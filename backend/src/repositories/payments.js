import { uid } from '../utils/ids.js'
import { getCommissionRate } from '../utils/settings.js'

/**
 * Record an enrollment + payment inside an existing transaction connection `c`.
 * Splits the amount into platform commission and instructor earning using the
 * current commission rate. Returns the created ids.
 */
export async function recordPayment(c, { type, refId, requestId, studentId, instructorId, amount, method }) {
  const rate = await getCommissionRate()
  const commissionAmount = Math.round(amount * rate)
  const instructorEarning = amount - commissionAmount

  const enrollmentId = uid('enr')
  const paymentId = uid('pay')
  const now = new Date()

  await c.query(
    `INSERT INTO enrollments (id, type, ref_id, request_id, student_id, amount, paid_at, started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [enrollmentId, type, refId, requestId || null, studentId, amount, now, now]
  )
  await c.query(
    `INSERT INTO payments
       (id, enrollment_id, student_id, instructor_id, amount, commission_rate, commission_amount, instructor_earning, method, status, at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', ?)`,
    [
      paymentId,
      enrollmentId,
      studentId,
      instructorId || null,
      amount,
      rate,
      commissionAmount,
      instructorEarning,
      method || 'card',
      now,
    ]
  )
  return { enrollmentId, paymentId, rate, commissionAmount, instructorEarning }
}
