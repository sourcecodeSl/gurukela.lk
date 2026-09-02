import { Router } from 'express'
import { query, queryOne, tx } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { signToken } from '../utils/jwt.js'
import { issueOtp, verifyOtp } from '../utils/otp.js'
import { asyncH, badRequest, conflict, unauthorized, forbidden } from '../utils/http.js'
import { isEmail, normalizePhone, requireFields, assertPasswords } from '../utils/validate.js'
import { getInstructor, getStudent, profileIdForUser } from '../repositories/people.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const publicUser = (u) => ({
  id: u.id,
  role: u.role,
  email: u.email,
  phone: u.phone,
  phoneVerified: !!u.phone_verified,
})

async function tokenFor(user) {
  const profileId = await profileIdForUser(user.id, user.role)
  const token = signToken({ sub: user.id, role: user.role, profileId })
  return { token, profileId }
}

/* ---------------------------------------------------------------- */
/* Student registration                                             */
/* ---------------------------------------------------------------- */
router.post(
  '/register/student',
  asyncH(async (req, res) => {
    const { email, phone, password, confirmPassword, name, birthday, grade } = req.body
    const subjectIds = req.body.subjectIds || req.body.subjects || []
    requireFields(req.body, ['email', 'phone', 'password', 'name'])
    if (!isEmail(email)) throw badRequest('Invalid email')
    const normPhone = normalizePhone(phone)
    if (!normPhone) throw badRequest('Invalid phone number')
    assertPasswords(password, confirmPassword)

    const existing = await queryOne('SELECT id FROM users WHERE email = ? OR phone = ?', [
      email,
      normPhone,
    ])
    if (existing) throw conflict('An account with that email or phone already exists')

    const userId = uid('usr')
    const studentId = uid('std')
    const passwordHash = await hashPassword(password)

    await tx(async (c) => {
      await c.query(
        'INSERT INTO users (id, role, email, phone, password_hash, phone_verified) VALUES (?, "student", ?, ?, ?, 0)',
        [userId, email, normPhone, passwordHash]
      )
      await c.query(
        'INSERT INTO students (id, user_id, name, birthday, grade) VALUES (?, ?, ?, ?, ?)',
        [studentId, userId, name, birthday || null, grade || null]
      )
      for (const sid of subjectIds) {
        await c.query(
          'INSERT IGNORE INTO student_subjects (student_id, subject_id) VALUES (?, ?)',
          [studentId, sid]
        )
      }
    })

    const otp = await issueOtp(normPhone, 'verify')
    res.status(201).json({
      message: 'Registered. Verify your phone with the OTP we sent.',
      userId,
      phone: normPhone,
      requiresVerification: true,
      devCode: otp.devCode,
    })
  })
)

/* ---------------------------------------------------------------- */
/* Instructor registration                                          */
/* ---------------------------------------------------------------- */
router.post(
  '/register/instructor',
  asyncH(async (req, res) => {
    const { email, phone, password, confirmPassword, name, title, city, bio } = req.body
    const moduleIds = req.body.moduleIds || []
    requireFields(req.body, ['email', 'phone', 'password', 'name'])
    if (!isEmail(email)) throw badRequest('Invalid email')
    const normPhone = normalizePhone(phone)
    if (!normPhone) throw badRequest('Invalid phone number')
    assertPasswords(password, confirmPassword)

    const existing = await queryOne('SELECT id FROM users WHERE email = ? OR phone = ?', [
      email,
      normPhone,
    ])
    if (existing) throw conflict('An account with that email or phone already exists')

    const userId = uid('usr')
    const instructorId = uid('ins')
    const passwordHash = await hashPassword(password)

    await tx(async (c) => {
      await c.query(
        'INSERT INTO users (id, role, email, phone, password_hash, phone_verified) VALUES (?, "instructor", ?, ?, ?, 0)',
        [userId, email, normPhone, passwordHash]
      )
      await c.query(
        `INSERT INTO instructors (id, user_id, name, title, city, bio, verification_status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending_basic')`,
        [instructorId, userId, name, title || null, city || null, bio || null]
      )
      for (const mid of moduleIds) {
        await c.query(
          'INSERT IGNORE INTO instructor_modules (instructor_id, module_id) VALUES (?, ?)',
          [instructorId, mid]
        )
      }
    })

    const otp = await issueOtp(normPhone, 'verify')
    res.status(201).json({
      message: 'Registered. Verify your phone, then await admin verification.',
      userId,
      phone: normPhone,
      requiresVerification: true,
      devCode: otp.devCode,
    })
  })
)

