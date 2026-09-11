/**
 * Our Lecturers — the full panel, filtered by stream, subject, medium and a
 * free-text search. The stream lives in the query string so the stream cards
 * on the home page and the footer can deep-link straight into a filtered list.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageBanner, Section, TutorCard } from '../components.jsx'
import { ChevronDown, Search, Users } from '../art/Icons.jsx'
import { streams, streamById } from '../siteData.js'
import { useLecturers } from '../LecturersContext.jsx'
import { useLang } from '../i18n/LanguageContext.jsx'

function SubjectPills({ streamId, lecturers, selected, onSelect }) {
  const streamDef = streamById(streamId)
  if (!streamDef) return null

  // Subjects that actually have lecturers in this stream — guaranteed to filter
  const activeSubjects = [...new Set(
    lecturers.filter((l) => l.streams.includes(streamId)).flatMap((l) => l.subjects)
  )].sort()

  // Stream definition subjects with no matching lecturers → Coming Soon
  const activeSet = new Set(activeSubjects.map((s) => s.toLowerCase()))
  const comingSoon = streamDef.subjects.filter((s) => !activeSet.has(s.toLowerCase()))

  return (
    <div className="gk-pills" style={{ margin: '4px 0' }}>
      <button
        type="button"
        className={`gk-pill${selected === 'all' ? ' is-on' : ''}`}
        onClick={() => onSelect('all')}
      >
        All
      </button>
      {activeSubjects.map((s) => (
        <button
          key={s}
          type="button"
          className={`gk-pill${selected === s ? ' is-on' : ''}`}
          onClick={() => onSelect(s)}
        >
          {s}
        </button>
      ))}
      {comingSoon.map((s) => (
        <span key={s} className="gk-pill" style={{ cursor: 'default', opacity: 0.6 }}>
          {s}
          <span className="gk-chip gk-chip--gold" style={{ height: 20, padding: '0 7px', fontSize: 10.5, marginLeft: 6 }}>
            Coming Soon
          </span>
        </span>
      ))}
    </div>
  )
}

/**
 * Stream filter with the grades of each stream nested one level in, the way the
 * registration subject picker nests its groups: the closed control shows the
 * current pick ("Ordinary Level · Grade 10"), opening it lists every stream, and
 * a stream with grades expands to reveal them. Picking a grade selects the
 * stream and the grade together; picking "All …" keeps the whole stream.
 */
function StreamGradePicker({ streams, gradesByStream, stream, grade, tr, allLabel, onPick }) {
  const [open, setOpen] = useState(false)
  // The one stream whose grades are showing in the side panel (cascade menu).
  const [flyout, setFlyout] = useState(stream !== 'all' ? stream : null)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const away = (e) => !rootRef.current?.contains(e.target) && setOpen(false)
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  const streamName = (id) => tr(streams.find((s) => s.id === id)?.name) || id
  const label =
    stream === 'all'
      ? allLabel
      : grade && grade !== 'all'
        ? `${streamName(stream)} · ${grade}`
        : streamName(stream)

  const pick = (sid, g) => {
    onPick(sid, g)
    setOpen(false)
  }

  const flyoutGrades = flyout ? gradesByStream[flyout] || [] : []

  return (
    <div className={`gk-multi${open ? ' is-open' : ''}`} ref={rootRef} style={{ minWidth: 200 }}>
      <div
        className="gk-multi__control"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label="Stream and grade"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen((o) => !o))}
      >
        <span className="gk-multi__tags">
          <span className={stream === 'all' ? 'gk-multi__placeholder' : undefined}>{label}</span>
        </span>
        <ChevronDown size={18} className="gk-multi__caret" />
      </div>

      {open && (
        <>
          <div className="gk-multi__menu">
            <div className="gk-multi__list" role="listbox">
              <button
                type="button"
                className={`gk-multi__opt${stream === 'all' ? ' is-on' : ''}`}
                onClick={() => pick('all', 'all')}
              >
                {allLabel}
              </button>
              {streams.map((s) => {
                const gs = gradesByStream[s.id] || []
                const activeStream = stream === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`gk-multi__grouphead${flyout === s.id ? ' is-open' : ''}${activeStream ? ' gk-multi__grouphead--active' : ''}`}
                    aria-expanded={flyout === s.id}
                    onClick={() => (gs.length ? setFlyout(s.id) : pick(s.id, 'all'))}
                    onMouseEnter={() => gs.length && setFlyout(s.id)}
                  >
                    <span className="gk-multi__groupname">{tr(s.name)}</span>
                    {gs.length > 0 && (
                      <ChevronDown
                        size={16}
                        className="gk-multi__groupcaret"
                        style={{ transform: 'rotate(-90deg)' }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {flyoutGrades.length > 0 && (
            <div className="gk-multi__flyout">
              <div className="gk-multi__flyouthead">{streamName(flyout)}</div>
              <button
                type="button"
                className={`gk-multi__opt${stream === flyout && (!grade || grade === 'all') ? ' is-on' : ''}`}
                onClick={() => pick(flyout, 'all')}
              >
                All {streamName(flyout)}
              </button>
              {flyoutGrades.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`gk-multi__opt${stream === flyout && grade === g ? ' is-on' : ''}`}
                  onClick={() => pick(flyout, g)}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

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
  const [grade, setGrade] = useState('all')
  const [medium, setMedium] = useState('all')
  const [sort, setSort] = useState('rating')

  const setStream = (id, nextGrade = 'all') => {
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('stream')
    else next.set('stream', id)
    setParams(next, { replace: true })
    setSubject('all')
    setGrade(nextGrade)
  }

  // Subjects offered inside whichever stream is selected.
  const subjects = useMemo(() => {
    const pool = stream === 'all' ? lecturers : lecturers.filter((l) => l.streams.includes(stream))
    return [...new Set(pool.flatMap((l) => l.subjects))].sort()
  }, [lecturers, stream])

  // Grades taught inside each stream (Grade 10, Grade 11 …), for the picker's
  // nested sub-lists.
  const gradesByStream = useMemo(() => {
    const map = {}
    for (const s of streams) {
      const pool = lecturers.filter((l) => l.streams.includes(s.id))
      map[s.id] = [...new Set(pool.flatMap((l) => l.grades || []))].sort()
    }
    return map
  }, [lecturers])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return lecturers
      .filter((l) => stream === 'all' || l.streams.includes(stream))
      .filter((l) => subject === 'all' || l.subjects.includes(subject))
      .filter((l) => grade === 'all' || (l.grades || []).includes(grade))
      .filter((l) => medium === 'all' || l.mediums.includes(medium))
      .filter(
        (l) =>
          !needle ||
          l.name.toLowerCase().includes(needle) ||
          l.subject.toLowerCase().includes(needle) ||
          l.title.toLowerCase().includes(needle)
      )
      .sort(SORTS[sort])
  }, [lecturers, q, stream, subject, grade, medium, sort])

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

          <StreamGradePicker
            streams={streams}
            gradesByStream={gradesByStream}
            stream={stream}
            grade={grade}
            tr={tr}
            allLabel={t('lect.allStreams')}
            onPick={(sid, g) => setStream(sid, g)}
          />

          {stream !== 'all' ? (
            <SubjectPills
              streamId={stream}
              lecturers={lecturers}
              selected={subject}
              onSelect={setSubject}
            />
          ) : (
            <select className="gk-select" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject">
              <option value="all">{t('lect.allSubjects')}</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

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
                setGrade('all')
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
