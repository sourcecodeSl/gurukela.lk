import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext.jsx'
import { Field } from '../../components/ui.jsx'
import AuthShell from './AuthShell.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login({ identifier: identifier.trim(), password })
      navigate('/', { replace: true })
    } catch (err) {
      // Unverified phone → send them to the OTP screen.
      if (err.status === 403 && err.data?.requiresVerification) {
        navigate('/verify', { state: { phone: err.data.phone, devCode: err.data.devCode } })
        return
      }
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your email or phone number."
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form onSubmit={submit} className="col" style={{ gap: 14 }}>
        {error && <div className="auth-error">{error}</div>}
        <Field label="Email or phone">
          <input
            className="input"
            autoFocus
            placeholder="you@example.lk or 07XXXXXXXX"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: -6 }}>
          <Link to="/forgot" className="small">
            Forgot password?
          </Link>
        </div>
        <button className="btn btn-primary btn-block btn-lg" disabled={busy || !identifier || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  )
}
