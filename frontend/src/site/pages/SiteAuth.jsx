/**
 * Public auth — the real thing, talking to the API.
 *
 *   /login                  one page, Student ⇄ Lecturer switch
 *   /register               student sign-up
 *   /lecturer-registration  lecturer sign-up, on its own URL
 *
 * Every path ends the same way: a verified phone yields a JWT, AuthContext
 * flips to 'authed', and App.jsx swaps the marketing site for the LMS. There
 * is no separate "go to the system" step.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api/client.js'
import { useAuth } from '../../store/AuthContext.jsx'
import { Check, Info, Mentor, Shield, Sparkle, Users } from '../art/Icons.jsx'
import { PageBanner, Section, Ticks } from '../components.jsx'
import { site } from '../siteData.js'

const LECTURER_SIGNUP = '/lecturer-registration'

/* ---------------------------------------------------------------- */
/* Shared bits                                                       */
/* ---------------------------------------------------------------- */

function ErrorNote({ children }) {
  if (!children) return null
  return (
    <div className="gk-error" role="alert">
      <Info size={17} />
      <span>{children}</span>
    </div>
  )
}

function Steps({ step }) {
  return (
    <div className="gk-auth-steps" aria-hidden="true">
      <span className="is-on">1</span>
      <i className={step >= 2 ? 'is-on' : undefined} />
      <span className={step >= 2 ? 'is-on' : undefined}>2</span>
    </div>
  )
}

/**
 * Step two of every sign-up: confirm the SMS code.
 *
 * The backend returns the code as `devCode` while SMS_PROVIDER=dev, so it is
 * shown on screen — that block disappears on its own once a real gateway is
 * configured and the field stops coming back.
 */
function OtpStep({ phone, devCode, heading, onBack }) {
  const { verifyPhone, resendOtp } = useAuth()
  const [code, setCode] = useState('')
  const [hint, setHint] = useState(devCode)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      // On success AuthContext stores the token and App re-renders as the LMS.
      await verifyPhone({ phone, code: code.trim() })
    } catch (err) {
      setError(err.message || 'That code was not accepted.')
      setBusy(false)
    }
  }

  const resend = async () => {
    setError('')
    try {
      const res = await resendOtp(phone)
      setHint(res.devCode)
    } catch (err) {
      setError(err.message || 'Could not send a new code.')
    }
  }

  return (
    <form className="gk-card gk-form" onSubmit={submit} noValidate>
      <Steps step={2} />
      <div>
        <h2 style={{ fontSize: 24 }}>{heading}</h2>
        <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14.5 }}>
          We sent a code by SMS to <b>{phone}</b>. Enter it to finish.
        </p>
      </div>

      <ErrorNote>{error}</ErrorNote>

      {hint && (
        <div className="gk-devcode">
          <Info size={17} />
          <span>
            Development mode — your code is <b>{hint}</b>
          </span>
        </div>
      )}

      <div className="gk-field">
        <label htmlFor="otp">Verification code</label>
        <input
          id="otp"
          className="gk-otp"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="······"
        />
      </div>

      <button type="submit" className="gk-btn gk-btn--primary gk-btn--block" disabled={busy || code.length < 4}>
        {busy ? 'Checking…' : 'Verify and continue'}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
        <button type="button" className="gk-link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={resend}>
          Send a new code
        </button>
        {onBack && (
          <button type="button" className="gk-link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={onBack}>
            Change my details
          </button>
        )}
      </div>
    </form>
  )
}

