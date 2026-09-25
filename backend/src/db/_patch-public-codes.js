import mysql from 'mysql2/promise'
import env from '../config/env.js'

// One-off, idempotent patch: add the friendly public `code` column to students
// and instructors (8-digit display id — students start at 10000001, teachers at
// 90000001), backfill existing rows in join order, and seed the counters the app
// bumps on registration. The internal primary keys (std-… / ins-…) are untouched,
// so every foreign key keeps working. Safe to run repeatedly.
const conn = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  multipleStatements: true,
})

const hasColumn = async (table, column) => {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [env.db.database, table, column]
  )
  return rows.length > 0
}

// (table, orderBy, base, counterKey) — base sits one below the first issued code.
const PLAN = [
  { table: 'instructors', order: 'created_at, id', base: 90000000, key: 'instructor_code_seq' },
  { table: 'students', order: 'joined_at, id', base: 10000000, key: 'student_code_seq' },
]

for (const { table, order, base, key } of PLAN) {
  if (!(await hasColumn(table, 'code'))) {
    await conn.query(`ALTER TABLE ${table} ADD COLUMN code VARCHAR(8) AFTER id`)
    await conn.query(`ALTER TABLE ${table} ADD UNIQUE KEY uq_${table}_code (code)`)
    console.log(`[patch] ${table}.code column added`)
  } else {
    console.log(`[patch] ${table}.code already present`)
  }

  // Backfill any rows still missing a code, in stable join order.
  await conn.query('SET @n := ?', [base])
  const [res] = await conn.query(
    `UPDATE ${table} SET code = (@n := @n + 1) WHERE code IS NULL ORDER BY ${order}`
  )
  if (res.affectedRows) console.log(`[patch] ${table}: backfilled ${res.affectedRows} code(s)`)

  // Seed / advance the counter so the next registration continues the sequence.
  const [[{ maxUsed }]] = await conn.query(
    `SELECT COALESCE(MAX(CAST(code AS UNSIGNED)), ?) AS maxUsed FROM ${table}`,
    [base]
  )
  await conn.query(
    'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ' +
      'ON DUPLICATE KEY UPDATE `value` = GREATEST(CAST(`value` AS UNSIGNED), VALUES(`value`))',
    [key, String(maxUsed)]
  )
  console.log(`[patch] ${key} set to ${maxUsed}`)
}

await conn.end()
console.log('[patch] done')
