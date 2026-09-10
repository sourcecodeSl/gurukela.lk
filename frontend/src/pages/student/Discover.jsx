import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import InstructorCard from '../../components/InstructorCard.jsx'
import { Card, Empty } from '../../components/ui.jsx'
import { Search, Compass } from '../../components/icons.jsx'

const SORTS = [
  { id: 'rating', label: 'Highest rated' },
  { id: 'students', label: 'Most students' },
  { id: 'hours', label: 'Most teaching hours' },
  { id: 'priceAsc', label: 'Lowest price' },
  { id: 'name', label: 'Name (A–Z)' },
]

const RATINGS = [
  { id: 0, label: 'Any rating' },
  { id: 4, label: '4.0+' },
  { id: 4.5, label: '4.5+' },
  { id: 4.8, label: '4.8+' },
]

export default function Discover() {
  const app = useApp()
  const [q, setQ] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [medium, setMedium] = useState('all')
  const [minRating, setMinRating] = useState(0)
  const [sort, setSort] = useState('rating')

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()

    const list = app.instructors.filter((ins) => {
      if (ins.rating < minRating) return false
      if (medium !== 'all' && !ins.languages?.includes(medium)) return false

      if (subjectId) {
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
      name: (a, b) => a.name.localeCompare(b.name),
    }
    return [...list].sort(by[sort])
  }, [app, q, subjectId, medium, minRating, sort])

  const clearAll = () => {
    setSubjectId('')
    setMedium('all')
    setMinRating(0)
    setQ('')
  }

  return (
    <>
      <div className="page-head">
        <h1>Find your instructor</h1>
        <p className="sub">
          {app.instructors.length} instructors teaching {app.modules.length} lessons across {app.subjects.length} subjects.
        </p>
      </div>

      {/* search + inline filters — same layout as the public site */}
      <Card style={{ marginBottom: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="search" style={{ flex: '1 1 240px' }}>
            <Search className="ico" width={17} height={17} />
            <input
              className="input"
              placeholder="Search by name, subject or title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            className="select"
            style={{ width: 'auto', minWidth: 170 }}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            aria-label="Subject"
          >
            <option value="">All subjects</option>
            {app.subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            className="select"
            style={{ width: 'auto', minWidth: 150 }}
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            aria-label="Medium"
          >
            <option value="all">Any medium</option>
            <option value="Sinhala">Sinhala medium</option>
            <option value="English">English medium</option>
          </select>

          <select
            className="select"
            style={{ width: 'auto', minWidth: 140 }}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            aria-label="Minimum rating"
          >
            {RATINGS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>

          <select
            className="select"
            style={{ width: 'auto', minWidth: 170 }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort by"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <p className="small muted" style={{ marginBottom: 12 }}>
        <b>{results.length}</b> instructor{results.length === 1 ? '' : 's'} found
      </p>

      {results.length === 0 ? (
        <Card>
          <Empty
            icon={Compass}
            title="No instructors match those filters"
            action={
              <button className="btn btn-outline" onClick={clearAll}>
                Reset search
              </button>
            }
          >
            Try widening the rating range, or search a different subject or medium.
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-4">
          {results.map((ins) => (
            <InstructorCard key={ins.id} instructor={ins} />
          ))}
        </div>
      )}
    </>
  )
}
