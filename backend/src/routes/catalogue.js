import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapStream, mapSubject, mapModule, mapLesson } from '../utils/mappers.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()
const adminOnly = [authenticate, requireRole('admin')]
const adminOrInstructor = [authenticate, requireRole('admin', 'instructor')]

// Fetch a subject joined with its stream name (the shape mapSubject expects).
const subjectWithStream = (id) =>
  queryOne(
    `SELECT s.*, st.name AS stream_name FROM subjects s
     LEFT JOIN streams st ON st.id = s.stream_id WHERE s.id = ?`,
    [id]
  )

/* ---------------------------- streams ---------------------------- */
router.get(
  '/streams',
  asyncH(async (req, res) => {
    const rows = await query('SELECT * FROM streams ORDER BY position, name')
    res.json(rows.map(mapStream))
  })
)

router.post(
  '/streams',
  adminOnly,
  asyncH(async (req, res) => {
    const { name, color, position } = req.body
    requireFields(req.body, ['name'])
    const id = uid('str')
    await query('INSERT INTO streams (id, name, color, position) VALUES (?, ?, ?, ?)', [
      id,
      name,
      color ?? null,
      position ?? 0,
    ])
    res.status(201).json(mapStream(await queryOne('SELECT * FROM streams WHERE id = ?', [id])))
  })
)

router.put(
  '/streams/:id',
  adminOnly,
  asyncH(async (req, res) => {
    const existing = await queryOne('SELECT * FROM streams WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Stream not found')
    const { name, color, position } = { ...existing, ...req.body }
    await query('UPDATE streams SET name = ?, color = ?, position = ? WHERE id = ?', [
      name,
      color,
      position,
      req.params.id,
    ])
    res.json(mapStream(await queryOne('SELECT * FROM streams WHERE id = ?', [req.params.id])))
  })
)

router.delete(
  '/streams/:id',
  adminOnly,
  asyncH(async (req, res) => {
    await query('DELETE FROM streams WHERE id = ?', [req.params.id]) // cascades to subjects -> modules -> lessons
    res.json({ message: 'Stream removed' })
  })
)

/* ---------------------------- subjects ---------------------------- */
router.get(
  '/subjects',
  asyncH(async (req, res) => {
    const { streamId } = req.query
    const rows = streamId
      ? await query(
          `SELECT s.*, st.name AS stream_name FROM subjects s
           LEFT JOIN streams st ON st.id = s.stream_id WHERE s.stream_id = ? ORDER BY s.name`,
          [streamId]
        )
      : await query(
          `SELECT s.*, st.name AS stream_name FROM subjects s
           LEFT JOIN streams st ON st.id = s.stream_id ORDER BY s.name`
        )
    res.json(rows.map(mapSubject))
  })
)

router.post(
  '/subjects',
  adminOnly,
  asyncH(async (req, res) => {
    const { name, icon, color, description, streamId, grade } = req.body
    requireFields(req.body, ['name'])
    const id = uid('sub')
    await query('INSERT INTO subjects (id, stream_id, name, icon, color, description, grade) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      id,
      streamId || null,
      name,
      icon || null,
      color ?? null,
      description || null,
      grade || null,
    ])
    res.status(201).json(mapSubject(await subjectWithStream(id)))
  })
)

router.put(
  '/subjects/:id',
  adminOnly,
  asyncH(async (req, res) => {
    const existing = await queryOne('SELECT * FROM subjects WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Subject not found')
    const { name, icon, color, description, grade, stream_id } = { ...existing, ...req.body, stream_id: req.body.streamId ?? existing.stream_id }
    await query(
      'UPDATE subjects SET stream_id = ?, name = ?, icon = ?, color = ?, description = ?, grade = ? WHERE id = ?',
      [stream_id || null, name, icon, color, description, grade || null, req.params.id]
    )
    res.json(mapSubject(await subjectWithStream(req.params.id)))
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

/* ---------------------------- sub-lessons ---------------------------- */
// The per-lesson syllabus. Public GET returns admin defaults + every
// instructor's own sub-lessons; the frontend shows each viewer the right slice.
router.get(
  '/lessons',
  asyncH(async (req, res) => {
    const { moduleId, instructorId } = req.query
    const where = []
    const params = []
    if (moduleId) {
      where.push('module_id = ?')
      params.push(moduleId)
    }
    if (instructorId) {
      where.push('(instructor_id = ? OR instructor_id IS NULL)')
      params.push(instructorId)
    }
    const sql = `SELECT * FROM lessons ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY module_id, position, created_at`
    res.json((await query(sql, params)).map(mapLesson))
  })
)

// Admin creates a default sub-lesson (instructor_id NULL); an instructor
// creates one of their own (instructor_id = their profile).
router.post(
  '/lessons',
  adminOrInstructor,
  asyncH(async (req, res) => {
    const { moduleId, name, hours, position } = req.body
    requireFields(req.body, ['moduleId', 'name'])
    const module = await queryOne('SELECT id FROM modules WHERE id = ?', [moduleId])
    if (!module) throw notFound('Lesson not found')
    const instructorId = req.user.role === 'instructor' ? req.user.profileId : null
    const id = uid('les')
    await query(
      'INSERT INTO lessons (id, module_id, instructor_id, name, hours, position) VALUES (?, ?, ?, ?, ?, ?)',
      [id, moduleId, instructorId, name, hours ?? null, position ?? 0]
    )
    res.status(201).json(mapLesson(await queryOne('SELECT * FROM lessons WHERE id = ?', [id])))
  })
)

// Ownership: admin may edit any sub-lesson; an instructor only their own.
const assertCanEditLesson = async (req) => {
  const lesson = await queryOne('SELECT * FROM lessons WHERE id = ?', [req.params.id])
  if (!lesson) throw notFound('Sub-lesson not found')
  if (req.user.role === 'instructor' && lesson.instructor_id !== req.user.profileId)
    throw forbidden('You can only edit your own sub-lessons')
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
    res.json({ message: 'Sub-lesson removed' })
  })
)

export default router
