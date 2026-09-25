import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client.js'
import { useApp } from '../store/AppContext.jsx'
import { Modal, Field, Spinner, money } from './ui.jsx'
import { Card as CardIcon, Wallet, Shield, Check, QrCode, Bank, Upload, Copy, Info } from './icons.jsx'

const BASE_METHODS = [
  { id: 'payhere', label: 'PayHere', icon: Shield, hint: 'Card · eZ Cash · banking' },
  { id: 'qr', label: 'LankaQR', icon: QrCode, hint: 'Scan & pay' },
  { id: 'bank', label: 'Bank transfer', icon: Bank, hint: 'Direct deposit' },
  { id: 'card', label: 'Card (demo)', icon: CardIcon, hint: 'Simulated' },
  { id: 'wallet', label: 'Wallet (demo)', icon: Wallet, hint: 'Simulated' },
]

/**
 * Checkout sheet used by both booking flows.
 *
 * - PayHere: redirects to the hosted page; the booking confirms via the
 *   server-side notify callback.
 * - LankaQR / Bank transfer (manual): the student pays offline, then submits a
 *   reference + optional slip. The claim stays pending until an admin verifies
 *   it — so these do NOT call `onConfirm`; they show a "submitted" state.
 * - Card / Wallet (demo) fall back to `onConfirm(method)` for local testing.
 */
