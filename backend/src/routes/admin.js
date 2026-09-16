import { Router } from 'express'
import { query, queryOne, tx } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, badRequest } from '../utils/http.js'
import { requireFields, isEmail, normalizePhone, assertPasswords } from '../utils/validate.js'
import { hashPassword } from '../utils/password.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { getInstructor, listInstructors, listStudents } from '../repositories/people.js'
import { getCommissionRate, getSetting, setSetting } from '../utils/settings.js'
import { mapEnrollment, mapPayment, mapManualPayment } from '../utils/mappers.js'
import { completePayable } from '../repositories/enrollment.js'
import { imageUpload, fileUrl } from '../middleware/upload.js'

const qrUpload = imageUpload('qr')

const router = Router()
router.use(authenticate, requireRole('admin'))

/* ------------------------- instructors ------------------------- */
router.get(
  '/instructors',
  asyncH(async (req, res) => {
    res.json(await listInstructors()) // full view: includes contact + status
  })
)

router.get(
  '/instructors/:id',
  asyncH(async (req, res) => {
    const ins = await getInstructor(req.params.id)
    if (!ins) throw notFound('Instructor not found')
    res.json(ins)
  })
)

// Toggle active/inactive.
router.patch(
  '/instructors/:id/active',
  asyncH(async (req, res) => {
    const isActive = req.body.isActive ? 1 : 0
    const r = await query('UPDATE instructors SET is_active = ? WHERE id = ?', [isActive, req.params.id])
    if (!r.affectedRows) throw notFound('Instructor not found')
    res.json({ message: `Instructor ${isActive ? 'activated' : 'deactivated'}`, instructor: await getInstructor(req.params.id) })
  })
)

/**
 * Verification stage machine, driven by admin:
 *   action=basic    : first verification  -> 'basic_verified'
 *   action=advanced : second verification -> 'verified' (needs a submitted video)
 *   action=reject   : -> 'rejected'
 */
router.patch(
  '/instructors/:id/verification',
  asyncH(async (req, res) => {
    const { action } = req.body
    const ins = await queryOne('SELECT * FROM instructors WHERE id = ?', [req.params.id])
    if (!ins) throw notFound('Instructor not found')

    let status
    if (action === 'basic') {
      if (!['pending_basic', 'rejected'].includes(ins.verification_status))
        throw badRequest(`Cannot run basic verification from status "${ins.verification_status}"`)
      status = 'basic_verified'
    } else if (action === 'advanced') {
      if (ins.verification_status !== 'pending_advanced')
        throw badRequest('Instructor must submit the 5-minute video first (status pending_advanced)')
      status = 'verified'
    } else if (action === 'reject') {
      status = 'rejected'
    } else if (action === 'verify') {
      // Admin override: mark fully verified directly.
      status = 'verified'
    } else if (action === 'revoke') {
      // Admin override: send back to the start of the verification flow.
      status = 'pending_basic'
    } else {
      throw badRequest('action must be one of: basic, advanced, verify, revoke, reject')
    }

    await query('UPDATE instructors SET verification_status = ? WHERE id = ?', [status, req.params.id])
    res.json({ message: `Verification updated to ${status}`, instructor: await getInstructor(req.params.id) })
  })
)

