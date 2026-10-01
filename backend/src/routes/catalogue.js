import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapStream, mapSubject, mapModule, mapLesson } from '../utils/mappers.js'
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js'

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

// Visibility for the approval workflow (subjects + modules). Admins see every
// row; an instructor additionally sees their own pending/rejected submissions;
// students and anonymous callers see only approved rows. `col` prefixes the
// column names (e.g. 's.') for aliased queries. Returns a SQL fragment to AND in.
const catalogueVisibility = (req, col = '') => {
  const status = `${col}status`
  const createdBy = `${col}created_by`
  if (req.user?.role === 'admin') return { clause: '', params: [] }
  if (req.user?.role === 'instructor' && req.user.profileId)
    return { clause: `(${status} = 'approved' OR ${createdBy} = ?)`, params: [req.user.profileId] }
  return { clause: `${status} = 'approved'`, params: [] }
}

// Apply an approve/reject decision to a subject/module row. Admin-only route.
const applyApproval = async (table, id, action) => {
  if (!['approve', 'reject'].includes(action)) throw badRequest('action must be approve or reject')
  await query(`UPDATE ${table} SET status = ? WHERE id = ?`, [
    action === 'approve' ? 'approved' : 'rejected',
    id,
  ])
}

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
  optionalAuth,
  asyncH(async (req, res) => {
    const { streamId } = req.query
    const vis = catalogueVisibility(req, 's.')
    const where = []
    const params = []
    if (streamId) {
      where.push('s.stream_id = ?')
      params.push(streamId)
    }
    if (vis.clause) {
      where.push(vis.clause)
      params.push(...vis.params)
    }
    const sql = `SELECT s.*, st.name AS stream_name FROM subjects s
                 LEFT JOIN streams st ON st.id = s.stream_id
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY s.name`
    res.json((await query(sql, params)).map(mapSubject))
  })
)

// Admin creates an approved subject; an instructor submits one for approval
// (status 'pending', created_by their profile) and is auto-linked to it so it
// lands on their profile once approved.
router.post(
  '/subjects',
  adminOrInstructor,
  asyncH(async (req, res) => {
    const { name, icon, color, description, streamId, grade } = req.body
    requireFields(req.body, ['name'])
    const isInstructor = req.user.role === 'instructor'
    const id = uid('sub')
    await query(
      'INSERT INTO subjects (id, stream_id, name, icon, color, description, grade, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        streamId || null,
        name,
        icon || null,
        color ?? null,
        description || null,
        grade || null,
        isInstructor ? 'pending' : 'approved',
        isInstructor ? req.user.profileId : null,
      ]
    )
    if (isInstructor) {
      await query(
        'INSERT IGNORE INTO instructor_subjects (instructor_id, subject_id) VALUES (?, ?)',
        [req.user.profileId, id]
      )
    }
    res.status(201).json(mapSubject(await subjectWithStream(id)))
  })
)

// Ownership: admin may edit any subject; an instructor only one they submitted
// that is still pending/rejected (an approved subject is shared — hands off).
const assertCanEditSubject = async (req) => {
  const subject = await queryOne('SELECT * FROM subjects WHERE id = ?', [req.params.id])
  if (!subject) throw notFound('Subject not found')
  if (req.user.role === 'instructor') {
    if (subject.created_by !== req.user.profileId)
      throw forbidden('You can only edit subjects you added')
    if (subject.status === 'approved')
      throw forbidden('This subject is approved and now shared; it can no longer be edited')
  }
  return subject
}

