import crypto from 'node:crypto'
import env from '../config/env.js'

/**
 * PayHere redirect-checkout helpers.
 *
 * Flow: backend builds signed checkout params -> browser POSTs them to PayHere's
 * hosted page -> customer pays -> PayHere calls our `notify_url` server-to-server
 * (this is the source of truth) and redirects the browser to `return_url`.
 *
 * The `hash`/`md5sig` scheme is PayHere's:
 *   startHash = MD5(merchant_id + order_id + amount + currency + MD5(secret))   (upper-cased)
 *   md5sig    = MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(secret))
 */

const md5 = (s) => crypto.createHash('md5').update(String(s)).digest('hex')
const up = (s) => s.toUpperCase()

export const payhere = {
  isConfigured: () => Boolean(env.payhere.merchantId && env.payhere.merchantSecret),
  mode: () => (env.payhere.mode === 'live' ? 'live' : 'sandbox'),
  checkoutUrl: () =>
    env.payhere.mode === 'live'
      ? 'https://www.payhere.lk/pay/checkout'
      : 'https://sandbox.payhere.lk/pay/checkout',

  /** PayHere wants the amount with 2 decimals and no thousand separators. */
  formatAmount: (n) => Number(n).toFixed(2),

  startHash(orderId, amountStr, currency = 'LKR') {
    const secretMd5 = up(md5(env.payhere.merchantSecret))
    return up(md5(env.payhere.merchantId + orderId + amountStr + currency + secretMd5))
  },

  /** Verify a notify callback's md5sig against our secret. */
  verifyNotify(b) {
    if (!b || !b.md5sig) return false
    const secretMd5 = up(md5(env.payhere.merchantSecret))
    const local = up(
      md5(
        String(b.merchant_id) +
          String(b.order_id) +
          String(b.payhere_amount) +
          String(b.payhere_currency) +
          String(b.status_code) +
          secretMd5
      )
    )
    return local === String(b.md5sig).toUpperCase()
  },
}

export default payhere
