import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Load backend/.env regardless of the current working directory.
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const num = (v, fallback) => (v === undefined || v === '' ? fallback : Number(v))
const bool = (v, fallback) => (v === undefined ? fallback : v === 'true' || v === '1')

export const env = {
  port: num(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: num(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gurukela_lms',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcryptRounds: num(process.env.BCRYPT_ROUNDS, 10),

  otp: {
    length: num(process.env.OTP_LENGTH, 6),
    ttlMinutes: num(process.env.OTP_TTL_MINUTES, 10),
    devLog: bool(process.env.OTP_DEV_LOG, true),
  },

  sms: {
    provider: process.env.SMS_PROVIDER || 'dev',
    apiUrl: process.env.SMS_API_URL || '',
    userId: process.env.SMS_USER_ID || '',
    apiKey: process.env.SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || 'GetClass',
    httpMethod: (process.env.SMS_HTTP_METHOD || 'GET').toUpperCase(),
  },

  defaultCommissionRate: num(process.env.DEFAULT_COMMISSION_RATE, 0.15),

  // Dialog Genie payment gateway. Leave GENIE_API_URL/GENIE_API_KEY blank to run
  // in sandbox/mock mode (no real charge — the booking still completes so the
  // flow is testable). Fill them in and set GENIE_LIVE=true to go live.
  genie: {
    apiUrl: process.env.GENIE_API_URL || '',
    apiKey: process.env.GENIE_API_KEY || '',
    merchantId: process.env.GENIE_MERCHANT_ID || '',
    live: bool(process.env.GENIE_LIVE, false),
  },

  // PayHere payment gateway (redirect checkout).
  //   PAYHERE_MODE         : 'sandbox' | 'live'
  //   PAYHERE_NOTIFY_URL   : public URL PayHere posts to; blank derives it from
  //                          the incoming request (only works when the backend is
  //                          publicly reachable — use ngrok for local testing).
  //   APP_URL              : frontend base for return/cancel redirects.
  payhere: {
    mode: process.env.PAYHERE_MODE || 'sandbox',
    merchantId: process.env.PAYHERE_MERCHANT_ID || '',
    merchantSecret: process.env.PAYHERE_MERCHANT_SECRET || '',
    notifyUrl: process.env.PAYHERE_NOTIFY_URL || '',
    appUrl: process.env.APP_URL || 'http://localhost:5173',
  },
}

export default env

