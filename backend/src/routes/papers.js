import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest, conflict } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapPaper, mapPaperSubmission } from '../utils/mappers.js'
import { authenticate, requireVerifiedInstructor } from '../middleware/auth.js'
import { pdfUpload, answerUpload, fileUrl } from '../middleware/upload.js'

/**
 * Papers: a question paper / handout (PDF) an instructor attaches to a seminar
 * (many registered students) OR a booked 1-on-1 slot (the one student who booked
 * it) — exactly one of seminarId / slotId, same shape as seminar_quizzes.
 * Students in that audience download the paper and, when answers are allowed,
 * upload their own answer (PDF or image); the instructor marks it and leaves
 * feedback.
 */

const router = Router()
const paperUpload = pdfUpload('papers')
const submissionUpload = answerUpload('paper-answers')

// Every route needs a signed-in user (the owning instructor or an audience student).
router.use(authenticate)

/* ------------------------------- helpers ------------------------------- */

const loadPaper = async (id) => {
  const p = await queryOne('SELECT * FROM papers WHERE id = ?', [id])
  if (!p) throw notFound('Paper not found')
  return p
}

const isOwner = (p, req) => req.user.role === 'instructor' && p.instructor_id === req.user.profileId

const assertOwner = (p, req) => {
  if (!isOwner(p, req)) throw forbidden('Not your paper')
}

const assertRegistered = async (seminarId, studentId) => {
  const reg = await queryOne(
    'SELECT id FROM seminar_registrations WHERE seminar_id = ? AND student_id = ?',
    [seminarId, studentId]
  )
  if (!reg) throw forbidden('Register for the seminar to access its papers')
}

// Gate a student to the paper's audience — the slot's booker, or a registered
// seminar student — mirroring how quizzes scope access.
const assertStudentAccess = async (p, studentId) => {
  if (p.slot_id) {
    const slot = await queryOne('SELECT booked_by FROM slots WHERE id = ?', [p.slot_id])
    if (!slot || slot.booked_by !== studentId)
      throw forbidden('This paper is for the student who booked this slot')
  } else {
    await assertRegistered(p.seminar_id, studentId)
  }
}

// Resolve the owning instructor of a target seminar/slot when creating a paper,
// verifying the caller owns it. Returns { seminarId, slotId }.
const resolveTarget = async (b, req) => {
  if (b.slotId) {
    const slot = await queryOne('SELECT * FROM slots WHERE id = ?', [b.slotId])
    if (!slot) throw notFound('Slot not found')
    if (slot.instructor_id !== req.user.profileId) throw forbidden('Not your slot')
    return { seminarId: null, slotId: slot.id }
  }
  if (!b.seminarId) throw badRequest('seminarId or slotId is required')
  const seminar = await queryOne('SELECT * FROM seminars WHERE id = ?', [b.seminarId])
  if (!seminar) throw notFound('Seminar not found')
  if (seminar.instructor_id !== req.user.profileId) throw forbidden('Not your seminar')
  return { seminarId: seminar.id, slotId: null }
}

/* ------------------------------- listing ------------------------------- */

// List papers for a seminar or a slot. Owner sees submission counts; an audience
// student sees each paper with their own submission (mine) attached.
router.get(
  '/',
  asyncH(async (req, res) => {
    const { seminarId, slotId } = req.query
    if (!seminarId && !slotId) throw badRequest('seminarId or slotId is required')

    let owner, whereClause, whereVal
    if (slotId) {
      const slot = await queryOne('SELECT * FROM slots WHERE id = ?', [slotId])
      if (!slot) throw notFound('Slot not found')
      owner = req.user.role === 'instructor' && slot.instructor_id === req.user.profileId
      if (!owner && (req.user.role !== 'student' || slot.booked_by !== req.user.profileId))
        throw forbidden('This paper is for the student who booked this slot')
      whereClause = 'p.slot_id = ?'
      whereVal = slotId
    } else {
      const seminar = await queryOne('SELECT * FROM seminars WHERE id = ?', [seminarId])
      if (!seminar) throw notFound('Seminar not found')
      owner = req.user.role === 'instructor' && seminar.instructor_id === req.user.profileId
      if (!owner) {
        if (req.user.role !== 'student') throw forbidden('Not allowed')
        await assertRegistered(seminarId, req.user.profileId)
      }
      whereClause = 'p.seminar_id = ?'
      whereVal = seminarId
    }

    const rows = await query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM paper_submissions ps WHERE ps.paper_id = p.id) AS submission_count
         FROM papers p
        WHERE ${whereClause}
        ORDER BY p.created_at DESC`,
      [whereVal]
    )

    if (owner) return res.json(rows.map((r) => mapPaper(r, { submissionCount: r.submission_count })))

    // Student view: attach each paper's own submission (null if none yet).
    const mineRows = rows.length
      ? await query(
          `SELECT * FROM paper_submissions
            WHERE student_id = ? AND paper_id IN (${rows.map(() => '?').join(',')})`,
          [req.user.profileId, ...rows.map((r) => r.id)]
        )
      : []
    const mineByPaper = Object.fromEntries(mineRows.map((m) => [m.paper_id, mapPaperSubmission(m)]))
    res.json(rows.map((r) => mapPaper(r, { mine: mineByPaper[r.id] || null })))
  })
)

/* ----------------------------- instructor ----------------------------- */

// Upload a paper PDF and create the row. Multipart: field 'file' + text fields
// seminarId|slotId, title, description, dueAt, allowAnswers.
router.post(
  '/upload',
  requireVerifiedInstructor,
  paperUpload.single('file'),
  asyncH(async (req, res) => {
    if (req.user.role !== 'instructor') throw forbidden('Instructors only')
    if (!req.file) throw badRequest('No PDF uploaded')
    requireFields(req.body, ['title'])
    const { seminarId, slotId } = await resolveTarget(req.body, req)
    const id = uid('pap')
    const url = fileUrl(req, 'papers', req.file.filename)
    const allowAnswers = req.body.allowAnswers === undefined ? 1 : req.body.allowAnswers === 'false' || req.body.allowAnswers === false ? 0 : 1
    const dueAt = req.body.dueAt ? String(req.body.dueAt).replace('T', ' ') : null
    await query(
      `INSERT INTO papers (id, instructor_id, seminar_id, slot_id, title, description, file_url, allow_answers, due_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.profileId, seminarId, slotId, String(req.body.title).trim(), req.body.description || null, url, allowAnswers, dueAt]
    )
    res.status(201).json(mapPaper(await loadPaper(id), { submissionCount: 0 }))
  })
)

