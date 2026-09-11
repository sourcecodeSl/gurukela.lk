import multer from 'multer'
import { HttpError } from '../utils/http.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details })
  }
  // Multer upload errors (e.g. file exceeds the configured size limit).
  if (err instanceof multer.MulterError) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE' ? 'The file is too large' : `Upload error: ${err.message}`
    return res.status(400).json({ error: msg })
  }
  // fileFilter rejections come through as plain Errors from multer.
  if (err && /Only .* files are allowed/.test(err.message || '')) {
    return res.status(400).json({ error: err.message })
  }
  // MySQL duplicate key
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'A record with those details already exists' })
  }
  console.error('[error]', err)
  res.status(500).json({ error: 'Internal server error' })
}
