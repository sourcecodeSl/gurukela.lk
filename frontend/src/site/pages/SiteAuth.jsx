/**
 * Student login and registration for the public site.
 *
 * These are the brand-facing screens only — nothing is posted anywhere yet.
 * The real, API-backed auth screens still live under src/pages/auth and are
 * reachable at /gurukela/login, so wiring the backend later is a routing change
 * rather than a rewrite.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Info, Shield, Sparkle } from '../art/Icons.jsx'
import { PageBanner, Section, Ticks } from '../components.jsx'
import { streams, site } from '../siteData.js'

const PERKS = [
  'Live classes on your timetable, from any device',
  'Three replays of every lesson before the paper',
  'Printed tutes couriered to your address',
  'Marked model papers with written feedback',
]

function Notice() {
  return (
    <div className="gk-note gk-note--gold">
      <Info size={17} />
      <span>
        Accounts are not open on this site yet — the student portal is being connected. Leave your details with us
        on the <Link to="/contact" className="gk-link">contact page</Link> and we will register you by phone.
      </span>
    </div>
  )
}

/* ---------------------------------------------------------------- */

export function Login() {
  const [form, setForm] = useState({ id: '', password: '' })
  const [tried, setTried] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <>
      <PageBanner title="Student Login" crumb="Login" text="Sign in to reach your classes, recordings and marks." />

      <Section>
        <div className="gk-grid gk-grid--2" style={{ gap: 48, alignItems: 'start' }}>
          <form
            className="gk-card gk-form"
            onSubmit={(e) => {
              e.preventDefault()
              setTried(true)
            }}
            noValidate
          >
            <div>
              <h2 style={{ fontSize: 24 }}>Welcome back</h2>
              <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14.5 }}>
                One login is one student. Sharing it closes the account.
              </p>
            </div>

            {tried && <Notice />}

            <div className="gk-field">
              <label htmlFor="l-id">Phone number or email</label>
              <input id="l-id" className="gk-input" value={form.id} onChange={set('id')} placeholder="07X XXX XXXX" />
            </div>

            <div className="gk-field">
              <label htmlFor="l-pw">Password</label>
              <input id="l-pw" className="gk-input" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
              <span className="gk-field__hint">
                Forgot it? Call the technical line and we will reset it after verifying your details.
              </span>
            </div>

            <button type="submit" className="gk-btn gk-btn--primary gk-btn--block">
              Sign in
            </button>

            <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
              No account yet? <Link to="/register" className="gk-link">Create one</Link>
            </p>
          </form>

          <div>
            <span className="gk-eyebrow">Inside the LMS</span>
            <h2>What your login opens</h2>
            <p style={{ color: 'var(--muted)', margin: '14px 0 24px' }}>
              Everything for the month you paid for, in one place — no separate Zoom links or Drive folders to hunt
              through.
            </p>
            <Ticks items={PERKS} />

            <div className="gk-note" style={{ marginTop: 26 }}>
              <Shield size={17} />
              <span>
                Never share your password, and never buy a shared login from anyone. Accounts used on more than one
                device at a time are disabled automatically.
              </span>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}

/* ---------------------------------------------------------------- */

export function Register() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', grade: '', stream: '', password: '' })
  const [tried, setTried] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <>
      <PageBanner
        title="Create your account"
        crumb="Register"
        text="One account carries you from Grade 6 to A/L. Registration is free — you pay only for the classes you join."
      />

      <Section>
        <div className="gk-grid gk-grid--2" style={{ gap: 48, alignItems: 'start' }}>
          <form
            className="gk-card gk-form"
            onSubmit={(e) => {
              e.preventDefault()
              setTried(true)
            }}
            noValidate
          >
            <div>
              <h2 style={{ fontSize: 24 }}>Student registration</h2>
              <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14.5 }}>
                A parent or guardian should register the account for any student under eighteen.
              </p>
            </div>

            {tried && <Notice />}

            <div className="gk-form__row">
              <div className="gk-field">
                <label htmlFor="r-name">Full name</label>
                <input id="r-name" className="gk-input" value={form.name} onChange={set('name')} placeholder="As it appears on the exam index" />
              </div>
              <div className="gk-field">
                <label htmlFor="r-phone">Phone number</label>
                <input id="r-phone" className="gk-input" value={form.phone} onChange={set('phone')} placeholder="07X XXX XXXX" />
              </div>
            </div>

            <div className="gk-form__row">
              <div className="gk-field">
                <label htmlFor="r-grade">Grade</label>
                <select id="r-grade" className="gk-select" style={{ width: '100%' }} value={form.grade} onChange={set('grade')}>
                  <option value="">Choose a grade</option>
                  {['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="gk-field">
                <label htmlFor="r-stream">Stream</label>
                <select id="r-stream" className="gk-select" style={{ width: '100%' }} value={form.stream} onChange={set('stream')}>
                  <option value="">Choose a stream</option>
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="gk-field">
              <label htmlFor="r-email">Email (optional)</label>
              <input id="r-email" className="gk-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            </div>

            <div className="gk-field">
              <label htmlFor="r-pw">Choose a password</label>
              <input id="r-pw" className="gk-input" type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" />
              <span className="gk-field__hint">We verify your phone number with an SMS code before the account opens.</span>
            </div>

            <button type="submit" className="gk-btn gk-btn--primary gk-btn--block">
              Create my account
            </button>

            <p style={{ fontSize: 12.5, color: 'var(--faint)', textAlign: 'center' }}>
              By registering you accept our <Link to="/terms" className="gk-link" style={{ fontSize: 12.5 }}>Terms</Link> and{' '}
              <Link to="/privacy" className="gk-link" style={{ fontSize: 12.5 }}>Privacy Policy</Link>.
            </p>
          </form>

          <div>
            <span className="gk-eyebrow">Why register</span>
            <h2>Free to join, free for a week</h2>
            <p style={{ color: 'var(--muted)', margin: '14px 0 24px' }}>
              Registration costs nothing and puts no class on your bill. Your first week with any lecturer is free —
              sit the lesson, take the tute, then decide.
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

            <div className="gk-note" style={{ marginTop: 14 }}>
              <Check size={17} />
              <span>
                Already paid at the office? Call {'‎'}the enrolment line and we will open your account the same
                day.
              </span>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
