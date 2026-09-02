import { badRequest } from './http.js'

export const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

// Sri Lankan mobile numbers: accept 07XXXXXXXX or +947XXXXXXXX; normalise to +94.
export function normalizePhone(raw) {
  if (typeof raw !== 'string') return null
  const digits = raw.replace(/[^\d+]/g, '')
  if (/^\+94\d{9}$/.test(digits)) return digits
  if (/^0\d{9}$/.test(digits)) return '+94' + digits.slice(1)
  if (/^94\d{9}$/.test(digits)) return '+' + digits
  return null
}

/** Assert required fields are present; throws 400 listing what's missing. */
export function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '')
  if (missing.length) throw badRequest(`Missing required fields: ${missing.join(', ')}`, { missing })
}

export function assertPasswords(password, confirm) {
  if (typeof password !== 'string' || password.length < 8)
    throw badRequest('Password must be at least 8 characters')
  if (confirm !== undefined && password !== confirm)
    throw badRequest('Passwords do not match')
}
