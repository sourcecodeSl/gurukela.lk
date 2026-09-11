/**
 * A single lecturer — the equivalent of the reference site's individual
 * lecture page. Shows the profile, the classes they run, and lets a visitor
 * put a class in the cart before signing in.
 */

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Portrait from '../art/Portrait.jsx'
import { ArrowLeft, Award, Calendar, Cart, Clock, Globe, Star, Users, Video } from '../art/Icons.jsx'
import { PageBanner, Section, SectionHead, TutorCard, Ticks } from '../components.jsx'
import { money } from '../CartContext.jsx'
import { streamById } from '../siteData.js'
import { useLecturers } from '../LecturersContext.jsx'
import { useLang } from '../i18n/LanguageContext.jsx'
import { api } from '../../api/client.js'

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-LK', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'TBA'

/** Monthly fee by class type — the admission fee is charged once, separately. */
const FEES = { Theory: 2500, Revision: 2800, 'Paper Class': 3200, Seminar: 1500 }

const SCHEDULE = {
  Theory: 'Tuesdays & Fridays · 6.00 – 8.00 p.m.',
  Revision: 'Saturdays · 8.00 – 11.00 a.m.',
  'Paper Class': 'Sundays · 2.00 – 5.00 p.m.',
  Seminar: 'Announced monthly',
}

