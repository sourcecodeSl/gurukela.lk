import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest, conflict } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapBank, mapQuestion } from '../utils/mappers.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { imageUpload, fileUrl } from '../middleware/upload.js'
import { validateQuestionBody } from '../utils/quizQuestions.js'

const router = Router()
const bankImageUpload = imageUpload('quizzes')

// Reusable MCQ banks are managed by instructors and admins. Every route needs a
// signed-in user of one of those roles.
router.use(authenticate, requireRole('instructor', 'admin'))

/* ------------------------------- helpers ------------------------------- */

const loadBank = async (id) => {
  const b = await queryOne('SELECT * FROM question_banks WHERE id = ?', [id])
  if (!b) throw notFound('MCQ bank not found')
  return b
}

// A bank is only managed by its creator.
const assertOwner = (b, req) => {
  if (b.owner_user_id !== req.user.id) throw forbidden('Not your MCQ bank')
}

const questionsOf = (bankId) =>
  query('SELECT * FROM bank_questions WHERE bank_id = ? ORDER BY position ASC, id ASC', [bankId])

// A short, human-typeable random password (used when the creator doesn't set one).
const genPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}

// Normalise a user-supplied import password, or make a unique one. Enforces the
// UNIQUE constraint at the app layer so we can return a friendly error.
const resolvePassword = async (raw, { excludeId } = {}) => {
  let pwd = String(raw ?? '').trim()
  if (pwd) {
    if (pwd.length < 4) throw badRequest('The password must be at least 4 characters')
    const clash = await queryOne(
      'SELECT id FROM question_banks WHERE import_password = ? AND id <> ?',
      [pwd, excludeId ?? '']
    )
    if (clash) throw conflict('That password is already in use — pick another')
    return pwd
  }
  // Generate one that isn't taken.
  for (let tries = 0; tries < 10; tries++) {
    pwd = genPassword()
    const clash = await queryOne('SELECT id FROM question_banks WHERE import_password = ?', [pwd])
    if (!clash) return pwd
  }
  throw conflict('Could not generate a unique password — please set one')
}

/* ------------------------------- routes -------------------------------- */

// Upload an image used in a bank question/option; returns its public URL. Shared
// upload folder with quizzes.
router.post(
  '/upload',
  bankImageUpload.single('image'),
  asyncH(async (req, res) => {
    if (!req.file) throw badRequest('No image uploaded')
    res.status(201).json({ url: fileUrl(req, 'quizzes', req.file.filename) })
  })
)

// List the banks I own, with question counts, newest first.
router.get(
  '/',
  asyncH(async (req, res) => {
    const rows = await query(
      `SELECT b.*, (SELECT COUNT(*) FROM bank_questions q WHERE q.bank_id = b.id) AS question_count
         FROM question_banks b
        WHERE b.owner_user_id = ?
        ORDER BY b.created_at DESC`,
      [req.user.id]
    )
    res.json(rows.map((r) => mapBank(r)))
  })
)

// Full bank view (owner only): questions with the answer key.
router.get(
  '/:id',
  asyncH(async (req, res) => {
    const b = await loadBank(req.params.id)
    assertOwner(b, req)
    const questions = (await questionsOf(b.id)).map((q) => mapQuestion(q, { reveal: true }))
    res.json(mapBank({ ...b, question_count: questions.length }, { questions }))
  })
)

// Create a bank. Password is optional — one is generated if omitted.
router.post(
  '/',
  asyncH(async (req, res) => {
    const b = req.body
    requireFields(b, ['title'])
    const importPassword = await resolvePassword(b.importPassword)
    const id = uid('bank')
    await query(
      'INSERT INTO question_banks (id, owner_user_id, owner_role, title, import_password) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, req.user.role, String(b.title).trim(), importPassword]
    )
    res.status(201).json(mapBank(await loadBank(id)))
  })
)

// Rename a bank / change its import password.
router.put(
  '/:id',
  asyncH(async (req, res) => {
    const b = await loadBank(req.params.id)
    assertOwner(b, req)
    const body = req.body
    const title = body.title != null ? String(body.title).trim() : b.title
    if (!title) throw badRequest('A title is required')
    const importPassword =
      body.importPassword != null
        ? await resolvePassword(body.importPassword, { excludeId: b.id })
        : b.import_password
    await query('UPDATE question_banks SET title = ?, import_password = ? WHERE id = ?', [
      title,
      importPassword,
      b.id,
    ])
    res.json(mapBank(await loadBank(b.id)))
  })
)

router.delete(
  '/:id',
  asyncH(async (req, res) => {
    const b = await loadBank(req.params.id)
    assertOwner(b, req)
    await query('DELETE FROM question_banks WHERE id = ?', [b.id])
    res.json({ message: 'MCQ bank removed' })
  })
)

// Add a question to a bank.
router.post(
  '/:id/questions',
  asyncH(async (req, res) => {
    const b = await loadBank(req.params.id)
    assertOwner(b, req)
    const { text, imageUrl, options, correctIndex, correctIndexes } = validateQuestionBody(req.body)
    const [{ n }] = await query('SELECT COUNT(*) AS n FROM bank_questions WHERE bank_id = ?', [b.id])
    const id = uid('bq')
    await query(
      'INSERT INTO bank_questions (id, bank_id, position, text, image_url, options, correct_index, correct_indexes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, b.id, n, text, imageUrl, JSON.stringify(options), correctIndex, JSON.stringify(correctIndexes)]
    )
    res.status(201).json(mapQuestion(await queryOne('SELECT * FROM bank_questions WHERE id = ?', [id]), { reveal: true }))
  })
)

router.put(
  '/:id/questions/:qid',
  asyncH(async (req, res) => {
    const b = await loadBank(req.params.id)
    assertOwner(b, req)
    const existing = await queryOne('SELECT * FROM bank_questions WHERE id = ? AND bank_id = ?', [
      req.params.qid,
      b.id,
    ])
    if (!existing) throw notFound('Question not found')
    const { text, imageUrl, options, correctIndex, correctIndexes } = validateQuestionBody(req.body)
    await query(
      'UPDATE bank_questions SET text = ?, image_url = ?, options = ?, correct_index = ?, correct_indexes = ? WHERE id = ?',
      [text, imageUrl, JSON.stringify(options), correctIndex, JSON.stringify(correctIndexes), existing.id]
    )
    res.json(mapQuestion(await queryOne('SELECT * FROM bank_questions WHERE id = ?', [existing.id]), { reveal: true }))
  })
)

router.delete(
  '/:id/questions/:qid',
  asyncH(async (req, res) => {
    const b = await loadBank(req.params.id)
    assertOwner(b, req)
    await query('DELETE FROM bank_questions WHERE id = ? AND bank_id = ?', [req.params.qid, b.id])
    res.json({ message: 'Question removed' })
  })
)

export default router
