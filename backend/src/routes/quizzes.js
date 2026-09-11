import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest, conflict } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapQuiz, mapQuestion, mapSubmission } from '../utils/mappers.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Every quiz route needs a signed-in user (owning instructor or registered student).
router.use(authenticate)

/* ------------------------------- helpers ------------------------------- */

const loadQuiz = async (id) => {
  // seconds_left is computed on the DB (NOW() and ends_at share a timezone) so
  // the client never has to parse a bare datetime string.
  const q = await queryOne(
    'SELECT *, TIMESTAMPDIFF(SECOND, NOW(), ends_at) AS seconds_left FROM seminar_quizzes WHERE id = ?',
    [id]
  )
  if (!q) throw notFound('Quiz not found')
  return q
}

// True once the shared window has elapsed. Lazily flips a still-'active' row to
// 'ended' so counts/listing stay honest without needing a cron.
const settleIfExpired = async (q) => {
  if (q.status === 'active' && q.ends_at != null && new Date(q.ends_at) <= new Date()) {
    await query("UPDATE seminar_quizzes SET status = 'ended' WHERE id = ?", [q.id])
    q.status = 'ended'
  }
  return q
}

const isOwner = (q, req) => req.user.role === 'instructor' && q.instructor_id === req.user.profileId

const assertOwner = (q, req) => {
  if (!isOwner(q, req)) throw forbidden('Not your quiz')
}

const assertRegistered = async (seminarId, studentId) => {
  const reg = await queryOne(
    'SELECT id FROM seminar_registrations WHERE seminar_id = ? AND student_id = ?',
    [seminarId, studentId]
  )
  if (!reg) throw forbidden('Register for the seminar to access its tests')
}

const questionsOf = async (quizId, { reveal }) => {
  const rows = await query(
    'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY position ASC, id ASC',
    [quizId]
  )
  return rows.map((r) => mapQuestion(r, { reveal }))
}

// Leaderboard for an ended quiz: every submission with the student's name, best first.
const submissionsOf = async (quizId) => {
  const rows = await query(
    `SELECT s.*, st.name AS student_name, st.hue AS student_hue
       FROM quiz_submissions s
       JOIN students st ON st.id = s.student_id
      WHERE s.quiz_id = ?
      ORDER BY s.score DESC, s.submitted_at ASC`,
    [quizId]
  )
  return rows.map(mapSubmission)
}

const validateQuestionBody = (b) => {
  requireFields(b, ['text'])
  const options = Array.isArray(b.options) ? b.options.map((o) => String(o ?? '').trim()) : []
  if (options.length < 2) throw badRequest('A question needs at least two options')
  if (options.some((o) => !o)) throw badRequest('Answer options cannot be blank')
  const correctIndex = Number(b.correctIndex)
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length)
    throw badRequest('Mark which option is the correct answer')
  return { text: String(b.text).trim(), options, correctIndex }
}

/* ------------------------------- listing ------------------------------- */

// List quizzes for a seminar. Owner sees everything (with counts); a registered
// student sees only quizzes that have gone live (active/ended), never drafts.
router.get(
  '/',
  asyncH(async (req, res) => {
    const { seminarId } = req.query
    if (!seminarId) throw badRequest('seminarId is required')
    const seminar = await queryOne('SELECT * FROM seminars WHERE id = ?', [seminarId])
    if (!seminar) throw notFound('Seminar not found')

    const owner = req.user.role === 'instructor' && seminar.instructor_id === req.user.profileId
    if (!owner) {
      if (req.user.role !== 'student') throw forbidden('Not allowed')
      await assertRegistered(seminarId, req.user.profileId)
    }

    const rows = await query(
      `SELECT q.*,
              TIMESTAMPDIFF(SECOND, NOW(), q.ends_at) AS seconds_left,
              (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id)   AS question_count,
              (SELECT COUNT(*) FROM quiz_submissions qs WHERE qs.quiz_id = q.id) AS submission_count
         FROM seminar_quizzes q
        WHERE q.seminar_id = ?
        ORDER BY q.created_at DESC`,
      [seminarId]
    )
    for (const r of rows) await settleIfExpired(r)
    const visible = owner ? rows : rows.filter((r) => r.status !== 'draft')
    res.json(visible.map((r) => mapQuiz(r)))
  })
)

