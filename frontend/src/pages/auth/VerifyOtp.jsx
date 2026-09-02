import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext.jsx'
import { Field } from '../../components/ui.jsx'
import AuthShell from './AuthShell.jsx'

export default function VerifyOtp() {
  const { verifyPhone, resendOtp } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const phone = state?.phone
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(state?.devCode ? `Dev code: ${state.devCode}` : '')

  // No phone in navigation state → nothing to verify.
  if (!phone) return <Navigate to="/login" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await verifyPhone({ phone, code: code.trim() })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setError('')
    try {
      const res = await resendOtp(phone)
      setNote(res.devCode ? `New dev code: ${res.devCode}` : 'A new code has been sent.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthShell
      title="Verify your phone"
      subtitle={`Enter the code we sent to ${phone}.`}
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <form onSubmit={submit} className="col" style={{ gap: 14 }}>
        {error && <div className="auth-error">{error}</div>}
        {note && <div className="auth-note">{note}</div>}
        <Field label="Verification code">
          <input
            className="input"
            inputMode="numeric"
            autoFocus
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ letterSpacing: 4, fontSize: 18, textAlign: 'center' }}
          />
        </Field>
        <button className="btn btn-primary btn-block btn-lg" disabled={busy || code.length < 4}>
          {busy ? 'Verifying…' : 'Verify & continue'}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={resend}>
          Resend code
        </button>
      </form>
    </AuthShell>
  )
}
