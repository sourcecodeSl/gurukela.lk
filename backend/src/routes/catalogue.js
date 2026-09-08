import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapSubject, mapModule, mapLesson, asArray } from '../utils/mappers.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()
const adminOnly = [authenticate, requireRole('admin')]
const adminOrInstructor = [authenticate, requireRole('admin', 'instructor')]

/* ---------------------------- subjects ---------------------------- */
router.get(
  '/subjects',
  asyncH(async (req, res) => {
    const rows = await query('SELECT * FROM subjects ORDER BY name')
    res.json(rows.map(mapSubject))
  })
)

router.post(
  '/subjects',
  adminOnly,
  asyncH(async (req, res) => {
    const { name, icon, color, description, streams } = req.body
    requireFields(req.body, ['name'])
    const id = uid('sub')
    await query('INSERT INTO subjects (id, name, icon, color, description, streams) VALUES (?, ?, ?, ?, ?, ?)', [
      id,
      name,
      icon || null,
      color ?? null,
      description || null,
      JSON.stringify(Array.isArray(streams) ? streams : []),
    ])
    res.status(201).json(mapSubject(await queryOne('SELECT * FROM subjects WHERE id = ?', [id])))
  })
)

router.put(
  '/subjects/:id',
  adminOnly,
  asyncH(async (req, res) => {
    const existing = await queryOne('SELECT * FROM subjects WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Subject not found')
    const { name, icon, color, description, streams } = { ...existing, ...req.body }
    await query(
      'UPDATE subjects SET name = ?, icon = ?, color = ?, description = ?, streams = ? WHERE id = ?',
      [name, icon, color, description, JSON.stringify(Array.isArray(streams) ? streams : asArray(streams)), req.params.id]
    )
    res.json(mapSubject(await queryOne('SELECT * FROM subjects WHERE id = ?', [req.params.id])))
  })
)

router.delete(
  '/subjects/:id',
  adminOnly,
  asyncH(async (req, res) => {
    await query('DELETE FROM subjects WHERE id = ?', [req.params.id]) // cascades to modules
    res.json({ message: 'Subject removed' })
  })
)

/* ---------------------------- modules ---------------------------- */
router.get(
  '/modules',
  asyncH(async (req, res) => {
    const { subjectId } = req.query
    const rows = subjectId
      ? await query('SELECT * FROM modules WHERE subject_id = ? ORDER BY code', [subjectId])
      : await query('SELECT * FROM modules ORDER BY code')
    res.json(rows.map(mapModule))
  })
)

router.post(
  '/modules',
  adminOnly,
  asyncH(async (req, res) => {
    const { subjectId, code, name, level, hours } = req.body
    requireFields(req.body, ['subjectId', 'name'])
    const id = uid('mod')
    await query(
      'INSERT INTO modules (id, subject_id, code, name, level, hours) VALUES (?, ?, ?, ?, ?, ?)',
      [id, subjectId, code || null, name, level || null, hours ?? null]
    )
    res.status(201).json(mapModule(await queryOne('SELECT * FROM modules WHERE id = ?', [id])))
  })
)

router.put(
  '/modules/:id',
  adminOnly,
  asyncH(async (req, res) => {
    const existing = await queryOne('SELECT * FROM modules WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Module not found')
    const merged = { ...existing, ...req.body }
    await query('UPDATE modules SET subject_id = ?, code = ?, name = ?, level = ?, hours = ? WHERE id = ?', [
      merged.subjectId ?? merged.subject_id,
      merged.code,
      merged.name,
      merged.level,
      merged.hours,
      req.params.id,
    ])
    res.json(mapModule(await queryOne('SELECT * FROM modules WHERE id = ?', [req.params.id])))
  })
)

router.delete(
  '/modules/:id',
  adminOnly,
  asyncH(async (req, res) => {
    await query('DELETE FROM modules WHERE id = ?', [req.params.id])
    res.json({ message: 'Module removed' })
  })
)

/* ---------------------------- lessons ---------------------------- */
// The per-subject syllabus. Public GET returns admin defaults + every
// instructor's own lessons; the frontend shows each viewer the right slice.
router.get(
  '/lessons',
  asyncH(async (req, res) => {
    const { subjectId, instructorId } = req.query
    const where = []
    const params = []
    if (subjectId) {
      where.push('subject_id = ?')
      params.push(subjectId)
    }
    if (instructorId) {
      where.push('(instructor_id = ? OR instructor_id IS NULL)')
      params.push(instructorId)
    }
    const sql = `SELECT * FROM lessons ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY subject_id, position, created_at`
    res.json((await query(sql, params)).map(mapLesson))
  })
)

// Admin creates a default lesson (instructor_id NULL); an instructor creates
// one of their own (instructor_id = their profile).
router.post(
  '/lessons',
  adminOrInstructor,
  asyncH(async (req, res) => {
    const { subjectId, name, hours, position } = req.body
    requireFields(req.body, ['subjectId', 'name'])
    const subject = await queryOne('SELECT id FROM subjects WHERE id = ?', [subjectId])
    if (!subject) throw notFound('Subject not found')
    const instructorId = req.user.role === 'instructor' ? req.user.profileId : null
    const id = uid('les')
    await query(
      'INSERT INTO lessons (id, subject_id, instructor_id, name, hours, position) VALUES (?, ?, ?, ?, ?, ?)',
      [id, subjectId, instructorId, name, hours ?? null, position ?? 0]
    )
    res.status(201).json(mapLesson(await queryOne('SELECT * FROM lessons WHERE id = ?', [id])))
  })
)

// Ownership: admin may edit any lesson; an instructor only their own.
const assertCanEditLesson = async (req) => {
  const lesson = await queryOne('SELECT * FROM lessons WHERE id = ?', [req.params.id])
  if (!lesson) throw notFound('Lesson not found')
  if (req.user.role === 'instructor' && lesson.instructor_id !== req.user.profileId)
    throw forbidden('You can only edit your own lessons')
  return lesson
}

router.put(
  '/lessons/:id',
  adminOrInstructor,
  asyncH(async (req, res) => {
    const existing = await assertCanEditLesson(req)
    const merged = { ...existing, ...req.body }
    await query('UPDATE lessons SET name = ?, hours = ?, position = ? WHERE id = ?', [
      merged.name,
      merged.hours ?? null,
      merged.position ?? 0,
      req.params.id,
    ])
    res.json(mapLesson(await queryOne('SELECT * FROM lessons WHERE id = ?', [req.params.id])))
  })
)

router.delete(
  '/lessons/:id',
  adminOrInstructor,
  asyncH(async (req, res) => {
    await assertCanEditLesson(req)
    await query('DELETE FROM lessons WHERE id = ?', [req.params.id])
    res.json({ message: 'Lesson removed' })
  })
)

export default router
