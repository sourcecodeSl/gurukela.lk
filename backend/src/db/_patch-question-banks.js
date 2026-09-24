import mysql from 'mysql2/promise'
import env from '../config/env.js'

// One-off, idempotent patch: add reusable MCQ question banks. A bank is a
// standalone set of questions (built by an instructor or admin ahead of time)
// with a shared import password that lets any instructor copy its questions
// into a draft quiz.
const conn = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
})

const tableExists = async (name) => {
  const [rows] = await conn.query(
    'SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [env.db.database, name]
  )
  return rows.length > 0
}

if (!(await tableExists('question_banks'))) {
  await conn.query(`
    CREATE TABLE question_banks (
      id              VARCHAR(40) PRIMARY KEY,
      owner_user_id   VARCHAR(40) NOT NULL,
      owner_role      ENUM('instructor','admin') NOT NULL,
      title           VARCHAR(200) NOT NULL,
      import_password VARCHAR(100) NOT NULL,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_bank_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uq_bank_password (import_password),
      KEY idx_bank_owner (owner_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('[patch] question_banks table created')
} else {
  console.log('[patch] question_banks already present')
}

if (!(await tableExists('bank_questions'))) {
  await conn.query(`
    CREATE TABLE bank_questions (
      id              VARCHAR(40) PRIMARY KEY,
      bank_id         VARCHAR(40) NOT NULL,
      position        INT NOT NULL DEFAULT 0,
      text            TEXT NOT NULL,
      image_url       VARCHAR(500) DEFAULT NULL,
      options         JSON NOT NULL,
      correct_index   INT NOT NULL DEFAULT 0,
      correct_indexes JSON DEFAULT NULL,
      CONSTRAINT fk_bq_bank FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE,
      KEY idx_bq_bank (bank_id, position)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('[patch] bank_questions table created')
} else {
  console.log('[patch] bank_questions already present')
}

await conn.end()
console.log('[patch] done')
