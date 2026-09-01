import { useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Empty } from '../../components/ui.jsx'
import { Check, Book, Info, Search } from '../../components/icons.jsx'

/**
 * Instructors can only register against modules the admin has defined —
 * they pick from the catalogue, they never create their own.
 */
export default function Modules() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(me.moduleIds)

  const dirty =
    selected.length !== me.moduleIds.length || selected.some((id) => !me.moduleIds.includes(id))

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const needle = q.trim().toLowerCase()

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>My modules</h1>
            <p className="sub">Tick the modules you teach. Students filter and request sessions against these.</p>
          </div>
          {dirty && (
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setSelected(me.moduleIds)}>Discard</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  app.dispatch({ type: 'instructor/setModules', id: me.id, moduleIds: selected })
                  app.toast('Modules updated')
                }}
              >
                <Check width={16} height={16} /> Save {selected.length} module{selected.length === 1 ? '' : 's'}
              </button>
            </div>
          )}
        </div>
      </div>

      <Card style={{ marginBottom: 20, background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
          <Info width={18} height={18} className="accent" style={{ flex: 'none', marginTop: 2 }} />
          <p className="small muted">
            This catalogue is maintained by the platform administrator. If a module you teach is missing, request it from
            admin — instructors cannot add their own.
          </p>
        </div>
      </Card>

      <div className="search" style={{ marginBottom: 20, maxWidth: 380 }}>
        <Search className="ico" width={17} height={17} />
        <input className="input" placeholder="Search modules…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="col" style={{ gap: 'var(--gap)' }}>
        {app.subjects.map((sub) => {
          const mods = app.modules
            .filter((m) => m.subjectId === sub.id)
            .filter((m) => !needle || `${m.name} ${m.code}`.toLowerCase().includes(needle))
          if (!mods.length) return null
          const picked = mods.filter((m) => selected.includes(m.id)).length

          return (
            <Card key={sub.id} pad={false}>
              <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 12, gap: 11 }}>
                <span
                  style={{
                    width: 36, height: 36, borderRadius: 'var(--r)', display: 'grid', placeItems: 'center',
                    background: `hsl(${sub.color} 60% 50% / .14)`, color: `hsl(${sub.color} 60% 45%)`,
                  }}
                >
                  <Book width={18} height={18} />
                </span>
                <div style={{ flex: 1 }}>
                  <h3>{sub.name}</h3>
                  <p className="tiny faint">{mods.length} modules available</p>
                </div>
                {picked > 0 && <Badge tone="accent">{picked} selected</Badge>}
              </div>

              <div className="grid grid-3" style={{ padding: '0 var(--pad) var(--pad)' }}>
                {mods.map((m) => {
                  const on = selected.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggle(m.id)}
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
                          <span className="tiny bold accent">{m.code}</span>
                          <Badge>{m.level}</Badge>
                        </span>
                        <span style={{ fontWeight: 600 }}>{m.name}</span>
                        <span className="tiny faint">{m.hours} teaching hours</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </Card>
          )
        })}

        {app.subjects.every((sub) =>
          app.modules.filter((m) => m.subjectId === sub.id).every((m) => needle && !`${m.name} ${m.code}`.toLowerCase().includes(needle))
        ) && (
          <Card><Empty icon={Search} title="No modules match that search" /></Card>
        )}
      </div>
    </>
  )
}
