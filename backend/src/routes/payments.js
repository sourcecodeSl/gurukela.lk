import { Router } from 'express'
import express from 'express'
import { query, queryOne } from '../config/db.js'
import { asyncH, notFound, badRequest, forbidden, conflict } from '../utils/http.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import {
  describePayable,
  completeSlotPay,
  completeGroupJoin,
  completeSeminarJoin,
} from '../repositories/enrollment.js'
import { imageUpload, fileUrl } from '../middleware/upload.js'
import { getSetting } from '../utils/settings.js'
import { uid } from '../utils/ids.js'
import genie from '../services/genie.js'
import payhere from '../services/payhere.js'
import env from '../config/env.js'

const router = Router()
const slipUpload = imageUpload('slips')

/** Read the admin-configured manual-payment details (QR image + bank text). */
async function manualConfig() {
  const [qrUrl, bankDetails] = await Promise.all([
    getSetting('pay_qr_url', ''),
    getSetting('pay_bank_details', ''),
  ])
  return {
    available: !!(qrUrl || bankDetails),
    qrUrl: qrUrl || null,
    bankDetails: bankDetails || null,
  }
}

// Which gateways the frontend can offer.
router.get(
  '/config',
  asyncH(async (req, res) => {
    res.json({
      payhere: { available: payhere.isConfigured(), mode: payhere.mode() },
      genie: { available: false, mode: genie.mode() },
      manual: await manualConfig(),
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

/* ==================== Manual payment (QR / bank transfer) ==================== */

// A student pays offline (LankaQR or bank transfer) then submits proof here.
// We store a 'pending' claim with the optional slip image; an admin verifies it
// and approves from the admin panel, which is what actually enrols the student.
// Multipart: fields kind, id, method, reference (+ optional 'slip' image file).
router.post(
  '/manual/submit',
  studentOnly,
  slipUpload.single('slip'),
  asyncH(async (req, res) => {
    const cfg = await manualConfig()
    if (!cfg.available) throw badRequest('Manual payments are not enabled yet')

    const { kind, id, method, reference } = req.body
    if (!['qr', 'bank'].includes(method)) throw badRequest('method must be "qr" or "bank"')

    // Validates ownership/eligibility and gives us the amount to expect.
    const payable = await describePayable(kind, id, req.user.profileId)

    // Don't let a student stack duplicate pending claims for the same thing.
    const dupe = await queryOne(
      `SELECT id FROM manual_payments
       WHERE student_id = ? AND kind = ? AND ref_id = ? AND status = 'pending'`,
      [req.user.profileId, payable.kind, payable.refId]
    )
    if (dupe) throw conflict('You already have a pending payment for this — please wait for it to be verified')

    const slipUrl = req.file ? fileUrl(req, 'slips', req.file.filename) : null
    const paymentId = uid('mpay')
    await query(
      `INSERT INTO manual_payments (id, student_id, kind, ref_id, method, amount, reference, slip_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [paymentId, req.user.profileId, payable.kind, payable.refId, method, payable.amount, reference || null, slipUrl]
    )

    res.status(201).json({
      id: paymentId,
      status: 'pending',
      message: 'Payment submitted — we will confirm your seat once it is verified.',
    })
  })
)

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
