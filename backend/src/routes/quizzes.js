import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest, conflict } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapQuiz, mapQuestion, mapSubmission } from '../utils/mappers.js'
import { authenticate } from '../middleware/auth.js'
import { imageUpload, fileUrl } from '../middleware/upload.js'

const router = Router()
const quizImageUpload = imageUpload('quizzes')

// Every quiz route needs a signed-in user (owning instructor or registered student).
router.use(authenticate)

// Upload an image used in a question or an answer option; returns its public URL.
router.post(
  '/upload',
  quizImageUpload.single('image'),
  asyncH(async (req, res) => {
    if (req.user.role !== 'instructor') throw forbidden('Instructors only')
    if (!req.file) throw badRequest('No image uploaded')
    res.status(201).json({ url: fileUrl(req, 'quizzes', req.file.filename) })
  })
)

/* ------------------------------- helpers ------------------------------- */

// seconds_left is computed on the DB (NOW() and ends_at share a timezone) so
// the client never has to parse a bare datetime string.
const reloadRow = (id) =>
  queryOne(
    'SELECT *, TIMESTAMPDIFF(SECOND, NOW(), ends_at) AS seconds_left FROM seminar_quizzes WHERE id = ?',
    [id]
  )

const loadQuiz = async (id) => {
  const q = await reloadRow(id)
  if (!q) throw notFound('Quiz not found')
  return q
}

// Advance a quiz through its lifecycle lazily, so no cron is needed:
//   scheduled → active   the moment its start time arrives, and
//   active    → ended    once the shared window has elapsed.
// The scheduled→active flip is done in SQL against NOW() (so it matches
// scheduled_at's timezone), then the row is reloaded so status/seconds_left stay
// in sync for the caller. Called on every read of a quiz.
const settleQuiz = async (q) => {
  if (q.status === 'scheduled') {
    const r = await query(
      `UPDATE seminar_quizzes
          SET status = 'active', started_at = scheduled_at,
              ends_at = DATE_ADD(scheduled_at, INTERVAL duration_secs SECOND)
        WHERE id = ? AND status = 'scheduled' AND scheduled_at <= NOW()`,
      [q.id]
    )
    if (r.affectedRows) Object.assign(q, await reloadRow(q.id))
  }
  if (q.status === 'active' && q.ends_at != null && new Date(q.ends_at) <= new Date()) {
    await query("UPDATE seminar_quizzes SET status = 'ended' WHERE id = ?", [q.id])
    Object.assign(q, await reloadRow(q.id))
  }
  return q
}

