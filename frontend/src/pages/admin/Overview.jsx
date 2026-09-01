import { Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Stars, Stat, fmtDate, hours, money } from '../../components/ui.jsx'
import { Users, Layers, Money, Ticket, ChevronRight, Book, Star } from '../../components/icons.jsx'

export default function Overview() {
  const app = useApp()

  const revenue = app.payments.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount, 0)
  const topInstructors = [...app.instructors].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount).slice(0, 5)
  const busiest = [...app.instructors].sort((a, b) => b.teachingHours - a.teachingHours).slice(0, 5)
  const maxHours = busiest[0]?.teachingHours || 1

  const pendingRequests = app.slotRequests.filter((r) => r.status === 'pending').length
  const seatsSold = app.groupClasses.reduce((s, c) => s + c.enrolled, 0)

  return (
    <>
      <div className="page-head">
        <h1>Platform overview</h1>
        <p className="sub">Catalogue, instructors and bookings across EduLink.</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <Stat label="Instructors" value={app.instructors.length} sub={`${app.instructors.filter((i) => i.verified).length} verified`} icon={Users} />
        <Stat label="Modules" value={app.modules.length} sub={`${app.subjects.length} subjects`} icon={Layers} />
        <Stat label="Group enrolments" value={seatsSold} sub={`${app.groupClasses.length} class${app.groupClasses.length === 1 ? '' : 'es'}`} icon={Ticket} />
        <Stat label="Revenue" value={money(revenue)} sub={`${app.payments.length} payments`} icon={Money} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Card pad={false}>
          <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 10 }}>
            <Star width={17} height={17} style={{ color: 'var(--star)' }} />
            <h2 style={{ flex: 1 }}>Top rated instructors</h2>
            <Link className="btn btn-ghost btn-sm" to="/admin/instructors">
              All <ChevronRight width={14} height={14} />
            </Link>
          </div>
          <div style={{ padding: '0 var(--pad) var(--pad)' }}>
            {topInstructors.map((i, idx) => (
              <div key={i.id} className="row" style={{ gap: 11, padding: '11px 0', borderTop: '1px solid var(--border)' }}>
                <span className="tiny bold faint" style={{ width: 14 }}>{idx + 1}</span>
                <Avatar name={i.name} hue={i.hue} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontWeight: 600 }}>{i.name}</div>
                  <span className="tiny faint">{i.title}</span>
                </div>
                <Stars value={i.rating} showValue count={i.reviewCount} />
              </div>
            ))}
          </div>
        </Card>

        <Card pad={false}>
          <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 10 }}>
            <h2 style={{ flex: 1 }}>Most teaching hours</h2>
          </div>
          <div style={{ padding: '0 var(--pad) var(--pad)' }}>
            {busiest.map((i) => (
              <div key={i.id} style={{ padding: '11px 0', borderTop: '1px solid var(--border)' }}>
                <div className="row" style={{ gap: 11, marginBottom: 7 }}>
                  <Avatar name={i.name} hue={i.hue} size={30} />
                  <span className="truncate" style={{ flex: 1, fontWeight: 600 }}>{i.name}</span>
                  <span className="small bold">{hours(i.teachingHours)} h</span>
                </div>
                <div className="meter"><i style={{ width: `${(i.teachingHours / maxHours) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>

        <Card pad={false}>
          <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 10 }}>
            <Book width={17} height={17} className="accent" />
            <h2 style={{ flex: 1 }}>Catalogue coverage</h2>
            <Link className="btn btn-ghost btn-sm" to="/admin/catalogue">
              Manage <ChevronRight width={14} height={14} />
            </Link>
          </div>
          <div style={{ padding: '0 var(--pad) var(--pad)' }}>
            {app.subjects.map((s) => {
              const mods = app.modules.filter((m) => m.subjectId === s.id)
              const covered = mods.filter((m) => app.instructors.some((i) => i.moduleIds.includes(m.id))).length
              return (
                <div key={s.id} style={{ padding: '11px 0', borderTop: '1px solid var(--border)' }}>
                  <div className="row" style={{ marginBottom: 6 }}>
                    <span style={{ flex: 1, fontWeight: 600 }}>{s.name}</span>
                    <span className="tiny faint">{covered}/{mods.length} modules have instructors</span>
                  </div>
                  <div className="meter">
                    <i style={{ width: `${mods.length ? (covered / mods.length) * 100 : 0}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card pad={false}>
          <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 10 }}>
            <h2 style={{ flex: 1 }}>Booking activity</h2>
            {pendingRequests > 0 && <Badge tone="warning">{pendingRequests} pending</Badge>}
          </div>
          <div style={{ padding: '0 var(--pad) var(--pad)' }}>
            {[
              ['Slot requests', app.slotRequests.length],
              ['Accepted, unpaid', app.slotRequests.filter((r) => r.status === 'accepted').length],
              ['Slots secured', app.slotRequests.filter((r) => r.status === 'paid').length],
              ['Open free slots', app.slots.filter((s) => s.status === 'open').length],
              ['Full group classes', app.groupClasses.filter((c) => c.enrolled >= c.seats).length],
            ].map(([k, v]) => (
              <div key={k} className="row" style={{ padding: '11px 0', borderTop: '1px solid var(--border)' }}>
                <span className="small muted" style={{ flex: 1 }}>{k}</span>
                <span className="bold">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card pad={false} style={{ marginTop: 'var(--gap)' }}>
        <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 10 }}>
          <h2 style={{ flex: 1 }}>Latest payments</h2>
          <Link className="btn btn-ghost btn-sm" to="/admin/payments">
            All payments <ChevronRight width={14} height={14} />
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Student</th><th>Type</th><th>Amount</th><th>Method</th><th>Date</th></tr>
            </thead>
            <tbody>
              {app.payments
                .slice()
                .sort((a, b) => new Date(b.at) - new Date(a.at))
                .slice(0, 6)
                .map((p) => {
                  const enr = app.enrollments.find((e) => e.id === p.enrollmentId)
                  const std = app.studentById[p.studentId]
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="row" style={{ gap: 9 }}>
                          <Avatar name={std?.name} hue={std?.hue} size={26} />
                          <span className="small">{std?.name}</span>
                        </div>
                      </td>
                      <td><Badge tone="accent">{enr?.type === 'group' ? 'Group class' : 'Free slot'}</Badge></td>
                      <td className="bold">{money(p.amount)}</td>
                      <td className="small muted">{p.method}</td>
                      <td className="small muted">{fmtDate(p.at, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
