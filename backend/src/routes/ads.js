import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound } from '../utils/http.js'
import { mapAd } from '../utils/mappers.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()
const adminOnly = [authenticate, requireRole('admin')]

/* ---------------------------- public ---------------------------- */
// Active ads only, in display order — consumed by the public home page.
router.get(
  '/',
  asyncH(async (req, res) => {
    const rows = await query('SELECT * FROM ads WHERE is_active = 1 ORDER BY position, created_at')
    res.json(rows.map(mapAd))
  })
)

/* ---------------------------- admin ---------------------------- */
// Every ad (active or not), for the admin manager.
router.get(
  '/all',
  adminOnly,
  asyncH(async (req, res) => {
    const rows = await query('SELECT * FROM ads ORDER BY position, created_at')
    res.json(rows.map(mapAd))
  })
)

router.post(
  '/',
  adminOnly,
  asyncH(async (req, res) => {
    const { title, text, imageUrl, link, position, isActive } = req.body
    const id = uid('ad')
    await query(
      'INSERT INTO ads (id, title, text, image_url, link, position, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title || null, text || null, imageUrl || null, link || null, Number(position) || 0, isActive === false ? 0 : 1]
    )
    res.status(201).json(mapAd(await queryOne('SELECT * FROM ads WHERE id = ?', [id])))
  })
)

router.put(
  '/:id',
  adminOnly,
  asyncH(async (req, res) => {
    const existing = await queryOne('SELECT * FROM ads WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Ad not found')
    const m = { ...mapAd(existing), ...req.body }
    await query(
      'UPDATE ads SET title = ?, text = ?, image_url = ?, link = ?, position = ?, is_active = ? WHERE id = ?',
      [m.title || null, m.text || null, m.imageUrl || null, m.link || null, Number(m.position) || 0, m.isActive ? 1 : 0, req.params.id]
    )
    res.json(mapAd(await queryOne('SELECT * FROM ads WHERE id = ?', [req.params.id])))
  })
)

// Toggle active/inactive.
router.patch(
  '/:id/active',
  adminOnly,
  asyncH(async (req, res) => {
    const isActive = req.body.isActive ? 1 : 0
    const r = await query('UPDATE ads SET is_active = ? WHERE id = ?', [isActive, req.params.id])
    if (!r.affectedRows) throw notFound('Ad not found')
    res.json({ message: `Ad ${isActive ? 'activated' : 'deactivated'}`, ad: mapAd(await queryOne('SELECT * FROM ads WHERE id = ?', [req.params.id])) })
  })
)

router.delete(
  '/:id',
  adminOnly,
  asyncH(async (req, res) => {
    await query('DELETE FROM ads WHERE id = ?', [req.params.id])
    res.json({ message: 'Ad removed' })
  })
)

export default router
