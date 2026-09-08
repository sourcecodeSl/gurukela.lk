import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty } from '../../components/ui.jsx'
import { Book, Video, Globe, Search } from '../../components/icons.jsx'

const KIND_META = {
  pdf: { label: 'PDF', icon: Book, tone: 'danger', cta: 'Open PDF' },
  recording: { label: 'Recording', icon: Video, tone: 'accent', cta: 'Watch' },
  link: { label: 'Link', icon: Globe, tone: '', cta: 'Open' },
}

/** Students browse PDFs and recordings shared by instructors. */
export default function Materials() {
  const app = useApp()
  const [q, setQ] = useState('')
  const [subjectId, setSubjectId] = useState('')

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return app.materials.filter((m) => {
      if (subjectId && m.subjectId !== subjectId) return false
      if (needle) {
        const hay = `${m.title} ${m.description || ''} ${m.instructorName || ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [app.materials, q, subjectId])

  // Only subjects that actually have materials, for a tidy filter row.
  const subjectsWithMaterials = useMemo(() => {
    const ids = new Set(app.materials.map((m) => m.subjectId).filter(Boolean))
    return app.subjects.filter((s) => ids.has(s.id))
  }, [app.materials, app.subjects])

  return (
    <>
      <div className="page-head">
        <h1>Learning materials</h1>
        <p className="sub">PDFs, tutes and class recordings shared by instructors.</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="search" style={{ flex: '1 1 260px' }}>
            <Search className="ico" width={17} height={17} />
            <input className="input" placeholder="Search materials or instructors…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {subjectsWithMaterials.length > 0 && (
            <select className="select" style={{ width: 200 }} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">All subjects</option>
              {subjectsWithMaterials.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
      </Card>

      {results.length === 0 ? (
        <Card><Empty icon={Book} title="No materials found">Instructors haven't shared anything matching this yet.</Empty></Card>
      ) : (
        <div className="grid grid-3">
          {results.map((m) => {
            const meta = KIND_META[m.kind] || KIND_META.link
            const Icon = meta.icon
            const subject = app.subjectById[m.subjectId]
            const instructor = app.instructorById[m.instructorId]
            return (
              <Card key={m.id} className="col" style={{ gap: 10 }}>
                <div className="row" style={{ gap: 10 }}>
                  <span
                    style={{
                      width: 38, height: 38, borderRadius: 'var(--r)', flex: 'none',
                      display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent)',
                    }}
                  >
                    <Icon width={19} height={19} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }} className="truncate">{m.title}</div>
                    <div className="row" style={{ gap: 6 }}>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      {subject && <span className="tiny faint truncate">{subject.name}</span>}
                    </div>
                  </div>
                </div>
                {m.description && <p className="small muted">{m.description}</p>}
                <div className="row" style={{ gap: 8 }}>
                  <Avatar name={m.instructorName || instructor?.name} hue={instructor?.hue} size={22} />
                  <span className="tiny muted truncate" style={{ flex: 1 }}>{m.instructorName || instructor?.name}</span>
                </div>
                <a className="btn btn-outline btn-sm btn-block" href={m.url} target="_blank" rel="noreferrer" style={{ marginTop: 'auto' }}>
                  {meta.cta}
                </a>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
