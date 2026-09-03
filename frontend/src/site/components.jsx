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
 * An endlessly looping row of result posters that steps itself along.
 *
 * The rail advances exactly one card every `interval` seconds and glides
 * there over `glide` seconds — a timed rotation rather than a constant
 * crawl, so every poster gets a beat of stillness to be read in.
 *
 * The card list is rendered twice inside one track. Stepping past the last
 * card of the first copy lands on the duplicate of the first card, which
 * sits pixel-for-pixel where the original started; once that glide ends the
 * track snaps back to index 0 with the transition switched off, so the loop
 * never shows a seam. Hover, keyboard focus and a hidden tab all pause it.
 */
export function ResultRail({ items, interval = 3.2, glide = 0.9 }) {
  const trackRef = useRef(null)
  const [step, setStep] = useState(0)
  const [index, setIndex] = useState(0)
  const [glideOn, setGlideOn] = useState(true)
  const [hold, setHold] = useState(false)
  const loop = [...items, ...items]

  /* One card's advance is its width plus the margin between cards; measure it
     from the DOM so the rail keeps working at any breakpoint. */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined
    const measure = () => {
      const [a, b] = track.children
      if (!a) return
      setStep(b ? b.offsetLeft - a.offsetLeft : a.offsetWidth)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    return () => ro.disconnect()
  }, [items.length])

  /* The clock. */
  useEffect(() => {
    if (hold || !step) return undefined
    const id = setInterval(() => setIndex((i) => i + 1), Math.max(0.6, interval) * 1000)
    return () => clearInterval(id)
  }, [hold, step, interval])

  /* Nothing to look at in a background tab — and a browser that throttles the
     timer there would otherwise queue up a pile of steps to replay on return. */
  useEffect(() => {
    const sync = () => setHold((h) => (document.hidden ? true : h && false))
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  /* Close the loop: once the glide onto the duplicate has finished, jump back
     to the real first card without a transition. */
  useEffect(() => {
    if (index < items.length) return undefined
    const id = setTimeout(() => {
      setGlideOn(false)
      setIndex(0)
    }, Math.max(0, glide) * 1000 + 60)
    return () => clearTimeout(id)
  }, [index, items.length, glide])

  /* Re-arm the transition only after the snap-back has painted. */
  useEffect(() => {
    if (glideOn) return undefined
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setGlideOn(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [glideOn])

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
      <div
        ref={trackRef}
        className="gk-marquee__track"
        style={{
          transform: `translate3d(${-index * step}px, 0, 0)`,
          transitionDuration: glideOn ? `${Math.max(0, glide)}s` : '0s',
        }}
      >
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