// Full quiz view. Role-aware:
//  - owner instructor: questions WITH the answer key + live submission count.
//  - registered student: draft is hidden; while active the answer key is
//    stripped; once ended, answers + leaderboard + their own result are shown.
router.get(
  '/:id',
  asyncH(async (req, res) => {
    const q = await settleIfExpired(await loadQuiz(req.params.id))
    const owner = isOwner(q, req)

    if (owner) {
      const questions = await questionsOf(q.id, { reveal: true })
      const submissions = await submissionsOf(q.id)
      const quiz = mapQuiz(
        { ...q, question_count: questions.length, submission_count: submissions.length },
        { questions }
      )
      return res.json({ ...quiz, submissions })
    }

    if (req.user.role !== 'student') throw forbidden('Not allowed')
    await assertRegistered(q.seminar_id, req.user.profileId)
    if (q.status === 'draft') throw notFound('Quiz not found')

    const mineRow = await queryOne(
      'SELECT * FROM quiz_submissions WHERE quiz_id = ? AND student_id = ?',
      [q.id, req.user.profileId]
    )
    const mine = mineRow ? mapSubmission(mineRow) : null
    const ended = q.status === 'ended'

    const questions = await questionsOf(q.id, { reveal: ended })
    const body = { ...mapQuiz(q, { questions }), mine }
    if (ended) body.results = { submissions: await submissionsOf(q.id) }
    res.json(body)
  })
)

/* ----------------------------- instructor ----------------------------- */

// Create a draft quiz on a seminar you own.
router.post(
  '/',
  asyncH(async (req, res) => {
    if (req.user.role !== 'instructor') throw forbidden('Instructors only')
    const b = req.body
    requireFields(b, ['seminarId', 'title'])
    const seminar = await queryOne('SELECT * FROM seminars WHERE id = ?', [b.seminarId])
    if (!seminar) throw notFound('Seminar not found')
    if (seminar.instructor_id !== req.user.profileId) throw forbidden('Not your seminar')

    const durationSecs = Math.max(30, Number(b.durationSecs) || 600)
    const id = uid('quiz')
    await query(
      `INSERT INTO seminar_quizzes (id, seminar_id, instructor_id, title, duration_secs, status)
       VALUES (?, ?, ?, ?, ?, 'draft')`,
      [id, seminar.id, req.user.profileId, String(b.title).trim(), durationSecs]
    )
    res.status(201).json(mapQuiz(await loadQuiz(id)))
  })
)

// Edit a draft's title/duration (locked once the quiz has gone live).
router.put(
  '/:id',
  asyncH(async (req, res) => {
    const q = await loadQuiz(req.params.id)
    assertOwner(q, req)
    if (q.status !== 'draft') throw conflict('You can only edit a quiz before it starts')
    const b = req.body
    const durationSecs = b.durationSecs != null ? Math.max(30, Number(b.durationSecs)) : q.duration_secs
    await query('UPDATE seminar_quizzes SET title = ?, duration_secs = ? WHERE id = ?', [
      b.title != null ? String(b.title).trim() : q.title,
      durationSecs,
      q.id,
    ])
    res.json(mapQuiz(await loadQuiz(q.id)))
  })
)

router.delete(
  '/:id',
  asyncH(async (req, res) => {
    const q = await loadQuiz(req.params.id)
    assertOwner(q, req)
    await query('DELETE FROM seminar_quizzes WHERE id = ?', [q.id])
    res.json({ message: 'Quiz removed' })
  })
)

// Add a question to a draft.
router.post(
  '/:id/questions',
  asyncH(async (req, res) => {
    const q = await loadQuiz(req.params.id)
    assertOwner(q, req)
    if (q.status !== 'draft') throw conflict('Add questions before the quiz starts')
    const { text, options, correctIndex } = validateQuestionBody(req.body)
    const [{ n }] = await query('SELECT COUNT(*) AS n FROM quiz_questions WHERE quiz_id = ?', [q.id])
    const id = uid('qq')
    await query(
      'INSERT INTO quiz_questions (id, quiz_id, position, text, options, correct_index) VALUES (?, ?, ?, ?, ?, ?)',
      [id, q.id, n, text, JSON.stringify(options), correctIndex]
    )
    res.status(201).json(mapQuestion(await queryOne('SELECT * FROM quiz_questions WHERE id = ?', [id]), { reveal: true }))
  })
)