// Parse an incoming "YYYY-MM-DD HH:MM:SS" local wall-clock start time (same
// convention as seminars/classes — stored verbatim, no UTC shift) and require
// it to be in the future. Returns the normalised string to store.
const parseFutureTime = (raw) => {
  const s = String(raw ?? '').trim()
  if (!s) throw badRequest('Pick a start date and time')
  const when = new Date(s.replace(' ', 'T'))
  if (Number.isNaN(when.getTime())) throw badRequest('That start time is not valid')
  if (when.getTime() <= Date.now()) throw badRequest('Pick a start time in the future')
  return s
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

// A quiz lives on a seminar (many registered students) or a booked slot (the one
// student who booked it). This gates a student to the quiz's audience either way.
const assertStudentAccess = async (q, studentId) => {
  if (q.slot_id) {
    const slot = await queryOne('SELECT booked_by FROM slots WHERE id = ?', [q.slot_id])
    if (!slot || slot.booked_by !== studentId)
      throw forbidden('This test is for the student who booked this slot')
  } else {
    await assertRegistered(q.seminar_id, studentId)
  }
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

// How many students the quiz is aimed at: everyone registered for the seminar,
// or the single student who booked the slot.
const audienceSize = async (q) => {
  if (q.slot_id) return 1
  const [{ n }] = await query(
    'SELECT COUNT(*) AS n FROM seminar_registrations WHERE seminar_id = ?',
    [q.seminar_id]
  )
  return Number(n)
}

// Real-time progress for the lecturer's live panel: how many of the audience
// have opened the quiz (started), how many have submitted, and how many are
// still working on it (started but not submitted).
const liveProgress = async (q) => {
  const [[{ started }], [{ submitted }], expected] = await Promise.all([
    query('SELECT COUNT(*) AS started FROM quiz_attempts WHERE quiz_id = ?', [q.id]),
    query('SELECT COUNT(*) AS submitted FROM quiz_submissions WHERE quiz_id = ?', [q.id]),
    audienceSize(q),
  ])
  const startedN = Number(started)
  const submittedN = Number(submitted)
  return {
    expected,
    started: startedN,
    submitted: submittedN,
    inProgress: Math.max(0, startedN - submittedN),
    // Of the audience, how many have not opened the quiz at all.
    notStarted: Math.max(0, expected - startedN),
  }
}

// Record (once) that a student has opened this quiz, so they count towards the
// live "in progress" tally. Idempotent via the unique (quiz_id, student_id) key.
const recordAttempt = (quizId, studentId) =>
  query(
    'INSERT IGNORE INTO quiz_attempts (id, quiz_id, student_id) VALUES (?, ?, ?)',
    [uid('qa'), quizId, studentId]
  )

// Post-quiz analytics for the lecturer: per-question correct counts + percentage,
// and how scores are distributed across mark bands. Computed from the stored
// submissions (answers JSON vs each question's correct_index).
const quizAnalytics = async (quizId) => {
  const [questions, subs] = await Promise.all([
    query('SELECT id, position, text, correct_index, correct_indexes FROM quiz_questions WHERE quiz_id = ? ORDER BY position ASC, id ASC', [quizId]),
    query('SELECT answers, score, total FROM quiz_submissions WHERE quiz_id = ?', [quizId]),
  ])
  const parseAnswers = (a) => (a && typeof a === 'string' ? JSON.parse(a) : a || {})
  const answerSets = subs.map((s) => parseAnswers(s.answers))
  const submissionCount = subs.length

  const questionStats = questions.map((qq, i) => {
    let answered = 0
    let correct = 0
    for (const ans of answerSets) {
      const chosen = ans[qq.id]
      const answeredThis = Array.isArray(chosen) ? chosen.length > 0 : chosen != null
      if (answeredThis) {
        answered += 1
        if (isAnswerCorrect(chosen, correctSetFor(qq))) correct += 1
      }
    }
    return {
      questionId: qq.id,
      position: i + 1,
      text: qq.text,
      answered,
      correct,
      // % correct out of everyone who submitted (blank answers count as wrong).
      percent: submissionCount ? Math.round((correct / submissionCount) * 100) : 0,
    }
  })

  // Score distribution in percentage bands, so it works whatever the mark total.
  const total = questions.length
  const bands = [
    { label: '0–39%', min: 0, max: 0.399999 },
    { label: '40–54%', min: 0.4, max: 0.549999 },
    { label: '55–69%', min: 0.55, max: 0.699999 },
    { label: '70–84%', min: 0.7, max: 0.849999 },
    { label: '85–100%', min: 0.85, max: 1 },
  ].map((b) => ({ ...b, count: 0 }))
  for (const s of subs) {
    const frac = s.total ? s.score / s.total : 0
    const band = bands.find((b) => frac >= b.min && frac <= b.max) || bands[0]
    band.count += 1
  }
  const scoreDistribution = bands.map(({ label, count }) => ({ label, count }))

  return { total, submissionCount, questionStats, scoreDistribution }
}

// Normalise one answer option to { text, imageUrl }. Accepts a plain string
// (legacy / simple) or an object; an option is valid if it has text or an image.
const normOption = (o) => {
  if (o && typeof o === 'object') {
    return {
      text: String(o.text ?? '').trim(),
      imageUrl: o.imageUrl ? String(o.imageUrl).trim() : null,
    }
  }
  return { text: String(o ?? '').trim(), imageUrl: null }
}

const validateQuestionBody = (b) => {
  const text = String(b.text ?? '').trim()
  const imageUrl = b.imageUrl ? String(b.imageUrl).trim() : null
  if (!text && !imageUrl) throw badRequest('A question needs text or an image')

  const options = Array.isArray(b.options) ? b.options.map(normOption) : []
  if (options.length < 2) throw badRequest('A question needs at least two options')
  if (options.some((o) => !o.text && !o.imageUrl)) throw badRequest('Each answer needs text or an image')

  // Correct answers: accept an array (multiple) or a single index (legacy).
  const rawCorrect = Array.isArray(b.correctIndexes)
    ? b.correctIndexes
    : b.correctIndex != null
      ? [b.correctIndex]
      : []
  const correctIndexes = [...new Set(rawCorrect.map(Number))].sort((a, c) => a - c)
  if (
    correctIndexes.length === 0 ||
    correctIndexes.some((i) => !Number.isInteger(i) || i < 0 || i >= options.length)
  )
    throw badRequest('Mark at least one correct answer')
  return { text, imageUrl, options, correctIndexes, correctIndex: correctIndexes[0] }
}

// Normalise a stored/submitted correct-answer value to a sorted set of indexes.
const toIndexSet = (v) => {
  const arr = Array.isArray(v) ? v : v == null ? [] : [v]
  return [...new Set(arr.map(Number).filter(Number.isInteger))].sort((a, c) => a - c)
}

// A question is marked correct only when the chosen set exactly matches the key.
const isAnswerCorrect = (chosen, correct) => {
  const a = toIndexSet(chosen)
  const b = toIndexSet(correct)
  return a.length === b.length && a.every((v, i) => v === b[i])
}

// The correct-answer key for a stored question row (array column, legacy fallback).
const correctSetFor = (q) => {
  const parsed = q.correct_indexes && typeof q.correct_indexes === 'string' ? JSON.parse(q.correct_indexes) : q.correct_indexes
  const set = toIndexSet(parsed)
  return set.length ? set : toIndexSet(q.correct_index)
}

/* ------------------------------- listing ------------------------------- */

// List quizzes for a seminar. Owner sees everything (with counts); a registered
// student sees only quizzes that have gone live (active/ended), never drafts.
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
      if (!owner) {
        if (req.user.role !== 'student' || slot.booked_by !== req.user.profileId)
          throw forbidden('This test is for the student who booked this slot')
      }
      whereClause = 'q.slot_id = ?'
      whereVal = slotId
    } else {
      const seminar = await queryOne('SELECT * FROM seminars WHERE id = ?', [seminarId])
      if (!seminar) throw notFound('Seminar not found')
      owner = req.user.role === 'instructor' && seminar.instructor_id === req.user.profileId
      if (!owner) {
        if (req.user.role !== 'student') throw forbidden('Not allowed')
        await assertRegistered(seminarId, req.user.profileId)
      }
      whereClause = 'q.seminar_id = ?'
      whereVal = seminarId
    }

    const rows = await query(
      `SELECT q.*,
              TIMESTAMPDIFF(SECOND, NOW(), q.ends_at) AS seconds_left,
              (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id)   AS question_count,
              (SELECT COUNT(*) FROM quiz_submissions qs WHERE qs.quiz_id = q.id) AS submission_count
         FROM seminar_quizzes q
        WHERE ${whereClause}
        ORDER BY q.created_at DESC`,
      [whereVal]
    )
    for (const r of rows) await settleQuiz(r)
    const visible = owner ? rows : rows.filter((r) => r.status !== 'draft')

    // For a student, flag which of these quizzes they've already submitted so the
    // list can show "Submitted" without them having to open each test.
    let submittedIds = new Set()
    if (!owner && req.user.role === 'student' && visible.length) {
      const subs = await query(
        `SELECT quiz_id FROM quiz_submissions
          WHERE student_id = ? AND quiz_id IN (${visible.map(() => '?').join(',')})`,
        [req.user.profileId, ...visible.map((r) => r.id)]
      )
      submittedIds = new Set(subs.map((s) => s.quiz_id))
    }

    res.json(visible.map((r) => ({ ...mapQuiz(r), submitted: submittedIds.has(r.id) })))
  })
)

