import mysql from 'mysql2/promise'
import env from '../config/env.js'

// One-off, idempotent patch: add the quiz_attempts table to an existing DB so
// the lecturer's live progress panel can count "in progress" students (those who
// opened a live quiz but have not submitted yet). Safe to run repeatedly.
const conn = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
})

const [tables] = await conn.query(
  "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'quiz_attempts'",
  [env.db.database]
)
if (tables.length === 0) {
  await conn.query(`
    CREATE TABLE quiz_attempts (
      id           VARCHAR(40) PRIMARY KEY,
      quiz_id      VARCHAR(40) NOT NULL,
      student_id   VARCHAR(40) NOT NULL,
      started_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_quiz_attempt (quiz_id, student_id),
      CONSTRAINT fk_qa_quiz FOREIGN KEY (quiz_id) REFERENCES seminar_quizzes(id) ON DELETE CASCADE,
      CONSTRAINT fk_qa_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('[patch] quiz_attempts table created')
} else {
  console.log('[patch] quiz_attempts already present')
}

await conn.end()
console.log('[patch] done')
