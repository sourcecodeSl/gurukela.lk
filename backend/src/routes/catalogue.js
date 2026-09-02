import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapSubject, mapModule } from '../utils/mappers.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()
const adminOnly = [authenticate, requireRole('admin')]

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
    const { name, icon, color, description } = req.body
    requireFields(req.body, ['name'])
    const id = uid('sub')
    await query('INSERT INTO subjects (id, name, icon, color, description) VALUES (?, ?, ?, ?, ?)', [
      id,
      name,
      icon || null,
      color ?? null,
      description || null,
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
    const { name, icon, color, description } = { ...existing, ...req.body }
    await query(
      'UPDATE subjects SET name = ?, icon = ?, color = ?, description = ? WHERE id = ?',
      [name, icon, color, description, req.params.id]
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

export default router
