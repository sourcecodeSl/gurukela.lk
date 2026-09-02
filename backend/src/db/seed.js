import { pool, query } from '../config/db.js'
import env from '../config/env.js'
import { hashPassword } from '../utils/password.js'
import { uid } from '../utils/ids.js'
import seed from '../../../frontend/src/data/seed.js'

/** ISO string -> 'YYYY-MM-DD HH:MM:SS' (UTC wall time). */
const dt = (iso) => (iso ? new Date(iso).toISOString().slice(0, 19).replace('T', ' ') : null)
const date = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : null)

// Deterministic unique phone numbers for demo accounts.
let phoneCounter = 100
const nextPhone = () => `+9477${String(1000000 + phoneCounter++).slice(-7)}`

const DEFAULT_PASSWORD = 'password123'

async function run() {
  console.log('[seed] clearing existing data...')
  const tables = [
    'payments',
    'payouts',
    'enrollments',
    'reviews',
    'slot_requests',
    'slots',
    'group_classes',
    'instructor_modules',
    'student_subjects',
    'modules',
    'subjects',
    'instructors',
    'students',
    'otps',
    'settings',
    'users',
  ]
  await query('SET FOREIGN_KEY_CHECKS = 0')
  for (const t of tables) await query(`TRUNCATE TABLE \`${t}\``)
  await query('SET FOREIGN_KEY_CHECKS = 1')

  const passwordHash = await hashPassword(DEFAULT_PASSWORD)

  /* ---------------- settings + admin ---------------- */
  await query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', [
    'commission_rate',
    String(env.defaultCommissionRate),
  ])

  const adminUserId = uid('usr')
  await query(
    'INSERT INTO users (id, role, email, phone, password_hash, phone_verified) VALUES (?, "admin", ?, ?, ?, 1)',
    [adminUserId, 'admin@gurukela.lk', '+94770000001', await hashPassword('admin123')]
  )

  /* ---------------- subjects + modules ---------------- */
  for (const s of seed.subjects)
    await query('INSERT INTO subjects (id, name, icon, color, description) VALUES (?, ?, ?, ?, ?)', [
      s.id,
      s.name,
      s.icon,
      s.color,
      s.description,
    ])

  for (const m of seed.modules)
    await query(
      'INSERT INTO modules (id, subject_id, code, name, level, hours) VALUES (?, ?, ?, ?, ?, ?)',
      [m.id, m.subjectId, m.code, m.name, m.level, m.hours]
    )

  /* ---------------- instructors ---------------- */
  for (const i of seed.instructors) {
    const userId = uid('usr')
    const emailLocal = i.name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')
    await query(
      'INSERT INTO users (id, role, email, phone, password_hash, phone_verified) VALUES (?, "instructor", ?, ?, ?, 1)',
      [userId, `${emailLocal}@teach.gurukela.lk`, nextPhone(), passwordHash]
    )
    await query(
      `INSERT INTO instructors
        (id, user_id, name, title, hue, verification_status, is_active, rating, review_count,
         teaching_hours, student_count, hourly_rate, response_mins, languages, city, experience_years, bio, highlights)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        i.id,
        userId,
        i.name,
        i.title,
        i.hue,
        i.verified ? 'verified' : 'pending_basic',
        i.rating,
        i.reviewCount,
        i.teachingHours,
        i.studentCount,
        i.hourlyRate,
        i.responseMins,
        JSON.stringify(i.languages || []),
        i.city,
        i.experienceYears,
        i.bio,
        JSON.stringify(i.highlights || []),
      ]
    )
    for (const mid of i.moduleIds || [])
      await query('INSERT INTO instructor_modules (instructor_id, module_id) VALUES (?, ?)', [
        i.id,
        mid,
      ])
  }

  /* ---------------- students ---------------- */
  for (const s of seed.students) {
    const userId = uid('usr')
    await query(
      'INSERT INTO users (id, role, email, phone, password_hash, phone_verified) VALUES (?, "student", ?, ?, ?, 1)',
      [userId, s.email, nextPhone(), passwordHash]
    )
    await query(
      'INSERT INTO students (id, user_id, name, hue, joined_at) VALUES (?, ?, ?, ?, ?)',
      [s.id, userId, s.name, s.hue, dt(s.joinedAt)]
    )
  }

  /* ---------------- slots + requests ---------------- */
  for (const s of seed.slots)
    await query(
      'INSERT INTO slots (id, instructor_id, date, start, end, status, booked_by, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [s.id, s.instructorId, dt(s.date), s.start, s.end, s.status, s.bookedBy, s.price]
    )

  for (const r of seed.slotRequests)
    await query(
      `INSERT INTO slot_requests (id, slot_id, student_id, module_id, status, note, created_at, accepted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.slotId, r.studentId, r.moduleId, r.status, r.note, dt(r.createdAt), dt(r.acceptedAt)]
    )

  /* ---------------- group classes ---------------- */
  for (const g of seed.groupClasses)
    await query(
      `INSERT INTO group_classes
        (id, instructor_id, module_id, title, description, schedule, weeks, starts_at, seats, enrolled, price, level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        g.id,
        g.instructorId,
        g.moduleId,
        g.title,
        g.description,
        g.schedule,
        g.weeks,
        dt(g.startsAt),
        g.seats,
        g.enrolled,
        g.price,
        g.level,
      ]
    )

  /* ---------------- reviews ---------------- */
  for (const r of seed.reviews)
    await query(
      `INSERT INTO reviews (id, instructor_id, student_id, rating, days_studied, text, verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.instructorId, r.studentId, r.rating, r.daysStudied, r.text, r.verified ? 1 : 0, dt(r.createdAt)]
    )

  /* ---------------- enrollments + payments ---------------- */
  // Resolve instructor for a payment from its enrollment's slot/group.
  const slotById = Object.fromEntries(seed.slots.map((s) => [s.id, s]))
  const groupById = Object.fromEntries(seed.groupClasses.map((g) => [g.id, g]))
  const enrollmentById = Object.fromEntries(seed.enrollments.map((e) => [e.id, e]))

  for (const e of seed.enrollments)
    await query(
      `INSERT INTO enrollments (id, type, ref_id, request_id, student_id, amount, paid_at, started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.id, e.type, e.refId, e.requestId || null, e.studentId, e.amount, dt(e.paidAt), dt(e.startedAt)]
    )

  const rate = env.defaultCommissionRate
  for (const p of seed.payments) {
    const enr = enrollmentById[p.enrollmentId]
    let instructorId = null
    if (enr) {
      instructorId =
        enr.type === 'slot'
          ? slotById[enr.refId]?.instructorId
          : groupById[enr.refId]?.instructorId
    }
    const commissionAmount = Math.round(p.amount * rate)
    await query(
      `INSERT INTO payments
        (id, enrollment_id, student_id, instructor_id, amount, commission_rate, commission_amount, instructor_earning, method, status, at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.enrollmentId,
        p.studentId,
        instructorId,
        p.amount,
        rate,
        commissionAmount,
        p.amount - commissionAmount,
        p.method,
        p.status,
        dt(p.at),
      ]
    )
  }

  console.log('[seed] done.')
  console.log('       Admin login  : admin@gurukela.lk / admin123')
  console.log(`       Demo accounts: any seeded email / ${DEFAULT_PASSWORD}`)
}

run()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('[seed] failed:', err)
    await pool.end()
    process.exit(1)
  })
