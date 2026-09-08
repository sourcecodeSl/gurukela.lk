import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapMaterial } from '../utils/mappers.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { pdfUpload, fileUrl } from '../middleware/upload.js'

const router = Router()
const instructorOnly = [authenticate, requireRole('instructor')]
const upload = pdfUpload('materials')

const KINDS = ['pdf', 'recording', 'link']

// List materials, optionally filtered by instructor or subject. Any signed-in
// user can browse (students view their instructors' resources).
router.get(
  '/',
  authenticate,
  asyncH(async (req, res) => {
    const { instructorId, subjectId } = req.query
    const where = []
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
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY m.created_at DESC`
    res.json((await query(sql, params)).map(mapMaterial))
  })
)

// Upload a PDF, then create the material row referencing it. Multipart:
// field 'file' + text fields title/subjectId/moduleId/description.
router.post(
  '/upload',
  instructorOnly,
  upload.single('file'),
  asyncH(async (req, res) => {
    if (!req.file) throw badRequest('No PDF uploaded')
    const { title, subjectId, moduleId, description } = req.body
    requireFields(req.body, ['title'])
    const id = uid('mat')
    const url = fileUrl(req, 'materials', req.file.filename)
    await query(
      `INSERT INTO materials (id, instructor_id, subject_id, module_id, title, kind, url, description)
       VALUES (?, ?, ?, ?, ?, 'pdf', ?, ?)`,
      [id, req.user.profileId, subjectId || null, moduleId || null, title, url, description || null]
    )
    res.status(201).json(mapMaterial(await queryOne('SELECT * FROM materials WHERE id = ?', [id])))
  })
)

// Add a recording or link (external URL) — no file upload.
router.post(
  '/',
  instructorOnly,
  asyncH(async (req, res) => {
    const { title, kind, url, subjectId, moduleId, description } = req.body
    requireFields(req.body, ['title', 'url'])
    const k = KINDS.includes(kind) ? kind : 'link'
    if (k === 'pdf') throw badRequest('Use /materials/upload for PDF files')
    const id = uid('mat')
    await query(
      `INSERT INTO materials (id, instructor_id, subject_id, module_id, title, kind, url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.profileId, subjectId || null, moduleId || null, title, k, url, description || null]
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
