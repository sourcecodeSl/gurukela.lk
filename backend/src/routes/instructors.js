import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { asyncH, notFound, badRequest, forbidden } from '../utils/http.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { getInstructor, listInstructors } from '../repositories/people.js'
import { mapEnrollment } from '../utils/mappers.js'
import { imageUpload, fileUrl } from '../middleware/upload.js'

const router = Router()
const photoUpload = imageUpload('avatars')

/* Public discovery (only active, non-banned instructors, contact hidden). */
router.get(
  '/',
  asyncH(async (req, res) => {
    const all = await listInstructors({ publicView: true })
    const visible = all.filter((i) => i.isActive !== false)
    res.json(visible)
  })
)

router.get(
  '/:id',
  asyncH(async (req, res) => {
    const ins = await getInstructor(req.params.id, { publicView: true })
    if (!ins) throw notFound('Instructor not found')
    res.json(ins)
  })
)

/* ---- Instructor self-service ---- */
const instructorOnly = [authenticate, requireRole('instructor')]

// Enrollments across this instructor's slots + group classes (roster / who paid).
router.get(
  '/:id/enrollments',
  instructorOnly,
  asyncH(async (req, res) => {
    if (req.user.profileId !== req.params.id) throw forbidden('Not your record')
    const rows = await query(
      `SELECT e.*, st.name AS student_name, st.hue AS student_hue
       FROM enrollments e
       LEFT JOIN students st ON st.id = e.student_id
       LEFT JOIN slots s ON e.type = 'slot' AND s.id = e.ref_id
       LEFT JOIN group_classes g ON e.type = 'group' AND g.id = e.ref_id
       WHERE s.instructor_id = ? OR g.instructor_id = ?
       ORDER BY e.paid_at DESC`,
      [req.params.id, req.params.id]
    )
    res.json(rows.map(mapEnrollment))
  })
)

const assertSelf = (req) => {
  if (req.user.profileId !== req.params.id)
    throw forbidden('You can only manage your own profile')
}

// Update own profile details.
router.put(
  '/:id',
  instructorOnly,
  asyncH(async (req, res) => {
    assertSelf(req)
    const existing = await queryOne('SELECT * FROM instructors WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Instructor not found')
    const b = req.body
    await query(
      `UPDATE instructors SET title = ?, hue = ?, hourly_rate = ?, response_mins = ?,
        languages = ?, city = ?, experience_years = ?, bio = ?, highlights = ? WHERE id = ?`,
      [
        b.title ?? existing.title,
        b.hue ?? existing.hue,
        b.hourlyRate ?? existing.hourly_rate,
        b.responseMins ?? existing.response_mins,
        JSON.stringify(b.languages ?? existing.languages ?? []),
        b.city ?? existing.city,
        b.experienceYears ?? existing.experience_years,
        b.bio ?? existing.bio,
        JSON.stringify(b.highlights ?? existing.highlights ?? []),
        req.params.id,
      ]
    )
    res.json(await getInstructor(req.params.id))
  })
)

// Upload / replace the instructor's profile picture. Multipart: field 'file'.
router.post(
  '/:id/photo',
  instructorOnly,
  photoUpload.single('file'),
  asyncH(async (req, res) => {
    assertSelf(req)
    if (!req.file) throw badRequest('No image uploaded')
    const existing = await queryOne('SELECT id FROM instructors WHERE id = ?', [req.params.id])
    if (!existing) throw notFound('Instructor not found')
    const url = fileUrl(req, 'avatars', req.file.filename)
    await query('UPDATE instructors SET photo_url = ? WHERE id = ?', [url, req.params.id])
    res.json(await getInstructor(req.params.id))
  })
)

// Set the subjects this instructor teaches (from the admin catalogue). The
// lessons/modules they cover are every module under these subjects.
router.put(
  '/:id/subjects',
  instructorOnly,
  asyncH(async (req, res) => {
    assertSelf(req)
    const subjectIds = req.body.subjectIds || []
    await query('DELETE FROM instructor_subjects WHERE instructor_id = ?', [req.params.id])
    for (const sid of subjectIds) {
      await query('INSERT IGNORE INTO instructor_subjects (instructor_id, subject_id) VALUES (?, ?)', [
        req.params.id,
        sid,
      ])
    }
    res.json(await getInstructor(req.params.id))
  })
)

/**
 * Submit the >= 5 minute video for advanced (second) verification.
 * Only allowed once basic verification has passed.
 */
router.post(
  '/:id/verification-video',
  instructorOnly,
  asyncH(async (req, res) => {
    assertSelf(req)
    const { videoUrl } = req.body
    const seconds = Number(req.body.videoSeconds)
    if (!videoUrl) throw badRequest('videoUrl is required')
    if (!Number.isFinite(seconds) || seconds < 300)
      throw badRequest('The video must be at least 5 minutes (300 seconds) long')

    const ins = await queryOne('SELECT * FROM instructors WHERE id = ?', [req.params.id])
    if (!ins) throw notFound('Instructor not found')
    if (!['basic_verified', 'pending_advanced', 'rejected'].includes(ins.verification_status))
      throw badRequest('Await first (basic) verification before submitting the video')

    await query(
      `UPDATE instructors SET video_url = ?, video_seconds = ?, verification_status = 'pending_advanced'
       WHERE id = ?`,
      [videoUrl, seconds, req.params.id]
    )
    res.json({
      message: 'Video submitted. Awaiting advanced verification by admin.',
      instructor: await getInstructor(req.params.id),
    })
  })
)

export default router
