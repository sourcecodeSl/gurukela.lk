import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext.jsx'
import { api } from '../../api/client.js'
import { Field, Spinner, PasswordInput } from '../../components/ui.jsx'
import AuthShell from './AuthShell.jsx'

const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'O/L', 'A/L']
const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Rev']
// O/L / A/L students pick the year they sit the exam: this year through +4.
const EXAM_YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i)

export default function Register() {
  const { registerStudent, registerInstructor } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [subjects, setSubjects] = useState([])
  const [f, setF] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    birthday: '', grade: '', examYear: '', title: '', subjectIds: [],
  })
  const [agree, setAgree] = useState(false)
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

  // Required fields that gate the "Create account" button's active look. These
  // mirror the submit() validation below so the button only turns green once a
  // click will actually succeed — it stays clickable while grey so pressing it
  // surfaces the specific error (e.g. unchecked Terms).
  const requiredReady =
    f.name.trim() &&
    f.email.trim() &&
    f.phone.trim() &&
    f.password.length >= 8 &&
    f.confirmPassword &&
    f.password === f.confirmPassword &&
    agree

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!f.name.trim()) return setError('Please enter your full name')
    if (!f.email.trim()) return setError('Please enter your email')
    if (!f.phone.trim()) return setError('Please enter your phone number')
    if (f.password.length < 8) return setError('Password must be at least 8 characters')
    if (f.password !== f.confirmPassword) return setError('Passwords do not match')
    if (!agree) return setError('Please accept the Terms & Conditions, Privacy Policy and Refund Policy to continue')
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
          examYear: f.examYear || undefined,
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
                <select
                  className="select"
                  value={f.grade}
                  onChange={(e) => {
                    const grade = e.target.value
                    // Exam year only applies to O/L / A/L — clear it otherwise.
                    setF((s) => ({
                      ...s,
                      grade,
                      examYear: grade === 'O/L' || grade === 'A/L' ? s.examYear : '',
                    }))
                  }}
                >
                  <option value="">Select…</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </Field>
            </div>
            {(f.grade === 'O/L' || f.grade === 'A/L') && (
              <Field label={`${f.grade} exam year`} hint="The year you'll sit the exam">
                <select className="select" value={f.examYear} onChange={set('examYear')}>
                  <option value="">Select…</option>
                  {EXAM_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </Field>
            )}
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
          <Field label="Title" hint="How you'd like to be addressed">
            <select className="select" value={f.title} onChange={set('title')}>
              <option value="">Select…</option>
              {TITLES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        )}

        <div className="row" style={{ gap: 12 }}>
          <Field label="Password">
            <PasswordInput value={f.password} onChange={set('password')} placeholder="Min 8 characters" />
          </Field>
          <Field label="Confirm password">
            <PasswordInput value={f.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" />
          </Field>
        </div>

        <label className="auth-agree">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            I have read and agree to the{' '}
            <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</Link>,{' '}
            <Link to="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link> and{' '}
            <Link to="/refund" target="_blank" rel="noopener noreferrer">Refund Policy</Link>.
          </span>
        </label>

        <button
          className={`btn btn-block btn-lg ${requiredReady ? 'btn-primary' : 'btn-muted'}`}
          disabled={busy}
        >
          {busy ? <><Spinner /> Creating account…</> : 'Create account'}
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