router.put(
  '/:id/questions/:qid',
  asyncH(async (req, res) => {
    const q = await loadQuiz(req.params.id)
    assertOwner(q, req)
    if (q.status !== 'draft') throw conflict('You can only edit questions before the quiz starts')
    const existing = await queryOne('SELECT * FROM quiz_questions WHERE id = ? AND quiz_id = ?', [
      req.params.qid,
      q.id,
    ])
    if (!existing) throw notFound('Question not found')
    const { text, options, correctIndex } = validateQuestionBody(req.body)
    await query('UPDATE quiz_questions SET text = ?, options = ?, correct_index = ? WHERE id = ?', [
      text,
      JSON.stringify(options),
      correctIndex,
      existing.id,
    ])
    res.json(mapQuestion(await queryOne('SELECT * FROM quiz_questions WHERE id = ?', [existing.id]), { reveal: true }))
  })
)

router.delete(
  '/:id/questions/:qid',
  asyncH(async (req, res) => {
    const q = await loadQuiz(req.params.id)
    assertOwner(q, req)
    if (q.status !== 'draft') throw conflict('You can only remove questions before the quiz starts')
    await query('DELETE FROM quiz_questions WHERE id = ? AND quiz_id = ?', [req.params.qid, q.id])
    res.json({ message: 'Question removed' })
  })
)

// Activate: start the shared countdown. All registered students see it live now.
router.post(
  '/:id/activate',
  asyncH(async (req, res) => {
    const q = await loadQuiz(req.params.id)
    assertOwner(q, req)
    if (q.status === 'ended') throw conflict('This quiz has already ended')
    if (q.status === 'active') return res.json(mapQuiz(q))
    const [{ n }] = await query('SELECT COUNT(*) AS n FROM quiz_questions WHERE quiz_id = ?', [q.id])
    if (n === 0) throw badRequest('Add at least one question before starting')
    await query(
      `UPDATE seminar_quizzes
          SET status = 'active', started_at = NOW(),
              ends_at = DATE_ADD(NOW(), INTERVAL duration_secs SECOND)
        WHERE id = ?`,
      [q.id]
    )
    res.json(mapQuiz(await loadQuiz(q.id)))
  })
)

// End early. Results become visible to everyone immediately.
router.post(
  '/:id/end',
  asyncH(async (req, res) => {
    const q = await loadQuiz(req.params.id)
    assertOwner(q, req)
    if (q.status === 'draft') throw conflict('This quiz has not started yet')
    await query("UPDATE seminar_quizzes SET status = 'ended', ends_at = NOW() WHERE id = ?", [q.id])
    res.json(mapQuiz(await loadQuiz(q.id)))
  })
)

/* ------------------------------- student ------------------------------ */

// Submit answers while the quiz is live. Scored on the spot; one attempt only.
router.post(
  '/:id/submit',
  asyncH(async (req, res) => {
    if (req.user.role !== 'student') throw forbidden('Students only')
    const q = await settleIfExpired(await loadQuiz(req.params.id))
    await assertRegistered(q.seminar_id, req.user.profileId)
    if (q.status !== 'active') throw conflict('This test is not open for answers')

    const dupe = await queryOne(
      'SELECT id FROM quiz_submissions WHERE quiz_id = ? AND student_id = ?',
      [q.id, req.user.profileId]
    )
    if (dupe) throw conflict('You have already submitted this test')

    const answers = req.body?.answers && typeof req.body.answers === 'object' ? req.body.answers : {}
    const questions = await query('SELECT id, correct_index FROM quiz_questions WHERE quiz_id = ?', [q.id])
    let score = 0
    for (const question of questions) {
      if (Number(answers[question.id]) === question.correct_index) score += 1
    }
    const total = questions.length

    await query(
      'INSERT INTO quiz_submissions (id, quiz_id, student_id, answers, score, total) VALUES (?, ?, ?, ?, ?, ?)',
      [uid('qs'), q.id, req.user.profileId, JSON.stringify(answers), score, total]
    )
    // Score is withheld until the shared window closes so nobody gets an early
    // read on how they did; the student sees it on the results screen.
    res.status(201).json({ message: 'Answers submitted', total })
  })
)

export default router
