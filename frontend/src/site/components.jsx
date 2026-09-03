/**
 * Presentational building blocks shared by the public pages.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Portrait from './art/Portrait.jsx'
import ResultCard from './art/ResultCard.jsx'
import Flyer from './art/Flyer.jsx'
import { ArrowRight, ChevronDown, ChevronRight, Star, Quote, Check } from './art/Icons.jsx'
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
/* Testimonials                                                      */
/* ---------------------------------------------------------------- */

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
 * An endlessly looping row of result posters that crawls along by itself.
 *
 * The rail moves continuously at `speed` pixels per second — no stepping and
 * no pauses between cards, so the row reads as one slow, even drift.
 *
 * The card list is rendered twice inside one track. The crawl advances until
 * it has travelled the width of the first copy, at which point the offset
 * wraps by exactly that distance: the duplicate now sits pixel-for-pixel
 * where the original was, so the loop never shows a seam. The transform is
 * written straight to the node each frame — putting it through state would
 * re-render every card sixty times a second.
 *
 * Hover, keyboard focus and a hidden tab all hold it still, and a visitor who
 * asks for reduced motion gets a stationary rail they can scroll by hand.
 */
export function ResultRail({ items, speed = 78 }) {
  const trackRef = useRef(null)
  const offsetRef = useRef(0)
  const [hold, setHold] = useState(false)
  const [reduced, setReduced] = useState(false)
  const loop = [...items, ...items]

  /* Respect the OS "reduce motion" setting, and follow it if it changes. */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /* The crawl. */
  useEffect(() => {
    const track = trackRef.current
    if (!track || hold || reduced) return undefined

    /* Distance to travel before the duplicate lines up with the original. */
    const lapWidth = () => {
      const first = track.children[0]
      const wrapPoint = track.children[items.length]
      return wrapPoint && first ? wrapPoint.offsetLeft - first.offsetLeft : 0
    }

    let frame = 0
    let last = performance.now()
    const tick = (now) => {
      /* Clamp the delta so a stalled tab cannot teleport the rail forwards. */
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const lap = lapWidth()
      if (lap > 0) {
        offsetRef.current = (offsetRef.current + speed * dt) % lap
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [hold, reduced, speed, items.length])

  /* Nothing to look at in a background tab. */
  useEffect(() => {
    const sync = () => setHold((h) => (document.hidden ? true : h && false))
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  const pause = useCallback(() => setHold(true), [])
  const resume = useCallback(() => setHold(document.hidden), [])

  return (
    <div
      className="gk-marquee"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <div ref={trackRef} className="gk-marquee__track">
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
