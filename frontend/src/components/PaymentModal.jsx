import { useState } from 'react'
import { Modal, Field, money } from './ui.jsx'
import { Card as CardIcon, Wallet, Shield, Check } from './icons.jsx'

const METHODS = [
  { id: 'card', label: 'Card', icon: CardIcon, hint: 'Visa / Mastercard' },
  { id: 'wallet', label: 'Mobile wallet', icon: Wallet, hint: 'eZ Cash / mCash' },
]

/**
 * Checkout sheet used by both booking flows.
 * `onConfirm(method)` is where the real payment gateway would be called;
 * here it resolves after a short simulated round trip.
 */
export default function PaymentModal({ open, onClose, onConfirm, title, lines = [], total, cta = 'Pay now', warning }) {
  const [method, setMethod] = useState('card')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    await new Promise((r) => setTimeout(r, 650))
    setBusy(false)
    onConfirm(method)
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
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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

      <p className="tiny faint row" style={{ marginTop: 16, gap: 6 }}>
        <Shield width={13} height={13} />
        Demo checkout — no real payment is processed.
      </p>
    </Modal>
  )
}
