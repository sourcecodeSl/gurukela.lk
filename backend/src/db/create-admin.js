import { pool, query, queryOne } from '../config/db.js'
import env from '../config/env.js'
import { hashPassword } from '../utils/password.js'
import { uid } from '../utils/ids.js'

/**
 * Create (or reset) the admin account without seeding any demo data.
 * Credentials come from ADMIN_EMAIL / ADMIN_PHONE / ADMIN_PASSWORD env vars,
 * falling back to sensible defaults. Also ensures the commission_rate setting.
 *
 *   node src/db/create-admin.js
 */
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gurukela.lk'
const PHONE = process.env.ADMIN_PHONE || '+94770000001'
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

async function run() {
  const passwordHash = await hashPassword(PASSWORD)
  const existing = await queryOne('SELECT id FROM users WHERE email = ? OR phone = ?', [EMAIL, PHONE])

  if (existing) {
    await query(
      'UPDATE users SET role = "admin", password_hash = ?, phone_verified = 1, banned = 0 WHERE id = ?',
      [passwordHash, existing.id]
    )
    console.log(`[admin] updated existing account ${EMAIL}`)
  } else {
    await query(
      'INSERT INTO users (id, role, email, phone, password_hash, phone_verified) VALUES (?, "admin", ?, ?, ?, 1)',
      [uid('usr'), EMAIL, PHONE, passwordHash]
    )
    console.log(`[admin] created account ${EMAIL}`)
  }

  await query(
    'INSERT INTO settings (`key`, `value`) VALUES ("commission_rate", ?) ON DUPLICATE KEY UPDATE `value` = `value`',
    [String(env.defaultCommissionRate)]
  )

  console.log(`[admin] login  : ${EMAIL} / ${PASSWORD}`)
}

run()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('[admin] failed:', err)
    await pool.end()
    process.exit(1)
  })
