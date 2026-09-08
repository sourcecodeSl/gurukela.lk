import axios from 'axios'
import env from '../config/env.js'

/**
 * Dialog Genie payment gateway integration seam.
 *
 * This is the ONE place the platform talks to Dialog. Until a merchant account
 * is wired up (GENIE_API_URL + GENIE_API_KEY in backend/.env) it runs in
 * sandbox mode: `createSession` returns no redirect URL and `verify` reports the
 * payment as paid, so the booking flow is fully testable without a real charge.
 *
 * To go live:
 *   1. Set GENIE_API_URL, GENIE_API_KEY, GENIE_MERCHANT_ID and GENIE_LIVE=true.
 *   2. Confirm the request/response field names below against the Genie Business
 *      API docs for your account and adjust if needed.
 *   3. Point the return URL at a frontend page that calls `/api/payments/genie/verify`
 *      then completes the booking (slot pay / group join).
 */

const configured = () => Boolean(env.genie.apiUrl && env.genie.apiKey)

export const genie = {
  /** Whether a real gateway is wired up (vs sandbox/mock). */
  isConfigured: configured,
  /** 'live' once GENIE_LIVE=true and credentials are present, else 'sandbox'. */
  mode: () => (configured() && env.genie.live ? 'live' : 'sandbox'),

  /**
   * Create a hosted payment session.
   * @returns {Promise<{transactionId:string, redirectUrl:string|null, mock:boolean}>}
   */
  async createSession({ amount, reference, description, customer, returnUrl }) {
    if (!configured()) {
      return { transactionId: `mock-${reference}`, redirectUrl: null, mock: true }
    }
    const { data } = await axios.post(
      `${env.genie.apiUrl.replace(/\/$/, '')}/transactions`,
      {
        merchantId: env.genie.merchantId,
        amount,
        currency: 'LKR',
        reference,
        description,
        customer,
        returnUrl,
      },
      { headers: { Authorization: `Bearer ${env.genie.apiKey}`, 'Content-Type': 'application/json' } }
    )
    return {
      transactionId: data.transactionId || data.id,
      redirectUrl: data.redirectUrl || data.url || data.paymentUrl || null,
      mock: false,
    }
  },

  /**
   * Verify a transaction after the customer returns from the hosted page.
   * @returns {Promise<{paid:boolean, mock?:boolean, raw?:object}>}
   */
  async verify(transactionId) {
    if (!configured() || String(transactionId).startsWith('mock-')) {
      return { paid: true, mock: true }
    }
    const { data } = await axios.get(
      `${env.genie.apiUrl.replace(/\/$/, '')}/transactions/${transactionId}`,
      { headers: { Authorization: `Bearer ${env.genie.apiKey}` } }
    )
    const status = String(data.status || '').toUpperCase()
    return { paid: status === 'SUCCESS' || status === 'PAID' || data.paid === true, raw: data }
  },
}

export default genie
