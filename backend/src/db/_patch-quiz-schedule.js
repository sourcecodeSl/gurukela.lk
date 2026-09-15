import mysql from 'mysql2/promise'
import env from '../config/env.js'

// One-off, idempotent patch: add scheduled-quiz support to an existing DB
// (scheduled status + scheduled_at column) without dropping data.
const conn = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
})

await conn.query(
  "ALTER TABLE seminar_quizzes MODIFY COLUMN status ENUM('draft','scheduled','active','ended') NOT NULL DEFAULT 'draft'"
)
console.log('[patch] status enum updated')

const [cols] = await conn.query(
  "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'seminar_quizzes' AND COLUMN_NAME = 'scheduled_at'",
  [env.db.database]
)
if (cols.length === 0) {
  await conn.query('ALTER TABLE seminar_quizzes ADD COLUMN scheduled_at DATETIME DEFAULT NULL AFTER status')
  console.log('[patch] scheduled_at column added')
} else {
  console.log('[patch] scheduled_at already present')
}

await conn.end()
console.log('[patch] done')
