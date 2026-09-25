import { Router } from 'express'
import { query, queryOne, tx } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest, conflict } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapRequest } from '../utils/mappers.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { recordPayment } from '../repositories/payments.js'
import {
  notifyInstructorNewRequest,
  notifyStudentAccepted,
  notifyInstructorPaid,
} from '../services/notifications.js'

const router = Router()

// Requests visible to the caller: an instructor sees requests on their slots,
// a student sees their own.
router.get(
  '/',
  authenticate,
  asyncH(async (req, res) => {
    // LEFT JOIN slots so custom (slot-less) requests are still returned; their
    // owning instructor is resolved via r.instructor_id instead.
    const base = `SELECT r.*, st.name AS student_name, st.hue AS student_hue
                  FROM slot_requests r
                  LEFT JOIN slots s ON s.id = r.slot_id
                  LEFT JOIN students st ON st.id = r.student_id`
    let rows
    if (req.user.role === 'instructor') {
      rows = await query(
        `${base} WHERE s.instructor_id = ? OR r.instructor_id = ? ORDER BY r.created_at DESC`,
        [req.user.profileId, req.user.profileId]
      )
    } else if (req.user.role === 'student') {
      // Surface any pending offline (QR / bank) claim so the UI can show
      // "payment under verification" instead of nagging the student to pay again.
      const studentBase = `SELECT r.*, st.name AS student_name, st.hue AS student_hue,
                    (SELECT mp.method FROM manual_payments mp
                     WHERE mp.kind = 'slot' AND mp.ref_id = r.id
                       AND mp.student_id = r.student_id AND mp.status = 'pending'
                     ORDER BY mp.created_at DESC LIMIT 1) AS manual_pending_method
                  FROM slot_requests r
                  LEFT JOIN slots s ON s.id = r.slot_id
                  LEFT JOIN students st ON st.id = r.student_id`
      rows = await query(`${studentBase} WHERE r.student_id = ? ORDER BY r.created_at DESC`, [
        req.user.profileId,
      ])
    } else {
      rows = await query(`${base} ORDER BY r.created_at DESC`)
    }
    res.json(rows.map(mapRequest))
  })
)

const studentOnly = [authenticate, requireRole('student')]
const instructorOnly = [authenticate, requireRole('instructor')]

