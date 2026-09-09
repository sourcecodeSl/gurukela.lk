/**
 * Our Lecturers — the full panel, filtered by stream, subject, medium and a
 * free-text search. The stream lives in the query string so the stream cards
 * on the home page and the footer can deep-link straight into a filtered list.
 */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageBanner, Section, TutorCard } from '../components.jsx'
import { Search, Users } from '../art/Icons.jsx'
import { streams, streamById } from '../siteData.js'
import { useLecturers } from '../LecturersContext.jsx'
import { useLang } from '../i18n/LanguageContext.jsx'

const SORTS = {
  rating: (a, b) => b.rating - a.rating,
  students: (a, b) => b.students - a.students,
  experience: (a, b) => b.years - a.years,
  name: (a, b) => a.name.localeCompare(b.name),
}

export default function Lecturers() {
  const { t, tr } = useLang()
  const { lecturers, loading } = useLecturers()
  const [params, setParams] = useSearchParams()
  const stream = params.get('stream') || 'all'

  const [q, setQ] = useState('')
  const [subject, setSubject] = useState('all')
  const [medium, setMedium] = useState('all')
  const [sort, setSort] = useState('rating')

  const setStream = (id) => {
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('stream')
    else next.set('stream', id)
    setParams(next, { replace: true })
    setSubject('all')
  }

  // Subjects offered inside whichever stream is selected.
  const subjects = useMemo(() => {
    const pool = stream === 'all' ? lecturers : lecturers.filter((l) => l.streams.includes(stream))
    return [...new Set(pool.flatMap((l) => l.subjects))].sort()
  }, [lecturers, stream])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return lecturers
      .filter((l) => stream === 'all' || l.streams.includes(stream))
      .filter((l) => subject === 'all' || l.subjects.includes(subject))
      .filter((l) => medium === 'all' || l.mediums.includes(medium))
      .filter(
        (l) =>
          !needle ||
          l.name.toLowerCase().includes(needle) ||
          l.subject.toLowerCase().includes(needle) ||
          l.title.toLowerCase().includes(needle)
      )
      .sort(SORTS[sort])
  }, [lecturers, q, stream, subject, medium, sort])

  const active = stream === 'all' ? null : streamById(stream)

  return (
    <>
      <PageBanner
        title={t('lect.title')}
        crumb={t('lect.title')}
        text={
          active
            ? `${tr(active.name)}: ${tr(active.blurb)}`
            : `${lecturers.length} ${t('lect.intro').replace('{streams}', streams.length)}`
        }
      />

      <Section>
        <div className="gk-filters">
          <div className="gk-search">
            <Search size={17} />
            <input
              className="gk-input"
              type="search"
              placeholder={t('lect.search')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search lecturers"
            />
          </div>

          <select className="gk-select" value={stream} onChange={(e) => setStream(e.target.value)} aria-label="Stream">
            <option value="all">{t('lect.allStreams')}</option>
            {streams.map((s) => (
              <option key={s.id} value={s.id}>
                {tr(s.name)}
              </option>
            ))}
          </select>

          <select className="gk-select" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject">
            <option value="all">{t('lect.allSubjects')}</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select className="gk-select" value={medium} onChange={(e) => setMedium(e.target.value)} aria-label="Medium">
            <option value="all">{t('lect.anyMedium')}</option>
            <option value="Sinhala">{t('lect.sinhalaMedium')}</option>
            <option value="English">{t('lect.englishMedium')}</option>
          </select>

          <select className="gk-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
            <option value="rating">{t('lect.sortRating')}</option>
            <option value="students">{t('lect.sortStudents')}</option>
            <option value="experience">{t('lect.sortExperience')}</option>
            <option value="name">{t('lect.sortName')}</option>
          </select>
        </div>

        <p className="gk-count">
          {results.length} {results.length === 1 ? t('common.lecturer') : t('common.lecturers')}
          {active ? ` ${t('lect.inStream')} ${tr(active.name)}` : ''}
        </p>

        {loading ? (
          <div className="gk-empty">
            <Users size={44} style={{ margin: '0 auto', color: 'var(--faint)' }} />
            <h3>{t('common.loading')}</h3>
          </div>
        ) : results.length ? (
          <div className="gk-grid gk-grid--4">
            {results.map((l) => (
              <TutorCard key={l.id} lecturer={l} />
            ))}
          </div>
        ) : (
          <div className="gk-empty">
            <Users size={44} style={{ margin: '0 auto', color: 'var(--faint)' }} />
            <h3>{t('lect.none.title')}</h3>
            <p>{t('lect.none.text')}</p>
            <button
              type="button"
              className="gk-btn gk-btn--ghost"
              onClick={() => {
                setQ('')
                setSubject('all')
                setMedium('all')
                setStream('all')
              }}
            >
              {t('lect.clear')}
            </button>
          </div>
        )}
      </Section>
    </>
  )
}
