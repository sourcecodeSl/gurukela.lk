import { Router } from 'express'
import express from 'express'
import { query, queryOne, tx } from '../config/db.js'
import { asyncH, notFound, badRequest, forbidden, conflict } from '../utils/http.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { recordPayment } from '../repositories/payments.js'
import { uid } from '../utils/ids.js'
import genie from '../services/genie.js'
import payhere from '../services/payhere.js'
import env from '../config/env.js'

const router = Router()

// Which gateways the frontend can offer.
router.get(
  '/config',
  asyncH(async (req, res) => {
    res.json({
      payhere: { available: payhere.isConfigured(), mode: payhere.mode() },
      genie: { available: false, mode: genie.mode() },
    })
  })
)

const studentOnly = [authenticate, requireRole('student')]

/* ============================ PayHere ============================ */

// Build signed checkout params for a slot request or a group class. The
// frontend POSTs these to PayHere's hosted page.
router.post(
  '/payhere/start',
  studentOnly,
  asyncH(async (req, res) => {
    if (!payhere.isConfigured()) throw badRequest('PayHere is not configured')
    const { kind, id } = req.body

    const user = await queryOne('SELECT email, phone FROM users WHERE id = ?', [req.user.id])
    const student = await queryOne('SELECT name FROM students WHERE id = ?', [req.user.profileId])

    let amount
    let orderId
    let items

    if (kind === 'slot') {
      const row = await queryOne(
        `SELECT sr.id, sr.student_id, sr.status, s.price
         FROM slot_requests sr JOIN slots s ON s.id = sr.slot_id WHERE sr.id = ?`,
        [id]
      )
      if (!row) throw notFound('Request not found')
      if (row.student_id !== req.user.profileId) throw forbidden('Not your request')
      if (row.status !== 'accepted') throw badRequest('Only an accepted request can be paid')
      amount = row.price
      orderId = row.id // the slot_request id
      items = 'GetClass one-to-one session'
    } else if (kind === 'group') {
      const cls = await queryOne('SELECT id, price, title FROM group_classes WHERE id = ?', [id])
      if (!cls) throw notFound('Group class not found')
      amount = cls.price
      // classId/studentId never contain '_' (uid uses hyphens), so split('_') is safe.
      orderId = `grpjoin_${cls.id}_${req.user.profileId}`
      items = `GetClass group class — ${cls.title}`
    } else if (kind === 'seminar') {
      const sem = await queryOne('SELECT id, price, title, is_free FROM seminars WHERE id = ?', [id])
      if (!sem) throw notFound('Seminar not found')
      if (sem.is_free) throw badRequest('This seminar is free — no payment needed')
      amount = sem.price
      orderId = `semjoin_${sem.id}_${req.user.profileId}`
      items = `GetClass seminar — ${sem.title}`
    } else {
      throw badRequest('kind must be "slot", "group" or "seminar"')
    }

    const amountStr = payhere.formatAmount(amount)
    const currency = 'LKR'
    const nameParts = String(student?.name || 'Student').trim().split(/\s+/)

    const notifyUrl =
      env.payhere.notifyUrl || `${req.protocol}://${req.get('host')}/api/payments/payhere/notify`

    const params = {
      merchant_id: env.payhere.merchantId,
      return_url: `${env.payhere.appUrl}/pay/return?order=${encodeURIComponent(orderId)}`,
      cancel_url: `${env.payhere.appUrl}/pay/cancel`,
      notify_url: notifyUrl,
      order_id: orderId,
      items,
      currency,
      amount: amountStr,
      first_name: nameParts[0] || 'Student',
      last_name: nameParts.slice(1).join(' ') || '-',
      email: user?.email || 'student@gurukela.lk',
      phone: user?.phone || '0770000000',
      address: 'Online',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash: payhere.startHash(orderId, amountStr, currency),
    }

    res.json({ action: payhere.checkoutUrl(), params })
  })
)

