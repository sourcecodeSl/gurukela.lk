import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { asyncH, notFound, forbidden } from '../utils/http.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { getStudent } from '../repositories/people.js'
import { mapEnrollment } from '../utils/mappers.js'

const router = Router()
const studentOnly = [authenticate, requireRole('student')]

const assertSelf = (req) => {
  if (req.user.role === 'admin') return
  if (req.user.profileId !== req.params.id) throw forbidden('You can only view your own record')
}

router.get(
  '/:id',
  authenticate,
  asyncH(async (req, res) => {
    assertSelf(req)
    const s = await getStudent(req.params.id)
    if (!s) throw notFound('Student not found')
    res.json(s)
  })
)

// Update own profile (grade, birthday, chosen subjects).
router.put(
  '/:id',
  studentOnly,
  asyncH(async (req, res) => {
    assertSelf(req)
    const existing = await queryOne('SELECT * FROM students WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Student not found')
    const b = req.body
    await query('UPDATE students SET name = ?, hue = ?, birthday = ?, grade = ? WHERE id = ?', [
      b.name ?? existing.name,
      b.hue ?? existing.hue,
      b.birthday ?? existing.birthday,
      b.grade ?? existing.grade,
      req.params.id,
    ])
    if (Array.isArray(b.subjectIds)) {
      await query('DELETE FROM student_subjects WHERE student_id = ?', [req.params.id])
      for (const sid of b.subjectIds)
        await query('INSERT IGNORE INTO student_subjects (student_id, subject_id) VALUES (?, ?)', [
          req.params.id,
          sid,
        ])
    }
    res.json(await getStudent(req.params.id))
  })
)

// A student's enrollments (their booked slots + joined group classes).
router.get(
  '/:id/enrollments',
  authenticate,
  asyncH(async (req, res) => {
    assertSelf(req)
    const rows = await query('SELECT * FROM enrollments WHERE student_id = ? ORDER BY paid_at DESC', [
      req.params.id,
    ])
    res.json(rows.map(mapEnrollment))
  })
)

export default router
