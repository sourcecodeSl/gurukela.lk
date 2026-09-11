import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { uid } from '../utils/ids.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// backend/uploads is the on-disk root; served statically at /uploads (app.js).
export const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads')

/** Build a multer instance that writes into uploads/<subdir> and accepts images. */
export function imageUpload(subdir) {
  const dir = path.join(UPLOADS_ROOT, subdir)
  fs.mkdirSync(dir, { recursive: true })

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase()
      cb(null, `${uid('img')}${ext}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
      if (/^image\//.test(file.mimetype)) cb(null, true)
      else cb(new Error('Only image files are allowed'))
    },
  })
}

/** Build a multer instance that writes into uploads/<subdir> and accepts PDFs. */
export function pdfUpload(subdir) {
  const dir = path.join(UPLOADS_ROOT, subdir)
  fs.mkdirSync(dir, { recursive: true })

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.pdf').toLowerCase()
      cb(null, `${uid('doc')}${ext}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') cb(null, true)
      else cb(new Error('Only PDF files are allowed'))
    },
  })
}

/** Build a multer instance that writes into uploads/<subdir> and accepts videos. */
export function videoUpload(subdir, { maxBytes = 100 * 1024 * 1024 } = {}) {
  const dir = path.join(UPLOADS_ROOT, subdir)
  fs.mkdirSync(dir, { recursive: true })

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.mp4').toLowerCase()
      cb(null, `${uid('vid')}${ext}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: maxBytes }, // default 100 MB
    fileFilter: (req, file, cb) => {
      if (/^video\//.test(file.mimetype)) cb(null, true)
      else cb(new Error('Only video files are allowed'))
    },
  })
}

/** Absolute public URL for a stored file, e.g. https://api.host/uploads/ads/x.jpg */
export const fileUrl = (req, subdir, filename) =>
  `${req.protocol}://${req.get('host')}/uploads/${subdir}/${filename}`
