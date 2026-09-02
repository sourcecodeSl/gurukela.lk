import axios from 'axios'
import env from '../config/env.js'

/**
 * Normalise a phone number to the local MSISDN form gateways expect:
 * `94XXXXXXXXX` (no leading + or 0).
 *   0771234567     -> 94771234567
 *   771234567      -> 94771234567
 *   +94771234567   -> 94771234567
 */
export function toMsisdn(raw) {
  const digits = String(raw).replace(/\D/g, '')
  if (digits.startsWith('94')) return digits
  if (digits.startsWith('0')) return '94' + digits.slice(1)
  if (digits.length === 9) return '94' + digits
  return digits
}

/**
 * Send an SMS. Pluggable via SMS_PROVIDER in .env.
 * - "dev"          : logs to the server console (no network call)
 * - "ozonesender"  : OzoneSender gateway (GET, query params, 204 = success)
 * - "http"         : generic gateway; substitutes {to},{text},{sender},{apikey}
 */
export async function sendSms(to, text) {
  const { provider, apiUrl, userId, apiKey, senderId, httpMethod } = env.sms

  if (provider === 'dev' || !apiUrl) {
    console.log(`\n[SMS →${to}] ${text}\n`)
    return { ok: true, provider: 'dev' }
  }

  if (provider === 'ozonesender') {
    const recipient = toMsisdn(to)
    try {
      const res = await axios.get(apiUrl, {
        params: {
          user_id: userId,
          api_key: apiKey,
          sender_id: senderId,
          recipient_contact_no: recipient,
          message: text,
        },
        validateStatus: () => true,
      })
      // Gateway returns HTTP 204 on success (or a JSON body with status:success).
      const ok = res.status === 204 || res.status === 200 || res.data?.status === 'success'
      if (!ok) console.error('[SMS] ozonesender failed:', res.status, res.data)
      return { ok, provider: 'ozonesender', status: res.status }
    } catch (err) {
      console.error('[SMS] ozonesender error:', err.message)
      return { ok: false, provider: 'ozonesender', error: err.message }
    }
  }

  if (provider === 'http') {
    const fill = (s) =>
      s
        .replaceAll('{to}', encodeURIComponent(to))
        .replaceAll('{text}', encodeURIComponent(text))
        .replaceAll('{sender}', encodeURIComponent(senderId))
        .replaceAll('{apikey}', encodeURIComponent(apiKey))

    try {
      if (httpMethod === 'POST') {
        const res = await axios.post(apiUrl, {
          to,
          message: text,
          sender: senderId,
          api_key: apiKey,
        })
        return { ok: true, provider: 'http', status: res.status }
      }
      const res = await axios.get(fill(apiUrl))
      return { ok: true, provider: 'http', status: res.status }
    } catch (err) {
      console.error('[SMS] send failed:', err.message)
      return { ok: false, provider: 'http', error: err.message }
    }
  }

  console.warn(`[SMS] unknown provider "${provider}" — message not sent`)
  return { ok: false, provider }
}
