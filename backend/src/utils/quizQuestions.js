import { badRequest } from './http.js'

// Shared MCQ question helpers, used by both live quizzes (routes/quizzes.js) and
// reusable question banks (routes/questionBanks.js) so the two stay in lockstep
// on how a question is validated, stored, and graded.

// Normalise one answer option to { text, imageUrl }. Accepts a plain string
// (legacy / simple) or an object; an option is valid if it has text or an image.
export const normOption = (o) => {
  if (o && typeof o === 'object') {
    return {
      text: String(o.text ?? '').trim(),
      imageUrl: o.imageUrl ? String(o.imageUrl).trim() : null,
    }
  }
  return { text: String(o ?? '').trim(), imageUrl: null }
}

// Validate an incoming question body, returning the normalised fields to store.
// Throws badRequest on the first problem.
export const validateQuestionBody = (b) => {
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
export const toIndexSet = (v) => {
  const arr = Array.isArray(v) ? v : v == null ? [] : [v]
  return [...new Set(arr.map(Number).filter(Number.isInteger))].sort((a, c) => a - c)
}

// A question is marked correct only when the chosen set exactly matches the key.
export const isAnswerCorrect = (chosen, correct) => {
  const a = toIndexSet(chosen)
  const b = toIndexSet(correct)
  return a.length === b.length && a.every((v, i) => v === b[i])
}

// The correct-answer key for a stored question row (array column, legacy fallback).
export const correctSetFor = (q) => {
  const parsed = q.correct_indexes && typeof q.correct_indexes === 'string' ? JSON.parse(q.correct_indexes) : q.correct_indexes
  const set = toIndexSet(parsed)
  return set.length ? set : toIndexSet(q.correct_index)
}
