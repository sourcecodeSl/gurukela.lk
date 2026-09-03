/**
 * Our Lecturers — the full panel, filtered by stream, subject, medium and a
 * free-text search. The stream lives in the query string so the stream cards
 * on the home page and the footer can deep-link straight into a filtered list.
 */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageBanner, Section, TutorCard } from '../components.jsx'
import { Search, Users } from '../art/Icons.jsx'
import { lecturers, streams, streamById } from '../siteData.js'

const SORTS = {
  rating: (a, b) => b.rating - a.rating,
  students: (a, b) => b.students - a.students,
  experience: (a, b) => b.years - a.years,
  name: (a, b) => a.name.localeCompare(b.name),
}

export default function Lecturers() {
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
    const pool = stream === 'all' ? lecturers : lecturers.filter((l) => l.stream === stream)
    return [...new Set(pool.map((l) => l.subject))].sort()
  }, [stream])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return lecturers
      .filter((l) => stream === 'all' || l.stream === stream)
      .filter((l) => subject === 'all' || l.subject === subject)
      .filter((l) => medium === 'all' || l.medium === medium)
      .filter(
        (l) =>
          !needle ||
          l.name.toLowerCase().includes(needle) ||
          l.subject.toLowerCase().includes(needle) ||
          l.title.toLowerCase().includes(needle)
      )
      .sort(SORTS[sort])
  }, [q, stream, subject, medium, sort])

  const active = stream === 'all' ? null : streamById(stream)

  return (
    <>
      <PageBanner
        title="Our Lecturers"
        crumb="Our Lecturers"
        text={
          active
            ? `${active.name} — ${active.blurb}`
            : 'Forty-eight lecturers across four streams. Filter by stream, subject or medium, then read the profile before you commit to anyone.'
        }
      />

      <Section>
        <div className="gk-filters">
          <div className="gk-search">
            <Search size={17} />
            <input
              className="gk-input"
              type="search"
              placeholder="Search by name, subject or title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search lecturers"
            />
          </div>

          <select className="gk-select" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject">
            <option value="all">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select className="gk-select" value={medium} onChange={(e) => setMedium(e.target.value)} aria-label="Medium">
            <option value="all">Any medium</option>
            <option value="Sinhala">Sinhala medium</option>
            <option value="English">English medium</option>
          </select>

          <select className="gk-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
            <option value="rating">Highest rated</option>
            <option value="students">Most students</option>
            <option value="experience">Most experienced</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        <div className="gk-pills" style={{ marginBottom: 22 }}>
          <button type="button" className={`gk-pill${stream === 'all' ? ' is-on' : ''}`} onClick={() => setStream('all')}>
            All streams
          </button>
          {streams.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`gk-pill${stream === s.id ? ' is-on' : ''}`}
              onClick={() => setStream(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>

        <p className="gk-count">
          {results.length} {results.length === 1 ? 'lecturer' : 'lecturers'}
          {active ? ` in ${active.name}` : ''}
        </p>

        {results.length ? (
          <div className="gk-grid gk-grid--4">
            {results.map((l) => (
              <TutorCard key={l.id} lecturer={l} />
            ))}
          </div>
        ) : (
          <div className="gk-empty">
            <Users size={44} style={{ margin: '0 auto', color: 'var(--faint)' }} />
            <h3>No lecturer matches that</h3>
            <p>Try a different subject or medium, or clear the search box and start again.</p>
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
              Clear all filters
            </button>
          </div>
        )}
      </Section>
    </>
  )
}
