import { HttpError } from '../utils/http.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details })
  }
  // MySQL duplicate key
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'A record with those details already exists' })
  }
  console.error('[error]', err)
  res.status(500).json({ error: 'Internal server error' })
}
