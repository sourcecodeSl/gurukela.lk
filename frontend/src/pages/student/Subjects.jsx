import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card } from '../../components/ui.jsx'
import { ChevronRight, Book, Users } from '../../components/icons.jsx'

/** Browse the admin-defined catalogue and jump straight to who teaches what. */
export default function Subjects() {
  const app = useApp()
  const [openId, setOpenId] = useState(app.subjects[0]?.id)

  return (
    <>
      <div className="page-head">
        <h1>Subjects &amp; modules</h1>
        <p className="sub">
          The catalogue is curated by the platform. Instructors register against these modules — nothing outside the list.
        </p>
      </div>

      <div className="grid grid-3">
        {app.subjects.map((s) => {
          const mods = app.modules.filter((m) => m.subjectId === s.id)
          const teachers = app.instructors.filter((i) => i.moduleIds.some((id) => app.moduleById[id]?.subjectId === s.id))
          const open = openId === s.id
          return (
            <Card key={s.id} hover className="col" style={{ gap: 12 }}>
              <div className="row" style={{ gap: 12 }}>
                <span
                  style={{
                    width: 42, height: 42, borderRadius: 'var(--r)',
                    display: 'grid', placeItems: 'center',
                    background: `hsl(${s.color} 60% 50% / .14)`,
                    color: `hsl(${s.color} 60% 45%)`,
                  }}
                >
                  <Book width={20} height={20} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>{s.name}</h3>
                  <p className="tiny faint">{mods.length} modules · {teachers.length} instructors</p>
                </div>
              </div>

              <p className="small muted">{s.description}</p>

              <button
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'space-between' }}
                onClick={() => setOpenId(open ? null : s.id)}
              >
                {open ? 'Hide modules' : 'Show modules'}
                <ChevronRight width={15} height={15} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
              </button>

              {open && (
                <div className="col" style={{ gap: 7 }}>
                  {mods.map((m) => (
                    <div key={m.id} className="slot" style={{ padding: '9px 11px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <span className="tiny bold accent">{m.code}</span>
                          <Badge>{m.level}</Badge>
                        </div>
                        <div className="small truncate" style={{ fontWeight: 600 }}>{m.name}</div>
                      </div>
                      <span className="tiny faint">{m.hours}h</span>
                    </div>
                  ))}
                </div>
              )}

              <hr className="divider" />

              <div className="row">
                <div className="row" style={{ gap: 0 }}>
                  {teachers.slice(0, 4).map((t, i) => (
                    <span key={t.id} style={{ marginLeft: i ? -9 : 0, border: '2px solid var(--surface)', borderRadius: '50%' }}>
                      <Avatar name={t.name} hue={t.hue} size={26} />
                    </span>
                  ))}
                  {teachers.length > 4 && <span className="tiny faint" style={{ marginLeft: 7 }}>+{teachers.length - 4}</span>}
                </div>
                <div className="spacer" />
                <Link className="btn btn-outline btn-sm" to="/discover">
                  <Users width={14} height={14} /> Find tutors
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}
