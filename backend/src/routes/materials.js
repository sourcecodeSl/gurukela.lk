import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapMaterial } from '../utils/mappers.js'
import { authenticate, requireRole, requireVerifiedInstructor } from '../middleware/auth.js'
import { pdfUpload, fileUrl } from '../middleware/upload.js'

const router = Router()
const instructorOnly = [authenticate, requireRole('instructor')]
const verifiedInstructorOnly = [...instructorOnly, requireVerifiedInstructor]
const upload = pdfUpload('materials')

const KINDS = ['pdf', 'recording', 'link']

/* --------------------------- session scoping --------------------------- */

// A material can be pinned to a seminar / booked slot / group class. These
// helpers verify the caller either owns that session (to attach/list as the
// teacher) or belongs to its audience (to view as a student), mirroring how
// quizzes and papers scope access.

const sessionTables = {
  seminarId: { table: 'seminars', col: 'seminar_id' },
  slotId: { table: 'slots', col: 'slot_id' },
  groupId: { table: 'group_classes', col: 'group_id' },
}

// Pull the session scope out of a request body/query. Returns { key, id } for
// the one that's set, or null when the material is unscoped (general shelf).
const readScope = (src) => {
  for (const key of Object.keys(sessionTables)) {
    if (src[key]) return { key, id: src[key] }
  }
  return null
}

// Verify the signed-in instructor owns the scoped session. Returns the column
// name + id to store. Throws if not found / not theirs.
const assertScopeOwner = async (scope, req) => {
  const { table, col } = sessionTables[scope.key]
  const row = await queryOne(`SELECT instructor_id FROM ${table} WHERE id = ?`, [scope.id])
  if (!row) throw notFound('Session not found')
  if (row.instructor_id !== req.user.profileId) throw forbidden('Not your session')
  return { col, id: scope.id }
}

// Verify the caller may VIEW a scoped session's materials — the owning
// instructor, or a student in its audience (registered seminar / slot booker /
// enrolled group). Returns the column name to filter by.
const assertScopeViewer = async (scope, req) => {
  const { table, col } = sessionTables[scope.key]
  const row = await queryOne(`SELECT * FROM ${table} WHERE id = ?`, [scope.id])
  if (!row) throw notFound('Session not found')
  if (req.user.role === 'instructor' && row.instructor_id === req.user.profileId) return col
  if (req.user.role !== 'student') throw forbidden('Not allowed')

  const sid = req.user.profileId
  let ok = false
  if (scope.key === 'seminarId') {
    ok = !!(await queryOne('SELECT id FROM seminar_registrations WHERE seminar_id = ? AND student_id = ?', [scope.id, sid]))
  } else if (scope.key === 'slotId') {
    ok = row.booked_by === sid
  } else {
    ok = !!(await queryOne("SELECT id FROM enrollments WHERE type = 'group' AND ref_id = ? AND student_id = ?", [scope.id, sid]))
  }
  if (!ok) throw forbidden('Join this session to access its materials')
  return col
}

// List materials. Two modes:
//  - Session mode (?seminarId= / ?slotId= / ?groupId=): the resources pinned to
//    that one session, visible to its owner or audience.
//  - Shelf mode (?instructorId= / ?subjectId=): the instructor's general
//    resource shelf — session-pinned materials are excluded so they don't leak
//    into the public/profile listing.
router.get(
  '/',
  authenticate,
  asyncH(async (req, res) => {
    const scope = readScope(req.query)
    if (scope) {
      const col = await assertScopeViewer(scope, req)
      const rows = await query(
        `SELECT m.*, i.name AS instructor_name
           FROM materials m
           JOIN instructors i ON i.id = m.instructor_id
          WHERE m.${col} = ?
          ORDER BY m.created_at DESC`,
        [scope.id]
      )
      return res.json(rows.map(mapMaterial))
    }

    const { instructorId, subjectId } = req.query
    const where = ['m.seminar_id IS NULL', 'm.slot_id IS NULL', 'm.group_id IS NULL']
    const params = []
    if (instructorId) {
      where.push('m.instructor_id = ?')
      params.push(instructorId)
    }
    if (subjectId) {
      where.push('m.subject_id = ?')
      params.push(subjectId)
    }
    const sql = `SELECT m.*, i.name AS instructor_name
                 FROM materials m
                 JOIN instructors i ON i.id = m.instructor_id
                 WHERE ${where.join(' AND ')}
                 ORDER BY m.created_at DESC`
    res.json((await query(sql, params)).map(mapMaterial))
  })
)

// Upload a PDF, then create the material row referencing it. Multipart:
// field 'file' + text fields title/subjectId/moduleId/description.
router.post(
  '/upload',
  verifiedInstructorOnly,
  upload.single('file'),
  asyncH(async (req, res) => {
    if (!req.file) throw badRequest('No PDF uploaded')
    const { title, subjectId, moduleId, description } = req.body
    requireFields(req.body, ['title'])
    const scope = readScope(req.body)
    const scoped = scope ? await assertScopeOwner(scope, req) : null
    const id = uid('mat')
    const url = fileUrl(req, 'materials', req.file.filename)
    await query(
      `INSERT INTO materials (id, instructor_id, subject_id, module_id, seminar_id, slot_id, group_id, title, kind, url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pdf', ?, ?)`,
      [
        id, req.user.profileId, subjectId || null, moduleId || null,
        scoped?.col === 'seminar_id' ? scoped.id : null,
        scoped?.col === 'slot_id' ? scoped.id : null,
        scoped?.col === 'group_id' ? scoped.id : null,
        title, url, description || null,
      ]
    )
    res.status(201).json(mapMaterial(await queryOne('SELECT * FROM materials WHERE id = ?', [id])))
  })
)

// Add a recording or link (external URL) — no file upload.
router.post(
  '/',
  verifiedInstructorOnly,
  asyncH(async (req, res) => {
    const { title, kind, url, subjectId, moduleId, description } = req.body
    requireFields(req.body, ['title', 'url'])
    const k = KINDS.includes(kind) ? kind : 'link'
    if (k === 'pdf') throw badRequest('Use /materials/upload for PDF files')
    const scope = readScope(req.body)
    const scoped = scope ? await assertScopeOwner(scope, req) : null
    const id = uid('mat')
    await query(
      `INSERT INTO materials (id, instructor_id, subject_id, module_id, seminar_id, slot_id, group_id, title, kind, url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.user.profileId, subjectId || null, moduleId || null,
        scoped?.col === 'seminar_id' ? scoped.id : null,
        scoped?.col === 'slot_id' ? scoped.id : null,
        scoped?.col === 'group_id' ? scoped.id : null,
        title, k, url, description || null,
      ]
    )
    res.status(201).json(mapMaterial(await queryOne('SELECT * FROM materials WHERE id = ?', [id])))
  })
)

router.delete(
  '/:id',
  instructorOnly,
  asyncH(async (req, res) => {
    const m = await queryOne('SELECT * FROM materials WHERE id = ?', [req.params.id])
    if (!m) throw notFound('Material not found')
    if (m.instructor_id !== req.user.profileId) throw forbidden('Not your material')
    await query('DELETE FROM materials WHERE id = ?', [req.params.id])
    res.json({ message: 'Material removed' })
  })
)

export default router
