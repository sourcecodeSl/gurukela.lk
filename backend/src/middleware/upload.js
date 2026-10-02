import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { uid } from '../utils/ids.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// backend/uploads is the on-disk root; served statically at /uploads (app.js).
export const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads')

// Map each accepted mimetype to the extension we store it under. Deriving the
// extension from the (validated) mimetype — never from the user-supplied
// originalname — stops an attacker from saving an executable/HTML file (e.g.
// a faked-mimetype "shell.php") into a statically-served directory.
const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
}

// Safe extension for a stored file. Falls back to the mimetype's top-level
// family so an unmapped-but-allowed type still gets an inert extension.
function safeExt(file, fallback) {
  if (EXT_BY_MIME[file.mimetype]) return EXT_BY_MIME[file.mimetype]
  if (/^image\//.test(file.mimetype)) return '.img'
  if (/^video\//.test(file.mimetype)) return '.vid'
  return fallback
}

/** Build a multer instance that writes into uploads/<subdir> and accepts images. */
export function imageUpload(subdir) {
  const dir = path.join(UPLOADS_ROOT, subdir)
  fs.mkdirSync(dir, { recursive: true })

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      cb(null, `${uid('img')}${safeExt(file, '.jpg')}`)
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
      cb(null, `${uid('doc')}${safeExt(file, '.pdf')}`)
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

/** Build a multer instance that writes into uploads/<subdir> and accepts either
 *  a PDF or an image — used for student paper answers, since handwritten work is
 *  usually a photo while typed work is a PDF. */
export function answerUpload(subdir, { maxBytes = 25 * 1024 * 1024 } = {}) {
  const dir = path.join(UPLOADS_ROOT, subdir)
  fs.mkdirSync(dir, { recursive: true })

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const fallback = file.mimetype === 'application/pdf' ? '.pdf' : '.jpg'
      cb(null, `${uid('ans')}${safeExt(file, fallback)}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: maxBytes }, // default 25 MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf' || /^image\//.test(file.mimetype)) cb(null, true)
      else cb(new Error('Only PDF or image files are allowed'))
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
      cb(null, `${uid('vid')}${safeExt(file, '.mp4')}`)
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