/** Chip multi-select backed by a public catalogue endpoint. */
function CataloguePicker({ path, label, hint, value, onChange, format }) {
  const [items, setItems] = useState([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get(path, { auth: false })
      .then((rows) => !cancelled && setItems(rows))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [path])

  if (failed || items.length === 0) return null

  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  return (
    <div className="gk-field">
      <label>{label}</label>
      <div className="gk-scrollbox">
        <div className="gk-chipset">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              className={`gk-chipset__item${value.includes(it.id) ? ' is-on' : ''}`}
              aria-pressed={value.includes(it.id)}
              onClick={() => toggle(it.id)}
            >
              {value.includes(it.id) && <Check size={14} />}
              {format ? format(it) : it.name}
            </button>
          ))}
        </div>
      </div>
      <span className="gk-field__hint">{hint}</span>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Login — one page, two roles                                       */
/* ---------------------------------------------------------------- */

const ROLE_COPY = {
  student: {
    tab: 'Student',
    heading: 'Student login',
    blurb: 'Your classes, recordings, tutes and marks.',
    signupText: 'No account yet?',
    signupLabel: 'Register as a student',
    signupTo: '/register',
    perks: [
      'Live classes on your timetable, from any device',
      'Three replays of every lesson before the paper',
      'Printed tutes couriered to your address',
      'Marked model papers with written feedback',
    ],
  },
  instructor: {
    tab: 'Lecturer',
    heading: 'Lecturer login',
    blurb: 'Your timetable, slot requests, batches and reviews.',
    signupText: 'Want to teach with us?',
    signupLabel: 'Apply as a lecturer',
    signupTo: LECTURER_SIGNUP,
    perks: [
      'Publish your free time slots and accept requests',
      'Run group batches with a fixed seat count',
      'Mark papers and answer your students in one place',
      'Track earnings and verified reviews',
    ],
  },
}

export function Login() {
  const { login } = useAuth()
  const [role, setRole] = useState('student')
  const [form, setForm] = useState({ id: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState(null)

  const copy = ROLE_COPY[role]
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const switchRole = (next) => {
    setRole(next)
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.id.trim() || !form.password) {
      setError('Enter your phone number or email, and your password.')
      return
    }
    setError('')
    setBusy(true)
    try {
      // The switch is authoritative: `expectRole` makes AuthContext refuse an
      // account of the other kind before it commits the session, so the error
      // below can still be shown.
      await login({ identifier: form.id.trim(), password: form.password, expectRole: role })
      // On success AuthContext flips to 'authed' and App.jsx renders the LMS.
    } catch (err) {
      // An unverified phone is not a failure — finish the OTP the server just sent.
      if (err.data?.requiresVerification) {
        setOtp({ phone: err.data.phone, devCode: err.data.devCode })
        return
      }
      if (err.message === 'WRONG_ROLE') {
        const other = ROLE_COPY[err.actualRole]
        setError(
          `That is a ${err.actualRole === 'instructor' ? 'lecturer' : 'student'} account. ` +
            `Switch to the ${other.tab} tab above and sign in again.`
        )
      } else {
        setError(err.message || 'Could not sign you in.')
      }
      setBusy(false)
    }
  }

  if (otp) {
    return (
      <>
        <PageBanner title="Verify your phone" crumb="Login" text="One step left before you can sign in." />
        <Section>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <OtpStep phone={otp.phone} devCode={otp.devCode} heading="Verify your phone" onBack={() => setOtp(null)} />
          </div>
        </Section>
      </>
    )
  }

  return (
    <>
      <PageBanner title="Login" text="One login for the whole academy — pick whether you are a student or a lecturer." />

      <Section>
        <div className="gk-grid gk-grid--2" style={{ gap: 48, alignItems: 'start' }}>
          <form className="gk-card gk-form" onSubmit={submit} noValidate>
            <div className="gk-switch" role="tablist" aria-label="Account type">
              {['student', 'instructor'].map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={role === r}
                  className={`gk-switch__btn${role === r ? ' is-on' : ''}`}
                  onClick={() => switchRole(r)}
                >
                  {r === 'student' ? <Users size={17} /> : <Mentor size={17} />}
                  {ROLE_COPY[r].tab}
                </button>
              ))}
            </div>

            <div>
              <h2 style={{ fontSize: 24 }}>{copy.heading}</h2>
              <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14.5 }}>{copy.blurb}</p>
            </div>

            <ErrorNote>{error}</ErrorNote>

            <div className="gk-field">
              <label htmlFor="l-id">Phone number or email</label>
              <input
                id="l-id"
                className="gk-input"
                value={form.id}
                onChange={set('id')}
                placeholder="07X XXX XXXX"
                autoComplete="username"
              />
            </div>

            <div className="gk-field">
              <label htmlFor="l-pw">Password</label>
              <input
                id="l-pw"
                className="gk-input"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="gk-btn gk-btn--primary gk-btn--block" disabled={busy}>
              {busy ? 'Signing in…' : `Sign in as ${copy.tab.toLowerCase()}`}
            </button>

            <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
              {copy.signupText}{' '}
              <Link to={copy.signupTo} className="gk-link">
                {copy.signupLabel}
              </Link>
            </p>
          </form>

          <div>
            <span className="gk-eyebrow">Inside the system</span>
            <h2>What your login opens</h2>
            <p style={{ color: 'var(--muted)', margin: '14px 0 24px' }}>
              {role === 'student'
                ? 'Everything for the month you paid for, in one place — no separate Zoom links or Drive folders to hunt through.'
                : 'Your whole teaching operation — availability, requests, batches and marking — behind one login.'}
            </p>
            <Ticks items={copy.perks} />

            <div className="gk-note" style={{ marginTop: 26 }}>
              <Shield size={17} />
              <span>
                One login is one person. Accounts used on more than one device at a time are disabled
                automatically.
              </span>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}