export default function LecturerProfile() {
  const { t, tr } = useLang()
  const { id } = useParams()
  const { lecturers, lecturerById, loading } = useLecturers()
  const l = lecturerById(id)

  // This lecturer's real published seminars and open time slots (public data).
  const [seminars, setSeminars] = useState([])
  const [slots, setSlots] = useState([])

  useEffect(() => {
    if (!id) return
    let alive = true
    Promise.all([
      api.get(`/seminars?instructorId=${id}`, { auth: false }).catch(() => []),
      api.get(`/slots?instructorId=${id}&status=open`, { auth: false }).catch(() => []),
    ]).then(([sem, slt]) => {
      if (!alive) return
      setSeminars(Array.isArray(sem) ? sem : [])
      setSlots(Array.isArray(slt) ? slt : [])
    })
    return () => { alive = false }
  }, [id])

  if (loading) {
    return (
      <>
        <PageBanner title={t('common.loading')} crumb={t('lect.title')} />
        <Section>
          <div className="gk-empty">
            <h3>{t('common.loading')}</h3>
          </div>
        </Section>
      </>
    )
  }

  if (!l) {
    return (
      <>
        <PageBanner title="Lecturer not found" crumb="Our Lecturers" />
        <Section>
          <div className="gk-empty">
            <h3>That profile is not on the panel</h3>
            <p>The link may be out of date. The full lecturer panel is one click away.</p>
            <Link to="/lecturers" className="gk-btn gk-btn--primary">
              Back to the panel
            </Link>
          </div>
        </Section>
      </>
    )
  }

  const stream = streamById(l.stream)
  const related = lecturers.filter((x) => x.streams.includes(l.stream) && x.id !== l.id).slice(0, 4)

  const now = Date.now()
  const upcomingSeminars = [...seminars]
    .filter((s) => s.status !== 'ended')
    .sort((a, b) => new Date(a.startsAt || 0) - new Date(b.startsAt || 0))
  const upcomingSlots = slots
    .filter((s) => s.status === 'open' && new Date(s.date).getTime() >= now - 3600_000)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6)

  return (
    <>
      <PageBanner title={l.name} crumb={t('lect.title')} text={`${l.title} · ${tr(stream.name)}`} />

      <Section>
        <Link to="/lecturers" className="gk-link" style={{ marginBottom: 24 }}>
          <ArrowLeft size={15} />
          All lecturers
        </Link>

        <div className="gk-profile">
          {/* ---- sticky identity card ---- */}
          <aside className="gk-card gk-profile__card">
            <div className="gk-profile__photo">
              <Portrait id={l.id} name={l.name} photoUrl={l.photoUrl} />
            </div>
            <div className="gk-profile__facts">
              <div className="gk-profile__fact">
                <span>Subject</span>
                <b>{l.subject}</b>
              </div>
              <div className="gk-profile__fact">
                <span>Stream</span>
                <b>{tr(stream.name)}</b>
              </div>
              <div className="gk-profile__fact">
                <span>Medium</span>
                <b>{l.medium}</b>
              </div>
              <div className="gk-profile__fact">
                <span>Experience</span>
                <b>{l.years} years</b>
              </div>
              <div className="gk-profile__fact">
                <span>Students taught</span>
                <b>{l.students.toLocaleString('en-LK')}</b>
              </div>
              <div className="gk-profile__fact">
                <span>Rating</span>
                <b style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Star size={14} style={{ color: 'var(--gold)' }} />
                  {l.rating.toFixed(1)}
                </b>
              </div>
              <Link to="/register" className="gk-btn gk-btn--primary gk-btn--block" style={{ marginTop: 6 }}>
                Enrol with {l.name.split(' ')[0]}
              </Link>
            </div>
          </aside>

          {/* ---- detail ---- */}
          <div>
            <div className="gk-pills" style={{ marginBottom: 20 }}>
              <span className="gk-chip">
                <Globe size={14} />
                {l.medium} {t('lect.medium')}
              </span>
              <span className="gk-chip">
                <Users size={14} />
                {l.students.toLocaleString('en-LK')} {t('common.students')}
              </span>
              <span className="gk-chip">
                <Award size={14} />
                {l.years} years teaching
              </span>
            </div>

            <div className="gk-prose">
              <h2>About {l.name}</h2>
              <p style={{ marginTop: 16 }}>{l.bio}</p>
            </div>

            {l.demoVideoUrl && (
              <div style={{ marginTop: 38 }}>
                <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Video size={18} />
                  Intro video
                </h3>
                <div className="gk-card" style={{ overflow: 'hidden', padding: 0 }}>
                  <video
                    src={l.demoVideoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    style={{ width: '100%', maxHeight: 460, display: 'block', background: '#000' }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginTop: 38 }}>
              <h3 style={{ marginBottom: 16 }}>Qualifications</h3>
              <Ticks items={l.qualifications} />
            </div>

            {/* ---- classes ---- */}
            <div style={{ marginTop: 44 }}>
              <h3 style={{ marginBottom: 16 }}>Classes and fees</h3>
              <div className="gk-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {l.classes.map((type) => (
                  <article className="gk-card gk-card__body" key={type} style={{ display: 'grid', gap: 10 }}>
                    <span className="gk-chip gk-chip--solid" style={{ justifySelf: 'start' }}>
                      <Video size={14} />
                      {type}
                    </span>
                    <div style={{ fontSize: 13.5, color: 'var(--muted)', display: 'flex', gap: 7, alignItems: 'center' }}>
                      <Clock size={15} />
                      {SCHEDULE[type]}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--g-700)', letterSpacing: '-.02em' }}>
                      {money(FEES[type])}
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}> / month</span>
                    </div>
                    <Link to="/login" className="gk-btn gk-btn--primary gk-btn--sm gk-btn--block">
                      <Cart size={15} />
                      Sign in to enrol
                    </Link>
                  </article>
                ))}
              </div>

              <div className="gk-note" style={{ marginTop: 18 }}>
                <Calendar size={17} />
                <span>
                  Fees are billed monthly and include every PDF tute in the LMS. A one-time admission fee applies to a new
                  batch and is shown at checkout.
                </span>
              </div>
            </div>

            {/* ---- real live seminars ---- */}
            {upcomingSeminars.length > 0 && (
              <div style={{ marginTop: 44 }}>
                <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Video size={18} />
                  Live seminars
                </h3>
                <div className="gk-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                  {upcomingSeminars.map((s) => {
                    const full = s.seats > 0 && s.registered >= s.seats
                    return (
                      <article className="gk-card gk-card__body" key={s.id} style={{ display: 'grid', gap: 10 }}>
                        <span
                          className="gk-chip"
                          style={{ justifySelf: 'start', ...(s.isFree ? { background: 'var(--g-600)', color: '#fff' } : {}) }}
                        >
                          {s.isFree ? 'Free' : money(s.price)}
                        </span>
                        <b style={{ lineHeight: 1.35 }}>{s.title}</b>
                        <div style={{ fontSize: 13.5, color: 'var(--muted)', display: 'flex', gap: 7, alignItems: 'center' }}>
                          <Calendar size={15} />
                          {fmtDateTime(s.startsAt)}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 7, alignItems: 'center' }}>
                          <Users size={14} />
                          {s.registered} registered{s.seats > 0 ? ` · ${Math.max(0, s.seats - s.registered)} seats left` : ''}
                        </div>
                        <Link to="/login" className={`gk-btn ${full ? 'gk-btn--ghost' : 'gk-btn--primary'} gk-btn--sm gk-btn--block`}>
                          <Video size={15} />
                          {full ? 'Seminar full' : s.isFree ? 'Sign in to register' : 'Sign in to join'}
                        </Link>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ---- real 1-to-1 time slots ---- */}
            {upcomingSlots.length > 0 && (
              <div style={{ marginTop: 44 }}>
                <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} />
                  Available time slots
                </h3>
                <div className="gk-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  {upcomingSlots.map((slot) => (
                    <article className="gk-card gk-card__body" key={slot.id} style={{ display: 'grid', gap: 10 }}>
                      <div style={{ fontSize: 13.5, color: 'var(--muted)', display: 'flex', gap: 7, alignItems: 'center' }}>
                        <Calendar size={15} />
                        {fmtDateTime(slot.date)}
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--muted)', display: 'flex', gap: 7, alignItems: 'center' }}>
                        <Clock size={15} />
                        {slot.start} – {slot.end}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--g-700)' }}>
                        {slot.price > 0 ? money(slot.price) : 'Free'}
                      </div>
                      <Link to="/login" className="gk-btn gk-btn--primary gk-btn--sm gk-btn--block">
                        <Calendar size={15} />
                        Sign in to book
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      {related.length > 0 && (
        <Section tone="paper">
          <SectionHead
            eyebrow="Same stream"
            title={`More from ${tr(stream.name)}`}
            text="Students who take this subject usually pair it with one of these."
          />
          <div className="gk-grid gk-grid--4">
            {related.map((r) => (
              <TutorCard key={r.id} lecturer={r} />
            ))}
          </div>
        </Section>
      )}

    </>
  )
}