/* ---------------------------------------------------------------- */
/* Phone verification (SMS OTP)                                      */
/* ---------------------------------------------------------------- */
router.post(
  '/verify-phone/request',
  asyncH(async (req, res) => {
    const normPhone = normalizePhone(req.body.phone)
    if (!normPhone) throw badRequest('Invalid phone number')
    const user = await queryOne('SELECT id FROM users WHERE phone = ?', [normPhone])
    if (!user) throw badRequest('No account with that phone')
    const otp = await issueOtp(normPhone, 'verify')
    res.json({ message: 'OTP sent', devCode: otp.devCode })
  })
)

router.post(
  '/verify-phone/confirm',
  asyncH(async (req, res) => {
    const { code } = req.body
    const normPhone = normalizePhone(req.body.phone)
    if (!normPhone) throw badRequest('Invalid phone number')
    requireFields(req.body, ['code'])

    await verifyOtp(normPhone, 'verify', code)
    await query('UPDATE users SET phone_verified = 1 WHERE phone = ?', [normPhone])

    const user = await queryOne('SELECT * FROM users WHERE phone = ?', [normPhone])
    const { token, profileId } = await tokenFor(user)
    res.json({ message: 'Phone verified', token, user: publicUser(user), profileId })
  })
)

/* ---------------------------------------------------------------- */
/* Login                                                            */
/* ---------------------------------------------------------------- */
router.post(
  '/login',
  asyncH(async (req, res) => {
    const { password } = req.body
    const identifier = req.body.email || req.body.phone
    requireFields({ identifier, password }, ['identifier', 'password'])

    const normPhone = normalizePhone(identifier)
    const user = await queryOne('SELECT * FROM users WHERE email = ? OR phone = ?', [
      identifier,
      normPhone || identifier,
    ])
    if (!user) throw unauthorized('Invalid credentials')
    if (user.banned) throw forbidden('This account has been banned')

    const ok = await verifyPassword(password, user.password_hash)
    if (!ok) throw unauthorized('Invalid credentials')

    if (!user.phone_verified) {
      const otp = await issueOtp(user.phone, 'verify')
      return res.status(403).json({
        error: 'Phone not verified',
        requiresVerification: true,
        phone: user.phone,
        devCode: otp.devCode,
      })
    }

    const { token, profileId } = await tokenFor(user)
    res.json({ token, user: publicUser(user), profileId })
  })
)

/* ---------------------------------------------------------------- */
/* Forgot password via SMS OTP                                      */
/* ---------------------------------------------------------------- */
router.post(
  '/forgot-password',
  asyncH(async (req, res) => {
    const normPhone = normalizePhone(req.body.phone)
    if (!normPhone) throw badRequest('Invalid phone number')
    const user = await queryOne('SELECT id FROM users WHERE phone = ?', [normPhone])
    // Always respond the same to avoid leaking which numbers exist.
    let devCode
    if (user) {
      const otp = await issueOtp(normPhone, 'reset')
      devCode = otp.devCode
    }
    res.json({ message: 'If that number is registered, an OTP has been sent.', devCode })
  })
)

router.post(
  '/reset-password',
  asyncH(async (req, res) => {
    const { code, password, confirmPassword } = req.body
    const normPhone = normalizePhone(req.body.phone)
    if (!normPhone) throw badRequest('Invalid phone number')
    requireFields(req.body, ['code', 'password'])
    assertPasswords(password, confirmPassword)

    await verifyOtp(normPhone, 'reset', code)
    const passwordHash = await hashPassword(password)
    await query('UPDATE users SET password_hash = ? WHERE phone = ?', [passwordHash, normPhone])
    res.json({ message: 'Password updated. You can now log in.' })
  })
)

/* ---------------------------------------------------------------- */
/* Current user                                                     */
/* ---------------------------------------------------------------- */
router.get(
  '/me',
  authenticate,
  asyncH(async (req, res) => {
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id])
    let profile = null
    if (user.role === 'instructor') profile = await getInstructor(req.user.profileId)
    else if (user.role === 'student') profile = await getStudent(req.user.profileId)
    res.json({ user: publicUser(user), profile })
  })
)

export default router
