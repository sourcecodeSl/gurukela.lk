import { verifyToken } from '../utils/jwt.js'
import { queryOne } from '../config/db.js'
import { unauthorized, forbidden } from '../utils/http.js'

/**
 * Populate req.user from the Bearer token. Rejects banned accounts.
 * Sets req.user = { id, role, email, phone, banned, profileId }.
 */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) throw unauthorized('Missing token')

    let decoded
    try {
      decoded = verifyToken(token)
    } catch {
      throw unauthorized('Invalid or expired token')
    }

    const user = await queryOne('SELECT id, role, email, phone, banned FROM users WHERE id = ?', [
      decoded.sub,
    ])
    if (!user) throw unauthorized('Account no longer exists')
    if (user.banned) throw forbidden('This account has been banned')

    req.user = { ...user, profileId: decoded.profileId || null }
    next()
  } catch (err) {
    next(err)
  }
}

/** Restrict to one or more roles. Use after `authenticate`. */
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(unauthorized())
    if (!roles.includes(req.user.role)) return next(forbidden('Insufficient role'))
    next()
  }
