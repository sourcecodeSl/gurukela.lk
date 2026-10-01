import mysql from 'mysql2/promise'
import env from '../config/env.js'

// One-off, idempotent patch: let teachers submit their own subjects and lessons
// (modules) for admin approval. Adds a `status` + `created_by` column to both the
// `subjects` and `modules` tables. Admin-created rows keep the defaults
// ('approved', created_by NULL); teacher-submitted rows start 'pending'.
const conn = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
})

const columnExists = async (table, column) => {
  const [rows] = await conn.query(
    'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [env.db.database, table, column]
  )
  return rows.length > 0
}

const constraintExists = async (table, name) => {
  const [rows] = await conn.query(
    'SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?',
    [env.db.database, table, name]
  )
  return rows.length > 0
}

for (const [table, fk] of [
  ['subjects', 'fk_subjects_creator'],
  ['modules', 'fk_modules_creator'],
]) {
  if (!(await columnExists(table, 'status'))) {
    await conn.query(
      `ALTER TABLE ${table} ADD COLUMN status ENUM('approved','pending','rejected') NOT NULL DEFAULT 'approved'`
    )
    console.log(`[patch] ${table}.status added`)
  } else {
    console.log(`[patch] ${table}.status already present`)
  }

  if (!(await columnExists(table, 'created_by'))) {
    await conn.query(`ALTER TABLE ${table} ADD COLUMN created_by VARCHAR(40) DEFAULT NULL`)
    console.log(`[patch] ${table}.created_by added`)
  } else {
    console.log(`[patch] ${table}.created_by already present`)
  }

  if (!(await constraintExists(table, fk))) {
    await conn.query(
      `ALTER TABLE ${table} ADD CONSTRAINT ${fk} FOREIGN KEY (created_by) REFERENCES instructors(id) ON DELETE SET NULL`
    )
    console.log(`[patch] ${table}.${fk} added`)
  } else {
    console.log(`[patch] ${table}.${fk} already present`)
  }
}

await conn.end()
console.log('[patch] done')
