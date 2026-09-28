import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client.js'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Field, SkeletonCard, Spinner, fmtDate, money } from '../../components/ui.jsx'
import { QrCode, Bank, Upload, Check, X, Shield, Wallet, Card as CardIcon } from '../../components/icons.jsx'

// Every method the checkout can offer, with the copy admins see here.
const ALL_METHODS = [
  { id: 'payhere', label: 'PayHere', icon: Shield, hint: 'Card · eZ Cash · online banking (auto-confirmed)' },
  { id: 'qr', label: 'LankaQR', icon: QrCode, hint: 'Scan & pay — verified manually' },
  { id: 'bank', label: 'Bank transfer', icon: Bank, hint: 'Direct deposit — verified manually' },
  { id: 'card', label: 'Card (demo)', icon: CardIcon, hint: 'Simulated — for testing only' },
  { id: 'wallet', label: 'Wallet (demo)', icon: Wallet, hint: 'Simulated — for testing only' },
]

/**
 * Admin: configure the manual payment details students see (LankaQR image +
 * bank account text) and verify the offline payments they submit.
 */
export default function PayMethods() {
  const app = useApp()
  const [qrUrl, setQrUrl] = useState(null)
  const [bankDetails, setBankDetails] = useState('')
  const [enabledMethods, setEnabledMethods] = useState(ALL_METHODS.map((m) => m.id))
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploadingQr, setUploadingQr] = useState(false)
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const fileRef = useRef(null)

  const loadSettings = () =>
    api.get('/admin/payment-settings').then((s) => {
      setQrUrl(s.qrUrl || null)
      setBankDetails(s.bankDetails || '')
      if (Array.isArray(s.enabledMethods)) setEnabledMethods(s.enabledMethods)
    })
  const loadClaims = () =>
    api.get('/admin/manual-payments').then((rows) => setClaims(rows || []))

  useEffect(() => {
    Promise.all([loadSettings(), loadClaims()])
      .catch((e) => app.toast(e.message || 'Failed to load', 'err'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      await api.put('/admin/payment-settings', { qrUrl: qrUrl || '', bankDetails, enabledMethods })
      app.toast('Payment details saved')
    } catch (e) {
      app.toast(e.message || 'Could not save', 'err')
    } finally {
      setSavingSettings(false)
    }
  }

  const toggleMethod = (id) =>
    setEnabledMethods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )

  const uploadQr = async (file) => {
    if (!file) return
    setUploadingQr(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { url } = await api.upload('/admin/payment-settings/qr', fd)
      setQrUrl(url)
      app.toast('QR uploaded — remember to save')
    } catch (e) {
      app.toast(e.message || 'Upload failed', 'err')
    } finally {
      setUploadingQr(false)
    }
  }

  const decide = async (claim, action) => {
    if (action === 'reject' && !window.confirm('Reject this payment? The student will not be enrolled.')) return
    setBusyId(claim.id)
    try {
      await api.post(`/admin/manual-payments/${claim.id}/${action}`)
      app.toast(action === 'approve' ? 'Approved & student enrolled' : 'Payment rejected')
      await loadClaims()
      if (action === 'approve') app.refresh() // refresh enrollments/payments elsewhere
    } catch (e) {
      app.toast(e.message || 'Action failed', 'err')
    } finally {
      setBusyId(null)
    }
  }

  const pending = claims.filter((c) => c.status === 'pending')
  const decided = claims.filter((c) => c.status !== 'pending')

  return (
    <>
      <div className="page-head">
        <h1>Payment methods</h1>
        <p className="sub">Set the LankaQR &amp; bank details students pay to, and verify offline payments.</p>
      </div>

      <Card className="col" style={{ gap: 14, marginBottom: 22 }}>
        <div className="row" style={{ gap: 8 }}>
          <Wallet width={18} height={18} className="accent" />
          <b>Available methods</b>
        </div>
        <p className="small muted" style={{ marginTop: -6 }}>
          Turn a method on to offer it at checkout. The “demo” methods are for testing only and
          don’t take a real payment — leave them off in production.
        </p>
        <div className="col" style={{ gap: 10 }}>
          {ALL_METHODS.map((m) => {
            const on = enabledMethods.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMethod(m.id)}
                className="row"
                style={{
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 'var(--r)',
                  border: '1px solid',
                  borderColor: on ? 'var(--accent)' : 'var(--border)',
                  background: on ? 'var(--accent-soft)' : 'var(--surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <m.icon width={19} height={19} className={on ? 'accent' : 'faint'} style={{ flex: 'none' }} />
                <div className="col" style={{ gap: 2, flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{m.label}</span>
                  <span className="tiny faint">{m.hint}</span>
                </div>
                <Badge tone={on ? 'success' : ''}>{on ? 'Active' : 'Inactive'}</Badge>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-2" style={{ marginBottom: 22, alignItems: 'start' }}>
        <Card className="col" style={{ gap: 14 }}>
          <div className="row" style={{ gap: 8 }}>
            <QrCode width={18} height={18} className="accent" />
            <b>LankaQR code</b>
          </div>
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="Payment QR"
              style={{ width: 190, height: 190, objectFit: 'contain', background: '#fff', borderRadius: 10, padding: 8, border: '1px solid var(--border)' }}
            />
          ) : (
            <Empty icon={QrCode} title="No QR uploaded yet">Upload the “My QR” image from your bank app.</Empty>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => uploadQr(e.target.files?.[0])}
          />
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={uploadingQr} style={{ gap: 7 }}>
              <Upload width={15} height={15} />
              {uploadingQr ? <><Spinner /> Uploading…</> : qrUrl ? 'Replace image' : 'Upload image'}
            </button>
            {qrUrl && (
              <button className="btn btn-ghost" onClick={() => setQrUrl(null)}>
                Remove
              </button>
            )}
          </div>
        </Card>

        <Card className="col" style={{ gap: 14 }}>
          <div className="row" style={{ gap: 8 }}>
            <Bank width={18} height={18} className="accent" />
            <b>Bank transfer details</b>
          </div>
          <Field label="Account details" hint="Shown exactly as typed. Include bank, branch, account name & number.">
            <textarea
              className="input"
              rows={7}
              placeholder={'Bank: Commercial Bank\nBranch: Colombo\nName: T R Maduwantha\nAccount No: 1234567890'}
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              style={{ resize: 'vertical', lineHeight: 1.5 }}
            />
          </Field>
        </Card>
      </div>

      <div className="row" style={{ marginBottom: 26 }}>
        <button className="btn btn-primary" onClick={saveSettings} disabled={savingSettings}>
          {savingSettings ? <><Spinner /> Saving…</> : 'Save payment details'}
        </button>
      </div>

      <div className="page-head">
        <h2 style={{ fontSize: 19 }}>
          Payments to verify {pending.length > 0 && <Badge tone="warning">{pending.length} pending</Badge>}
        </h2>
      </div>

      {loading ? (
        <div className="col" style={{ gap: 12 }}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      ) : pending.length === 0 ? (
        <Card><Empty icon={Check} title="Nothing to verify" >All offline payments have been handled.</Empty></Card>
      ) : (
        <div className="col" style={{ gap: 12 }}>
          {pending.map((c) => (
            <ClaimCard key={c.id} claim={c} busy={busyId === c.id} onDecide={decide} />
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <>
          <div className="page-head" style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 19 }}>History</h2>
          </div>
          <Card pad={false}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Student</th><th>Paid for</th><th>Method</th><th>Amount</th><th>Ref</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {decided.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="row" style={{ gap: 10 }}>
                          <Avatar name={c.studentName} hue={c.studentHue} size={28} />
                          <span className="small" style={{ fontWeight: 600 }}>{c.studentName}</span>
                        </div>
                      </td>
                      <td className="small truncate" style={{ maxWidth: 200 }}>{c.label}</td>
                      <td className="small muted" style={{ textTransform: 'uppercase' }}>{c.method}</td>
                      <td className="bold">{money(c.amount)}</td>
                      <td className="small muted">{c.reference || '—'}</td>
                      <td><Badge tone={c.status === 'approved' ? 'success' : 'danger'}>{c.status}</Badge></td>
                      <td className="small muted">{fmtDate(c.reviewedAt || c.createdAt, { day: 'numeric', month: 'short' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  )
}

function ClaimCard({ claim, busy, onDecide }) {
  return (
    <Card className="row wrap" style={{ gap: 16, alignItems: 'flex-start' }}>
      {claim.slipUrl ? (
        <a href={claim.slipUrl} target="_blank" rel="noreferrer" style={{ flex: 'none' }}>
          <img
            src={claim.slipUrl}
            alt="Payment slip"
            style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
          />
        </a>
      ) : (
        <div
          className="row"
          style={{ flex: 'none', width: 96, height: 96, justifyContent: 'center', borderRadius: 10, border: '1px dashed var(--border)', color: 'var(--muted)' }}
        >
          {claim.method === 'qr' ? <QrCode width={26} height={26} /> : <Bank width={26} height={26} />}
        </div>
      )}

      <div className="col" style={{ gap: 6, flex: '1 1 220px' }}>
        <div className="row" style={{ gap: 8 }}>
          <Avatar name={claim.studentName} hue={claim.studentHue} size={26} />
          <b>{claim.studentName}</b>
          <Badge tone="accent" style={{ textTransform: 'uppercase' }}>{claim.method}</Badge>
        </div>
        <div className="small">{claim.label}</div>
        <div className="small muted">
          {money(claim.amount)} · Ref: <b>{claim.reference || '—'}</b>
        </div>
        <div className="tiny faint">Submitted {fmtDate(claim.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      <div className="row" style={{ gap: 8, flex: 'none' }}>
        <button className="btn btn-ghost" onClick={() => onDecide(claim, 'reject')} disabled={busy} style={{ gap: 6 }}>
          <X width={15} height={15} /> Reject
        </button>
        <button className="btn btn-primary" onClick={() => onDecide(claim, 'approve')} disabled={busy} style={{ gap: 6 }}>
          {busy ? <Spinner /> : <Check width={15} height={15} />} {busy ? 'Working…' : 'Approve'}
        </button>
      </div>
    </Card>
  )
}
