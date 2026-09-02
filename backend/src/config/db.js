import mysql from 'mysql2/promise'
import env from './env.js'

/**
 * Shared connection pool. All queries go through `query` / `tx`.
 * `multipleStatements` is enabled so the schema file can run in one shot.
 */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  dateStrings: true,
  charset: 'utf8mb4_general_ci',
})

/** Run a query, returning rows only. */
export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params)
  return rows
}

/** Return the first row (or null). */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows[0] || null
}

/**
 * Run `fn` inside a transaction. `fn` receives a connection whose
 * `.query`/`.execute` are used for all statements; commit/rollback is automatic.
 */
export async function tx(fn) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export default pool
