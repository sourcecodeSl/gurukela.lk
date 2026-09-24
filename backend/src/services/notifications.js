import { queryOne } from '../config/db.js'
import { sendSms } from '../utils/sms.js'

// Brand shown in outgoing SMS, matching the OTP messages in utils/otp.js.
const BRAND = 'getclass.lk'

// Format a slot's date + start time into a short "when" phrase for an SMS.
const fmtWhen = (date, start) => {
  if (!date) return ''
  const d = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10)
  return start ? `${d} at ${start}` : d
}

// Look up the account phone + display name behind an instructor / student profile.
// Phone lives on `users`; profiles link to it via user_id.
const instructorContact = (id) =>
  queryOne(
    'SELECT u.phone, i.name FROM instructors i JOIN users u ON u.id = i.user_id WHERE i.id = ?',
    [id]
  )
const studentContact = (id) =>
  queryOne(
    'SELECT u.phone, s.name FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = ?',
    [id]
  )

// Resolve everything a notification needs from a request id: the owning
// instructor (slot-based or custom) and the "when" phrase.
const contextFor = async (requestId) => {
  const r = await queryOne(
    `SELECT r.*, s.instructor_id AS slot_instructor_id, s.date AS slot_date, s.start AS slot_start
     FROM slot_requests r LEFT JOIN slots s ON s.id = r.slot_id WHERE r.id = ?`,
    [requestId]
  )
  if (!r) return null
  return {
    r,
    instructorId: r.slot_instructor_id || r.instructor_id,
    when: fmtWhen(r.slot_date || r.req_date, r.slot_start || r.req_start),
  }
}

// Notifications are best-effort: a gateway hiccup or missing phone must never
// break the booking flow, so every send is wrapped and swallowed here. Callers
// fire these without awaiting.
const safe = (fn) => {
  Promise.resolve()
    .then(fn)
    .catch((e) => console.error('[notify] failed:', e.message))
}
const deliver = (phone, text) => {
  if (!phone) return
  sendSms(phone, text).catch((e) => console.error('[notify] SMS failed:', e.message))
}

// A student booked/requested a slot → tell the instructor.
export function notifyInstructorNewRequest(requestId) {
  safe(async () => {
    const ctx = await contextFor(requestId)
    if (!ctx) return
    const ins = await instructorContact(ctx.instructorId)
    if (!ins?.phone) return
    const stu = await studentContact(ctx.r.student_id)
    const from = stu?.name ? ` from ${stu.name}` : ''
    const when = ctx.when ? ` for ${ctx.when}` : ''
    deliver(ins.phone, `New booking request${from}${when}. Review it on ${BRAND}.`)
  })
}

// Instructor confirmed/accepted the request → tell the student to pay.
export function notifyStudentAccepted(requestId) {
  safe(async () => {
    const ctx = await contextFor(requestId)
    if (!ctx) return
    const stu = await studentContact(ctx.r.student_id)
    if (!stu?.phone) return
    const ins = await instructorContact(ctx.instructorId)
    const who = ins?.name || 'Your instructor'
    const when = ctx.when ? ` for ${ctx.when}` : ''
    deliver(stu.phone, `${who} confirmed your booking${when}. Pay now on ${BRAND} to secure your slot.`)
  })
}

// Student paid → tell the instructor the slot is booked.
export function notifyInstructorPaid(requestId) {
  safe(async () => {
    const ctx = await contextFor(requestId)
    if (!ctx) return
    const ins = await instructorContact(ctx.instructorId)
    if (!ins?.phone) return
    const stu = await studentContact(ctx.r.student_id)
    const who = stu?.name || 'A student'
    const when = ctx.when ? ` for ${ctx.when}` : ''
    deliver(ins.phone, `${who} paid${when}. The slot is now booked on ${BRAND}.`)
  })
}
