import { useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Empty } from '../../components/ui.jsx'
import { Check, Book, Info, Search } from '../../components/icons.jsx'

/**
 * Instructors teach whole subjects (chosen at registration, grouped by stream).
 * This page lets them adjust that set — the lessons they cover are every module
 * the admin defines under the subjects they teach.
 */
export default function Modules() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(me.subjectIds || [])

  const current = me.subjectIds || []
  const dirty =
    selected.length !== current.length || selected.some((id) => !current.includes(id))

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const needle = q.trim().toLowerCase()
  const shownSubjects = app.subjects.filter((s) => !needle || s.name.toLowerCase().includes(needle))

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>My subjects</h1>
            <p className="sub">Tick the subjects you teach. Students filter and request sessions against these, and every lesson under them becomes yours to run.</p>
          </div>
          {dirty && (
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setSelected(current)}>Discard</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  app.dispatch({ type: 'instructor/setSubjects', id: me.id, subjectIds: selected })
                  app.toast('Subjects updated')
                }}
              >
                <Check width={16} height={16} /> Save {selected.length} subject{selected.length === 1 ? '' : 's'}
              </button>
            </div>
          )}
        </div>
      </div>

      <Card style={{ marginBottom: 20, background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
          <Info width={18} height={18} className="accent" style={{ flex: 'none', marginTop: 2 }} />
          <p className="small muted">
            This catalogue is maintained by the platform administrator. If a subject you teach is missing, request it from
            admin; instructors cannot add their own.
          </p>
        </div>
      </Card>

      <div className="search" style={{ marginBottom: 20, maxWidth: 380 }}>
        <Search className="ico" width={17} height={17} />
        <input className="input" placeholder="Search subjects…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="col" style={{ gap: 'var(--gap)' }}>
        {app.streams.map((stream) => {
          const subs = shownSubjects.filter((s) => s.streamId === stream.id)
          if (!subs.length) return null
          const picked = subs.filter((s) => selected.includes(s.id)).length

          return (
            <Card key={stream.id} pad={false}>
              <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 12, gap: 11 }}>
                <div style={{ flex: 1 }}>
                  <h3>{stream.name}</h3>
                  <p className="tiny faint">{subs.length} subjects available</p>
                </div>
                {picked > 0 && <Badge tone="accent">{picked} selected</Badge>}
              </div>

              <div className="grid grid-3" style={{ padding: '0 var(--pad) var(--pad)' }}>
                {subs.map((s) => {
                  const on = selected.includes(s.id)
                  const lessons = app.modules.filter((m) => m.subjectId === s.id).length
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className="slot"
                      style={{
                        cursor: 'pointer',
                        textAlign: 'left',
                        alignItems: 'flex-start',
                        borderColor: on ? 'var(--accent)' : 'var(--border)',
                        background: on ? 'var(--accent-soft)' : 'var(--surface)',
                      }}
                    >
                      <span
                        style={{
                          width: 19, height: 19, flex: 'none', marginTop: 2,
                          borderRadius: 5, display: 'grid', placeItems: 'center',
                          border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
                          background: on ? 'var(--accent)' : 'transparent',
                          color: 'var(--accent-fg)',
                        }}
                      >
                        {on && <Check width={13} height={13} />}
                      </span>
                      <span className="col" style={{ gap: 2, minWidth: 0 }}>
                        <span className="row" style={{ gap: 6 }}>
                          <Book width={14} height={14} className="accent" />
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                        </span>
                        <span className="tiny faint">{lessons} lesson{lessons === 1 ? '' : 's'}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </Card>
          )
        })}

        {shownSubjects.length === 0 && (
          <Card><Empty icon={Search} title="No subjects match that search" /></Card>
        )}
      </div>
    </>
  )
}
