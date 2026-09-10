/**
 * Home — banner carousel, the four streams, the statistics band, how it works,
 * the lecturer panel, the results rail, testimonials and the FAQ.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroArt from '../art/HeroArt.jsx'
import SiteAds from '../SiteAds.jsx'
import { GridLines } from '../art/Decor.jsx'
import { ArrowRight } from '../art/Icons.jsx'
import {
  Section, SectionHead, StreamCard, TutorCard, QuoteCard, CtaBand, Accordion,
} from '../components.jsx'
import { useLang } from '../i18n/LanguageContext.jsx'
import { useLecturers } from '../LecturersContext.jsx'
import {
  heroSlides, streams, stats, steps, testimonials, faqs, site,
} from '../siteData.js'

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

      <Section tight>
        <CtaBand />
      </Section>
    </>
  )
}
