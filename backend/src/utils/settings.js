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

// Every payment method the app knows about, in display order.
export const ALL_PAYMENT_METHODS = ['payhere', 'qr', 'bank', 'card', 'wallet']
// Sensible default when an admin hasn't configured this yet: the real gateways
// on, the "demo" (card/wallet) methods off.
const DEFAULT_PAYMENT_METHODS = ['payhere', 'qr', 'bank']

/** The payment methods an admin has switched on, as an ordered id array. */
export async function getEnabledPaymentMethods() {
  const raw = await getSetting('pay_methods', '')
  if (!raw) return [...DEFAULT_PAYMENT_METHODS]
  try {
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) return ALL_PAYMENT_METHODS.filter((m) => arr.includes(m))
  } catch {
    /* fall through to default */
  }
  return [...DEFAULT_PAYMENT_METHODS]
}

/** Persist the enabled payment methods (ignores unknown ids). */
export async function setEnabledPaymentMethods(methods) {
  const clean = ALL_PAYMENT_METHODS.filter((m) => Array.isArray(methods) && methods.includes(m))
  await setSetting('pay_methods', JSON.stringify(clean))
  return clean
}

/** Current commission rate as a number (0..1). */
export async function getCommissionRate() {
  const v = await getSetting('commission_rate', String(env.defaultCommissionRate))
  const n = Number(v)
  return Number.isFinite(n) ? n : env.defaultCommissionRate
}
