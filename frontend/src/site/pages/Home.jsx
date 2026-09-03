/**
 * Home — mirrors the reference site's landing page: banner carousel, the four
 * streams, the statistics band, what the academy offers, the lecturer panel,
 * achievements, testimonials, WhatsApp channels and the contact block.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroArt from '../art/HeroArt.jsx'
import { GridLines } from '../art/Decor.jsx'
import {
  ArrowRight, Video, Replay, Truck, Paper, Mentor, Chart, WhatsApp, Phone, Mail, Pin, Sparkle,
} from '../art/Icons.jsx'
import {
  Section, SectionHead, StreamCard, TutorCard, RankCard, QuoteCard, CtaBand, Accordion, ResultRail,
} from '../components.jsx'
import {
  heroSlides, streams, stats, offers, steps, lecturers, lecturersOf, achievements, results, testimonials,
  channels, faqs, contact, site,
} from '../siteData.js'

const OFFER_ICON = { live: Video, replay: Replay, tute: Truck, paper: Paper, mentor: Mentor, chart: Chart }
const MEDALS = ['gold', 'silver', 'green', 'green', 'silver']

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

      {/* ---- what Gurukela offers ---- */}
      <Section tone="paper">
        <SectionHead
          center
          eyebrow="What Gurukela offers"
          title="Everything a class needs, in one login"
          text="Not just a video link. Live teaching, printed material, marked papers and a record your parents can read."
        />
        <div className="gk-grid gk-grid--3">
          {offers.map((o) => {
            const Icon = OFFER_ICON[o.icon]
            return (
              <article className="gk-card gk-card--hover gk-offer" key={o.id}>
                <span className="gk-offer__icon">
                  <Icon size={25} />
                </span>
                <h3>{o.title}</h3>
                <p>{o.text}</p>
              </article>
            )
          })}
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

      {/* ---- achievements ---- */}
      <Section>
        <SectionHead
          center
          eyebrow="Ranking & achievements"
          title="Results our students earned"
          text="Every name here sat their exam from home, on the Gurukela timetable."
        />
        <div className="gk-grid gk-grid--4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {achievements.map((a, i) => (
            <RankCard key={a.id} item={a} tone={MEDALS[i]} />
          ))}
        </div>
      </Section>

      {/* ---- result posters, on an endless rail ---- */}
      <Section tone="paper" tight>
        <SectionHead
          center
          eyebrow="Congratulations"
          title="The 2025 results wall"
          text="Hover to stop the rail and read a card."
        />
      </Section>
      <div style={{ paddingBottom: 84, background: 'var(--paper)' }}>
        <ResultRail items={results} seconds={90} />
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

      {/* ---- WhatsApp channels ---- */}
      <Section tone="dark">
        <div className="gk-grid gk-grid--2" style={{ alignItems: 'center', gap: 48 }}>
          <div>
            <SectionHead
              eyebrow="Community"
              title="Join the batch channel"
              text="Timetable changes, tute drops, exam notices and paper discussion — where your batch actually talks."
            />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {channels.map((c) => (
              <a
                key={c.id}
                className="gk-channel"
                href={`https://wa.me/${contact.whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="gk-channel__icon">
                  <WhatsApp size={24} />
                </span>
                <span>
                  <b>{c.name}</b>
                  <span>{c.detail}</span>
                </span>
                <span className="gk-channel__members">{c.members} members</span>
              </a>
            ))}
          </div>
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

      {/* ---- contact strip ---- */}
      <Section tone="paper" id="contact" tight>
        <div className="gk-grid gk-grid--3">
          <div className="gk-info__row">
            <span className="gk-info__icon">
              <Pin size={20} />
            </span>
            <div>
              <b>Visit us</b>
              <p>{contact.address}</p>
            </div>
          </div>
          <div className="gk-info__row">
            <span className="gk-info__icon">
              <Phone size={20} />
            </span>
            <div>
              <b>Call us</b>
              <p>
                {contact.phones[0]} / {contact.phones[1]}
              </p>
            </div>
          </div>
          <div className="gk-info__row">
            <span className="gk-info__icon">
              <Mail size={20} />
            </span>
            <div>
              <b>Email us</b>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </div>
          </div>
        </div>
      </Section>

      <Section tight>
        <CtaBand />
      </Section>
    </>
  )
}
