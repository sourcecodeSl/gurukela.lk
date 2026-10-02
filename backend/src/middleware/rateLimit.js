/**
 * Minimal in-memory, fixed-window rate limiter — no external dependency.
 *
 * Suitable for the single-process cPanel/Passenger deployment this app runs on.
 * If the API is ever scaled to multiple processes, swap the store for Redis so
 * the window is shared across workers.
 *
 * Keys on the client IP (honouring the trusted proxy) plus the route, so a burst
 * of login attempts can't also exhaust the OTP budget and vice-versa.
 */
const buckets = new Map()

// Periodically drop expired buckets so the map can't grow without bound.
const SWEEP_MS = 10 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key)
}, SWEEP_MS).unref?.()

/**
 * @param {object} opts
 * @param {number} opts.windowMs  length of the fixed window
 * @param {number} opts.max       allowed requests per window per client
 * @param {string} [opts.name]    namespace so limits don't share a bucket
 */
export function rateLimit({ windowMs, max, name = 'default' }) {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown'
    const key = `${name}:${ip}`
    const now = Date.now()

    let b = buckets.get(key)
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + windowMs }
      buckets.set(key, b)
    }
    b.count += 1

    const remaining = Math.max(0, max - b.count)
    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(remaining))

    if (b.count > max) {
      const retryAfter = Math.ceil((b.resetAt - now) / 1000)
      res.setHeader('Retry-After', String(retryAfter))
      return res.status(429).json({ error: 'Too many requests. Please try again later.' })
    }
    next()
  }
}

export default rateLimit