// Edit a paper's details / open or close answer submissions.
router.patch(
  '/:id',
  asyncH(async (req, res) => {
    const p = await loadPaper(req.params.id)
    assertOwner(p, req)
    const b = req.body
    const allowAnswers = b.allowAnswers === undefined ? p.allow_answers : b.allowAnswers ? 1 : 0
    const dueAt = b.dueAt !== undefined ? (b.dueAt ? String(b.dueAt).replace('T', ' ') : null) : p.due_at
    await query('UPDATE papers SET title = ?, description = ?, allow_answers = ?, due_at = ? WHERE id = ?', [
      b.title != null ? String(b.title).trim() : p.title,
      b.description !== undefined ? b.description || null : p.description,
      allowAnswers,
      dueAt,
      p.id,
    ])
    res.json(mapPaper(await loadPaper(p.id)))
  })
)

router.delete(
  '/:id',
  asyncH(async (req, res) => {
    const p = await loadPaper(req.params.id)
    assertOwner(p, req)
    await query('DELETE FROM papers WHERE id = ?', [p.id])
    res.json({ message: 'Paper removed' })
  })
)

// Owner: every student's answer submission for this paper, with their name.
router.get(
  '/:id/submissions',
  asyncH(async (req, res) => {
    const p = await loadPaper(req.params.id)
    assertOwner(p, req)
    const rows = await query(
      `SELECT ps.*, st.name AS student_name, st.hue AS student_hue
         FROM paper_submissions ps
         JOIN students st ON st.id = ps.student_id
        WHERE ps.paper_id = ?
        ORDER BY ps.submitted_at DESC`,
      [p.id]
    )
    res.json(rows.map(mapPaperSubmission))
  })
)

// Owner: mark a submission and/or leave feedback.
router.patch(
  '/:id/submissions/:sid',
  asyncH(async (req, res) => {
    const p = await loadPaper(req.params.id)
    assertOwner(p, req)
    const sub = await queryOne('SELECT * FROM paper_submissions WHERE id = ? AND paper_id = ?', [req.params.sid, p.id])
    if (!sub) throw notFound('Submission not found')
    const marks = req.body.marks === '' || req.body.marks == null ? null : Number(req.body.marks)
    if (marks != null && !Number.isFinite(marks)) throw badRequest('Marks must be a number')
    await query('UPDATE paper_submissions SET marks = ?, feedback = ?, graded_at = NOW() WHERE id = ?', [
      marks,
      req.body.feedback != null ? String(req.body.feedback).trim() || null : sub.feedback,
      sub.id,
    ])
    res.json(mapPaperSubmission(await queryOne('SELECT * FROM paper_submissions WHERE id = ?', [sub.id])))
  })
)

/* ------------------------------- student ------------------------------ */

// Submit (or replace) an answer for a paper. Multipart: 'file' (PDF or image) +
// optional 'note'. Re-uploading overwrites the row and clears any prior marking.
router.post(
  '/:id/submit',
  submissionUpload.single('file'),
  asyncH(async (req, res) => {
    if (req.user.role !== 'student') throw forbidden('Students only')
    const p = await loadPaper(req.params.id)
    await assertStudentAccess(p, req.user.profileId)
    if (!p.allow_answers) throw conflict('Answers are closed for this paper')
    if (!req.file) throw badRequest('No answer file uploaded')

    const url = fileUrl(req, 'paper-answers', req.file.filename)
    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image'
    const note = req.body.note ? String(req.body.note).trim() || null : null

    const existing = await queryOne(
      'SELECT id FROM paper_submissions WHERE paper_id = ? AND student_id = ?',
      [p.id, req.user.profileId]
    )
    if (existing) {
      // Replace the file; clear the previous mark/feedback since it no longer applies.
      await query(
        'UPDATE paper_submissions SET file_url = ?, file_type = ?, note = ?, marks = NULL, feedback = NULL, graded_at = NULL, submitted_at = NOW() WHERE id = ?',
        [url, fileType, note, existing.id]
      )
      return res.json(mapPaperSubmission(await queryOne('SELECT * FROM paper_submissions WHERE id = ?', [existing.id])))
    }
    const id = uid('psb')
    await query(
      'INSERT INTO paper_submissions (id, paper_id, student_id, file_url, file_type, note) VALUES (?, ?, ?, ?, ?, ?)',
      [id, p.id, req.user.profileId, url, fileType, note]
    )
    res.status(201).json(mapPaperSubmission(await queryOne('SELECT * FROM paper_submissions WHERE id = ?', [id])))
  })
)

export default router
