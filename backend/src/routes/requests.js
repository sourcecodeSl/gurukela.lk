import { Router } from 'express'
import { query, queryOne, tx } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest, conflict } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapRequest } from '../utils/mappers.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { recordPayment } from '../repositories/payments.js'

const router = Router()

// Requests visible to the caller: an instructor sees requests on their slots,
// a student sees their own.
router.get(
  '/',
  authenticate,
  asyncH(async (req, res) => {
    const base = `SELECT r.*, st.name AS student_name, st.hue AS student_hue
                  FROM slot_requests r
                  JOIN slots s ON s.id = r.slot_id
                  LEFT JOIN students st ON st.id = r.student_id`
    let rows
    if (req.user.role === 'instructor') {
      rows = await query(`${base} WHERE s.instructor_id = ? ORDER BY r.created_at DESC`, [
        req.user.profileId,
      ])
    } else if (req.user.role === 'student') {
      rows = await query(`${base} WHERE r.student_id = ? ORDER BY r.created_at DESC`, [
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

// Student requests a slot for a specific module.
router.post(
  '/',
  studentOnly,
  asyncH(async (req, res) => {
    const { slotId, moduleId, note } = req.body
    requireFields(req.body, ['slotId'])
    const slot = await queryOne('SELECT * FROM slots WHERE id = ?', [slotId])
    if (!slot) throw notFound('Slot not found')
    if (slot.status === 'booked') throw conflict('That slot is already booked')

    const id = uid('req')
    await query(
      `INSERT INTO slot_requests (id, slot_id, student_id, module_id, status, note)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [id, slotId, req.user.profileId, moduleId || null, note || null]
    )
    res.status(201).json(mapRequest(await queryOne('SELECT * FROM slot_requests WHERE id = ?', [id])))
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

const assertInstructorOwnsRequest = async (req) => {
  const r = await queryOne(
    `SELECT r.*, s.instructor_id FROM slot_requests r JOIN slots s ON s.id = r.slot_id WHERE r.id = ?`,
    [req.params.id]
  )
  if (!r) throw notFound('Request not found')
  if (r.instructor_id !== req.user.profileId) throw forbidden('Not your slot')
  return r
}

router.post(
  '/:id/accept',
  instructorOnly,
  asyncH(async (req, res) => {
    const r = await assertInstructorOwnsRequest(req)
    if (r.status !== 'pending') throw badRequest(`Cannot accept a ${r.status} request`)
    await query('UPDATE slot_requests SET status = "accepted", accepted_at = NOW() WHERE id = ?', [
      req.params.id,
    ])
    res.json(mapRequest(await queryOne('SELECT * FROM slot_requests WHERE id = ?', [req.params.id])))
  })
)

router.post(
  '/:id/reject',
  instructorOnly,
  asyncH(async (req, res) => {
    const r = await assertInstructorOwnsRequest(req)
    if (!['pending', 'accepted'].includes(r.status)) throw badRequest(`Cannot reject a ${r.status} request`)
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

    res.json({ message: 'Payment successful. Slot secured.', ...result })
  })
)

export default router
