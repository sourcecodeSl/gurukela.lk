import { query, queryOne } from '../config/db.js'
import env from '../config/env.js'

/** Read a setting, falling back to `fallback` when absent. */
export async function getSetting(key, fallback = null) {
  const row = await queryOne('SELECT `value` FROM settings WHERE `key` = ?', [key])
  return row ? row.value : fallback
}

export async function setSetting(key, value) {
  await query(
    'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
    [key, String(value)]
  )
}

/** Current commission rate as a number (0..1). */
export async function getCommissionRate() {
  const v = await getSetting('commission_rate', String(env.defaultCommissionRate))
  const n = Number(v)
  return Number.isFinite(n) ? n : env.defaultCommissionRate
}
