import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { Modal, Field, money } from './ui.jsx'
import { Card as CardIcon, Wallet, Shield, Check } from './icons.jsx'

const METHODS = [
  { id: 'payhere', label: 'PayHere', icon: Shield, hint: 'Card · eZ Cash · banking' },
  { id: 'card', label: 'Card (demo)', icon: CardIcon, hint: 'Simulated' },
  { id: 'wallet', label: 'Wallet (demo)', icon: Wallet, hint: 'Simulated' },
]

/**
 * Checkout sheet used by both booking flows.
 *
 * - PayHere (default): if `payFor` = { kind:'slot'|'group', id } is given, submit
 *   asks the backend for signed checkout params and redirects to PayHere's
 *   hosted page. The booking is confirmed by the server-side notify callback.
 * - Other (demo) methods fall back to `onConfirm(method)` for local testing.
 */
export default function PaymentModal({ open, onClose, onConfirm, payFor, title, lines = [], total, cta = 'Pay now', warning }) {
  const [method, setMethod] = useState('payhere')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState({ payhere: { available: false, mode: 'sandbox' } })

  useEffect(() => {
    if (!open) return
    let alive = true
    api.get('/payments/config').then((c) => alive && c && setConfig(c)).catch(() => {})
    return () => { alive = false }
  }, [open])

  const payhereReady = config.payhere?.available && payFor

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      if (method === 'payhere') {
        if (!payhereReady) {
          throw new Error(
            config.payhere?.available
              ? 'This item cannot be paid via PayHere.'
              : 'PayHere is not configured yet. Add your Merchant ID/Secret to the backend .env.'
          )
        }
        const { action, params } = await api.post('/payments/payhere/start', payFor)
        redirectToPayHere(action, params) // leaves the SPA
        return
      }
      // demo methods
      await new Promise((r) => setTimeout(r, 650))
      onConfirm?.(method)
    } catch (e) {
      setBusy(false)
      setError(e.message || 'Payment could not be started')
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title={title || 'Complete payment'}
      subtitle="Your seat is confirmed the moment the payment succeeds."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? 'Processing…' : `${cta} · ${money(total)}`}
          </button>
        </>
      }
    >
      {warning && (
        <div
          className="row"
          style={{
            alignItems: 'flex-start',
            gap: 9,
            background: 'var(--warning-soft)',
            color: 'var(--warning)',
            padding: '10px 12px',
            borderRadius: 'var(--r)',
            marginBottom: 16,
            fontSize: 12.8,
            fontWeight: 500,
          }}
        >
          <Shield width={16} height={16} style={{ flex: 'none', marginTop: 1 }} />
          <span>{warning}</span>
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        {lines.map((l) => (
          <div key={l.label} className="row" style={{ padding: '7px 0' }}>
            <span className="muted small" style={{ flex: 1 }}>{l.label}</span>
            <span className="small bold">{l.value}</span>
          </div>
        ))}
        <hr className="divider" style={{ margin: '9px 0' }} />
        <div className="row" style={{ padding: '4px 0' }}>
          <span style={{ flex: 1, fontWeight: 600 }}>Total</span>
          <span style={{ fontSize: 19, fontWeight: 800 }}>{money(total)}</span>
        </div>
      </div>

      <Field label="Payment method">
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className="card card-pad"
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                borderColor: method === m.id ? 'var(--accent)' : 'var(--border)',
                background: method === m.id ? 'var(--accent-soft)' : 'var(--surface)',
                padding: 13,
              }}
            >
              <div className="row" style={{ marginBottom: 4 }}>
                <m.icon width={17} height={17} className={method === m.id ? 'accent' : 'faint'} />
                {method === m.id && <Check width={15} height={15} className="accent" style={{ marginLeft: 'auto' }} />}
              </div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</div>
              <div className="tiny faint">{m.hint}</div>
            </button>
          ))}
        </div>
      </Field>

      {method === 'payhere' && (
        <div
          className="col"
          style={{ gap: 8, marginTop: 14, padding: 14, borderRadius: 'var(--r)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}
        >
          <div className="row" style={{ gap: 8 }}>
            <Shield width={17} height={17} className="accent" />
            <b style={{ fontSize: 13.5 }}>Secure payment via PayHere</b>
            {config.payhere?.mode === 'sandbox' && <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>Sandbox</span>}
          </div>
          <p className="tiny muted">
            You'll be redirected to PayHere's secure page to pay with any Visa/Mastercard, eZ&nbsp;Cash or online banking.
            Your booking confirms automatically once payment succeeds.
          </p>
        </div>
      )}

      {method === 'card' && (
        <div className="grid" style={{ gap: 12, marginTop: 14 }}>
          <Field label="Card number">
            <input className="input" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" />
          </Field>
          <div className="row" style={{ gap: 12 }}>
            <Field label="Expiry">
              <input className="input" placeholder="MM/YY" defaultValue="12/28" />
            </Field>
            <Field label="CVC">
              <input className="input" placeholder="123" defaultValue="123" />
            </Field>
          </div>
        </div>
      )}

      {method === 'wallet' && (
        <div style={{ marginTop: 14 }}>
          <Field label="Mobile number" hint="You will receive a confirmation PIN by SMS.">
            <input className="input" placeholder="07X XXX XXXX" defaultValue="077 123 4567" />
          </Field>
        </div>
      )}

      {error && (
        <div className="auth-error" style={{ marginTop: 14 }}>{error}</div>
      )}

      <p className="tiny faint row" style={{ marginTop: 16, gap: 6 }}>
        <Shield width={13} height={13} />
        {method === 'payhere'
          ? config.payhere?.mode === 'live'
            ? 'Payments are processed securely by PayHere.'
            : 'PayHere sandbox: use a test card, no real money is charged.'
          : 'Demo method: no real payment is processed.'}
      </p>
    </Modal>
  )
}

/** Build a hidden form and POST it to PayHere, which navigates away. */
function redirectToPayHere(action, params) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = action
  Object.entries(params).forEach(([name, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value == null ? '' : String(value)
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}
