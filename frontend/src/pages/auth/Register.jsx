import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext.jsx'
import { api } from '../../api/client.js'
import { Field } from '../../components/ui.jsx'
import AuthShell from './AuthShell.jsx'

const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'O/L', 'A/L']

export default function Register() {
  const { registerStudent, registerInstructor } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [subjects, setSubjects] = useState([])
  const [f, setF] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    birthday: '', grade: '', title: '', subjectIds: [],
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get('/subjects', { auth: false }).then(setSubjects).catch(() => setSubjects([]))
  }, [])

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const toggleSubject = (id) =>
    setF((s) => ({
      ...s,
      subjectIds: s.subjectIds.includes(id)
        ? s.subjectIds.filter((x) => x !== id)
        : [...s.subjectIds, id],
    }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (f.password !== f.confirmPassword) return setError('Passwords do not match')
    if (f.password.length < 8) return setError('Password must be at least 8 characters')
    setBusy(true)
    try {
      const payload = {
        name: f.name, email: f.email.trim(), phone: f.phone.trim(),
        password: f.password, confirmPassword: f.confirmPassword,
      }
      let res
      if (role === 'student') {
        res = await registerStudent({
          ...payload, birthday: f.birthday || undefined, grade: f.grade || undefined,
          subjectIds: f.subjectIds,
        })
      } else {
        res = await registerInstructor({ ...payload, title: f.title || undefined })
      }
      navigate('/verify', { state: { phone: res.phone, devCode: res.devCode } })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="We'll send an SMS code to verify your phone."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <div className="auth-toggle">
        <button
          type="button"
          className={`auth-toggle-btn ${role === 'student' ? 'on' : ''}`}
          onClick={() => setRole('student')}
        >
          I'm a student
        </button>
        <button
          type="button"
          className={`auth-toggle-btn ${role === 'instructor' ? 'on' : ''}`}
          onClick={() => setRole('instructor')}
        >
          I'm an instructor
        </button>
      </div>

      <form onSubmit={submit} className="col" style={{ gap: 13 }}>
        {error && <div className="auth-error">{error}</div>}
        <Field label="Full name">
          <input className="input" value={f.name} onChange={set('name')} placeholder="Your name" />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={f.email} onChange={set('email')} placeholder="you@example.lk" />
        </Field>
        <Field label="Phone" hint="Sri Lankan mobile, e.g. 07XXXXXXXX">
          <input className="input" value={f.phone} onChange={set('phone')} placeholder="07XXXXXXXX" />
        </Field>

        {role === 'student' ? (
          <>
            <div className="row" style={{ gap: 12 }}>
              <Field label="Birthday">
                <input className="input" type="date" value={f.birthday} onChange={set('birthday')} />
              </Field>
              <Field label="Grade">
                <select className="select" value={f.grade} onChange={set('grade')}>
                  <option value="">Select…</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </Field>
            </div>
            {subjects.length > 0 && (
              <Field label="Subjects you're interested in">
                <div className="chip-grid">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`chip ${f.subjectIds.includes(s.id) ? 'on' : ''}`}
                      onClick={() => toggleSubject(s.id)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </Field>
            )}
          </>
        ) : (
          <Field label="Title / speciality">
            <input className="input" value={f.title} onChange={set('title')} placeholder="e.g. Physics Specialist" />
          </Field>
        )}

        <div className="row" style={{ gap: 12 }}>
          <Field label="Password">
            <input className="input" type="password" value={f.password} onChange={set('password')} placeholder="Min 8 characters" />
          </Field>
          <Field label="Confirm password">
            <input className="input" type="password" value={f.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" />
          </Field>
        </div>

        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        {role === 'instructor' && (
          <p className="tiny faint" style={{ textAlign: 'center' }}>
            After phone verification your account is reviewed by an admin before going live.
          </p>
        )}
      </form>
    </AuthShell>
  )
}
