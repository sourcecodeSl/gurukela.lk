/**
 * Home — banner carousel, the four streams, the statistics band, how it works,
 * the lecturer panel, the results rail, testimonials and the FAQ.
 */

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroArt from '../art/HeroArt.jsx'
import SiteAds from '../SiteAds.jsx'
import { GridLines } from '../art/Decor.jsx'
import { ArrowRight, Calendar, Clock, Users, Video } from '../art/Icons.jsx'
import {
  Section, SectionHead, StreamCard, TutorCard, QuoteCard, Accordion,
} from '../components.jsx'
import { useLang } from '../i18n/LanguageContext.jsx'
import { useLecturers } from '../LecturersContext.jsx'
import { api } from '../../api/client.js'
import {
  heroSlides, streams, steps, testimonials, faqs, site,
} from '../siteData.js'

const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-LK')}`
const metaRow = { display: 'flex', alignItems: 'center', gap: 7 }

/* ---------------------------------------------------------------- */

function Hero() {
  const { t, tr } = useLang()
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const slide = heroSlides[i]

  useEffect(() => {
    if (paused) return undefined
    const t = setInterval(() => setI((n) => (n + 1) % heroSlides.length), 7000)
    return () => clearInterval(t)
  }, [paused])

  return (
    <div className="gk-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <GridLines />
      <div className="gk-hero__glow" />
      <div className="gk-wrap">
        <div className="gk-hero__inner">
          <div>
            <span className="gk-hero__kicker">
              <b>New</b>
              {tr(slide.kicker)}
            </span>
            <h1>{tr(slide.title)}</h1>
            <p className="gk-hero__text">{tr(slide.text)}</p>

            <div className="gk-hero__cta">
              <Link to={slide.cta.to} className="gk-btn gk-btn--primary">
                {tr(slide.cta.label)}
                <ArrowRight size={17} />
              </Link>
              <Link to={slide.alt.to} className="gk-btn gk-btn--on-dark">
                {tr(slide.alt.label)}
              </Link>
            </div>

            <div className="gk-hero__dots" role="tablist" aria-label="Banner slides">
              {heroSlides.map((s, n) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={n === i}
                  aria-label={`${n + 1} / ${heroSlides.length}`}
                  className={`gk-hero__dot${n === i ? ' is-on' : ''}`}
                  onClick={() => setI(n)}
                />
              ))}
            </div>
          </div>

          <div className="gk-hero__art">
            <HeroArt name={slide.art} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */

/**
 * Live seminars rail on the home page. Surfaces the next few upcoming sessions
 * so the feature is visible before a visitor has to hunt for the Seminars tab.
 * Renders nothing when there is nothing upcoming to show.
 */
function HomeSeminars() {
  const { t } = useLang()
  const { lecturers } = useLecturers()
  const [seminars, setSeminars] = useState([])

  useEffect(() => {
    let alive = true
    api
      .get('/seminars', { auth: false })
      .then((rows) => alive && setSeminars(Array.isArray(rows) ? rows : []))
      .catch(() => alive && setSeminars([]))
    return () => {
      alive = false
    }
  }, [])

  const lecturerById = useMemo(() => {
    const m = {}
    for (const l of lecturers) m[l.id] = l
    return m
  }, [lecturers])

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString('en-LK', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      : t('home.seminars.tba')

  // Upcoming first, soonest at the top; take the next three for the rail.
  const list = useMemo(() => {
    const now = Date.now()
    return [...seminars]
      .filter((s) => new Date(s.startsAt || 0).getTime() >= now)
      .sort((a, b) => new Date(a.startsAt || 0) - new Date(b.startsAt || 0))
      .slice(0, 3)
  }, [seminars])

  if (list.length === 0) return null

  return (
    <Section tone="paper">
      <SectionHead
        eyebrow={t('home.seminars.eyebrow')}
        title={t('home.seminars.title')}
        text={t('home.seminars.text')}
      >
        <Link to="/seminars" className="gk-btn gk-btn--ghost" style={{ marginTop: 22 }}>
          {t('home.seminars.viewAll')}
          <ArrowRight size={16} />
        </Link>
      </SectionHead>
      <div className="gk-grid gk-grid--3">
        {list.map((s) => {
          const ins = lecturerById[s.instructorId]
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
                  {s.isFree ? t('home.seminars.free') : money(s.price)}
                </span>
                {full && <span className="gk-chip">{t('home.seminars.full')}</span>}
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
                <span style={metaRow}><Clock width={15} height={15} /> {s.durationMins} {t('home.seminars.mins')}</span>
                <span style={metaRow}><Users width={15} height={15} /> {s.registered} {t('home.seminars.registered')}</span>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <Link
                  to="/login"
                  className={`gk-btn gk-btn--block ${full ? 'gk-btn--ghost' : 'gk-btn--primary'}`}
                >
                  <Video width={16} height={16} />
                  {s.isFree ? t('home.seminars.register') : t('home.seminars.join')}
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </Section>
  )
}

/* ---------------------------------------------------------------- */

export default function Home() {
  const { t, tr } = useLang()
  const { lecturers, lecturersOf } = useLecturers()
  // No hand-picked "featured" flag on real data: surface verified lecturers
  // first, then the highest rated, and show up to eight.
  const featured = [...lecturers]
    .sort((a, b) => Number(b.verified) - Number(a.verified) || b.rating - a.rating)
    .slice(0, 8)

  return (
    <>
      <Hero />

      {/* ---- streams ---- */}
      <div className="gk-wrap gk-streams">
        <div className="gk-grid gk-grid--5">
          {streams.map((s) => (
            <StreamCard key={s.id} stream={s} count={lecturersOf(s.id).length} />
          ))}
        </div>
      </div>

      {/* ---- live seminars ---- */}
      <HomeSeminars />

      {/* ---- how it works ---- */}
      <Section>
        <SectionHead
          eyebrow={t('home.how.eyebrow')}
          title={t('home.how.title')}
          text={t('home.how.text')}
        />
        <div className="gk-grid gk-grid--4">
          {steps.map((s) => (
            <article className="gk-card gk-step" key={s.n}>
              <div className="gk-step__n">{s.n}</div>
              <h3>{tr(s.title)}</h3>
              <p>{tr(s.text)}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ---- lecturer panel ---- */}
      <Section tone="mint">
        <SectionHead
          eyebrow={t('home.panel.eyebrow')}
          title={t('home.panel.title')}
          text={`${lecturers.length} ${t('home.panel.text').replace('{streams}', streams.length)}`}
        >
          <Link to="/lecturers" className="gk-btn gk-btn--ghost" style={{ marginTop: 22 }}>
            {t('common.viewAll')}
            <ArrowRight size={16} />
          </Link>
        </SectionHead>
        <div className="gk-grid gk-grid--4">
          {featured.map((l) => (
            <TutorCard key={l.id} lecturer={l} />
          ))}
        </div>
      </Section>

      {/* ---- sponsor ads, on the same endless rail ---- */}
      <Section tone="paper" tight>
        <SectionHead
          center
          eyebrow="Sponsored"
          title="Featured programmes"
          text="The rail moves on by itself; hover to hold it and read a card."
        />
      </Section>
      <div style={{ paddingBottom: 84, background: 'var(--paper)' }}>
        <SiteAds />
      </div>

      {/* ---- testimonials ---- */}
      <Section tone="paper">
        <SectionHead
          eyebrow={t('home.stories.eyebrow')}
          title={t('home.stories.title')}
          text={t('home.stories.text')}
        />
        <div className="gk-grid gk-grid--2">
          {testimonials.map((t) => (
            <QuoteCard key={t.id} item={t} />
          ))}
        </div>
      </Section>

      {/* ---- FAQ ---- */}
      <Section>
        <SectionHead
          eyebrow={t('home.faq.eyebrow')}
          title={t('home.faq.title')}
          centered
        />
        <Accordion items={faqs} />
      </Section>

    </>
  )
}
