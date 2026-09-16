import { Router } from 'express'
import { query, queryOne, tx } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, badRequest, forbidden } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapReview } from '../utils/mappers.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.get(
  '/',
  asyncH(async (req, res) => {
    const { instructorId } = req.query
    const base = `SELECT r.*, s.name AS student_name, s.hue AS student_hue
                  FROM reviews r LEFT JOIN students s ON s.id = r.student_id`
    const rows = instructorId
      ? await query(`${base} WHERE r.instructor_id = ? ORDER BY r.created_at DESC`, [instructorId])
      : await query(`${base} ORDER BY r.created_at DESC`)
    res.json(rows.map(mapReview))
  })
)

/**
 * Review gate: the student must have paid for classes with this instructor
 * AND been studying for >= 30 days. Mirrors the frontend reviewEligibility.
 */
async function eligibility(studentId, instructorId) {
  const rows = await query(
    `SELECT e.started_at FROM enrollments e
     LEFT JOIN slots s ON e.type = 'slot' AND s.id = e.ref_id
     LEFT JOIN group_classes g ON e.type = 'group' AND g.id = e.ref_id
     WHERE e.student_id = ? AND (s.instructor_id = ? OR g.instructor_id = ?)`,
    [studentId, instructorId, instructorId]
  )
  if (!rows.length) return { eligible: false, reason: 'not-enrolled', days: 0 }

  const earliest = Math.min(...rows.map((r) => new Date(r.started_at).getTime()))
  const days = Math.floor((Date.now() - earliest) / 86400000)

  const existing = await queryOne(
    'SELECT id FROM reviews WHERE student_id = ? AND instructor_id = ?',
    [studentId, instructorId]
  )
  if (existing) return { eligible: false, reason: 'already-reviewed', days }
  if (days < 30) return { eligible: false, reason: 'too-early', days, daysLeft: 30 - days }
  return { eligible: true, reason: 'ok', days }
}

router.get(
  '/eligibility/:instructorId',
  authenticate,
  requireRole('student'),
  asyncH(async (req, res) => {
    res.json(await eligibility(req.user.profileId, req.params.instructorId))
  })
)

function validRating(rating) {
  const r = Number(rating)
  if (!Number.isInteger(r) || r < 1 || r > 5) throw badRequest('Rating must be 1–5')
  return r
}

/** Recompute an instructor's cached average rating and review count. */
async function recomputeInstructor(c, instructorId) {
  const [[agg]] = await c.query(
    'SELECT COUNT(*) AS cnt, AVG(rating) AS avg FROM reviews WHERE instructor_id = ?',
    [instructorId]
  )
  await c.query('UPDATE instructors SET review_count = ?, rating = ? WHERE id = ?', [
    agg.cnt,
    agg.avg == null ? 0 : Number(agg.avg).toFixed(2),
    instructorId,
  ])
}

router.post(
  '/',
  authenticate,
  requireRole('student'),
  asyncH(async (req, res) => {
    const { instructorId, rating, text } = req.body
    requireFields(req.body, ['instructorId', 'rating'])
    const r = validRating(rating)

    const gate = await eligibility(req.user.profileId, instructorId)
    // 'already-reviewed' is the one gate that must not be worked around by
    // POSTing again — the student has to use the update endpoint instead.
    if (!gate.eligible) throw forbidden(`Not eligible to review: ${gate.reason}`)

    const id = uid('rev')
    await tx(async (c) => {
      await c.query(
        `INSERT INTO reviews (id, instructor_id, student_id, rating, days_studied, text, verified)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [id, instructorId, req.user.profileId, r, gate.days, text || null]
      )
      await recomputeInstructor(c, instructorId)
    })
    res.status(201).json(mapReview(await queryOne('SELECT * FROM reviews WHERE id = ?', [id])))
  })
)

/**
 * Edit an existing review. A student may only update their own review, and
 * updating never lets them change which instructor it belongs to — the unique
 * (student_id, instructor_id) pairing is fixed at creation time.
 */
router.put(
  '/:id',
  authenticate,
  requireRole('student'),
  asyncH(async (req, res) => {
    const { rating, text } = req.body
    requireFields(req.body, ['rating'])
    const r = validRating(rating)

    const existing = await queryOne('SELECT * FROM reviews WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Review not found')
    if (existing.student_id !== req.user.profileId) throw forbidden('Not your review')

    await tx(async (c) => {
      await c.query('UPDATE reviews SET rating = ?, text = ? WHERE id = ?', [
        r,
        text || null,
        req.params.id,
      ])
      await recomputeInstructor(c, existing.instructor_id)
    })
    res.json(mapReview(await queryOne('SELECT * FROM reviews WHERE id = ?', [req.params.id])))
  })
)

export default router