// Manually enter a teacher (admin creates the account + a temporary password).
router.post(
  '/instructors',
  asyncH(async (req, res) => {
    const { email, phone, name, title, city, bio } = req.body
    const subjectIds = req.body.subjectIds || []
    requireFields(req.body, ['email', 'phone', 'name'])
    if (!isEmail(email)) throw badRequest('Invalid email')
    const normPhone = normalizePhone(phone)
    if (!normPhone) throw badRequest('Invalid phone number')

    const password = req.body.password || Math.random().toString(36).slice(2, 10) + 'A1'
    if (req.body.password) assertPasswords(req.body.password, req.body.confirmPassword)

    const dupe = await queryOne('SELECT id FROM users WHERE email = ? OR phone = ?', [email, normPhone])
    if (dupe) throw badRequest('An account with that email or phone already exists')

    const userId = uid('usr')
    const instructorId = uid('ins')
    const passwordHash = await hashPassword(password)
    // Admin-entered teachers are phone-verified and start basic_verified.
    const status = req.body.verificationStatus || 'basic_verified'

    await tx(async (c) => {
      await c.query(
        'INSERT INTO users (id, role, email, phone, password_hash, phone_verified) VALUES (?, "instructor", ?, ?, ?, 1)',
        [userId, email, normPhone, passwordHash]
      )
      await c.query(
        `INSERT INTO instructors (id, user_id, name, title, city, bio, verification_status, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [instructorId, userId, name, title || null, city || null, bio || null, status]
      )
      for (const sid of subjectIds)
        await c.query('INSERT IGNORE INTO instructor_subjects (instructor_id, subject_id) VALUES (?, ?)', [
          instructorId,
          sid,
        ])
    })

    res.status(201).json({
      message: 'Teacher created',
      instructor: await getInstructor(instructorId),
      // Returned once so the admin can share it; not stored in plaintext.
      temporaryPassword: req.body.password ? undefined : password,
    })
  })
)

/* ------------------------- students ------------------------- */
router.get(
  '/students',
  asyncH(async (req, res) => {
    res.json(await listStudents())
  })
)

/* ------------------------- all enrollments / payments ------------------------- */
router.get(
  '/enrollments',
  asyncH(async (req, res) => {
    const rows = await query(
      `SELECT e.*, st.name AS student_name, st.hue AS student_hue
       FROM enrollments e LEFT JOIN students st ON st.id = e.student_id
       ORDER BY e.paid_at DESC`
    )
    res.json(rows.map(mapEnrollment))
  })
)

router.get(
  '/payments',
  asyncH(async (req, res) => {
    const rows = await query('SELECT * FROM payments ORDER BY at DESC')
    res.json(rows.map(mapPayment))
  })
)

/* ------------------------- ban / unban ------------------------- */
// Works for instructors and students by their user_id lookup via profile id.
async function setBanned(profileTable, profileId, banned) {
  const row = await queryOne(`SELECT user_id FROM ${profileTable} WHERE id = ?`, [profileId])
  if (!row) throw notFound('Account not found')
  await query('UPDATE users SET banned = ? WHERE id = ?', [banned ? 1 : 0, row.user_id])
}

router.patch(
  '/instructors/:id/ban',
  asyncH(async (req, res) => {
    await setBanned('instructors', req.params.id, req.body.banned ?? true)
    res.json({ message: (req.body.banned ?? true) ? 'Instructor banned' : 'Instructor unbanned' })
  })
)

router.patch(
  '/students/:id/ban',
  asyncH(async (req, res) => {
    await setBanned('students', req.params.id, req.body.banned ?? true)
    res.json({ message: (req.body.banned ?? true) ? 'Student banned' : 'Student unbanned' })
  })
)

/* ------------------------- commission rate ------------------------- */
router.get(
  '/commission-rate',
  asyncH(async (req, res) => {
    const rate = await getCommissionRate()
    res.json({ rate, percent: Math.round(rate * 10000) / 100 })
  })
)

router.put(
  '/commission-rate',
  asyncH(async (req, res) => {
    let rate = Number(req.body.rate)
    // Accept either a fraction (0.15) or a percent (15).
    if (rate > 1) rate = rate / 100
    if (!Number.isFinite(rate) || rate < 0 || rate > 1)
      throw badRequest('rate must be between 0 and 1 (or 0 and 100 as a percent)')
    await setSetting('commission_rate', rate)
    res.json({ message: 'Commission rate updated', rate, percent: Math.round(rate * 10000) / 100 })
  })
)

/* ------------------------- manual payment methods ------------------------- */
// The QR image + bank details students see, plus a queue of offline payments
// to verify. QR/bank details live in the `settings` key/value store.

router.get(
  '/payment-settings',
  asyncH(async (req, res) => {
    const [qrUrl, bankDetails] = await Promise.all([
      getSetting('pay_qr_url', ''),
      getSetting('pay_bank_details', ''),
    ])
    res.json({ qrUrl: qrUrl || null, bankDetails: bankDetails || '' })
  })
)

router.put(
  '/payment-settings',
  asyncH(async (req, res) => {
    if ('qrUrl' in req.body) await setSetting('pay_qr_url', req.body.qrUrl || '')
    if ('bankDetails' in req.body) await setSetting('pay_bank_details', req.body.bankDetails || '')
    res.json({ message: 'Payment settings saved' })
  })
)

// Upload a new QR image; stores it and returns its public URL (does not persist
// it as the active QR until the settings form is saved with this URL).
router.post(
  '/payment-settings/qr',
  qrUpload.single('image'),
  asyncH(async (req, res) => {
    if (!req.file) throw badRequest('No image uploaded')
    res.status(201).json({ url: fileUrl(req, 'qr', req.file.filename) })
  })
)

// Every offline payment claim, pending ones first.
router.get(
  '/manual-payments',
  asyncH(async (req, res) => {
    const rows = await query(
      `SELECT mp.*, st.name AS student_name, st.hue AS student_hue,
              CASE mp.kind
                WHEN 'group'   THEN gc.title
                WHEN 'seminar' THEN sm.title
                ELSE 'One-to-one session'
              END AS label
       FROM manual_payments mp
       LEFT JOIN students st       ON st.id = mp.student_id
       LEFT JOIN group_classes gc  ON mp.kind = 'group'   AND gc.id = mp.ref_id
       LEFT JOIN seminars sm       ON mp.kind = 'seminar' AND sm.id = mp.ref_id
       ORDER BY (mp.status = 'pending') DESC, mp.created_at DESC`
    )
    res.json(rows.map(mapManualPayment))
  })
)

// Approve a claim: creates the real enrollment + payment, then marks it approved.
router.post(
  '/manual-payments/:id/approve',
  asyncH(async (req, res) => {
    const mp = await queryOne('SELECT * FROM manual_payments WHERE id = ?', [req.params.id])
    if (!mp) throw notFound('Payment not found')
    if (mp.status !== 'pending') throw badRequest(`Payment is already ${mp.status}`)

    // Enrols the student (idempotent). Throws on e.g. a full class — we keep the
    // claim pending so the admin can reject it with a note instead.
    await completePayable(mp.kind, mp.ref_id, mp.student_id, mp.amount, mp.method)

    await query(
      `UPDATE manual_payments SET status = 'approved', note = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [req.body.note || null, req.user.profileId || req.user.id, req.params.id]
    )
    res.json({ message: 'Payment approved and student enrolled' })
  })
)

router.post(
  '/manual-payments/:id/reject',
  asyncH(async (req, res) => {
    const mp = await queryOne('SELECT * FROM manual_payments WHERE id = ?', [req.params.id])
    if (!mp) throw notFound('Payment not found')
    if (mp.status !== 'pending') throw badRequest(`Payment is already ${mp.status}`)
    await query(
      `UPDATE manual_payments SET status = 'rejected', note = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [req.body.note || null, req.user.profileId || req.user.id, req.params.id]
    )
    res.json({ message: 'Payment rejected' })
  })
)

export default router
