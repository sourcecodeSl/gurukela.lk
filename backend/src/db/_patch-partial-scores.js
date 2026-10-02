import mysql from 'mysql2/promise'
import env from '../config/env.js'

// One-off, idempotent patch: widen quiz_submissions.score from INT to
// DECIMAL(7,2) so multi-answer questions can be graded with partial credit
// (e.g. 0.5 for getting one of two correct options). Existing whole-number
// scores are preserved unchanged by the type widening.
const conn = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
})

const [[col]] = await conn.query(
  `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'quiz_submissions' AND COLUMN_NAME = 'score'`,
  [env.db.database]
)

if (col && /^decimal/i.test(col.COLUMN_TYPE)) {
  console.log('[patch] quiz_submissions.score already DECIMAL')
} else {
  await conn.query(
    'ALTER TABLE quiz_submissions MODIFY COLUMN score DECIMAL(7,2) NOT NULL DEFAULT 0'
  )
  console.log('[patch] quiz_submissions.score widened to DECIMAL(7,2)')
}

await conn.end()
console.log('[patch] done')