// Full quiz view. Role-aware:
//  - owner instructor: questions WITH the answer key + live submission count.
//  - registered student: draft is hidden; while active the answer key is
//    stripped; once ended, answers + leaderboard + their own result are shown.
router.get(
  '/:id',
  asyncH(async (req, res) => {
    const q = await settleQuiz(await loadQuiz(req.params.id))
    const owner = isOwner(q, req)

    if (owner) {
      const questions = await questionsOf(q.id, { reveal: true })
      const submissions = await submissionsOf(q.id)
      const quiz = mapQuiz(
        { ...q, question_count: questions.length, submission_count: submissions.length },
        { questions }
      )
      const extra = {}
      // Live counts (opened / in-progress / submitted) once the quiz is running.
      if (q.status === 'active' || q.status === 'ended') extra.progress = await liveProgress(q)
      // Per-question + score-band analytics once there's something to analyse.
      if ((q.status === 'active' || q.status === 'ended') && submissions.length)
        extra.analytics = await quizAnalytics(q.id)
      return res.json({ ...quiz, submissions, ...extra })
    }

    if (req.user.role !== 'student') throw forbidden('Not allowed')
    await assertStudentAccess(q, req.user.profileId)
    if (q.status === 'draft') throw notFound('Quiz not found')

    // A scheduled quiz is visible as "upcoming" but its questions stay hidden
    // until it goes live, so nobody can preview them (or the answer key) early.
    if (q.status === 'scheduled') return res.json({ ...mapQuiz(q), mine: null })

    const mineRow = await queryOne(
      'SELECT * FROM quiz_submissions WHERE quiz_id = ? AND student_id = ?',
      [q.id, req.user.profileId]
    )
    const mine = mineRow ? mapSubmission(mineRow) : null
    const ended = q.status === 'ended'

    // Opening a live quiz marks the student as "in progress" for the lecturer's
    // live panel (once only; ignored if they've already started or submitted).
    if (q.status === 'active') await recordAttempt(q.id, req.user.profileId)

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
    requireFields(b, ['title'])

    // Attach to a seminar you own, or a booked slot you own — exactly one.
    let seminarId = null
    let slotId = null
    if (b.slotId) {
      const slot = await queryOne('SELECT * FROM slots WHERE id = ?', [b.slotId])
      if (!slot) throw notFound('Slot not found')
      if (slot.instructor_id !== req.user.profileId) throw forbidden('Not your slot')
      slotId = slot.id
    } else {
      requireFields(b, ['seminarId'])
      const seminar = await queryOne('SELECT * FROM seminars WHERE id = ?', [b.seminarId])
      if (!seminar) throw notFound('Seminar not found')
      if (seminar.instructor_id !== req.user.profileId) throw forbidden('Not your seminar')
      seminarId = seminar.id
    }

    const durationSecs = Math.max(30, Number(b.durationSecs) || 600)
    const id = uid('quiz')
    await query(
      `INSERT INTO seminar_quizzes (id, seminar_id, slot_id, instructor_id, title, duration_secs, status)
       VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
      [id, seminarId, slotId, req.user.profileId, String(b.title).trim(), durationSecs]
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
    const { text, imageUrl, options, correctIndex, correctIndexes } = validateQuestionBody(req.body)
    const [{ n }] = await query('SELECT COUNT(*) AS n FROM quiz_questions WHERE quiz_id = ?', [q.id])
    const id = uid('qq')
    await query(
      'INSERT INTO quiz_questions (id, quiz_id, position, text, image_url, options, correct_index, correct_indexes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, q.id, n, text, imageUrl, JSON.stringify(options), correctIndex, JSON.stringify(correctIndexes)]
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
    const { text, imageUrl, options, correctIndex, correctIndexes } = validateQuestionBody(req.body)
    await query('UPDATE quiz_questions SET text = ?, image_url = ?, options = ?, correct_index = ?, correct_indexes = ? WHERE id = ?', [
      text,
      imageUrl,
      JSON.stringify(options),
      correctIndex,
      JSON.stringify(correctIndexes),
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

// Activate: start the shared countdown now. All registered students see it live
// immediately. Works from a draft or a still-pending scheduled quiz.
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
          SET status = 'active', started_at = NOW(), scheduled_at = NULL,
              ends_at = DATE_ADD(NOW(), INTERVAL duration_secs SECOND)
        WHERE id = ?`,
      [q.id]
    )
    res.json(mapQuiz(await loadQuiz(q.id)))
  })
)

