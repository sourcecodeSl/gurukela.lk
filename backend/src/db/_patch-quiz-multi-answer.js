import mysql from 'mysql2/promise'
import env from '../config/env.js'

// One-off, idempotent patch: add multiple-correct-answer support to quiz
// questions (a correct_indexes JSON array alongside the legacy correct_index).
const conn = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
})

const [cols] = await conn.query(
  "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'quiz_questions' AND COLUMN_NAME = 'correct_indexes'",
  [env.db.database]
)
if (cols.length === 0) {
  await conn.query('ALTER TABLE quiz_questions ADD COLUMN correct_indexes JSON DEFAULT NULL AFTER correct_index')
  console.log('[patch] correct_indexes column added')
} else {
  console.log('[patch] correct_indexes already present')
}

// Backfill existing rows so grading/reveal reads a consistent array shape.
const [res] = await conn.query(
  'UPDATE quiz_questions SET correct_indexes = JSON_ARRAY(correct_index) WHERE correct_indexes IS NULL'
)
console.log(`[patch] backfilled ${res.affectedRows} question(s)`)

await conn.end()
console.log('[patch] done')
