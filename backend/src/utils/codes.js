/**
 * Human-friendly public account codes shown to users (and quoted over WhatsApp).
 *
 * These are SEPARATE from the internal primary keys (students.id / instructors.id,
 * still the `std-…` / `ins-…` strings). Every foreign key across the schema keeps
 * pointing at those PKs, so nothing about the relational model changes — we only
 * add a friendly numeric label on top.
 *
 *   student  → 8 digits starting with 1  (10000001, 10000002, …)
 *   teacher  → 8 digits starting with 9  (90000001, 90000002, …)
 */

// The base sits one below the first issued code, so the first bump yields
// 10000001 / 90000001.
const START = { student: 10000000, instructor: 90000000 }
const KEY = { student: 'student_code_seq', instructor: 'instructor_code_seq' }

/**
 * Next public code for `role` ('student' | 'instructor'). MUST be called with a
 * transaction connection (the `c` from `tx()`): the counter row is bumped under a
 * row lock, so concurrent sign-ups can never receive the same code.
 */
export async function nextPublicCode(conn, role) {
  const key = KEY[role]
  if (!key) throw new Error(`nextPublicCode: unknown role ${role}`)

  // Seed the counter on first use; INSERT IGNORE is a no-op once it exists.
  await conn.query('INSERT IGNORE INTO settings (`key`, `value`) VALUES (?, ?)', [
    key,
    String(START[role]),
  ])
  // Atomic increment — the row lock serialises concurrent registrations.
  await conn.query('UPDATE settings SET `value` = `value` + 1 WHERE `key` = ?', [key])
  const [rows] = await conn.query('SELECT `value` FROM settings WHERE `key` = ?', [key])
  return String(rows[0].value)
}

export { START as CODE_START, KEY as CODE_KEY }