// PayHere server-to-server confirmation. Public (no auth) — trust is established
// by verifying md5sig with our secret. Body is x-www-form-urlencoded.
router.post(
  '/payhere/notify',
  express.urlencoded({ extended: false }),
  asyncH(async (req, res) => {
    const b = req.body || {}
    const verified = payhere.verifyNotify(b)
    console.log(
      `[payhere notify] hit order=${b.order_id} status=${b.status_code} amount=${b.payhere_amount} verified=${verified}`
    )
    // Always answer 200 so PayHere stops retrying; we just no-op on bad input.
    if (!verified) return res.status(200).send('invalid-signature')
    if (String(b.status_code) !== '2') return res.status(200).send('not-successful')

    const orderId = String(b.order_id)
    const paid = String(b.payhere_amount)

    try {
      if (orderId.startsWith('grpjoin_')) {
        const parts = orderId.split('_')
        const classId = parts[1]
        const studentId = parts[2]
        await completeGroupJoin(classId, studentId, paid, b.payment_id)
      } else if (orderId.startsWith('semjoin_')) {
        const parts = orderId.split('_')
        await completeSeminarJoin(parts[1], parts[2], paid, b.payment_id)
      } else {
        await completeSlotPay(orderId, paid, b.payment_id)
      }
    } catch (e) {
      // Log but still ack; PayHere retries are not helpful for logic errors.
      console.error('[payhere notify] completion failed:', e.message)
    }
    res.status(200).send('ok')
  })
)

/** Complete a slot payment (idempotent). Mirrors POST /slot-requests/:id/pay. */
async function completeSlotPay(requestId, paidAmount, paymentRef) {
  await tx(async (c) => {
    const [[r]] = await c.query('SELECT * FROM slot_requests WHERE id = ? FOR UPDATE', [requestId])
    if (!r) throw new Error('request not found')
    if (r.status === 'paid') return // already done
    if (r.status !== 'accepted') throw new Error(`request is ${r.status}`)

    const [[slot]] = await c.query('SELECT * FROM slots WHERE id = ? FOR UPDATE', [r.slot_id])
    if (!slot) throw new Error('slot not found')
    if (slot.status === 'booked') throw new Error('slot already booked')
    if (Number(paidAmount) < Number(slot.price)) throw new Error('amount mismatch')

    await recordPayment(c, {
      type: 'slot',
      refId: slot.id,
      requestId: r.id,
      studentId: r.student_id,
      instructorId: slot.instructor_id,
      amount: slot.price,
      method: 'payhere',
    })
    await c.query('UPDATE slots SET status = "booked", booked_by = ? WHERE id = ?', [r.student_id, slot.id])
    await c.query('UPDATE slot_requests SET status = "paid", paid_at = NOW() WHERE id = ?', [r.id])
    await c.query(
      `UPDATE slot_requests SET status = "lost" WHERE slot_id = ? AND id <> ? AND status IN ('pending','accepted')`,
      [slot.id, r.id]
    )
    await c.query('UPDATE instructors SET student_count = student_count + 1 WHERE id = ?', [slot.instructor_id])
  })
}

/** Complete a group join (idempotent). Mirrors POST /group-classes/:id/join. */
async function completeGroupJoin(classId, studentId, paidAmount, paymentRef) {
  await tx(async (c) => {
    const [[g]] = await c.query('SELECT * FROM group_classes WHERE id = ? FOR UPDATE', [classId])
    if (!g) throw new Error('class not found')

    const [[dupe]] = await c.query(
      `SELECT id FROM enrollments WHERE type = 'group' AND ref_id = ? AND student_id = ?`,
      [classId, studentId]
    )
    if (dupe) return // already enrolled
    if (g.enrolled >= g.seats) throw new Error('class full')
    if (Number(paidAmount) < Number(g.price)) throw new Error('amount mismatch')

    await recordPayment(c, {
      type: 'group',
      refId: g.id,
      studentId,
      instructorId: g.instructor_id,
      amount: g.price,
      method: 'payhere',
    })
    await c.query('UPDATE group_classes SET enrolled = enrolled + 1 WHERE id = ?', [g.id])
  })
}

