import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapSlot } from '../utils/mappers.js'
import { authenticate, optionalAuth, requireRole, requireVerifiedInstructor } from '../middleware/auth.js'

const router = Router()

// List slots, optionally by instructor. Public, but private (single-student)
// slots are only surfaced to their target student and to the owning instructor.
router.get(
  '/',
  optionalAuth,
  asyncH(async (req, res) => {
    // Auto-remove open (never-booked) slots whose end time has already passed.
    // Booked slots are kept as history. Running this on every listing lets the
    // data self-clean without a scheduled job, so stale past slots never show.
    // slot_requests cascade on delete, so any leftover pending requests go too.
    await query(
      "DELETE FROM slots WHERE status = 'open' AND TIMESTAMP(CONCAT(DATE(date), ' ', end, ':00')) < NOW()"
    )

    const { instructorId, status } = req.query
    const where = []
    const params = []
    if (instructorId) {
      where.push('instructor_id = ?')
      params.push(instructorId)
    }
    if (status) {
      where.push('status = ?')
      params.push(status)
    }
    // Visibility: public slots are shown to everyone; a private slot is shown
    // only to the student it was made for, or to the instructor who owns it.
    if (req.user?.role === 'student') {
      where.push('(visible_to IS NULL OR visible_to = ?)')
      params.push(req.user.profileId)
    } else if (req.user?.role === 'instructor') {
      where.push('(visible_to IS NULL OR instructor_id = ?)')
      params.push(req.user.profileId)
    } else if (req.user?.role !== 'admin') {
      // Anonymous callers only ever see public slots. Admins see everything.
      where.push('visible_to IS NULL')
    }
    // `live` = the teacher has an open live session for this slot right now;
    // `ended_recently` = the last one ended within the past 15 minutes (and none
    // is open), so the booked student sees a transient "Session ended" instead
    // of a stale "Join live" button.
    const liveCols =
      "EXISTS(SELECT 1 FROM live_sessions ls WHERE ls.type='slot' AND ls.ref_id = slots.id AND ls.ended_at IS NULL) AS live," +
      "EXISTS(SELECT 1 FROM live_sessions ls WHERE ls.type='slot' AND ls.ref_id = slots.id AND ls.ended_at IS NOT NULL AND ls.ended_at >= NOW() - INTERVAL 15 MINUTE) AS ended_recently"
    const sql = `SELECT slots.*, ${liveCols} FROM slots ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY date, start`
    res.json((await query(sql, params)).map(mapSlot))
  })
)

const instructorOnly = [authenticate, requireRole('instructor')]

// Publish a free time slot.
router.post(
  '/',
  [...instructorOnly, requireVerifiedInstructor],
  asyncH(async (req, res) => {
    const { date, start, end, price, meetLink, visibleTo } = req.body
    requireFields(req.body, ['date', 'start', 'end'])
    // A private slot targets one existing student; anything else is public.
    let visibleToId = null
    if (visibleTo) {
      const student = await queryOne('SELECT id FROM students WHERE id = ?', [visibleTo])
      if (!student) throw badRequest('Student not found for private slot')
      visibleToId = student.id
    }
    const id = uid('slt')
    await query(
      `INSERT INTO slots (id, instructor_id, date, start, end, status, price, meet_link, visible_to)
       VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?)`,
      [id, req.user.profileId, date, start, end, price ?? 0, meetLink || null, visibleToId]
    )
    res.status(201).json(mapSlot(await queryOne('SELECT * FROM slots WHERE id = ?', [id])))
  })
)

// Instructor sets/updates the Google Meet link on their slot.
router.patch(
  '/:id',
  instructorOnly,
  asyncH(async (req, res) => {
    const slot = await queryOne('SELECT * FROM slots WHERE id = ?', [req.params.id])
    if (!slot) throw notFound('Slot not found')
    if (slot.instructor_id !== req.user.profileId) throw forbidden('Not your slot')
    if (req.body.meetLink !== undefined)
      await query('UPDATE slots SET meet_link = ? WHERE id = ?', [req.body.meetLink || null, req.params.id])
    if (req.body.acceptingRequests !== undefined)
      await query('UPDATE slots SET accepting_requests = ? WHERE id = ?', [
        req.body.acceptingRequests ? 1 : 0,
        req.params.id,
      ])
    res.json(mapSlot(await queryOne('SELECT * FROM slots WHERE id = ?', [req.params.id])))
  })
)

router.delete(
  '/:id',
  instructorOnly,
  asyncH(async (req, res) => {
    const slot = await queryOne('SELECT * FROM slots WHERE id = ?', [req.params.id])
    if (!slot) throw notFound('Slot not found')
    if (slot.instructor_id !== req.user.profileId) throw forbidden('Not your slot')
    if (slot.status === 'booked') throw badRequest('Cannot remove a booked slot')
    await query('DELETE FROM slots WHERE id = ?', [req.params.id])
    res.json({ message: 'Slot removed' })
  })
)

export default router
