/**
 * Presentational building blocks shared by the public pages.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import Portrait from './art/Portrait.jsx'
import ResultCard from './art/ResultCard.jsx'
import Flyer from './art/Flyer.jsx'
import { ArrowRight, ChevronDown, ChevronRight, Star, Quote, Check } from './art/Icons.jsx'
import { Medal } from './art/Decor.jsx'
import { streamById } from './siteData.js'

/* ---------------------------------------------------------------- */
/* Sections                                                          */
/* ---------------------------------------------------------------- */

export function Section({ tone = '', tight, id, children }) {
  const cls = ['gk-section', tone && `gk-section--${tone}`, tight && 'gk-section--tight']
    .filter(Boolean)
    .join(' ')
  return (
    <section className={cls} id={id}>
      <div className="gk-wrap">{children}</div>
    </section>
  )
}

export function SectionHead({ eyebrow, title, text, center, children }) {
  return (
    <header className={`gk-head${center ? ' gk-head--center' : ''}`}>
      {eyebrow && <span className="gk-eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {children}
    </header>
  )
}

export function PageBanner({ title, text, crumb }) {
  return (
    <div className="gk-banner">
      <div className="gk-banner__glow" />
      <div className="gk-wrap">
        <nav className="gk-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} />
          <span>{crumb || title}</span>
        </nav>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Lecturer card                                                     */
/* ---------------------------------------------------------------- */

export function TutorCard({ lecturer }) {
  const l = lecturer
  return (
    <Link to={`/lecturers/${l.id}`} className="gk-card gk-card--hover gk-tutor">
      <div className="gk-tutor__photo">
        <Portrait id={l.id} name={l.name} />
        <span className="gk-tutor__medium">{l.medium} medium</span>
      </div>
      <div className="gk-tutor__body">
        <span className="gk-tutor__subject">{l.subject}</span>
        <span className="gk-tutor__name">{l.name}</span>
        <span className="gk-tutor__title">{l.title}</span>
        <div className="gk-tutor__meta">
          <span className="gk-tutor__rating">
            <Star size={14} />
            {l.rating.toFixed(1)}
          </span>
          <span>{l.students.toLocaleString('en-LK')} students</span>
        </div>
      </div>
    </Link>
  )
}

/* ---------------------------------------------------------------- */
/* Campaign flyer card                                               */
/* ---------------------------------------------------------------- */

export function FlyerCard({ campaign, action }) {
  const c = campaign
  return (
    <article className="gk-card gk-card--hover gk-flyer">
      <div className="gk-flyer__art">
        <Flyer art={c.art} />
        <span className="gk-flyer__badge">{c.badge}</span>
      </div>
      <div className="gk-flyer__body">
        <span className="gk-flyer__sub">{c.subtitle}</span>
        <h3>{c.title}</h3>
        <p className="gk-flyer__detail">{c.detail}</p>
        <div className="gk-flyer__foot">
          <div>
            <div className="gk-flyer__price">
              {c.price}
              {c.was && <span className="gk-flyer__was">{c.was}</span>}
            </div>
            <div className="gk-flyer__period">{c.period}</div>
          </div>
          {action}
        </div>
      </div>
    </article>
  )
}

/* ---------------------------------------------------------------- */
/* Stream card                                                       */
/* ---------------------------------------------------------------- */

export function StreamCard({ stream, count }) {
  return (
    <Link to={`/lecturers?stream=${stream.id}`} className="gk-stream-card">
      <span className="gk-stream-card__level">{stream.level}</span>
      <h3>{stream.name}</h3>
      <p>{stream.blurb}</p>
      <div className="gk-stream-card__foot">
        <span>{count} lecturers</span>
        <span className="gk-link">
          View <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  )
}

/* ---------------------------------------------------------------- */
/* Achievements & testimonials                                       */
/* ---------------------------------------------------------------- */

export function RankCard({ item, tone }) {
  return (
    <article className="gk-card gk-rank">
      <span className="gk-rank__medal">
        <Medal tone={tone} label={item.rank} />
      </span>
      <span className="gk-rank__title">{item.rank}</span>
      <span className="gk-rank__name">{item.name}</span>
      <span className="gk-rank__detail">{item.detail}</span>
      <span className="gk-tag" style={{ marginTop: 8 }}>
        {item.year}
      </span>
    </article>
  )
}

export function QuoteCard({ item }) {
  return (
    <article className="gk-card gk-quote">
      <span className="gk-quote__mark">
        <Quote size={30} />
      </span>
      <p>{item.quote}</p>
      <div className="gk-quote__who">
        <span style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', display: 'block', flex: 'none' }}>
          <Portrait id={item.id + item.name} name={item.name} size={46} />
        </span>
        <span>
          <b>{item.name}</b>
          <span>{item.role}</span>
        </span>
      </div>
    </article>
  )
}


/* ---------------------------------------------------------------- */
/* Result rail                                                       */
/* ---------------------------------------------------------------- */

/**
 * An endlessly looping row of result posters.
 *
 * The card list is rendered twice inside one track. The track animates by
 * exactly -50% — one full copy — so the moment the first copy has scrolled
 * off, the second is sitting in precisely the same place and the loop
 * restarts invisibly. Hover or keyboard focus pauses it.
 */
export function ResultRail({ items, seconds = 70 }) {
  const loop = [...items, ...items]
  return (
    <div className="gk-marquee" style={{ '--gk-marquee-duration': `${seconds}s` }}>
      <div className="gk-marquee__track">
        {loop.map((r, i) => (
          <ResultCard key={`${r.id}-${i}`} result={r} duplicate={i >= items.length} />
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Accordion (FAQ)                                                   */
/* ---------------------------------------------------------------- */

export function Accordion({ items }) {
  const [open, setOpen] = useState(0)
  return (
    <div>
      {items.map((item, i) => (
        <div key={item.q} className={`gk-acc${open === i ? ' is-open' : ''}`}>
          <button
            type="button"
            className="gk-acc__q"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            {item.q}
            <ChevronDown size={19} />
          </button>
          {open === i && <p className="gk-acc__a">{item.a}</p>}
        </div>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Call to action band                                               */
/* ---------------------------------------------------------------- */

export function CtaBand({
  title = 'Ready to sit your first class?',
  text = 'Create an account, pick a lecturer and join this week’s lesson. The first week costs nothing.',
  primary = { to: '/register', label: 'Create a free account' },
  secondary = { to: '/lecturers', label: 'Browse the panel' },
}) {
  return (
    <div className="gk-cta">
      <div className="gk-cta__glow" />
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <div className="gk-cta__actions">
        <Link to={primary.to} className="gk-btn gk-btn--primary">
          {primary.label}
        </Link>
        {secondary && (
          <Link to={secondary.to} className="gk-btn gk-btn--on-dark">
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Misc                                                              */
/* ---------------------------------------------------------------- */

export function Ticks({ items }) {
  return (
    <ul className="gk-ticks">
      {items.map((t) => (
        <li key={t} className="gk-tick">
          <Check size={17} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export function StreamTag({ id }) {
  const s = streamById(id)
  return s ? <span className="gk-tag">{s.name}</span> : null
}
