import { queryOne, tx } from '../config/db.js'
import { recordPayment } from './payments.js'
import { uid } from '../utils/ids.js'
import { notFound, badRequest, forbidden } from '../utils/http.js'
import { notifyInstructorPaid } from '../services/notifications.js'

/**
 * Validate that `studentId` may pay for `{ kind, id }` and return what it costs.
 * Shared by PayHere checkout, manual-payment submission and admin approval so
 * the amount and eligibility rules live in one place.
 *
 * Returns { kind, refId, amount, item } where `refId` is the id the matching
 * complete* function expects (the slot_request id for slots, the class id for
 * groups, the seminar id for seminars).
 */
export async function describePayable(kind, id, studentId) {
  if (kind === 'slot') {
    const row = await queryOne(
      `SELECT sr.id, sr.student_id, sr.status, s.price
       FROM slot_requests sr JOIN slots s ON s.id = sr.slot_id WHERE sr.id = ?`,
      [id]
    )
    if (!row) throw notFound('Request not found')
    if (row.student_id !== studentId) throw forbidden('Not your request')
    if (row.status !== 'accepted') throw badRequest('Only an accepted request can be paid')
    return { kind, refId: row.id, amount: row.price, item: 'GetClass one-to-one session' }
  }
  if (kind === 'group') {
    const cls = await queryOne('SELECT id, price, title FROM group_classes WHERE id = ?', [id])
    if (!cls) throw notFound('Group class not found')
    return { kind, refId: cls.id, amount: cls.price, item: `GetClass group class — ${cls.title}` }
  }
  if (kind === 'seminar') {
    const sem = await queryOne('SELECT id, price, title, is_free FROM seminars WHERE id = ?', [id])
    if (!sem) throw notFound('Seminar not found')
    if (sem.is_free) throw badRequest('This seminar is free — no payment needed')
    return { kind, refId: sem.id, amount: sem.price, item: `GetClass seminar — ${sem.title}` }
  }
  throw badRequest('kind must be "slot", "group" or "seminar"')
}

/** Run the correct completion for a payable kind (used by manual approval). */
export async function completePayable(kind, refId, studentId, paidAmount, method) {
  if (kind === 'group') return completeGroupJoin(refId, studentId, paidAmount, method)
  if (kind === 'seminar') return completeSeminarJoin(refId, studentId, paidAmount, method)
  return completeSlotPay(refId, paidAmount, method)
}

/** Complete a slot payment (idempotent). Mirrors POST /slot-requests/:id/pay. */
export async function completeSlotPay(requestId, paidAmount, method = 'payhere') {
  const booked = await tx(async (c) => {
    const [[r]] = await c.query('SELECT * FROM slot_requests WHERE id = ? FOR UPDATE', [requestId])
    if (!r) throw new Error('request not found')
    if (r.status === 'paid') return false // already done — don't re-notify on retries
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
      method,
    })
    await c.query('UPDATE slots SET status = "booked", booked_by = ? WHERE id = ?', [r.student_id, slot.id])
    await c.query('UPDATE slot_requests SET status = "paid", paid_at = NOW() WHERE id = ?', [r.id])
    await c.query(
      `UPDATE slot_requests SET status = "lost" WHERE slot_id = ? AND id <> ? AND status IN ('pending','accepted')`,
      [slot.id, r.id]
    )
    await c.query('UPDATE instructors SET student_count = student_count + 1 WHERE id = ?', [slot.instructor_id])
    return true
  })
  // Slot secured via PayHere / verified manual payment — text the instructor.
  if (booked) notifyInstructorPaid(requestId)
}

/** Complete a group join (idempotent). Mirrors POST /group-classes/:id/join. */
export async function completeGroupJoin(classId, studentId, paidAmount, method = 'payhere') {
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
      method,
    })
    await c.query('UPDATE group_classes SET enrolled = enrolled + 1 WHERE id = ?', [g.id])
  })
}

/** Complete a paid-seminar registration (idempotent). */
export async function completeSeminarJoin(seminarId, studentId, paidAmount, method = 'payhere') {
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
      method,
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
