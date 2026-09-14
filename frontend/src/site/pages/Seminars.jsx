/**
 * Public seminars listing. Anyone can browse the free & paid live seminars our
 * instructors host, but joining needs an account — the CTA sends guests to the
 * login / register screen (same as the class flow).
 */

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { PageBanner, Section, SectionHead } from '../components.jsx'
import { Calendar, Clock, Users, Video } from '../art/Icons.jsx'
import { useLecturers } from '../LecturersContext.jsx'

const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-LK')}`

const fmt = (d) =>
  d
    ? new Date(d).toLocaleString('en-LK', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : 'Time to be announced'

const metaRow = { display: 'flex', alignItems: 'center', gap: 7 }

export default function Seminars() {
  const [seminars, setSeminars] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [when, setWhen] = useState('upcoming')
  const { lecturers } = useLecturers()

  useEffect(() => {
    let alive = true
    api
      .get('/seminars', { auth: false })
      .then((rows) => alive && setSeminars(Array.isArray(rows) ? rows : []))
      .catch(() => alive && setSeminars([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const lecturerById = useMemo(() => {
    const m = {}
    for (const l of lecturers) m[l.id] = l
    return m
  }, [lecturers])

  const { upcoming, past } = useMemo(() => {
    const now = Date.now()
    const filtered = seminars.filter((s) => {
      if (filter === 'free') return s.isFree
      if (filter === 'paid') return !s.isFree
      return true
    })
    const up = filtered
      .filter((s) => new Date(s.startsAt || 0).getTime() >= now)
      .sort((a, b) => new Date(a.startsAt || 0) - new Date(b.startsAt || 0))
    // Past ones kept separately, most recent first.
    const pa = filtered
      .filter((s) => new Date(s.startsAt || 0).getTime() < now)
      .sort((a, b) => new Date(b.startsAt || 0) - new Date(a.startsAt || 0))
    return { upcoming: up, past: pa }
  }, [seminars, filter])

  const renderCard = (s) => {
    const ins = lecturerById[s.instructorId]
    const upcomingCard = new Date(s.startsAt || 0).getTime() >= Date.now()
    const full = s.seats > 0 && s.registered >= s.seats
    return (
      <article key={s.id} className="gk-card gk-card--hover" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 18 }}>
        {s.bannerUrl && (
          <img
            src={s.bannerUrl}
            alt=""
            style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10 }}
          />
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            className="gk-chip"
            style={s.isFree ? { background: 'var(--g-600)', color: '#fff' } : undefined}
          >
            {s.isFree ? 'Free' : money(s.price)}
          </span>
          {!upcomingCard && <span className="gk-chip">Ended</span>}
          {upcomingCard && full && <span className="gk-chip">Full</span>}
        </div>

        <h3 style={{ margin: 0, lineHeight: 1.35 }}>{s.title}</h3>
        {s.description && (
          <p style={{ margin: 0, color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {s.description}
          </p>
        )}

        {ins && (
          <Link to={`/lecturers/${ins.id}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-2)' }}>
            {ins.name}
          </Link>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5, color: 'var(--muted)' }}>
          <span style={metaRow}><Calendar width={15} height={15} /> {fmt(s.startsAt)}</span>
          <span style={metaRow}><Clock width={15} height={15} /> {s.durationMins} mins</span>
          <span style={metaRow}><Users width={15} height={15} /> {s.registered} registered</span>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <Link
            to="/login"
            className={`gk-btn gk-btn--block ${upcomingCard && !full ? 'gk-btn--primary' : 'gk-btn--ghost'}`}
          >
            <Video width={16} height={16} />
            {upcomingCard ? (s.isFree ? 'Sign in to register' : 'Sign in to join') : 'View in your account'}
          </Link>
        </div>
      </article>
    )
  }

  return (
    <>
      <PageBanner
        title="Live seminars"
        crumb="Seminars"
        text="Join free and premium live sessions hosted by our lecturers — revision classes, paper discussions and special masterclasses."
      />

      <Section>
        <SectionHead
          eyebrow="What's on"
          title="Upcoming & recent seminars"
          text="Create a free student account to register and receive the live link."
        />

        <div className="gk-pills" style={{ justifyContent: 'center', marginBottom: 26 }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'free', label: 'Free' },
            { id: 'paid', label: 'Paid' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`gk-pill${filter === f.id ? ' is-on' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!loading && (upcoming.length > 0 || past.length > 0) && (
          <div className="gk-pills" style={{ justifyContent: 'center', marginBottom: 26 }}>
            {[
              { id: 'upcoming', label: `Upcoming (${upcoming.length})` },
              { id: 'past', label: `Past (${past.length})` },
            ].map((w) => (
              <button
                key={w.id}
                type="button"
                className={`gk-pill${when === w.id ? ' is-on' : ''}`}
                onClick={() => setWhen(w.id)}
              >
                {w.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading seminars…</p>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <div className="gk-empty">
            <h3>No seminars scheduled right now</h3>
            <p>Check back soon — our lecturers add new live sessions regularly.</p>
            <Link to="/lecturers" className="gk-btn gk-btn--primary">Browse lecturers</Link>
          </div>
        ) : when === 'upcoming' ? (
          upcoming.length === 0 ? (
            <div className="gk-empty"><h3>No upcoming seminars</h3><p>Check the Past tab for finished sessions.</p></div>
          ) : (
            <div className="gk-grid gk-grid--3">{upcoming.map(renderCard)}</div>
          )
        ) : past.length === 0 ? (
          <div className="gk-empty"><h3>No past seminars</h3><p>Finished seminars will show up here.</p></div>
        ) : (
          <div className="gk-grid gk-grid--3" style={{ opacity: 0.7 }}>{past.map(renderCard)}</div>
        )}
      </Section>
    </>
  )
}
