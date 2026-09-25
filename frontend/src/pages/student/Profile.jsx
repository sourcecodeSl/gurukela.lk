import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, fmtDate } from '../../components/ui.jsx'
import { Info, Layers, Copy } from '../../components/icons.jsx'

/** Read-only view of the signed-in student's own account details. */
export default function Profile() {
  const app = useApp()

  if (app.session.role !== 'student') {
    return (
      <Card>
        <Empty icon={Info} title="Student view only">Switch to the student account to see your profile.</Empty>
      </Card>
    )
  }

  const me = app.me || {}
  const subjects = (me.subjectIds || []).map((id) => app.subjectById[id]).filter(Boolean)

  const copy = (text) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
      .then(() => app.toast('Student ID copied'))
      .catch(() => app.toast('Could not copy', 'err'))
  }

  const rows = [
    { label: 'Student ID', value: me.code || me.id, copy: true },
    { label: 'Email', value: me.email },
    { label: 'Mobile number', value: me.phone },
    { label: 'Grade', value: me.grade },
    { label: 'Birthday', value: me.birthday ? fmtDate(me.birthday, { day: 'numeric', month: 'long', year: 'numeric' }) : null },
    { label: 'Joined', value: me.joinedAt ? fmtDate(me.joinedAt, { day: 'numeric', month: 'long', year: 'numeric' }) : null },
  ]

  return (
    <>
      <div className="page-head">
        <h1>My profile</h1>
        <p className="sub">Your account details on GetClass.</p>
      </div>

      <Card>
        <div className="row" style={{ gap: 16, alignItems: 'center' }}>
          <Avatar name={me.name} hue={me.hue} size={64} />
          <div>
            <h2 style={{ fontSize: 20 }}>{me.name || 'Student'}</h2>
            <p className="small muted">Student</p>
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {rows.map((r) => (
            <div key={r.label}>
              <p className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>{r.label}</p>
              {r.copy && r.value ? (
                <button
                  type="button"
                  onClick={() => copy(r.value)}
                  title="Click to copy"
                  className="row"
                  style={{
                    marginTop: 2, gap: 6, padding: 0, background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--accent)', fontWeight: 700,
                  }}
                >
                  <span className="small" style={{ fontWeight: 700 }}>{r.value}</span>
                  <Copy width={13} height={13} />
                </button>
              ) : (
                <p className="small" style={{ fontWeight: 600, marginTop: 2 }}>{r.value || '—'}</p>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <p className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Subjects</p>
          {subjects.length ? (
            <div className="row wrap" style={{ gap: 8 }}>
              {subjects.map((s) => (
                <Badge key={s.id} tone="accent"><Layers width={11} height={11} /> {s.name}</Badge>
              ))}
            </div>
          ) : (
            <p className="small muted">No subjects selected yet.</p>
          )}
        </div>
      </Card>
    </>
  )
}