router.put(
  '/subjects/:id',
  adminOrInstructor,
  asyncH(async (req, res) => {
    const existing = await assertCanEditSubject(req)
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
  adminOrInstructor,
  asyncH(async (req, res) => {
    await assertCanEditSubject(req)
    await query('DELETE FROM subjects WHERE id = ?', [req.params.id]) // cascades to modules
    res.json({ message: 'Subject removed' })
  })
)

// Admin approves or rejects a teacher-submitted subject.
router.patch(
  '/subjects/:id/approval',
  adminOnly,
  asyncH(async (req, res) => {
    const existing = await queryOne('SELECT id FROM subjects WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Subject not found')
    await applyApproval('subjects', req.params.id, req.body.action)
    res.json(mapSubject(await subjectWithStream(req.params.id)))
  })
)

/* ---------------------------- modules ---------------------------- */
router.get(
  '/modules',
  optionalAuth,
  asyncH(async (req, res) => {
    const { subjectId } = req.query
    const vis = catalogueVisibility(req)
    const where = []
    const params = []
    if (subjectId) {
      where.push('subject_id = ?')
      params.push(subjectId)
    }
    if (vis.clause) {
      where.push(vis.clause)
      params.push(...vis.params)
    }
    const sql = `SELECT * FROM modules ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY code`
    res.json((await query(sql, params)).map(mapModule))
  })
)

// Admin creates an approved lesson; an instructor submits one for approval
// (status 'pending', created_by their profile).
router.post(
  '/modules',
  adminOrInstructor,
  asyncH(async (req, res) => {
    const { subjectId, code, name, level, hours } = req.body
    requireFields(req.body, ['subjectId', 'name'])
    const isInstructor = req.user.role === 'instructor'
    const id = uid('mod')
    await query(
      'INSERT INTO modules (id, subject_id, code, name, level, hours, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        subjectId,
        code || null,
        name,
        level || null,
        hours ?? null,
        isInstructor ? 'pending' : 'approved',
        isInstructor ? req.user.profileId : null,
      ]
    )
    res.status(201).json(mapModule(await queryOne('SELECT * FROM modules WHERE id = ?', [id])))
  })
)

// Ownership: admin may edit any lesson; an instructor only one they submitted
// that is still pending/rejected (an approved lesson is shared — hands off).
const assertCanEditModule = async (req) => {
  const module = await queryOne('SELECT * FROM modules WHERE id = ?', [req.params.id])
  if (!module) throw notFound('Lesson not found')
  if (req.user.role === 'instructor') {
    if (module.created_by !== req.user.profileId)
      throw forbidden('You can only edit lessons you added')
    if (module.status === 'approved')
      throw forbidden('This lesson is approved and now shared; it can no longer be edited')
  }
  return module
}

router.put(
  '/modules/:id',
  adminOrInstructor,
  asyncH(async (req, res) => {
    const existing = await assertCanEditModule(req)
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
  adminOrInstructor,
  asyncH(async (req, res) => {
    await assertCanEditModule(req)
    await query('DELETE FROM modules WHERE id = ?', [req.params.id])
    res.json({ message: 'Module removed' })
  })
)

// Admin approves or rejects a teacher-submitted lesson.
router.patch(
  '/modules/:id/approval',
  adminOnly,
  asyncH(async (req, res) => {
    const existing = await queryOne('SELECT id FROM modules WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Lesson not found')
    await applyApproval('modules', req.params.id, req.body.action)
    res.json(mapModule(await queryOne('SELECT * FROM modules WHERE id = ?', [req.params.id])))
  })
)

// Admin folds a teacher-created lesson into the shared pool: it becomes an
// approved platform lesson owned by nobody (created_by NULL), so it is no
// longer the teacher's to edit and reads as a standard catalogue entry.
router.patch(
  '/modules/:id/promote',
  adminOnly,
  asyncH(async (req, res) => {
    const existing = await queryOne('SELECT id FROM modules WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Lesson not found')
    await query("UPDATE modules SET created_by = NULL, status = 'approved' WHERE id = ?", [req.params.id])
    res.json(mapModule(await queryOne('SELECT * FROM modules WHERE id = ?', [req.params.id])))
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

// Admin folds a teacher's own sub-lesson into the default pool: clearing
// instructor_id turns it into a platform default every instructor starts from.
router.patch(
  '/lessons/:id/promote',
  adminOnly,
  asyncH(async (req, res) => {
    const existing = await queryOne('SELECT id FROM lessons WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Sub-lesson not found')
    await query('UPDATE lessons SET instructor_id = NULL WHERE id = ?', [req.params.id])
    res.json(mapLesson(await queryOne('SELECT * FROM lessons WHERE id = ?', [req.params.id])))
  })
)

export default router
