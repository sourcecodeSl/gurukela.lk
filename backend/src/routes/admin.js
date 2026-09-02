import { Router } from 'express'
import { query, queryOne, tx } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, badRequest } from '../utils/http.js'
import { requireFields, isEmail, normalizePhone, assertPasswords } from '../utils/validate.js'
import { hashPassword } from '../utils/password.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { getInstructor, listInstructors, listStudents } from '../repositories/people.js'
import { getCommissionRate, setSetting } from '../utils/settings.js'
import { mapEnrollment, mapPayment } from '../utils/mappers.js'

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
    const moduleIds = req.body.moduleIds || []
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
      for (const mid of moduleIds)
        await c.query('INSERT IGNORE INTO instructor_modules (instructor_id, module_id) VALUES (?, ?)', [
          instructorId,
          mid,
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

export default router
