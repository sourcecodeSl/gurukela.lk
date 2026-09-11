import { Router } from 'express'
import { query, queryOne, tx } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest, conflict } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapSeminar } from '../utils/mappers.js'
import { authenticate, requireRole, requireVerifiedInstructor } from '../middleware/auth.js'

const router = Router()

/* ------------------------------- public ------------------------------- */

// List published seminars (newest first, upcoming emphasised by the client).
// The meet link is never exposed here — only registered students get it.
router.get(
  '/',
  asyncH(async (req, res) => {
    const { instructorId } = req.query
    const rows = instructorId
      ? await query(
          'SELECT * FROM seminars WHERE instructor_id = ? ORDER BY starts_at DESC',
          [instructorId]
        )
      : await query("SELECT * FROM seminars WHERE status = 'published' ORDER BY starts_at DESC")
    res.json(rows.map((r) => mapSeminar(r)))
  })
)

// Seminars the signed-in student has registered for, WITH the meet link.
router.get(
  '/mine',
  [authenticate, requireRole('student')],
  asyncH(async (req, res) => {
    const rows = await query(
      `SELECT s.*, r.paid AS reg_paid, r.registered_at
         FROM seminar_registrations r
         JOIN seminars s ON s.id = r.seminar_id
        WHERE r.student_id = ?
        ORDER BY s.starts_at DESC`,
      [req.user.profileId]
    )
    res.json(
      rows.map((r) => ({
        ...mapSeminar(r, { registered: true }),
        paid: !!r.reg_paid,
        registeredAt: r.registered_at,
      }))
    )
  })
)

router.get(
  '/:id',
  asyncH(async (req, res) => {
    const s = await queryOne('SELECT * FROM seminars WHERE id = ?', [req.params.id])
    if (!s) throw notFound('Seminar not found')
    res.json(mapSeminar(s))
  })
)

/* ----------------------------- instructor ----------------------------- */

const instructorOnly = [authenticate, requireRole('instructor')]

const assertOwner = async (req) => {
  const s = await queryOne('SELECT * FROM seminars WHERE id = ?', [req.params.id])
  if (!s) throw notFound('Seminar not found')
  if (s.instructor_id !== req.user.profileId) throw forbidden('Not your seminar')
  return s
}

// Publish a seminar. Free seminars force price to 0.
router.post(
  '/',
  [...instructorOnly, requireVerifiedInstructor],
  asyncH(async (req, res) => {
    const b = req.body
    requireFields(b, ['title'])
    const isFree = b.isFree === undefined ? true : !!b.isFree
    const price = isFree ? 0 : Number(b.price) || 0
    const id = uid('sem')
    await query(
      `INSERT INTO seminars
        (id, instructor_id, subject_id, title, description, banner_url, starts_at,
         duration_mins, is_free, price, seats, registered, meet_link, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'published')`,
      [
        id,
        req.user.profileId,
        b.subjectId || null,
        b.title,
        b.description || null,
        b.bannerUrl || null,
        b.startsAt || null,
        b.durationMins ?? 60,
        isFree ? 1 : 0,
        price,
        b.seats ?? 0,
        b.meetLink || null,
      ]
    )
    res.status(201).json(mapSeminar(await queryOne('SELECT * FROM seminars WHERE id = ?', [id])))
  })
)

router.put(
  '/:id',
  instructorOnly,
  asyncH(async (req, res) => {
    const s = await assertOwner(req)
    const b = req.body
    const isFree = b.isFree === undefined ? !!s.is_free : !!b.isFree
    const price = isFree ? 0 : b.price ?? s.price
    await query(
      `UPDATE seminars SET subject_id = ?, title = ?, description = ?, banner_url = ?, starts_at = ?,
         duration_mins = ?, is_free = ?, price = ?, seats = ?, meet_link = ?, status = ? WHERE id = ?`,
      [
        b.subjectId ?? s.subject_id,
        b.title ?? s.title,
        b.description ?? s.description,
        b.bannerUrl ?? s.banner_url,
        b.startsAt ?? s.starts_at,
        b.durationMins ?? s.duration_mins,
        isFree ? 1 : 0,
        price,
        b.seats ?? s.seats,
        b.meetLink !== undefined ? b.meetLink || null : s.meet_link,
        b.status ?? s.status,
        req.params.id,
      ]
    )
    res.json(mapSeminar(await queryOne('SELECT * FROM seminars WHERE id = ?', [req.params.id])))
  })
)

router.delete(
  '/:id',
  instructorOnly,
  asyncH(async (req, res) => {
    await assertOwner(req)
    await query('DELETE FROM seminars WHERE id = ?', [req.params.id])
    res.json({ message: 'Seminar removed' })
  })
)

// The attendee list (registered students) for the owning instructor.
router.get(
  '/:id/registrations',
  instructorOnly,
  asyncH(async (req, res) => {
    await assertOwner(req)
    const rows = await query(
      `SELECT r.id, r.student_id, r.paid, r.registered_at, st.name AS student_name, st.hue AS student_hue
         FROM seminar_registrations r
         JOIN students st ON st.id = r.student_id
        WHERE r.seminar_id = ?
        ORDER BY r.registered_at DESC`,
      [req.params.id]
    )
    res.json(
      rows.map((r) => ({
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        studentHue: r.student_hue,
        paid: !!r.paid,
        registeredAt: r.registered_at,
      }))
    )
  })
)

/* ------------------------------- student ------------------------------ */

// Register for a FREE seminar (paid ones must go through PayHere). Idempotent.
// Returns the meet link so the student can join immediately.
router.post(
  '/:id/register',
  [authenticate, requireRole('student')],
  asyncH(async (req, res) => {
    const result = await tx(async (c) => {
      const [[s]] = await c.query('SELECT * FROM seminars WHERE id = ? FOR UPDATE', [req.params.id])
      if (!s) throw notFound('Seminar not found')
      if (!s.is_free) throw badRequest('This is a paid seminar — please pay to register')
      if (s.seats > 0 && s.registered >= s.seats) throw conflict('This seminar is full')

      const [[dupe]] = await c.query(
        'SELECT id FROM seminar_registrations WHERE seminar_id = ? AND student_id = ?',
        [s.id, req.user.profileId]
      )
      if (!dupe) {
        await c.query(
          'INSERT INTO seminar_registrations (id, seminar_id, student_id, paid) VALUES (?, ?, ?, 0)',
          [uid('smr'), s.id, req.user.profileId]
        )
        await c.query('UPDATE seminars SET registered = registered + 1 WHERE id = ?', [s.id])
      }
      return { meetLink: s.meet_link }
    })
    res.json({ message: 'Registered for the seminar.', ...result })
  })
)

export default router
