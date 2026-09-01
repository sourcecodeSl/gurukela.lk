import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, fmtDate, fmtTime, money } from '../../components/ui.jsx'
import { Calendar, Clock, Users, Video, Info } from '../../components/icons.jsx'

/** Everything the student has paid for, laid out on a timeline. */
export default function Schedule() {
  const app = useApp()
  const studentId = app.session.role === 'student' ? app.session.id : null

  const sessions = useMemo(() => {
    if (!studentId) return []
    return app
      .enrollmentsOf(studentId)
      .map((e) => {
        if (e.type === 'group') {
          const cls = app.classById[e.refId]
          if (!cls) return null
          return {
            id: e.id,
            kind: 'group',
            when: cls.startsAt,
            title: cls.title,
            detail: cls.schedule,
            instructorId: cls.instructorId,
            amount: e.amount,
            weeks: cls.weeks,
          }
        }
        const slot = app.slotById[e.refId]
        if (!slot) return null
        return {
          id: e.id,
          kind: 'slot',
          when: slot.date,
          title: 'One-to-one session',
          detail: `${fmtTime(slot.start)} – ${fmtTime(slot.end)}`,
          instructorId: slot.instructorId,
          amount: e.amount,
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.when) - new Date(b.when))
  }, [app, studentId])

  if (!studentId) {
    return (
      <Card>
        <Empty icon={Info} title="Student view only">Switch to the student account to see your schedule.</Empty>
      </Card>
    )
  }

  const upcoming = sessions.filter((s) => new Date(s.when) >= new Date(Date.now() - 86400000))
  const past = sessions.filter((s) => new Date(s.when) < new Date(Date.now() - 86400000))

  const Row = ({ s, done }) => {
    const ins = app.instructorById[s.instructorId]
    return (
      <div className={`timeline-item ${done ? 'done' : ''}`}>
        <Card hover>
          <div className="row wrap" style={{ gap: 14, alignItems: 'flex-start' }}>
            <div
              className="col center"
              style={{
                background: done ? 'var(--surface-2)' : 'var(--accent-soft)',
                color: done ? 'var(--text-muted)' : 'var(--accent)',
                borderRadius: 'var(--r)',
                padding: '9px 13px',
                minWidth: 62,
              }}
            >
              <span className="tiny bold">{fmtDate(s.when, { weekday: 'short' })}</span>
              <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>{new Date(s.when).getDate()}</span>
              <span className="tiny">{fmtDate(s.when, { month: 'short' })}</span>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="row wrap" style={{ gap: 7 }}>
                <h3 style={{ fontSize: 15 }}>{s.title}</h3>
                <Badge tone={s.kind === 'group' ? 'accent' : ''}>
                  {s.kind === 'group' ? <><Users width={11} height={11} /> Group</> : <><Clock width={11} height={11} /> 1-to-1</>}
                </Badge>
              </div>
              <p className="small muted" style={{ marginTop: 3 }}>{s.detail}</p>
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <Avatar name={ins?.name} hue={ins?.hue} size={26} />
                <Link className="small" style={{ fontWeight: 600 }} to={`/instructor/${ins?.id}`}>{ins?.name}</Link>
              </div>
            </div>
            <div className="col" style={{ alignItems: 'flex-end', gap: 7 }}>
              <span className="small faint">{money(s.amount)}</span>
              {!done && (
                <button className="btn btn-outline btn-sm">
                  <Video width={14} height={14} /> Join class
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <h1>My schedule</h1>
        <p className="sub">{upcoming.length} upcoming session{upcoming.length === 1 ? '' : 's'}.</p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <Empty icon={Calendar} title="Nothing scheduled yet" action={<Link className="btn btn-primary" to="/discover">Find an instructor</Link>}>
            Book a free slot or join a group class and it will show up on this timeline.
          </Empty>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <h2 style={{ marginBottom: 14 }}>Upcoming</h2>
              <div className="timeline" style={{ marginBottom: 28 }}>
                {upcoming.map((s) => <Row key={s.id} s={s} />)}
              </div>
            </>
          )}
          {past.length > 0 && (
            <>
              <h2 style={{ marginBottom: 14 }}>Past</h2>
              <div className="timeline">
                {past.map((s) => <Row key={s.id} s={s} done />)}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