// Student requests a slot. Two shapes:
//   • { slotId } — request an existing published slot (original flow).
//   • { instructorId, date, start, end } — request a *custom* time the
//     instructor never published; no slot exists yet and the instructor sets
//     the price on accept.
router.post(
  '/',
  studentOnly,
  asyncH(async (req, res) => {
    const { slotId, instructorId, date, start, end, subjectId, moduleId, note } = req.body
    const id = uid('req')

    if (slotId) {
      const slot = await queryOne('SELECT * FROM slots WHERE id = ?', [slotId])
      if (!slot) throw notFound('Slot not found')
      if (slot.status === 'booked') throw conflict('That slot is already booked')
      if (!slot.accepting_requests)
        throw badRequest('This slot is not accepting requests right now')

      await query(
        `INSERT INTO slot_requests (id, slot_id, student_id, subject_id, module_id, status, note)
         VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
        [id, slotId, req.user.profileId, subjectId || null, moduleId || null, note || null]
      )
    } else {
      requireFields(req.body, ['instructorId', 'date', 'start', 'end'])
      const instructor = await queryOne('SELECT id FROM instructors WHERE id = ?', [instructorId])
      if (!instructor) throw notFound('Instructor not found')

      await query(
        `INSERT INTO slot_requests
           (id, student_id, instructor_id, subject_id, module_id, req_date, req_start, req_end, status, origin, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'student', ?)`,
        [id, req.user.profileId, instructorId, subjectId || null, moduleId || null, date, start, end, note || null]
      )
    }
    // Text the instructor that a new booking request is waiting.
    notifyInstructorNewRequest(id)
    res.status(201).json(mapRequest(await queryOne('SELECT * FROM slot_requests WHERE id = ?', [id])))
  })
)

// Instructor proposes a slot to a student who already has a request with them.
// Creates a 'proposed' request the student must confirm before it becomes a
// normal 'pending' request.
router.post(
  '/propose',
  instructorOnly,
  asyncH(async (req, res) => {
    const { studentId, slotId, moduleId, note } = req.body
    requireFields(req.body, ['studentId', 'slotId'])

    const slot = await queryOne('SELECT * FROM slots WHERE id = ?', [slotId])
    if (!slot) throw notFound('Slot not found')
    if (slot.instructor_id !== req.user.profileId) throw forbidden('Not your slot')
    if (slot.status === 'booked') throw conflict('That slot is already booked')
    if (!slot.accepting_requests) throw badRequest('This slot is not accepting requests right now')

    // Only students who already reached out to this instructor can be proposed to.
    const existing = await queryOne(
      `SELECT r.id FROM slot_requests r JOIN slots s ON s.id = r.slot_id
       WHERE r.student_id = ? AND s.instructor_id = ? LIMIT 1`,
      [studentId, req.user.profileId]
    )
    if (!existing) throw badRequest('That student has not requested any of your slots yet')

    const id = uid('req')
    await query(
      `INSERT INTO slot_requests (id, slot_id, student_id, module_id, origin, status, note, proposed_at)
       VALUES (?, ?, ?, ?, 'instructor', 'proposed', ?, NOW())`,
      [id, slotId, studentId, moduleId || null, note || null]
    )
    res.status(201).json(mapRequest(await queryOne('SELECT * FROM slot_requests WHERE id = ?', [id])))
  })
)

// Student confirms an instructor's proposal, turning it into a normal request.
router.post(
  '/:id/confirm',
  studentOnly,
  asyncH(async (req, res) => {
    const r = await queryOne('SELECT * FROM slot_requests WHERE id = ?', [req.params.id])
    if (!r) throw notFound('Request not found')
    if (r.student_id !== req.user.profileId) throw forbidden('Not your request')
    if (r.status === 'proposed') {
      // Instructor already picked one of their existing slots, so there is
      // nothing left for them to accept — confirming jumps straight to accepted
      // and the student pays directly. Take the slot off the market so no other
      // student can request it while this one goes to pay.
      await query('UPDATE slot_requests SET status = "accepted", accepted_at = NOW() WHERE id = ?', [
        req.params.id,
      ])
      if (r.slot_id)
        await query('UPDATE slots SET accepting_requests = 0 WHERE id = ?', [r.slot_id])
    } else if (r.status === 'rescheduled') {
      // Instructor already set the counter time & price; confirming materializes
      // the slot and jumps straight to accepted so the student can pay.
      await materializeSlot(r, r.req_price)
      await query('UPDATE slot_requests SET status = "accepted", accepted_at = NOW() WHERE id = ?', [
        req.params.id,
      ])
    } else {
      throw badRequest('Only a proposed or rescheduled request can be confirmed')
    }
    res.json(mapRequest(await queryOne('SELECT * FROM slot_requests WHERE id = ?', [req.params.id])))
  })
)

// Student declines an instructor's proposal.
router.post(
  '/:id/decline',
  studentOnly,
  asyncH(async (req, res) => {
    const r = await queryOne('SELECT * FROM slot_requests WHERE id = ?', [req.params.id])
    if (!r) throw notFound('Request not found')
    if (r.student_id !== req.user.profileId) throw forbidden('Not your request')
    if (!['proposed', 'rescheduled'].includes(r.status))
      throw badRequest('Only a proposed or rescheduled request can be declined')
    await query('UPDATE slot_requests SET status = "rejected", rejected_at = NOW() WHERE id = ?', [
      req.params.id,
    ])
    res.json(mapRequest(await queryOne('SELECT * FROM slot_requests WHERE id = ?', [req.params.id])))
  })
)

// Student withdraws their own pending request.
router.delete(
  '/:id',
  studentOnly,
  asyncH(async (req, res) => {
    const r = await queryOne('SELECT * FROM slot_requests WHERE id = ?', [req.params.id])
    if (!r) throw notFound('Request not found')
    if (r.student_id !== req.user.profileId) throw forbidden('Not your request')
    await query('DELETE FROM slot_requests WHERE id = ?', [req.params.id])
    res.json({ message: 'Request withdrawn' })
  })
)

// Resolve the owning instructor from either the slot (slot-based requests) or
// the request's own instructor_id (custom, slot-less requests).
const assertInstructorOwnsRequest = async (req) => {
  const r = await queryOne(
    `SELECT r.*, s.instructor_id AS slot_instructor_id
     FROM slot_requests r LEFT JOIN slots s ON s.id = r.slot_id WHERE r.id = ?`,
    [req.params.id]
  )
  if (!r) throw notFound('Request not found')
  const ownerId = r.slot_instructor_id || r.instructor_id
  if (ownerId !== req.user.profileId) throw forbidden('Not your slot')
  return r
}

// Materialize the real slot for a custom request once both sides agree. The
// slot is created not-accepting-requests so it never shows up as bookable to
// other students; from here the normal /pay flow secures it.
const materializeSlot = async (r, price) => {
  const slotId = uid('slt')
  await query(
    `INSERT INTO slots (id, instructor_id, date, start, end, status, price, accepting_requests)
     VALUES (?, ?, ?, ?, ?, 'open', ?, 0)`,
    [slotId, r.instructor_id, r.req_date, r.req_start, r.req_end, price ?? r.req_price ?? 0]
  )
  await query('UPDATE slot_requests SET slot_id = ? WHERE id = ?', [slotId, r.id])
  return slotId
}

router.post(
  '/:id/accept',
  instructorOnly,
  asyncH(async (req, res) => {
    const r = await assertInstructorOwnsRequest(req)
    if (r.status !== 'pending') throw badRequest(`Cannot accept a ${r.status} request`)
    // A custom (slot-less) request needs the instructor to set a price now; that
    // materializes the slot the student then pays for.
    if (!r.slot_id) {
      requireFields(req.body, ['price'])
      await materializeSlot(r, req.body.price)
    }
    // Optional message the instructor sends to the student on accept.
    const acceptNote = req.body.note ? String(req.body.note).slice(0, 500) : null
    await query(
      'UPDATE slot_requests SET status = "accepted", accepted_at = NOW(), accept_note = ? WHERE id = ?',
      [acceptNote, req.params.id]
    )
    // Text the student that the instructor confirmed and it's ready to pay.
    notifyStudentAccepted(req.params.id)
    res.json(mapRequest(await queryOne('SELECT * FROM slot_requests WHERE id = ?', [req.params.id])))
  })
)

// Instructor counter-offers a different date/time/price on a custom request.
// The student must confirm before it becomes payable.
router.post(
  '/:id/reschedule',
  instructorOnly,
  asyncH(async (req, res) => {
    const r = await assertInstructorOwnsRequest(req)
    if (r.slot_id) throw badRequest('Only a custom time request can be rescheduled')
    if (!['pending', 'rescheduled'].includes(r.status))
      throw badRequest(`Cannot reschedule a ${r.status} request`)
    const { date, start, end, price } = req.body
    requireFields(req.body, ['date', 'start', 'end', 'price'])
    await query(
      `UPDATE slot_requests
       SET req_date = ?, req_start = ?, req_end = ?, req_price = ?,
           status = 'rescheduled', proposed_at = NOW()
       WHERE id = ?`,
      [date, start, end, price, req.params.id]
    )
    res.json(mapRequest(await queryOne('SELECT * FROM slot_requests WHERE id = ?', [req.params.id])))
  })
)

router.post(
  '/:id/reject',
  instructorOnly,
  asyncH(async (req, res) => {
    const r = await assertInstructorOwnsRequest(req)
    if (!['pending', 'accepted', 'rescheduled'].includes(r.status))
      throw badRequest(`Cannot reject a ${r.status} request`)
    await query('UPDATE slot_requests SET status = "rejected", rejected_at = NOW() WHERE id = ?', [
      req.params.id,
    ])
    res.json(mapRequest(await queryOne('SELECT * FROM slot_requests WHERE id = ?', [req.params.id])))
  })
)

/**
 * Student pays for an accepted request. First payment wins the slot; every
 * other pending/accepted request on the same slot is closed as `lost`.
 * Runs in a transaction with a row lock on the slot.
 */
router.post(
  '/:id/pay',
  studentOnly,
  asyncH(async (req, res) => {
    const result = await tx(async (c) => {
      const [[r]] = await c.query('SELECT * FROM slot_requests WHERE id = ? FOR UPDATE', [
        req.params.id,
      ])
      if (!r) throw notFound('Request not found')
      if (r.student_id !== req.user.profileId) throw forbidden('Not your request')
      if (r.status !== 'accepted') throw badRequest('Only an accepted request can be paid')

      const [[slot]] = await c.query('SELECT * FROM slots WHERE id = ? FOR UPDATE', [r.slot_id])
      if (!slot) throw notFound('Slot not found')
      if (slot.status === 'booked') throw conflict('That slot was already secured by another student')

      const pay = await recordPayment(c, {
        type: 'slot',
        refId: slot.id,
        requestId: r.id,
        studentId: r.student_id,
        instructorId: slot.instructor_id,
        amount: slot.price,
        method: req.body.method,
      })

      await c.query('UPDATE slots SET status = "booked", booked_by = ? WHERE id = ?', [
        r.student_id,
        slot.id,
      ])
      await c.query('UPDATE slot_requests SET status = "paid", paid_at = NOW() WHERE id = ?', [r.id])
      await c.query(
        `UPDATE slot_requests SET status = "lost"
         WHERE slot_id = ? AND id <> ? AND status IN ('pending','accepted')`,
        [slot.id, r.id]
      )
      // Bump the instructor's student count.
      await c.query('UPDATE instructors SET student_count = student_count + 1 WHERE id = ?', [
        slot.instructor_id,
      ])
      return pay
    })

    // Slot is booked — text the instructor that the student paid.
    notifyInstructorPaid(req.params.id)
    res.json({ message: 'Payment successful. Slot secured.', ...result })
  })
)

export default router