// Schedule: the quiz goes live on its own when `scheduledAt` arrives (no manual
// Start needed). Set from a draft, or re-set while already scheduled.
router.post(
  '/:id/schedule',
  asyncH(async (req, res) => {
    const q = await loadQuiz(req.params.id)
    assertOwner(q, req)
    if (q.status !== 'draft' && q.status !== 'scheduled')
      throw conflict('You can only schedule a quiz before it starts')
    const [{ n }] = await query('SELECT COUNT(*) AS n FROM quiz_questions WHERE quiz_id = ?', [q.id])
    if (n === 0) throw badRequest('Add at least one question before scheduling')
    const scheduledAt = parseFutureTime(req.body?.scheduledAt)
    await query(
      "UPDATE seminar_quizzes SET status = 'scheduled', scheduled_at = ?, started_at = NULL, ends_at = NULL WHERE id = ?",
      [scheduledAt, q.id]
    )
    res.json(mapQuiz(await loadQuiz(q.id)))
  })
)

// Cancel a schedule and return the quiz to draft so questions can be edited again.
router.post(
  '/:id/unschedule',
  asyncH(async (req, res) => {
    const q = await loadQuiz(req.params.id)
    assertOwner(q, req)
    if (q.status !== 'scheduled') throw conflict('This quiz is not scheduled')
    await query("UPDATE seminar_quizzes SET status = 'draft', scheduled_at = NULL WHERE id = ?", [q.id])
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

// Add more time to a live test — or reopen one that just ran out — so students
// who need longer can keep going. Extends the shared countdown for everyone.
router.post(
  '/:id/extend',
  asyncH(async (req, res) => {
    const q = await loadQuiz(req.params.id)
    assertOwner(q, req)
    if (q.status === 'draft' || q.status === 'scheduled')
      throw conflict('The test has not started yet')
    const mins = Number(req.body?.minutes)
    if (!Number.isFinite(mins) || mins <= 0) throw badRequest('Choose how many minutes to add')
    const addSecs = Math.round(mins * 60)
    if (q.status === 'active') {
      // Extend from whichever comes later — the current end, or now if the shared
      // window has already lapsed but the quiz hasn't been read (and auto-ended) yet.
      await query(
        `UPDATE seminar_quizzes
            SET ends_at = DATE_ADD(GREATEST(ends_at, NOW()), INTERVAL ? SECOND)
          WHERE id = ?`,
        [addSecs, q.id]
      )
    } else {
      // Already ended: reopen it, giving everyone a fresh shared window. Results
      // go back to hidden for students until it ends again.
      await query(
        "UPDATE seminar_quizzes SET status = 'active', ends_at = DATE_ADD(NOW(), INTERVAL ? SECOND) WHERE id = ?",
        [addSecs, q.id]
      )
    }
    res.json(mapQuiz(await loadQuiz(q.id)))
  })
)

/* ------------------------------- student ------------------------------ */

// Submit answers while the quiz is live. Scored on the spot; one attempt only.
router.post(
  '/:id/submit',
  asyncH(async (req, res) => {
    if (req.user.role !== 'student') throw forbidden('Students only')
    const q = await settleQuiz(await loadQuiz(req.params.id))
    await assertStudentAccess(q, req.user.profileId)
    if (q.status !== 'active') throw conflict('This test is not open for answers')

    const dupe = await queryOne(
      'SELECT id FROM quiz_submissions WHERE quiz_id = ? AND student_id = ?',
      [q.id, req.user.profileId]
    )
    if (dupe) throw conflict('You have already submitted this test')

    const answers = req.body?.answers && typeof req.body.answers === 'object' ? req.body.answers : {}
    const questions = await query('SELECT id, correct_index, correct_indexes FROM quiz_questions WHERE quiz_id = ?', [q.id])
    let score = 0
    for (const question of questions) {
      if (isAnswerCorrect(answers[question.id], correctSetFor(question))) score += 1
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
