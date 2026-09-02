import bcrypt from 'bcryptjs'
import { query, queryOne } from '../config/db.js'
import env from '../config/env.js'
import { uid } from './ids.js'
import { sendSms } from './sms.js'
import { badRequest } from './http.js'

const randomCode = (len) => {
  let code = ''
  for (let i = 0; i < len; i++) code += Math.floor(Math.random() * 10)
  return code
}

/**
 * Create an OTP for `phone`/`purpose`, store its hash, and send it by SMS.
 * Any earlier unconsumed OTPs for the same phone+purpose are invalidated.
 * In development the code is also returned so it can be shown to the caller.
 */
export async function issueOtp(phone, purpose) {
  await query('UPDATE otps SET consumed = 1 WHERE phone = ? AND purpose = ? AND consumed = 0', [
    phone,
    purpose,
  ])

  const code = randomCode(env.otp.length)
  const codeHash = await bcrypt.hash(code, 8)
  const expiresAt = new Date(Date.now() + env.otp.ttlMinutes * 60000)

  await query(
    'INSERT INTO otps (id, phone, code_hash, purpose, expires_at) VALUES (?, ?, ?, ?, ?)',
    [uid('otp'), phone, codeHash, purpose, expiresAt]
  )

  const text =
    purpose === 'reset'
      ? `Your gurukela.lk password reset code is ${code}. It expires in ${env.otp.ttlMinutes} minutes.`
      : `Your gurukela.lk verification code is ${code}. It expires in ${env.otp.ttlMinutes} minutes.`

  await sendSms(phone, text)

  return { sent: true, devCode: env.otp.devLog ? code : undefined }
}

/**
 * Verify `code` for `phone`/`purpose`. Marks it consumed on success.
 * Throws a 400 on any failure.
 */
export async function verifyOtp(phone, purpose, code) {
  const row = await queryOne(
    'SELECT * FROM otps WHERE phone = ? AND purpose = ? AND consumed = 0 ORDER BY created_at DESC LIMIT 1',
    [phone, purpose]
  )
  if (!row) throw badRequest('No active code. Please request a new one.')
  if (new Date(row.expires_at) < new Date()) throw badRequest('Code expired. Please request a new one.')
  if (row.attempts >= 5) throw badRequest('Too many attempts. Please request a new code.')

  const ok = await bcrypt.compare(String(code), row.code_hash)
  if (!ok) {
    await query('UPDATE otps SET attempts = attempts + 1 WHERE id = ?', [row.id])
    throw badRequest('Incorrect code.')
  }

  await query('UPDATE otps SET consumed = 1 WHERE id = ?', [row.id])
  return true
}
