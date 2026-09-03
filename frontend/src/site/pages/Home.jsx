/**
 * Home — banner carousel, the four streams, the statistics band, how it works,
 * the lecturer panel, the results rail, testimonials and the FAQ.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroArt from '../art/HeroArt.jsx'
import { GridLines } from '../art/Decor.jsx'
import { ArrowRight, Sparkle } from '../art/Icons.jsx'
import {
  Section, SectionHead, StreamCard, TutorCard, QuoteCard, CtaBand, Accordion, ResultRail,
} from '../components.jsx'
import {
  heroSlides, streams, stats, steps, lecturers, lecturersOf, results, testimonials, faqs, site,
} from '../siteData.js'

/* ---------------------------------------------------------------- */

function Hero() {
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
              {slide.kicker}
            </span>
            <h1>{slide.title}</h1>
            <p className="gk-hero__text">{slide.text}</p>

            <div className="gk-hero__cta">
              <Link to={slide.cta.to} className="gk-btn gk-btn--primary">
                {slide.cta.label}
                <ArrowRight size={17} />
              </Link>
              <Link to={slide.alt.to} className="gk-btn gk-btn--on-dark">
                {slide.alt.label}
              </Link>
            </div>

            <div className="gk-hero__trust">
              {stats.slice(0, 3).map((s) => (
                <div key={s.label}>
                  <strong>
                    {s.value.toLocaleString('en-LK')}
                    {s.suffix}
                  </strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            <div className="gk-hero__dots" role="tablist" aria-label="Banner slides">
              {heroSlides.map((s, n) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={n === i}
                  aria-label={`Slide ${n + 1}: ${s.kicker}`}
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
  const featured = lecturers.filter((l) => l.featured).slice(0, 8)

  return (
    <>
      <Hero />

      {/* ---- streams ---- */}
      <div className="gk-wrap gk-streams">
        <div className="gk-grid gk-grid--4">
          {streams.map((s) => (
            <StreamCard key={s.id} stream={s} count={lecturersOf(s.id).length} />
          ))}
        </div>
      </div>

      {/* ---- statistics ---- */}
      <Section tight>
        <div className="gk-stats-row">
          {stats.map((s) => (
            <div className="gk-stat" key={s.label}>
              <div className="gk-stat__value">
                {s.value.toLocaleString('en-LK')}
                {s.suffix}
              </div>
              <div className="gk-stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- how it works ---- */}
      <Section>
        <SectionHead
          eyebrow="How it works"
          title="Four steps from here to your first lesson"
          text="No branch visit, no interview, no waiting list. Register today and you can be in a class this week."
        />
        <div className="gk-grid gk-grid--4">
          {steps.map((s) => (
            <article className="gk-card gk-step" key={s.n}>
              <div className="gk-step__n">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ---- lecturer panel ---- */}
      <Section tone="mint">
        <SectionHead
          eyebrow="Our lecturers"
          title="The panel your syllabus deserves"
          text="Forty-eight lecturers across four streams, each teaching the subject they have spent their career on."
        >
          <Link to="/lecturers" className="gk-btn gk-btn--ghost" style={{ marginTop: 22 }}>
            See all lecturers
            <ArrowRight size={16} />
          </Link>
        </SectionHead>
        <div className="gk-grid gk-grid--4">
          {featured.map((l) => (
            <TutorCard key={l.id} lecturer={l} />
          ))}
        </div>
      </Section>

      {/* ---- result posters, on an endless rail ---- */}
      <Section tone="paper" tight>
        <SectionHead
          center
          eyebrow="Congratulations"
          title="The 2025 results wall"
          text="The rail moves on by itself — hover to hold it and read a card."
        />
      </Section>
      <div style={{ paddingBottom: 84, background: 'var(--paper)' }}>
        <ResultRail items={results} interval={3.2} glide={0.9} />
      </div>

      {/* ---- testimonials ---- */}
      <Section tone="paper">
        <SectionHead
          eyebrow="Student stories"
          title="In their own words"
          text="Studied with us? Tell other students about your experience — your review appears here once it is approved."
        />
        <div className="gk-grid gk-grid--2">
          {testimonials.map((t) => (
            <QuoteCard key={t.id} item={t} />
          ))}
        </div>
      </Section>

      {/* ---- FAQ ---- */}
      <Section>
        <div className="gk-grid gk-grid--2" style={{ gap: 48, alignItems: 'start' }}>
          <div>
            <SectionHead
              eyebrow="Questions"
              title="The things parents ask first"
              text="If your question is not here, message us on WhatsApp — a person answers during working hours."
            />
            <span className="gk-chip gk-chip--gold">
              <Sparkle size={15} />
              {site.motto}
            </span>
          </div>
          <Accordion items={faqs} />
        </div>
      </Section>

      <Section tight>
        <CtaBand />
      </Section>
    </>
  )
}
