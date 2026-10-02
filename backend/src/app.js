import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import env from './config/env.js'
import { UPLOADS_ROOT } from './middleware/upload.js'
import { notFoundHandler, errorHandler } from './middleware/error.js'

import authRoutes from './routes/auth.js'
import catalogueRoutes from './routes/catalogue.js'
import instructorRoutes from './routes/instructors.js'
import studentRoutes from './routes/students.js'
import slotRoutes from './routes/slots.js'
import requestRoutes from './routes/requests.js'
import groupRoutes from './routes/groups.js'
import seminarRoutes from './routes/seminars.js'
import quizRoutes from './routes/quizzes.js'
import questionBankRoutes from './routes/questionBanks.js'
import reviewRoutes from './routes/reviews.js'
import adminRoutes from './routes/admin.js'
import reportRoutes from './routes/reports.js'
import adRoutes from './routes/ads.js'
import materialRoutes from './routes/materials.js'
import paperRoutes from './routes/papers.js'
import paymentRoutes from './routes/payments.js'
import liveRoutes from './routes/live.js'

const app = express()

// Behind cPanel/Passenger the app is proxied; trust it so req.protocol
// reflects https when building absolute upload URLs.
app.set('trust proxy', true)
// Don't advertise the framework/version to attackers.
app.disable('x-powered-by')

// Baseline security response headers (dependency-free equivalent of helmet's
// core defaults). The API serves JSON + static uploads, so we avoid a strict
// CSP that could break the separately-hosted frontend.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  if (env.isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser tools (no origin) and any configured origin.
      if (!origin || env.corsOrigin.includes(origin)) return cb(null, true)
      cb(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
)
// Cap request bodies so an oversized JSON payload can't exhaust memory. File
// uploads go through multer (own limits), not this parser.
app.use(express.json({ limit: '1mb' }))
if (!env.isProd) app.use(morgan('dev'))

app.get('/api/health', (req, res) => res.json({ ok: true, env: env.nodeEnv, time: new Date().toISOString() }))

// Uploaded files (ad images, etc.) served statically.
app.use('/uploads', express.static(UPLOADS_ROOT))

app.use('/api/auth', authRoutes)
app.use('/api', catalogueRoutes) // /subjects, /modules
app.use('/api/instructors', instructorRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/slots', slotRoutes)
app.use('/api/slot-requests', requestRoutes)
app.use('/api/group-classes', groupRoutes)
app.use('/api/seminars', seminarRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/question-banks', questionBankRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/ads', adRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/papers', paperRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/live', liveRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
