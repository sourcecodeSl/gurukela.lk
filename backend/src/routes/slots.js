import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapSlot } from '../utils/mappers.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// List slots, optionally by instructor. Public.
router.get(
  '/',
  asyncH(async (req, res) => {
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
    const sql = `SELECT * FROM slots ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY date, start`
    res.json((await query(sql, params)).map(mapSlot))
  })
)

const instructorOnly = [authenticate, requireRole('instructor')]

// Publish a free time slot.
router.post(
  '/',
  instructorOnly,
  asyncH(async (req, res) => {
    const { date, start, end, price } = req.body
    requireFields(req.body, ['date', 'start', 'end'])
    const id = uid('slt')
    await query(
      `INSERT INTO slots (id, instructor_id, date, start, end, status, price)
       VALUES (?, ?, ?, ?, ?, 'open', ?)`,
      [id, req.user.profileId, date, start, end, price ?? 0]
    )
    res.status(201).json(mapSlot(await queryOne('SELECT * FROM slots WHERE id = ?', [id])))
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
