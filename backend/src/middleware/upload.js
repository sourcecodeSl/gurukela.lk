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

/** Absolute public URL for a stored file, e.g. https://api.host/uploads/ads/x.jpg */
export const fileUrl = (req, subdir, filename) =>
  `${req.protocol}://${req.get('host')}/uploads/${subdir}/${filename}`