/** Complete a paid-seminar registration (idempotent). */
async function completeSeminarJoin(seminarId, studentId, paidAmount, paymentRef) {
  await tx(async (c) => {
    const [[s]] = await c.query('SELECT * FROM seminars WHERE id = ? FOR UPDATE', [seminarId])
    if (!s) throw new Error('seminar not found')

    const [[dupe]] = await c.query(
      'SELECT id, paid FROM seminar_registrations WHERE seminar_id = ? AND student_id = ?',
      [seminarId, studentId]
    )
    if (dupe && dupe.paid) return // already paid
    if (s.seats > 0 && s.registered >= s.seats && !dupe) throw new Error('seminar full')
    if (Number(paidAmount) < Number(s.price)) throw new Error('amount mismatch')

    await recordPayment(c, {
      type: 'seminar',
      refId: s.id,
      studentId,
      instructorId: s.instructor_id,
      amount: s.price,
      method: 'payhere',
    })
    if (dupe) {
      await c.query('UPDATE seminar_registrations SET paid = 1 WHERE id = ?', [dupe.id])
    } else {
      await c.query(
        'INSERT INTO seminar_registrations (id, seminar_id, student_id, paid) VALUES (?, ?, ?, 1)',
        [uid('smr'), seminarId, studentId]
      )
      await c.query('UPDATE seminars SET registered = registered + 1 WHERE id = ?', [seminarId])
    }
  })
}

/** Lightweight status check the return page polls after redirect. */
router.get(
  '/payhere/status',
  studentOnly,
  asyncH(async (req, res) => {
    const orderId = String(req.query.order || '')
    if (orderId.startsWith('grpjoin_')) {
      const parts = orderId.split('_')
      const [dupe] = await query(
        `SELECT id FROM enrollments WHERE type = 'group' AND ref_id = ? AND student_id = ?`,
        [parts[1], parts[2]]
      )
      return res.json({ paid: !!dupe })
    }
    if (orderId.startsWith('semjoin_')) {
      const parts = orderId.split('_')
      const [reg] = await query(
        'SELECT id FROM seminar_registrations WHERE seminar_id = ? AND student_id = ? AND paid = 1',
        [parts[1], parts[2]]
      )
      return res.json({ paid: !!reg })
    }
    const r = await queryOne('SELECT status FROM slot_requests WHERE id = ?', [orderId])
    res.json({ paid: r?.status === 'paid' })
  })
)

/* ============================ Genie (dormant) ============================ */

router.post(
  '/genie/initiate',
  studentOnly,
  asyncH(async (req, res) => {
    const { kind, id } = req.body
    if (!['slot', 'group'].includes(kind)) throw badRequest('kind must be "slot" or "group"')
    let amount
    let description
    if (kind === 'slot') {
      const row = await queryOne(
        `SELECT sr.id, s.price FROM slot_requests sr JOIN slots s ON s.id = sr.slot_id WHERE sr.id = ?`,
        [id]
      )
      if (!row) throw notFound('Request not found')
      amount = row.price
      description = 'GetClass one-to-one session'
    } else {
      const cls = await queryOne('SELECT id, price, title FROM group_classes WHERE id = ?', [id])
      if (!cls) throw notFound('Group class not found')
      amount = cls.price
      description = `GetClass group class — ${cls.title}`
    }
    const session = await genie.createSession({
      amount,
      reference: `${kind}-${id}`,
      description,
      customer: { id: req.user.profileId, email: req.user.email, phone: req.user.phone },
      returnUrl: req.body.returnUrl || null,
    })
    res.json({ ...session, amount, mode: genie.mode() })
  })
)

export default router