/* ---------------------------------------------------------------- */
/* Student registration                                              */
/* ---------------------------------------------------------------- */

const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13']

export function Register() {
  const { registerStudent } = useAuth()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', grade: '', birthday: '', password: '', confirmPassword: '',
  })
  const [subjectIds, setSubjectIds] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('The two passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Your password must be at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      const res = await registerStudent({ ...form, subjectIds })
      setOtp({ phone: res.phone, devCode: res.devCode })
    } catch (err) {
      setError(err.message || 'Could not create your account.')
      setBusy(false)
    }
  }

  if (otp) {
    return (
      <>
        <PageBanner title="Verify your phone" crumb="Register" text="One step left — then you are in." />
        <Section>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <OtpStep phone={otp.phone} devCode={otp.devCode} heading="Confirm your number" onBack={() => { setOtp(null); setBusy(false) }} />
          </div>
        </Section>
      </>
    )
  }

  return (
    <>
      <PageBanner
        title="Student registration"
        crumb="Register"
        text="One account carries you from Grade 6 to A/L. Registering is free — you pay only for the classes you join."
      />

      <Section>
        <div className="gk-grid gk-grid--2" style={{ gap: 48, alignItems: 'start' }}>
          <form className="gk-card gk-form" onSubmit={submit} noValidate>
            <Steps step={1} />
            <div>
              <h2 style={{ fontSize: 24 }}>Create your student account</h2>
              <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14.5 }}>
                A parent or guardian should register the account for any student under eighteen.
              </p>
            </div>

            <ErrorNote>{error}</ErrorNote>

            <div className="gk-field">
              <label htmlFor="r-name">Full name *</label>
              <input id="r-name" className="gk-input" value={form.name} onChange={set('name')} placeholder="As it appears on the exam index" />
            </div>

            <div className="gk-form__row">
              <div className="gk-field">
                <label htmlFor="r-phone">Phone number *</label>
                <input id="r-phone" className="gk-input" value={form.phone} onChange={set('phone')} placeholder="07X XXX XXXX" />
                <span className="gk-field__hint">We send your verification code here.</span>
              </div>
              <div className="gk-field">
                <label htmlFor="r-email">Email *</label>
                <input id="r-email" className="gk-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </div>
            </div>

            <div className="gk-form__row">
              <div className="gk-field">
                <label htmlFor="r-grade">Grade</label>
                <select id="r-grade" className="gk-select" style={{ width: '100%' }} value={form.grade} onChange={set('grade')}>
                  <option value="">Choose a grade</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="gk-field">
                <label htmlFor="r-bday">Date of birth</label>
                <input id="r-bday" className="gk-input" type="date" value={form.birthday} onChange={set('birthday')} />
              </div>
            </div>

            <CataloguePicker
              path="/subjects"
              label="Subjects you are looking for"
              hint="Optional — it only shapes what we recommend first."
              value={subjectIds}
              onChange={setSubjectIds}
            />

            <div className="gk-form__row">
              <div className="gk-field">
                <label htmlFor="r-pw">Password *</label>
                <input id="r-pw" className="gk-input" type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" autoComplete="new-password" />
              </div>
              <div className="gk-field">
                <label htmlFor="r-pw2">Confirm password *</label>
                <input id="r-pw2" className="gk-input" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
              </div>
            </div>

            <button type="submit" className="gk-btn gk-btn--primary gk-btn--block" disabled={busy}>
              {busy ? 'Creating…' : 'Create my account'}
            </button>

            <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
              Already registered? <Link to="/login" className="gk-link">Sign in</Link>
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--faint)', textAlign: 'center' }}>
              By registering you accept our <Link to="/terms" className="gk-link" style={{ fontSize: 12.5 }}>Terms</Link> and{' '}
              <Link to="/privacy" className="gk-link" style={{ fontSize: 12.5 }}>Privacy Policy</Link>.
            </p>
          </form>

          <div>
            <span className="gk-eyebrow">Why register</span>
            <h2>Free to join, free for a week</h2>
            <p style={{ color: 'var(--muted)', margin: '14px 0 24px' }}>
              Registering costs nothing and puts no class on your bill. Your first week with any lecturer is
              free — sit the lesson, take the tute, then decide.
            </p>
            <Ticks
              items={[
                'No admission fee to open an account',
                'The first week of any class is free',
                'Cancel a subject at the end of any month',
                'A named coordinator answers on WhatsApp',
              ]}
            />

            <div className="gk-note" style={{ marginTop: 26 }}>
              <Sparkle size={17} />
              <span>
                <b>{site.motto}</b> — {site.tagline}.
              </span>
            </div>

            <div className="gk-note gk-note--gold" style={{ marginTop: 14 }}>
              <Mentor size={17} />
              <span>
                Are you a teacher, not a student?{' '}
                <Link to={LECTURER_SIGNUP} className="gk-link">Apply to join the lecturer panel</Link>.
              </span>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}

