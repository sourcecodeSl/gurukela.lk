/**
 * About Us — the founder, the motto, vision and mission, the values and the
 * timeline, matching the sections the reference site carries.
 */

import { Link } from 'react-router-dom'
import { Globe, Shield, ArrowRight } from '../art/Icons.jsx'
import { PageBanner, Section, SectionHead } from '../components.jsx'
import { about, site, streams } from '../siteData.js'
import { useLecturers } from '../LecturersContext.jsx'
import { useLang } from '../i18n/LanguageContext.jsx'

export default function About() {
  const { t, tr } = useLang()
  const { lecturersOf } = useLecturers()
  return (
    <>
      <PageBanner
        title={t('about.title')}
        text={`${tr(site.tagline)}: experienced lecturers, certified across every subject stream.`}
      />

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
    </>
  )
}
