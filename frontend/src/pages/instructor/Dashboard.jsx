import { Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext.jsx'
import {
  Avatar, Badge, Card, Empty, Stars, Stat, StatusBadge,
  fmtDate, fmtTime, hours, money, timeAgo,
} from '../../components/ui.jsx'
import { Inbox, Clock, Users, Money, Star, Calendar, ChevronRight } from '../../components/icons.jsx'

export default function InstructorDashboard() {
  const app = useApp()
  const me = app.instructorById[app.session.id]

  const requests = app.requestsForInstructor(me.id)
  const pending = requests.filter((r) => r.status === 'pending')
  const slots = app.slotsOf(me.id)
  const classes = app.classesOf(me.id)
  const reviews = app.reviewsOf(me.id)

  const groupRevenue = classes.reduce((s, c) => s + c.price * c.enrolled, 0)
  const slotRevenue = app.enrollments
    .filter((e) => e.type === 'slot' && app.slotById[e.refId]?.instructorId === me.id)
    .reduce((s, e) => s + e.amount, 0)

  return (
    <>
      <div className="page-head">
        <div className="row wrap" style={{ gap: 14 }}>
          <Avatar name={me.name} hue={me.hue} size={52} />
          <div style={{ flex: 1 }}>
            <h1>Welcome back, {me.name.split(' ').slice(-1)[0]}</h1>
            <p className="sub">
              {pending.length > 0
                ? `${pending.length} slot request${pending.length === 1 ? '' : 's'} waiting for your response.`
                : 'No pending requests — you are all caught up.'}
            </p>
          </div>
          <Link className="btn btn-primary" to="/teach/slots">
            <Clock width={16} height={16} /> Publish free slots
          </Link>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <Stat label="Pending requests" value={pending.length} icon={Inbox} tone={pending.length ? 'warning' : undefined} />
        <Stat label="Open slots" value={slots.filter((s) => s.status === 'open').length} sub={`${slots.length} published`} icon={Clock} />
        <Stat label="Group students" value={classes.reduce((s, c) => s + c.enrolled, 0)} sub={`${classes.length} class${classes.length === 1 ? '' : 'es'}`} icon={Users} />
        <Stat label="Revenue" value={money(groupRevenue + slotRevenue)} sub="all time" icon={Money} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)' }}>
        <div className="col" style={{ gap: 'var(--gap)' }}>
          <Card pad={false}>
            <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 12 }}>
              <h2 style={{ flex: 1 }}>Latest slot requests</h2>
              <Link className="btn btn-ghost btn-sm" to="/teach/requests">
                View all <ChevronRight width={14} height={14} />
              </Link>
            </div>
            {requests.length === 0 ? (
              <Empty icon={Inbox} title="No requests yet">Publish free time slots and students will start requesting them.</Empty>
            ) : (
              <div style={{ padding: '0 var(--pad) var(--pad)' }} className="col">
                {requests
                  .slice()
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 5)
                  .map((r) => {
                    const std = app.studentById[r.studentId]
                    const slot = app.slotById[r.slotId]
                    const mod = app.moduleById[r.moduleId]
                    return (
                      <div key={r.id} className="row" style={{ gap: 12, padding: '11px 0', borderTop: '1px solid var(--border)' }}>
                        <Avatar name={std?.name} hue={std?.hue} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="row" style={{ gap: 7 }}>
                            <span style={{ fontWeight: 600 }} className="truncate">{std?.name}</span>
                            <StatusBadge status={r.status} />
                          </div>
                          <span className="tiny faint">
                            {mod?.code} · {fmtDate(slot?.date, { day: 'numeric', month: 'short' })} {fmtTime(slot?.start || '00:00')} · {timeAgo(r.createdAt)}
                          </span>
                        </div>
                        {r.status === 'pending' && (
                          <div className="row" style={{ gap: 6 }}>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => { app.dispatch({ type: 'request/accept', id: r.id }); app.toast('Request accepted') }}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => { app.dispatch({ type: 'request/reject', id: r.id }); app.toast('Request rejected', 'err') }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </Card>

          <Card pad={false}>
            <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 12 }}>
              <h2 style={{ flex: 1 }}>Your group classes</h2>
              <Link className="btn btn-ghost btn-sm" to="/teach/classes">
                Manage <ChevronRight width={14} height={14} />
              </Link>
            </div>
            {classes.length === 0 ? (
              <Empty icon={Users} title="No group classes yet">Create a pre-scheduled batch students can pay to join directly.</Empty>
            ) : (
              <div style={{ padding: '0 var(--pad) var(--pad)' }}>
                {classes.map((c) => (
                  <div key={c.id} className="row" style={{ gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate" style={{ fontWeight: 600 }}>{c.title}</div>
                      <span className="tiny faint">{c.schedule} · starts {fmtDate(c.startsAt, { day: 'numeric', month: 'short' })}</span>
                      <div className="meter" style={{ marginTop: 7, maxWidth: 220 }}>
                        <i style={{ width: `${(c.enrolled / c.seats) * 100}%` }} />
                      </div>
                    </div>
                    <div className="col" style={{ alignItems: 'flex-end' }}>
                      <span className="small bold">{c.enrolled}/{c.seats}</span>
                      <span className="tiny faint">{money(c.price * c.enrolled)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="col" style={{ gap: 'var(--gap)' }}>
          <Card>
            <h3 style={{ marginBottom: 12 }}>Your rating</h3>
            <div className="row" style={{ gap: 12 }}>
              <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.03em' }}>{me.rating.toFixed(1)}</span>
              <div className="col">
                <Stars value={me.rating} />
                <span className="tiny faint">{me.reviewCount} verified reviews</span>
              </div>
            </div>
            <hr className="divider" style={{ margin: '14px 0' }} />
            {[
              ['Teaching hours', hours(me.teachingHours)],
              ['Students taught', me.studentCount],
              ['Avg. response', `${me.responseMins} min`],
              ['Hourly rate', money(me.hourlyRate)],
            ].map(([k, v]) => (
              <div key={k} className="row" style={{ padding: '6px 0' }}>
                <span className="small muted" style={{ flex: 1 }}>{k}</span>
                <span className="small bold">{v}</span>
              </div>
            ))}
          </Card>

          <Card pad={false}>
            <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 10 }}>
              <h3 style={{ flex: 1 }}>Recent reviews</h3>
              <Star width={16} height={16} style={{ color: 'var(--star)' }} />
            </div>
            {reviews.length === 0 ? (
              <p className="small faint" style={{ padding: '0 var(--pad) var(--pad)' }}>No reviews yet.</p>
            ) : (
              <div style={{ padding: '0 var(--pad) var(--pad)' }}>
                {reviews.slice(0, 3).map((r) => (
                  <div key={r.id} style={{ padding: '11px 0', borderTop: '1px solid var(--border)' }}>
                    <div className="row" style={{ gap: 8, marginBottom: 5 }}>
                      <Avatar name={app.studentById[r.studentId]?.name} hue={app.studentById[r.studentId]?.hue} size={24} />
                      <span className="small" style={{ fontWeight: 600, flex: 1 }}>{app.studentById[r.studentId]?.name}</span>
                      <Stars value={r.rating} />
                    </div>
                    <p className="tiny muted" style={{ lineHeight: 1.6 }}>{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 style={{ marginBottom: 10 }}>Next open slots</h3>
            {slots.filter((s) => s.status === 'open').length === 0 ? (
              <p className="small faint">Nothing published. <Link className="accent" to="/teach/slots">Add slots</Link></p>
            ) : (
              <div className="col" style={{ gap: 8 }}>
                {slots
                  .filter((s) => s.status === 'open')
                  .slice(0, 4)
                  .map((s) => (
                    <div key={s.id} className="row small" style={{ gap: 8 }}>
                      <Calendar width={14} height={14} className="faint" />
                      <span style={{ flex: 1 }}>
                        {fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtTime(s.start)}
                      </span>
                      <Badge>{money(s.price)}</Badge>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
