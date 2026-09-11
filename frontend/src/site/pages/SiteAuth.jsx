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

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { api } from '../../api/client.js'
import { useAuth } from '../../store/AuthContext.jsx'
import { Calendar, Check, ChevronDown, Close, Info, Mentor, Search, Shield, Sparkle } from '../art/Icons.jsx'
import { PageBanner, Section, Ticks } from '../components.jsx'
import { site } from '../siteData.js'
import { useLang } from '../i18n/LanguageContext.jsx'

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
  const { t } = useLang()
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
      setError(err.message || t('auth.verify.badCode'))
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
          {t('auth.verify.sentTo')} <b>{phone}</b>. {t('auth.verify.enter')}
        </p>
      </div>

      <ErrorNote>{error}</ErrorNote>

      {hint && (
        <div className="gk-devcode">
          <Info size={17} />
          <span>
            {t('auth.verify.devCode')} <b>{hint}</b>
          </span>
        </div>
      )}

      <div className="gk-field">
        <label htmlFor="otp">{t('auth.verify.code')}</label>
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
        {busy ? t('auth.verify.checking') : t('auth.verify.submit')}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
        <button type="button" className="gk-link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={resend}>
          {t('auth.verify.resend')}
        </button>
        {onBack && (
          <button type="button" className="gk-link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={onBack}>
            {t('auth.verify.back')}
          </button>
        )}
      </div>
    </form>
  )
}

/**
 * Date of birth, on a real calendar (react-datepicker).
 *
 * The native date input renders in the browser's own locale — mm/dd/yyyy on a
 * machine set to en-US — which is the wrong order for anyone here and offers
 * no quick way back to a birth year twenty scrolls ago. This shows dd/mm/yyyy,
 * puts month and year on dropdowns, and refuses dates in the future.
 *
 * The value crossing the boundary stays a plain `YYYY-MM-DD` string, which is
 * what the API writes into the DATE column. Both conversions are built from
 * local calendar parts on purpose: `toISOString` would shift the day backwards
 * for anyone east of UTC, so a birthday could be saved one day early.
 */
const MIN_DOB = new Date(1950, 0, 1)

function toDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return y && m && d ? new Date(y, m - 1, d) : null
}

