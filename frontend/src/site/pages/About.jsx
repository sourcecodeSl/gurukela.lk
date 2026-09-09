/**
 * About Us — the founder, the motto, vision and mission, the values and the
 * timeline, matching the sections the reference site carries.
 */

import { Link } from 'react-router-dom'
import Portrait from '../art/Portrait.jsx'
import { Award, Sparkle, Globe, Shield, ArrowRight } from '../art/Icons.jsx'
import { PageBanner, Section, SectionHead, CtaBand } from '../components.jsx'
import { about, site, stats, streams } from '../siteData.js'
import { useLecturers } from '../LecturersContext.jsx'
import { useLang } from '../i18n/LanguageContext.jsx'

export default function About() {
  const { t, tr } = useLang()
  const { lecturersOf } = useLecturers()
  return (
    <>
      <PageBanner
        title={t('about.title')}
        text={`${tr(site.tagline)} — experienced lecturers, certified across every subject stream.`}
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
            <SectionHead eyebrow={t('about.founder.eyebrow')} title={t('about.founder.title')} />
            <div className="gk-prose">
              <p>{about.founder.text}</p>
            </div>
            <div className="gk-note" style={{ marginTop: 24 }}>
              <Sparkle size={17} />
              <span>
                <b>{tr(site.motto)}</b> — {t('about.motto')}
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* ---- the gap we bridge ---- */}
      <Section tone="paper">
        <div className="gk-grid gk-grid--2" style={{ gap: 52, alignItems: 'center' }}>
          <SectionHead eyebrow="Why we exist" title={about.problem.title} />
          <div className="gk-prose">
            {about.problem.paras.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </Section>

      {/* ---- vision & mission ---- */}
      <Section tone="mint">
        <div className="gk-grid gk-grid--2">
          <article className="gk-card gk-card__body" style={{ padding: 34 }}>
            <span className="gk-feature-icon">
              <Globe size={25} />
            </span>
            <h2 style={{ margin: '20px 0 14px', fontSize: 26 }}>{t('about.vision')}</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 16.5 }}>{about.vision}</p>
          </article>
          <article className="gk-card gk-card__body" style={{ padding: 34 }}>
            <span className="gk-feature-icon">
              <Shield size={25} />
            </span>
            <h2 style={{ margin: '20px 0 14px', fontSize: 26 }}>{t('about.mission')}</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 16.5 }}>{about.mission}</p>
          </article>
        </div>
      </Section>

      {/* ---- numbers ---- */}
      <Section tight>
        <div className="gk-stats-row">
          {stats.map((s) => (
            <div className="gk-stat" key={tr(s.label)}>
              <div className="gk-stat__value">
                {s.value.toLocaleString('en-LK')}
                {s.suffix}
              </div>
              <div className="gk-stat__label">{tr(s.label)}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- values ---- */}
      <Section>
        <SectionHead
          center
          eyebrow={t('about.values.eyebrow')}
          title={t('about.values.title')}
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
            eyebrow={t('about.story.eyebrow')}
            title={t('about.story.title')}
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
          eyebrow={t('about.teach.eyebrow')}
          title={t('about.teach.title')}
          text="Every subject on the national syllabus our panel can teach properly, plus the language and professional exams students keep asking for."
        />
        <div className="gk-grid gk-grid--2">
          {streams.map((s, i) => (
            <article
              className="gk-card gk-card__body"
              key={s.id}
              /* An odd card count would leave a hole in the last row; the final
                 one takes the full width instead. */
              style={{
                display: 'grid',
                gap: 12,
                gridColumn: i === streams.length - 1 && streams.length % 2 ? 'span 2' : undefined,
              }}
            >
              <span className="gk-stream-card__level">{tr(s.level)}</span>
              <h3>{tr(s.name)}</h3>
              <div className="gk-pills">
                {s.subjects.map((sub) => (
                  <span className="gk-tag" key={sub}>
                    {sub}
                  </span>
                ))}
              </div>
              <Link to={`/lecturers?stream=${s.id}`} className="gk-link" style={{ marginTop: 6 }}>
                {lecturersOf(s.id).length} {t('common.lecturers')}
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
