import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext.jsx'
import { Field } from '../../components/ui.jsx'
import AuthShell from './AuthShell.jsx'

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('request') // 'request' | 'reset'
  const [phone, setPhone] = useState('')
  const [f, setF] = useState({ code: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const requestCode = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await forgotPassword(phone.trim())
      setNote(res.devCode ? `Dev code: ${res.devCode}` : 'If that number is registered, an OTP has been sent.')
      setStep('reset')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const doReset = async (e) => {
    e.preventDefault()
    setError('')
    if (f.password !== f.confirmPassword) return setError('Passwords do not match')
    setBusy(true)
    try {
      await resetPassword({
        phone: phone.trim(), code: f.code.trim(),
        password: f.password, confirmPassword: f.confirmPassword,
      })
      navigate('/login', { replace: true, state: { flash: 'Password updated. Please sign in.' } })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle={step === 'request' ? 'Enter your phone to get a reset code.' : 'Enter the code and your new password.'}
      footer={<Link to="/login">Back to sign in</Link>}
    >
      {step === 'request' ? (
        <form onSubmit={requestCode} className="col" style={{ gap: 14 }}>
          {error && <div className="auth-error">{error}</div>}
          <Field label="Phone">
            <input className="input" autoFocus placeholder="07XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <button className="btn btn-primary btn-block btn-lg" disabled={busy || !phone}>
            {busy ? 'Sending…' : 'Send reset code'}
          </button>
        </form>
      ) : (
        <form onSubmit={doReset} className="col" style={{ gap: 13 }}>
          {error && <div className="auth-error">{error}</div>}
          {note && <div className="auth-note">{note}</div>}
          <Field label="Reset code">
            <input className="input" value={f.code} onChange={set('code')} placeholder="6-digit code" />
          </Field>
          <Field label="New password">
            <input className="input" type="password" value={f.password} onChange={set('password')} placeholder="Min 8 characters" />
          </Field>
          <Field label="Confirm new password">
            <input className="input" type="password" value={f.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" />
          </Field>
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