function toISODate(date) {
  if (!date) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function DateField({ id, label, value, onChange, hint }) {
  return (
    <div className="gk-field">
      <label htmlFor={id}>{label}</label>
      <DatePicker
        id={id}
        selected={toDate(value)}
        onChange={(date) => onChange(toISODate(date))}
        dateFormat="dd/MM/yyyy"
        placeholderText="DD/MM/YYYY"
        className="gk-input"
        wrapperClassName="gk-datewrap"
        calendarClassName="gk-cal"
        popperPlacement="bottom-start"
        showIcon
        icon={<Calendar size={17} />}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        minDate={MIN_DOB}
        maxDate={new Date()}
        isClearable={Boolean(value)}
        autoComplete="off"
      />
      {hint && <span className="gk-field__hint">{hint}</span>}
    </div>
  )
}

/**
 * Searchable multi-select backed by a public catalogue endpoint.
 *
 * The list of subjects (and especially of modules) is long enough that a wall
 * of chips buries the rest of the form, so it collapses into a dropdown: the
 * closed control shows what is chosen, and opening it gives a search box over
 * the whole catalogue. Picking does not close the menu — these fields are
 * almost always answered with more than one item.
 *
 * When the catalogue rows carry a `streams` array (subjects do; modules do
 * not) the options are grouped under collapsible stream headings. Several
 * headings can stay open at once, so a student sitting two or three streams
 * can expand them all and tick subjects across every one — opening a stream
 * never collapses or hides the others. A subject that belongs to more than one
 * stream is listed under each; because selection is keyed by id, ticking it in
 * one place ticks it everywhere.
 *
 * Keyboard: type to filter, ↑/↓ to walk the visible rows, Enter to toggle the
 * active row, Backspace on an empty box to drop the last choice, Escape to
 * close.
 */
function CataloguePicker({ path, label, hint, value, onChange, format, placeholder = 'Search and select…' }) {
  const [items, setItems] = useState([])
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [openGroups, setOpenGroups] = useState(() => new Set())
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const listId = `${path.replace(/\W+/g, '')}-list`

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

  /* Clicking anywhere else puts the menu away. */
  useEffect(() => {
    if (!open) return undefined
    const away = (e) => !rootRef.current?.contains(e.target) && setOpen(false)
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  /* Keep the highlighted row in view while arrowing through a long list. */
  useEffect(() => {
    if (activeId == null) return
    listRef.current?.querySelector(`[data-id="${CSS.escape(activeId)}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  if (failed || items.length === 0) return null

  const labelOf = (it) => (format ? format(it) : it.name)
  const needle = q.trim().toLowerCase()
  const matches = (it) => labelOf(it).toLowerCase().includes(needle)
  const shown = needle ? items.filter(matches) : items
  const chosen = items.filter((it) => value.includes(it.id))

  /* Grouped mode kicks in only when the catalogue carries streams. */
  const grouped = items.some((it) => Array.isArray(it.streams) && it.streams.length)
  const streamOrder = []
  if (grouped) {
    for (const it of items) for (const s of it.streams || []) if (!streamOrder.includes(s)) streamOrder.push(s)
  }
  /* Within a stream, subjects sit under their grade (Grade 10, Grade 11 …).
     Subjects an admin left without a grade collect under one plain heading. */
  const byGrade = (subs) => {
    const order = []
    for (const it of subs) {
      const g = it.grade || 'Other grades'
      if (!order.includes(g)) order.push(g)
    }
    return order.map((grade) => ({ grade, subs: subs.filter((it) => (it.grade || 'Other grades') === grade) }))
  }
  const groups = grouped
    ? [
        ...streamOrder
          .map((name) => ({ name, subs: shown.filter((it) => (it.streams || []).includes(name)) }))
          .filter((g) => g.subs.length),
        // Subjects an admin left without any stream still need a home.
        ...(() => {
          const orphans = shown.filter((it) => !(it.streams || []).length)
          return orphans.length ? [{ name: 'Other subjects', subs: orphans }] : []
        })(),
      ].map((g) => ({ ...g, grades: byGrade(g.subs) }))
    : []
  /* Grade sub-headings key off both names so an identical grade label in two
     streams opens and closes independently. */
  const gradeKey = (name, grade) => `${name} ${grade}`

  /* A stream counts as open while searching (so matches are never hidden) or
     once the student has expanded it by hand. */
  const isGroupOpen = (name) => Boolean(needle) || openGroups.has(name)

  /* The rows the keyboard can actually land on, top to bottom. */
  const visibleRows = grouped
    ? groups
        .filter((g) => isGroupOpen(g.name))
        .flatMap((g) =>
          g.grades.filter((gr) => isGroupOpen(gradeKey(g.name, gr.grade))).flatMap((gr) => gr.subs),
        )
    : shown

  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  const toggleGroup = (name) =>
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })

  const show = () => {
    setOpen(true)
    setActiveId(null)
    /* The input only exists once the menu is open. */
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const step = (dir) => {
    if (!visibleRows.length) return
    const i = visibleRows.findIndex((it) => it.id === activeId)
    const next = i === -1 ? (dir === 1 ? 0 : visibleRows.length - 1) : (i + dir + visibleRows.length) % visibleRows.length
    setActiveId(visibleRows[next].id)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') return setOpen(false)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      return step(e.key === 'ArrowDown' ? 1 : -1)
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const it = visibleRows.find((r) => r.id === activeId)
      return it && toggle(it.id)
    }
    if (e.key === 'Backspace' && !q && value.length) return onChange(value.slice(0, -1))
    return undefined
  }

  const Option = (it) => {
    const on = value.includes(it.id)
    return (
      <button
        type="button"
        key={it.id}
        data-id={it.id}
        role="option"
        aria-selected={on}
        className={`gk-multi__opt${on ? ' is-on' : ''}${it.id === activeId ? ' is-active' : ''}`}
        onMouseEnter={() => setActiveId(it.id)}
        onClick={() => toggle(it.id)}
      >
        <span className="gk-multi__box">{on && <Check size={12} />}</span>
        {labelOf(it)}
      </button>
    )
  }

  return (
    <div className="gk-field">
      <label id={`${listId}-label`}>{label}</label>

      <div className={`gk-multi${open ? ' is-open' : ''}`} ref={rootRef}>
        <div
          className="gk-multi__control"
          role="button"
          tabIndex={open ? -1 : 0}
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${listId}-label`}
          onClick={show}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), show())}
        >
          <span className="gk-multi__tags">
            {chosen.length === 0 && <span className="gk-multi__placeholder">{placeholder}</span>}
            {chosen.map((it) => (
              <span key={it.id} className="gk-multi__tag">
                {labelOf(it)}
                <button
                  type="button"
                  aria-label={`Remove ${labelOf(it)}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(it.id)
                  }}
                >
                  <Close size={12} />
                </button>
              </span>
            ))}
          </span>
          <ChevronDown size={18} className="gk-multi__caret" />
        </div>

        {open && (
          <div className="gk-multi__menu">
            <div className="gk-multi__search">
              <Search size={16} />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setActiveId(null)
                }}
                onKeyDown={onKeyDown}
                placeholder="Type to search"
                aria-label={`Search ${label}`}
                aria-controls={listId}
                autoComplete="off"
              />
              {value.length > 0 && (
                <button type="button" className="gk-multi__clear" onClick={() => onChange([])}>
                  Clear
                </button>
              )}
            </div>

            <div className="gk-multi__list" id={listId} role="listbox" aria-multiselectable="true" ref={listRef}>
              {grouped ? (
                <>
                  {groups.map((g) => {
                    const opened = isGroupOpen(g.name)
                    const picked = g.subs.filter((it) => value.includes(it.id)).length
                    return (
                      <div className="gk-multi__group" key={g.name}>
                        <button
                          type="button"
                          className={`gk-multi__grouphead${opened ? ' is-open' : ''}`}
                          aria-expanded={opened}
                          onClick={() => toggleGroup(g.name)}
                        >
                          <ChevronDown size={16} className="gk-multi__groupcaret" />
                          <span className="gk-multi__groupname">{g.name}</span>
                          <span className="gk-multi__groupcount">
                            {picked > 0 ? `${picked}/${g.subs.length}` : g.subs.length}
                          </span>
                        </button>
                        {opened && (
                          <div className="gk-multi__groupbody">
                            {g.grades.map((gr) => {
                              const gkey = gradeKey(g.name, gr.grade)
                              const gopen = isGroupOpen(gkey)
                              const gpicked = gr.subs.filter((it) => value.includes(it.id)).length
                              return (
                                <div className="gk-multi__group" key={gkey}>
                                  <button
                                    type="button"
                                    className={`gk-multi__grouphead gk-multi__grouphead--grade${gopen ? ' is-open' : ''}`}
                                    aria-expanded={gopen}
                                    onClick={() => toggleGroup(gkey)}
                                  >
                                    <ChevronDown size={16} className="gk-multi__groupcaret" />
                                    <span className="gk-multi__groupname">{gr.grade}</span>
                                    <span className="gk-multi__groupcount">
                                      {gpicked > 0 ? `${gpicked}/${gr.subs.length}` : gr.subs.length}
                                    </span>
                                  </button>
                                  {gopen && <div className="gk-multi__groupbody">{gr.subs.map(Option)}</div>}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {groups.length === 0 && <p className="gk-multi__empty">Nothing matches “{q}”.</p>}
                </>
              ) : (
                <>
                  {shown.map(Option)}
                  {shown.length === 0 && <p className="gk-multi__empty">Nothing matches “{q}”.</p>}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <span className="gk-field__hint">
        {value.length > 0 ? `${value.length} selected · ${hint}` : hint}
      </span>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Login — one page, two roles                                       */
/* ---------------------------------------------------------------- */

/**
 * One login for everyone. The account decides the role — the API returns it
 * with the token, and App.jsx sends a student to /discover and a lecturer to
 * /teach on its own. Nothing here needs to ask which kind of person is typing.
 */
export function Login() {
  const { t } = useLang()
  const { login } = useAuth()
  const [form, setForm] = useState({ id: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.id.trim() || !form.password) {
      setError(t('auth.needBoth'))
      return
    }
    setError('')
    setBusy(true)
    try {
      // On success AuthContext flips to 'authed' and App.jsx renders the LMS
      // for whichever role the account carries.
      await login({ identifier: form.id.trim(), password: form.password })
    } catch (err) {
      // An unverified phone is not a failure — finish the OTP the server just sent.
      if (err.data?.requiresVerification) {
        setOtp({ phone: err.data.phone, devCode: err.data.devCode })
        return
      }
      setError(err.message || t('auth.failed'))
      setBusy(false)
    }
  }

  if (otp) {
    return (
      <>
        <PageBanner title={t('auth.verify.title')} crumb={t('auth.login.title')} text={t('auth.verify.banner')} />
        <Section>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <OtpStep phone={otp.phone} devCode={otp.devCode} heading={t('auth.verify.title')} onBack={() => setOtp(null)} />
          </div>
        </Section>
      </>
    )
  }

  return (
    <>
      <PageBanner title={t('auth.login.title')} text={t('auth.login.banner')} />

      <Section>
        <div className="gk-grid gk-grid--2" style={{ gap: 48, alignItems: 'start' }}>
          <form className="gk-card gk-form" onSubmit={submit} noValidate>
            <div>
              <h2 style={{ fontSize: 24 }}>{t('auth.login.title')}</h2>
              <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14.5 }}>{t('auth.login.sub')}</p>
            </div>

            <ErrorNote>{error}</ErrorNote>

            <div className="gk-field">
              <label htmlFor="l-id">{t('auth.idLabel')}</label>
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
              <label htmlFor="l-pw">{t('auth.password')}</label>
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
              {busy ? t('auth.signingIn') : t('auth.signIn')}
            </button>

            <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="gk-link">
                {t('nav.registerStudent')}
              </Link>
            </p>
          </form>

          <div>
            <span className="gk-eyebrow">{t('auth.inside.eyebrow')}</span>
            <h2>{t('auth.inside.title')}</h2>
            <p style={{ color: 'var(--muted)', margin: '14px 0 24px' }}>{t('auth.inside.text')}</p>

            <h3 style={{ fontSize: 15, marginBottom: 12 }}>{t('auth.inside.ifStudent')}</h3>
            <Ticks
              items={[
                'Live classes on your timetable, from any device',
                'Three replays of every lesson before the paper',
                'Every tute as a downloadable PDF in the LMS',
                'Marked model papers with written feedback',
              ]}
            />

            <h3 style={{ fontSize: 15, margin: '24px 0 12px' }}>{t('auth.inside.ifLecturer')}</h3>
            <Ticks
              items={[
                'Publish your free time slots and accept requests',
                'Run group batches with a fixed seat count',
                'Mark papers and answer your students in one place',
                'Track earnings and verified reviews',
              ]}
            />

            <div className="gk-note" style={{ marginTop: 26 }}>
              <Shield size={17} />
              <span>
                {t('auth.oneLogin')}
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


export function Register() {
  const { t, tr } = useLang()
  const { registerStudent } = useAuth()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', birthday: '', password: '', confirmPassword: '',
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
      setError(t('reg.mismatch'))
      return
    }
    if (form.password.length < 8) {
      setError(t('reg.tooShort'))
      return
    }
    setBusy(true)
    try {
      const res = await registerStudent({ ...form, subjectIds })
      setOtp({ phone: res.phone, devCode: res.devCode })
    } catch (err) {
      setError(err.message || t('reg.failed'))
      setBusy(false)
    }
  }

  if (otp) {
    return (
      <>
        <PageBanner title="Verify your phone" crumb={t('reg.title')} text="One step left, then you are in." />
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
        title={t('reg.title')}
        crumb={t('reg.title')}
        text={t('reg.banner')}
      />

      <Section>
        <div className="gk-grid gk-grid--2" style={{ gap: 48, alignItems: 'start' }}>
          <form className="gk-card gk-form" onSubmit={submit} noValidate>
            <Steps step={1} />
            <div>
              <h2 style={{ fontSize: 24 }}>{t('reg.heading')}</h2>
              <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14.5 }}>
                {t('reg.guardian')}
              </p>
            </div>

            <ErrorNote>{error}</ErrorNote>

            <div className="gk-field">
              <label htmlFor="r-name">{t('reg.fullName')} *</label>
              <input id="r-name" className="gk-input" value={form.name} onChange={set('name')} placeholder={t('reg.namePlaceholder')} />
            </div>

            <div className="gk-field">
              <label htmlFor="r-phone">{t('reg.phone')} *</label>
              <input id="r-phone" className="gk-input" value={form.phone} onChange={set('phone')} placeholder="07X XXX XXXX" />
              <span className="gk-field__hint">{t('reg.phoneHint')}</span>
            </div>

            <div className="gk-field">
              <label htmlFor="r-email">{t('reg.email')} *</label>
              <input id="r-email" className="gk-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            </div>

            <DateField
              id="r-bday"
              label={t('reg.dob')}
              value={form.birthday}
              onChange={(iso) => setForm((f) => ({ ...f, birthday: iso }))}
            />

            <CataloguePicker
              path="/subjects"
              label={t('reg.subjects')}
              hint={t('reg.subjectsHint')}
              value={subjectIds}
              onChange={setSubjectIds}
            />

            <div className="gk-form__row">
              <div className="gk-field">
                <label htmlFor="r-pw">{t('auth.password')} *</label>
                <input id="r-pw" className="gk-input" type="password" value={form.password} onChange={set('password')} placeholder={t('reg.passwordPlaceholder')} autoComplete="new-password" />
              </div>
              <div className="gk-field">
                <label htmlFor="r-pw2">{t('reg.confirmPassword')} *</label>
                <input id="r-pw2" className="gk-input" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
              </div>
            </div>

            <button type="submit" className="gk-btn gk-btn--primary gk-btn--block" disabled={busy}>
              {busy ? t('reg.creating') : t('reg.submit')}
            </button>

            <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
              {t('reg.already')} <Link to="/login" className="gk-link">{t('auth.signIn')}</Link>
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--faint)', textAlign: 'center' }}>
              {t('reg.accept')} <Link to="/terms" className="gk-link" style={{ fontSize: 12.5 }}>{t('legal.terms')}</Link> {t('reg.and')}{' '}
              <Link to="/privacy" className="gk-link" style={{ fontSize: 12.5 }}>{t('legal.privacy')}</Link>.
            </p>
          </form>

          <div>
            <span className="gk-eyebrow">Why register</span>
            <h2>Free to join, free for a week</h2>
            <p style={{ color: 'var(--muted)', margin: '14px 0 24px' }}>
              Registering costs nothing and puts no class on your bill. Your first week with any lecturer is
              free: sit the lesson, take the tute, then decide.
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
                <b>{tr(site.motto)}</b>: {tr(site.tagline)}.
              </span>
            </div>

            <div className="gk-note gk-note--gold" style={{ marginTop: 14 }}>
              <Mentor size={17} />
              <span>
                {t('reg.teacherNote')}{' '}
                <Link to={LECTURER_SIGNUP} className="gk-link">{t('reg.teacherLink')}</Link>.
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
  const { t, tr } = useLang()
  const { registerInstructor } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', title: '', email: '', phone: '', city: '', bio: '', password: '', confirmPassword: '',
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
      setError(t('reg.mismatch'))
      return
    }
    if (form.password.length < 8) {
      setError(t('reg.tooShort'))
      return
    }
    setBusy(true)
    try {
      const res = await registerInstructor({ ...form, subjectIds })
      setOtp({ phone: res.phone, devCode: res.devCode })
    } catch (err) {
      setError(err.message || t('reg.failed'))
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
        text="Apply to teach with GetClass. Register here once; from then on you sign in through the same login page as everyone else."
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
                <span className="gk-field__hint">{t('reg.phoneHint')}</span>
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
              path="/subjects"
              label="Subjects you teach"
              hint="Pick a stream to expand it, then tick the subjects you teach under it."
              value={subjectIds}
              onChange={setSubjectIds}
            />

            <div className="gk-form__row">
              <div className="gk-field">
                <label htmlFor="i-pw">Password *</label>
                <input id="i-pw" className="gk-input" type="password" value={form.password} onChange={set('password')} placeholder={t('reg.passwordPlaceholder')} autoComplete="new-password" />
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
