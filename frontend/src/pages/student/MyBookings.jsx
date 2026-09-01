import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext.jsx'
import PaymentModal from '../../components/PaymentModal.jsx'
import {
  Avatar, Badge, Card, Empty, Stat, StatusBadge, Tabs,
  fmtDate, fmtTime, money, timeAgo,
} from '../../components/ui.jsx'
import { Ticket, Clock, Users, Info, Inbox, Check, Money, X } from '../../components/icons.jsx'

export default function MyBookings() {
  const app = useApp()
  const [tab, setTab] = useState('requests')
  const [payReq, setPayReq] = useState(null)

  const studentId = app.session.role === 'student' ? app.session.id : null

  const requests = useMemo(
    () =>
      app
        .requestsOfStudent(studentId)
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [app, studentId]
  )
  const enrollments = useMemo(
    () => app.enrollmentsOf(studentId).slice().sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)),
    [app, studentId]
  )

  if (!studentId) {
    return (
      <Card>
        <Empty icon={Info} title="Student view only">Switch to the student account from the sidebar to see bookings.</Empty>
      </Card>
    )
  }

  const awaitingPayment = requests.filter((r) => r.status === 'accepted')
  const spent = enrollments.reduce((sum, e) => sum + e.amount, 0)

  return (
    <>
      <div className="page-head">
        <h1>My bookings</h1>
        <p className="sub">Slot requests, confirmed sessions and the classes you have joined.</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <Stat label="Active requests" value={requests.filter((r) => r.status === 'pending').length} icon={Inbox} />
        <Stat label="Awaiting payment" value={awaitingPayment.length} icon={Clock} tone={awaitingPayment.length ? 'warning' : undefined} />
        <Stat label="Enrolled classes" value={enrollments.length} icon={Ticket} />
        <Stat label="Total paid" value={money(spent)} icon={Money} />
      </div>

      {awaitingPayment.length > 0 && (
        <Card style={{ marginBottom: 20, borderColor: 'var(--warning)', background: 'var(--warning-soft)' }}>
          <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
            <Clock width={18} height={18} style={{ color: 'var(--warning)', flex: 'none', marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 14, color: 'var(--warning)' }}>
                {awaitingPayment.length} request{awaitingPayment.length === 1 ? '' : 's'} accepted — pay to lock the slot
              </h3>
              <p className="small" style={{ color: 'var(--warning)', opacity: 0.9, marginTop: 3 }}>
                Other students may have been accepted for the same slot. The first payment wins it.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setPayReq(awaitingPayment[0])}>
              Pay now
            </button>
          </div>
        </Card>
      )}

      <Tabs
        tabs={[
          { id: 'requests', label: 'Slot requests', count: requests.filter((r) => r.status === 'pending' || r.status === 'accepted').length },
          { id: 'enrolled', label: 'Enrolled', count: enrollments.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'requests' && (
        requests.length === 0 ? (
          <Card>
            <Empty icon={Inbox} title="No slot requests yet" action={<Link className="btn btn-primary" to="/discover">Find an instructor</Link>}>
              Browse instructors and request one of their free time slots to get started.
            </Empty>
          </Card>
        ) : (
          <div className="col" style={{ gap: 12 }}>
            {requests.map((r) => {
              const slot = app.slotById[r.slotId]
              const ins = app.instructorById[slot?.instructorId]
              const mod = app.moduleById[r.moduleId]
              if (!slot || !ins) return null
              return (
                <Card key={r.id}>
                  <div className="row wrap" style={{ gap: 14, alignItems: 'flex-start' }}>
                    <Avatar name={ins.name} hue={ins.hue} size={44} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div className="row wrap" style={{ gap: 8 }}>
                        <Link to={`/instructor/${ins.id}`} style={{ fontWeight: 700 }}>{ins.name}</Link>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="small muted" style={{ marginTop: 3 }}>
                        {mod?.code} — {mod?.name}
                      </p>
                      <div className="row wrap small muted" style={{ gap: 12, marginTop: 6 }}>
                        <span className="row" style={{ gap: 5 }}>
                          <Clock width={13} height={13} />
                          {fmtDate(slot.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtTime(slot.start)} – {fmtTime(slot.end)}
                        </span>
                        <span className="faint tiny">requested {timeAgo(r.createdAt)}</span>
                      </div>
                      {r.note && (
                        <p className="small faint" style={{ marginTop: 8, paddingLeft: 11, borderLeft: '2px solid var(--border)' }}>
                          {r.note}
                        </p>
                      )}
                    </div>

                    <div className="col" style={{ gap: 8, alignItems: 'flex-end' }}>
                      <span className="bold" style={{ fontSize: 16 }}>{money(slot.price)}</span>
                      {r.status === 'accepted' && (
                        <button className="btn btn-primary btn-sm" onClick={() => setPayReq(r)}>
                          Pay &amp; confirm
                        </button>
                      )}
                      {r.status === 'pending' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            app.dispatch({ type: 'request/withdraw', id: r.id })
                            app.toast('Request withdrawn')
                          }}
                        >
                          <X width={14} height={14} /> Withdraw
                        </button>
                      )}
                      {r.status === 'paid' && <Badge tone="success"><Check width={12} height={12} /> Slot secured</Badge>}
                      {r.status === 'lost' && <span className="tiny faint">Another student paid first</span>}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      )}

      {tab === 'enrolled' && (
        enrollments.length === 0 ? (
          <Card>
            <Empty icon={Ticket} title="Nothing enrolled yet" action={<Link className="btn btn-primary" to="/classes">Browse group classes</Link>}>
              Group classes you pay for and slots you win will appear here.
            </Empty>
          </Card>
        ) : (
          <div className="grid grid-2">
            {enrollments.map((e) => {
              const isGroup = e.type === 'group'
              const cls = isGroup ? app.classById[e.refId] : null
              const slot = isGroup ? null : app.slotById[e.refId]
              const ins = app.instructorById[isGroup ? cls?.instructorId : slot?.instructorId]
              if (!ins) return null
              const days = Math.floor((Date.now() - new Date(e.startedAt).getTime()) / 86400000)
              return (
                <Card key={e.id} className="col" style={{ gap: 12 }}>
                  <div className="row">
                    <Badge tone="accent">{isGroup ? <><Users width={12} height={12} /> Group class</> : <><Clock width={12} height={12} /> One-to-one</>}</Badge>
                    <div className="spacer" />
                    <Badge tone="success">Paid {money(e.amount)}</Badge>
                  </div>
                  <h3>{isGroup ? cls?.title : `Session with ${ins.name}`}</h3>
                  <div className="row" style={{ gap: 9 }}>
                    <Avatar name={ins.name} hue={ins.hue} size={30} />
                    <Link to={`/instructor/${ins.id}`} className="small" style={{ fontWeight: 600 }}>{ins.name}</Link>
                  </div>
                  <div className="col small muted" style={{ gap: 4 }}>
                    {isGroup ? (
                      <>
                        <span>{cls?.schedule}</span>
                        <span className="tiny faint">Starts {fmtDate(cls?.startsAt, { day: 'numeric', month: 'long' })}</span>
                      </>
                    ) : (
                      <span>
                        {fmtDate(slot.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {fmtTime(slot.start)} – {fmtTime(slot.end)}
                      </span>
                    )}
                  </div>
                  <hr className="divider" />
                  <div className="row">
                    <span className="tiny faint" style={{ flex: 1 }}>
                      {days} day{days === 1 ? '' : 's'} of learning{days >= 30 ? ' · you can review this instructor' : ` · ${30 - days} days to review`}
                    </span>
                    <Link className="btn btn-sm btn-outline" to={`/instructor/${ins.id}`}>Open</Link>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      )}

      {payReq && (() => {
        const slot = app.slotById[payReq.slotId]
        const ins = app.instructorById[slot?.instructorId]
        const mod = app.moduleById[payReq.moduleId]
        return (
          <PaymentModal
            open
            title="Secure your time slot"
            cta="Pay & secure"
            total={slot.price}
            warning="This slot is not reserved until the payment completes. If another accepted student pays first, they get it and you are refunded automatically."
            lines={[
              { label: 'Instructor', value: ins?.name },
              { label: 'Module', value: `${mod?.code} — ${mod?.name}` },
              { label: 'Date', value: fmtDate(slot.date, { weekday: 'short', day: 'numeric', month: 'short' }) },
              { label: 'Time', value: `${fmtTime(slot.start)} – ${fmtTime(slot.end)}` },
            ]}
            onClose={() => setPayReq(null)}
            onConfirm={(method) => {
              const stillOpen = app.slotById[payReq.slotId]?.status === 'open'
              app.dispatch({ type: 'request/pay', id: payReq.id, method })
              setPayReq(null)
              app.toast(stillOpen ? 'Payment successful — the slot is yours' : 'That slot was just taken', stillOpen ? 'ok' : 'err')
            }}
          />
        )
      })()}
    </>
  )
}
