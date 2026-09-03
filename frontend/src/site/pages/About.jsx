/**
 * About Us — the founder, the motto, vision and mission, the values and the
 * timeline, matching the sections the reference site carries.
 */

import { Link } from 'react-router-dom'
import Portrait from '../art/Portrait.jsx'
import { Award, Sparkle, Globe, Shield, ArrowRight } from '../art/Icons.jsx'
import { PageBanner, Section, SectionHead, CtaBand } from '../components.jsx'
import { about, site, stats, streams, lecturersOf } from '../siteData.js'

export default function About() {
  return (
    <>
      <PageBanner
        title="About Us"
        text={`${site.tagline} — experienced lecturers, certified across every subject stream.`}
      />

      {/* ---- founder ---- */}
      <Section>
        <div className="gk-grid gk-grid--2" style={{ gap: 52, alignItems: 'center' }}>
          <div className="gk-card" style={{ overflow: 'hidden', maxWidth: 460 }}>
            <div style={{ aspectRatio: '1/1', background: 'var(--g-50)' }}>
              <Portrait id="rohana-wickramasinghe" name={about.founder.name} />
            </div>
            <div className="gk-card__body" style={{ display: 'grid', gap: 4 }}>
              <b style={{ fontSize: 18 }}>{about.founder.name}</b>
              <span style={{ color: 'var(--g-600)', fontWeight: 700, fontSize: 13.5 }}>{about.founder.role}</span>
              <span className="gk-chip" style={{ justifySelf: 'start', marginTop: 10 }}>
                <Award size={14} />
                24 years teaching Chemistry
              </span>
            </div>
          </div>

          <div>
            <SectionHead eyebrow="Our founder" title="Started by a teacher, not an investor" />
            <div className="gk-prose">
              <p>{about.founder.text}</p>
            </div>
            <div className="gk-note" style={{ marginTop: 24 }}>
              <Sparkle size={17} />
              <span>
                <b>{site.motto}</b> — the motto the academy was founded on.
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* ---- vision & mission ---- */}
      <Section tone="mint">
        <div className="gk-grid gk-grid--2">
          <article className="gk-card gk-card__body" style={{ padding: 34 }}>
            <span className="gk-offer__icon">
              <Globe size={25} />
            </span>
            <h2 style={{ margin: '20px 0 14px', fontSize: 26 }}>Our vision</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 16.5 }}>{about.vision}</p>
          </article>
          <article className="gk-card gk-card__body" style={{ padding: 34 }}>
            <span className="gk-offer__icon">
              <Shield size={25} />
            </span>
            <h2 style={{ margin: '20px 0 14px', fontSize: 26 }}>Our mission</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 16.5 }}>{about.mission}</p>
          </article>
        </div>
      </Section>

      {/* ---- numbers ---- */}
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

      {/* ---- values ---- */}
      <Section>
        <SectionHead
          center
          eyebrow="What we hold to"
          title="Four things we will not trade away"
          text="They are the reason parents stay with us for a second and third year."
        />
        <div className="gk-grid gk-grid--4">
          {about.values.map((v) => (
            <article className="gk-card gk-card__body" key={v.title} style={{ display: 'grid', gap: 10 }}>
              <h3 style={{ fontSize: 16.5 }}>{v.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>{v.text}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ---- timeline ---- */}
      <Section tone="paper">
        <div className="gk-grid gk-grid--2" style={{ gap: 52, alignItems: 'start' }}>
          <SectionHead
            eyebrow="Our story"
            title="From forty students to the whole island"
            text="Gurukela grew one batch at a time, and every stream on the panel started because students asked for it."
          />
          <div className="gk-timeline">
            {about.timeline.map((t) => (
              <div className="gk-timeline__row" key={t.year}>
                <span className="gk-timeline__year">{t.year}</span>
                <div className="gk-timeline__body">
                  <p>{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ---- streams ---- */}
      <Section>
        <SectionHead
          eyebrow="What we teach"
          title="Four streams, one timetable"
          text="Every subject on the national syllabus that our panel can teach properly — and nothing we cannot."
        />
        <div className="gk-grid gk-grid--2">
          {streams.map((s) => (
            <article className="gk-card gk-card__body" key={s.id} style={{ display: 'grid', gap: 12 }}>
              <span className="gk-stream-card__level">{s.level}</span>
              <h3>{s.name}</h3>
              <div className="gk-pills">
                {s.subjects.map((sub) => (
                  <span className="gk-tag" key={sub}>
                    {sub}
                  </span>
                ))}
              </div>
              <Link to={`/lecturers?stream=${s.id}`} className="gk-link" style={{ marginTop: 6 }}>
                {lecturersOf(s.id).length} lecturers
                <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      </Section>

      <Section tight>
        <CtaBand
          title="Come and see a class before you decide"
          text="Sit the first week free with any lecturer on the panel. Nothing to pay, nothing to cancel."
        />
      </Section>
    </>
  )
}