/* ---------------------------------------------------------------- */
/* Lecturer registration — its own URL                               */
/* ---------------------------------------------------------------- */

export function LecturerRegister() {
  const { registerInstructor } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', title: '', email: '', phone: '', city: '', bio: '', password: '', confirmPassword: '',
  })
  const [moduleIds, setModuleIds] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('The two passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Your password must be at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      const res = await registerInstructor({ ...form, moduleIds })
      setOtp({ phone: res.phone, devCode: res.devCode })
    } catch (err) {
      setError(err.message || 'Could not create your account.')
      setBusy(false)
    }
  }

  if (otp) {
    return (
      <>
        <PageBanner title="Verify your phone" crumb="Lecturer registration" text="One step left before your application reaches us." />
        <Section>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <OtpStep phone={otp.phone} devCode={otp.devCode} heading="Confirm your number" onBack={() => { setOtp(null); setBusy(false) }} />
          </div>
        </Section>
      </>
    )
  }

  return (
    <>
      <PageBanner
        title="Join the lecturer panel"
        crumb="Lecturer registration"
        text="Apply to teach with Gurukela. Register here once — from then on you sign in through the same login page as everyone else."
      />

      <Section>
        <div className="gk-grid gk-grid--2" style={{ gap: 48, alignItems: 'start' }}>
          <form className="gk-card gk-form" onSubmit={submit} noValidate>
            <Steps step={1} />
            <div>
              <h2 style={{ fontSize: 24 }}>Lecturer registration</h2>
              <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14.5 }}>
                This page is for teachers only. Students register on the{' '}
                <Link to="/register" className="gk-link">student registration page</Link>.
              </p>
            </div>

            <ErrorNote>{error}</ErrorNote>

            <div className="gk-form__row">
              <div className="gk-field">
                <label htmlFor="i-name">Full name *</label>
                <input id="i-name" className="gk-input" value={form.name} onChange={set('name')} placeholder="Name students will see" />
              </div>
              <div className="gk-field">
                <label htmlFor="i-title">Title</label>
                <input id="i-title" className="gk-input" value={form.title} onChange={set('title')} placeholder="Senior Physics Lecturer" />
              </div>
            </div>

            <div className="gk-form__row">
              <div className="gk-field">
                <label htmlFor="i-phone">Phone number *</label>
                <input id="i-phone" className="gk-input" value={form.phone} onChange={set('phone')} placeholder="07X XXX XXXX" />
                <span className="gk-field__hint">We send your verification code here.</span>
              </div>
              <div className="gk-field">
                <label htmlFor="i-email">Email *</label>
                <input id="i-email" className="gk-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </div>
            </div>

            <div className="gk-field">
              <label htmlFor="i-city">City</label>
              <input id="i-city" className="gk-input" value={form.city} onChange={set('city')} placeholder="Where you are based" />
            </div>

            <div className="gk-field">
              <label htmlFor="i-bio">About your teaching</label>
              <textarea
                id="i-bio"
                className="gk-textarea"
                value={form.bio}
                onChange={set('bio')}
                placeholder="Your experience, the syllabus you cover and how you run a class."
              />
              <span className="gk-field__hint">Students read this on your profile before they book.</span>
            </div>

            <CataloguePicker
              path="/modules"
              label="Modules you teach"
              hint="The administrator owns this list, so search and filtering stay consistent."
              value={moduleIds}
              onChange={setModuleIds}
              format={(m) => `${m.code} · ${m.name}`}
            />

            <div className="gk-form__row">
              <div className="gk-field">
                <label htmlFor="i-pw">Password *</label>
                <input id="i-pw" className="gk-input" type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" autoComplete="new-password" />
              </div>
              <div className="gk-field">
                <label htmlFor="i-pw2">Confirm password *</label>
                <input id="i-pw2" className="gk-input" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
              </div>
            </div>

            <button type="submit" className="gk-btn gk-btn--primary gk-btn--block" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit my application'}
            </button>

            <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
              Already on the panel?{' '}
              <button
                type="button"
                className="gk-link"
                style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}
                onClick={() => navigate('/login')}
              >
                Sign in on the lecturer tab
              </button>
            </p>
          </form>

          <div>
            <span className="gk-eyebrow">What happens next</span>
            <h2>From application to your first batch</h2>
            <div className="gk-timeline" style={{ marginTop: 24 }}>
              {[
                ['Verify', 'Confirm your phone with the SMS code. Your account opens immediately.'],
                ['Review', 'An administrator checks your qualifications and marks the profile verified.'],
                ['Publish', 'Add your free time slots and open a group batch from your dashboard.'],
                ['Teach', 'Students find you in the panel, request a slot, pay, and you are running.'],
              ].map(([year, text]) => (
                <div className="gk-timeline__row" key={year}>
                  <span className="gk-timeline__year">{year}</span>
                  <div className="gk-timeline__body">
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="gk-note" style={{ marginTop: 26 }}>
              <Shield size={17} />
              <span>
                You can sign in and set up your profile as soon as your phone is verified. Students only see
                you in the panel once an administrator has verified the account.
              </span>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