export default function PaymentModal({ open, onClose, onConfirm, onSubmitted, payFor, title, lines = [], total, cta = 'Pay now', warning }) {
  const app = useApp()
  const myCode = app.me?.code || app.session?.id || ''
  const [method, setMethod] = useState('payhere')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState('')
  const [slip, setSlip] = useState(null)
  const [config, setConfig] = useState({ payhere: { available: false, mode: 'sandbox' }, manual: { available: false } })
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setSubmitted(false)
    setReference('')
    setSlip(null)
    setError('')
    let alive = true
    api.get('/payments/config').then((c) => alive && c && setConfig(c)).catch(() => {})
    return () => { alive = false }
  }, [open])

  const payhereReady = config.payhere?.available && payFor
  const manual = config.manual || {}
  const methods = BASE_METHODS.filter((m) => (m.id === 'qr' || m.id === 'bank' ? manual.available : true))

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
      if (method === 'qr' || method === 'bank') {
        if (!payFor) throw new Error('This item cannot be paid this way.')
        const fd = new FormData()
        fd.append('kind', payFor.kind)
        fd.append('id', payFor.id)
        fd.append('method', method)
        fd.append('reference', reference.trim())
        if (slip) fd.append('slip', slip)
        await api.upload('/payments/manual/submit', fd)
        setBusy(false)
        setSubmitted(true)
        // Let the caller reload so the booking immediately reflects the pending
        // claim ("under verification") instead of still offering "Pay now".
        onSubmitted?.(method)
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

  const isManual = method === 'qr' || method === 'bank'

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title={title || 'Complete payment'}
      subtitle={
        submitted
          ? 'We will confirm your seat as soon as the payment is verified.'
          : 'Your seat is confirmed the moment the payment succeeds.'
      }
      footer={
        submitted ? (
          <button className="btn btn-primary" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Done
          </button>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              {busy ? <><Spinner /> Processing…</> : isManual ? `I've paid · ${money(total)}` : `${cta} · ${money(total)}`}
            </button>
          </>
        )
      }
    >
      {submitted ? (
        <div className="col" style={{ alignItems: 'center', textAlign: 'center', gap: 12, padding: '18px 8px' }}>
          <div
            className="row"
            style={{ justifyContent: 'center', width: 54, height: 54, borderRadius: '50%', background: 'var(--success-soft, #e6f7ee)', color: 'var(--success, #16a34a)' }}
          >
            <Check width={26} height={26} />
          </div>
          <b style={{ fontSize: 16 }}>Payment submitted for verification</b>
          <p className="small muted" style={{ maxWidth: 320 }}>
            Thanks! Our team will check your {method === 'qr' ? 'LankaQR' : 'bank transfer'} payment
            and confirm your seat shortly. You'll see it in your bookings once approved.
          </p>
        </div>
      ) : (
        <>
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
            <div className="grid stack-mobile" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {methods.map((m) => (
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

          {isManual && (
            <ManualPay
              method={method}
              manual={manual}
              total={total}
              myCode={myCode}
              onCopyCode={() => app.toast('Student ID copied')}
              reference={reference}
              setReference={setReference}
              slip={slip}
              setSlip={setSlip}
              fileRef={fileRef}
            />
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
              : isManual
                ? 'Your seat is held until an admin verifies your payment.'
                : 'Demo method: no real payment is processed.'}
          </p>
        </>
      )}
    </Modal>
  )
}

/** LankaQR / bank-transfer instructions + proof-of-payment inputs. */
function ManualPay({ method, manual, total, myCode, onCopyCode, reference, setReference, slip, setSlip, fileRef }) {
  const copyBank = () => {
    if (manual.bankDetails) navigator.clipboard?.writeText(manual.bankDetails).catch(() => {})
  }
  const copyCode = () => {
    if (!myCode) return
    navigator.clipboard?.writeText(myCode).then(() => onCopyCode?.()).catch(() => {})
  }
  return (
    <div className="col" style={{ gap: 12, marginTop: 14 }}>
      {myCode && (
        <div
          className="row"
          style={{
            alignItems: 'flex-start', gap: 9, padding: '11px 12px', borderRadius: 'var(--r)',
            background: 'var(--warning-soft)', color: 'var(--warning)', fontSize: 12.8, fontWeight: 500,
          }}
        >
          <Info width={16} height={16} style={{ flex: 'none', marginTop: 1 }} />
          <div className="col" style={{ gap: 6, flex: 1 }}>
            <span>
              Important: add your Student ID as the payment <b>description / reference</b> on the slip so we can
              match it to your account.
            </span>
            <button
              type="button"
              onClick={copyCode}
              title="Click to copy"
              className="row"
              style={{
                alignSelf: 'flex-start', gap: 7, padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                background: 'var(--surface)', border: '1px solid var(--warning)', color: 'var(--warning)', fontWeight: 800,
              }}
            >
              <span style={{ fontSize: 14, letterSpacing: '.02em' }}>{myCode}</span>
              <Copy width={13} height={13} />
            </button>
          </div>
        </div>
      )}
      <div
        className="col"
        style={{ gap: 10, padding: 14, borderRadius: 'var(--r)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}
      >
        {method === 'qr' ? (
          <>
            <div className="row" style={{ gap: 8 }}>
              <QrCode width={17} height={17} className="accent" />
              <b style={{ fontSize: 13.5 }}>Scan &amp; pay {money(total)}</b>
            </div>
            {manual.qrUrl ? (
              <img
                src={manual.qrUrl}
                alt="Payment QR code"
                style={{ width: 200, height: 200, objectFit: 'contain', alignSelf: 'center', background: '#fff', borderRadius: 10, padding: 8 }}
              />
            ) : (
              <p className="tiny muted">The QR code hasn't been set up yet — please use bank transfer.</p>
            )}
            <p className="tiny muted">
              Scan with any bank app or a LankaQR-enabled wallet, pay the exact amount, then enter your
              reference below and click “I've paid”. If your bank app shows a description or note field,
              enter your student number there.
            </p>
          </>
        ) : (
          <>
            <div className="row" style={{ gap: 8 }}>
              <Bank width={17} height={17} className="accent" />
              <b style={{ fontSize: 13.5 }}>Bank transfer</b>
              {manual.bankDetails && (
                <button className="btn btn-ghost btn-sm" onClick={copyBank} style={{ marginLeft: 'auto', gap: 5 }}>
                  <Copy width={13} height={13} /> Copy
                </button>
              )}
            </div>
            {manual.bankDetails ? (
              <pre
                style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.55 }}
              >
                {manual.bankDetails}
              </pre>
            ) : (
              <p className="tiny muted">Bank details haven't been set up yet — please use LankaQR.</p>
            )}
            <p className="tiny muted">
              Transfer {money(total)} to the account above, then enter your reference below and click “I've paid”.
            </p>
          </>
        )}
      </div>

      <Field label="Payment reference" hint="The transaction / reference number from your bank.">
        <input
          className="input"
          placeholder="e.g. 123456789"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </Field>

      <Field label="Upload receipt (optional)" hint="A screenshot or photo of your payment slip speeds up verification.">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => setSlip(e.target.files?.[0] || null)}
        />
        <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} style={{ gap: 7 }}>
          <Upload width={15} height={15} />
          {slip ? slip.name : 'Choose image'}
        </button>
      </Field>
    </div>
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
