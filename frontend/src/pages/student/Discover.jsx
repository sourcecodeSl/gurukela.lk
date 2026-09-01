import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import InstructorCard from '../../components/InstructorCard.jsx'
import { Card, Field, Empty, Badge } from '../../components/ui.jsx'
import { Search, Filter, Compass, X, Trending, Star, Clock } from '../../components/icons.jsx'

const SORTS = [
  { id: 'rating', label: 'Top rated', icon: Star },
  { id: 'hours', label: 'Most teaching hours', icon: Clock },
  { id: 'students', label: 'Most students', icon: Trending },
  { id: 'priceAsc', label: 'Lowest price', icon: null },
]

const RATING_STEPS = [0, 4, 4.5, 4.8]
const HOUR_STEPS = [0, 500, 1000, 2000]

export default function Discover() {
  const app = useApp()
  const [q, setQ] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [minHours, setMinHours] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sort, setSort] = useState('rating')
  const [showFilters, setShowFilters] = useState(false)

  const subjectModules = useMemo(
    () => (subjectId ? app.modules.filter((m) => m.subjectId === subjectId) : []),
    [app.modules, subjectId]
  )

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()

    let list = app.instructors.filter((ins) => {
      if (verifiedOnly && !ins.verified) return false
      if (ins.rating < minRating) return false
      if (ins.teachingHours < minHours) return false

      if (moduleId && !ins.moduleIds.includes(moduleId)) return false
      if (subjectId && !moduleId) {
        const teachesSubject = ins.moduleIds.some((id) => app.moduleById[id]?.subjectId === subjectId)
        if (!teachesSubject) return false
      }

      if (needle) {
        const haystack = [
          ins.name,
          ins.title,
          ins.bio,
          ins.city,
          ...app.modulesOf(ins.id).map((m) => `${m.name} ${m.code}`),
          ...app.subjectsOf(ins.id).map((s) => s.name),
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })

    const by = {
      rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
      hours: (a, b) => b.teachingHours - a.teachingHours,
      students: (a, b) => b.studentCount - a.studentCount,
      priceAsc: (a, b) => a.hourlyRate - b.hourlyRate,
    }
    return [...list].sort(by[sort])
  }, [app, q, subjectId, moduleId, minRating, minHours, verifiedOnly, sort])

  const activeFilters =
    (subjectId ? 1 : 0) + (moduleId ? 1 : 0) + (minRating ? 1 : 0) + (minHours ? 1 : 0) + (verifiedOnly ? 1 : 0)

  const clearAll = () => {
    setSubjectId('')
    setModuleId('')
    setMinRating(0)
    setMinHours(0)
    setVerifiedOnly(false)
  }

  return (
    <>
      <div className="page-head">
        <h1>Find your instructor</h1>
        <p className="sub">
          {app.instructors.length} instructors teaching {app.modules.length} modules across {app.subjects.length} subjects.
        </p>
      </div>

      {/* search + sort bar */}
      <Card style={{ marginBottom: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="search" style={{ flex: '1 1 260px' }}>
            <Search className="ico" width={17} height={17} />
            <input
              className="input"
              placeholder="Search by name, subject, module or city…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className="select" style={{ width: 200 }} value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          <button
            className={`btn ${showFilters || activeFilters ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter width={16} height={16} />
            Filters
            {activeFilters > 0 && (
              <span
                style={{
                  background: 'hsl(0 0% 100% / .25)',
                  borderRadius: 99,
                  padding: '0 6px',
                  fontSize: 11,
                }}
              >
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <>
            <hr className="divider" style={{ margin: '16px 0' }} />
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
              <Field label="Subject">
                <select
                  className="select"
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value)
                    setModuleId('')
                  }}
                >
                  <option value="">All subjects</option>
                  {app.subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Module">
                <select
                  className="select"
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  disabled={!subjectId}
                >
                  <option value="">{subjectId ? 'All modules' : 'Pick a subject first'}</option>
                  {subjectModules.map((m) => (
                    <option key={m.id} value={m.id}>{m.code} — {m.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Minimum rating">
                <div className="row wrap" style={{ gap: 6 }}>
                  {RATING_STEPS.map((r) => (
                    <button key={r} className={`chip ${minRating === r ? 'on' : ''}`} onClick={() => setMinRating(r)}>
                      {r === 0 ? 'Any' : `${r}+`}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Teaching hours">
                <div className="row wrap" style={{ gap: 6 }}>
                  {HOUR_STEPS.map((h) => (
                    <button key={h} className={`chip ${minHours === h ? 'on' : ''}`} onClick={() => setMinHours(h)}>
                      {h === 0 ? 'Any' : `${h}+`}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Verification">
                <button
                  className={`chip ${verifiedOnly ? 'on' : ''}`}
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => setVerifiedOnly((v) => !v)}
                >
                  Verified instructors only
                </button>
              </Field>
            </div>

            {activeFilters > 0 && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={clearAll}>
                <X width={14} height={14} />
                Clear all filters
              </button>
            )}
          </>
        )}
      </Card>

      {/* quick subject chips */}
      <div className="row wrap" style={{ gap: 8, marginBottom: 20 }}>
        <button className={`chip ${!subjectId ? 'on' : ''}`} onClick={() => { setSubjectId(''); setModuleId('') }}>
          All
        </button>
        {app.subjects.map((s) => (
          <button
            key={s.id}
            className={`chip ${subjectId === s.id ? 'on' : ''}`}
            onClick={() => { setSubjectId(s.id); setModuleId('') }}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <span className="small muted">
          <b>{results.length}</b> instructor{results.length === 1 ? '' : 's'} found
        </span>
        {moduleId && <Badge tone="accent">{app.moduleById[moduleId]?.name}</Badge>}
      </div>

      {results.length === 0 ? (
        <Card>
          <Empty
            icon={Compass}
            title="No instructors match those filters"
            action={
              <button className="btn btn-outline" onClick={() => { clearAll(); setQ('') }}>
                Reset search
              </button>
            }
          >
            Try widening the rating or teaching-hours range, or search a different subject.
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-3">
          {results.map((ins) => (
            <InstructorCard key={ins.id} instructor={ins} />
          ))}
        </div>
      )}
    </>
  )
}
