import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, StatusBadge, Tabs, fmtDate, fmtTime, money, timeAgo } from '../../components/ui.jsx'
import { Inbox, Check, X, Clock, Info, Users } from '../../components/icons.jsx'

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'closed', label: 'Closed' },
]

export default function Requests() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const [tab, setTab] = useState('pending')

  const all = app.requestsForInstructor(me.id)

  const grouped = useMemo(() => {
    const bySlot = {}
    const wanted =
      tab === 'closed'
        ? all.filter((r) => ['rejected', 'paid', 'lost'].includes(r.status))
        : all.filter((r) => r.status === tab)

    for (const r of wanted) {
      ;(bySlot[r.slotId] ||= []).push(r)
    }
    return Object.entries(bySlot)
      .map(([slotId, requests]) => ({ slot: app.slotById[slotId], requests }))
      .filter((g) => g.slot)
      .sort((a, b) => new Date(a.slot.date) - new Date(b.slot.date))
  }, [all, tab, app])

  const counts = {
    pending: all.filter((r) => r.status === 'pending').length,
    accepted: all.filter((r) => r.status === 'accepted').length,
    closed: all.filter((r) => ['rejected', 'paid', 'lost'].includes(r.status)).length,
  }

  return (
    <>
      <div className="page-head">
        <h1>Slot requests</h1>
        <p className="sub">
          Accept as many students as you like for a slot — the platform gives it to whoever pays first and closes the rest.
        </p>
      </div>

      <Card style={{ marginBottom: 20, background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
          <Info width={18} height={18} className="accent" style={{ flex: 'none', marginTop: 2 }} />
          <p className="small muted">
            Requests are grouped by time slot so you can see who is competing for the same hour. Accepting does not
            reserve anything until payment lands.
          </p>
        </div>
      </Card>

      <Tabs tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} value={tab} onChange={setTab} />

      {grouped.length === 0 ? (
        <Card>
          <Empty icon={Inbox} title={`No ${tab} requests`}>
            {tab === 'pending' ? 'When students request one of your free slots, they land here.' : 'Nothing in this list yet.'}
          </Empty>
        </Card>
      ) : (
        <div className="col" style={{ gap: 'var(--gap)' }}>
          {grouped.map(({ slot, requests }) => (
            <Card key={slot.id} pad={false}>
              <div className="row wrap" style={{ padding: 'var(--pad)', gap: 12, borderBottom: '1px solid var(--border)' }}>
                <div
                  className="col center"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r)', padding: '8px 12px', minWidth: 58 }}
                >
                  <span className="tiny bold">{fmtDate(slot.date, { weekday: 'short' })}</span>
                  <span style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.1 }}>{new Date(slot.date).getDate()}</span>
                  <span className="tiny">{fmtDate(slot.date, { month: 'short' })}</span>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <h3>{fmtTime(slot.start)} – {fmtTime(slot.end)}</h3>
                    <StatusBadge status={slot.status} />
                  </div>
                  <p className="small muted" style={{ marginTop: 2 }}>{money(slot.price)} · {requests.length} request{requests.length === 1 ? '' : 's'}</p>
                </div>
                {requests.length > 1 && slot.status === 'open' && (
                  <Badge tone="warning"><Users width={12} height={12} /> {requests.length} students competing</Badge>
                )}
              </div>

              <div style={{ padding: '4px var(--pad) var(--pad)' }}>
                {requests.map((r) => {
                  const std = app.studentById[r.studentId]
                  const mod = app.moduleById[r.moduleId]
                  return (
                    <div key={r.id} className="row wrap" style={{ gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                      <Avatar name={std?.name} hue={std?.hue} size={40} />
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div className="row wrap" style={{ gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{std?.name}</span>
                          <StatusBadge status={r.status} />
                          <span className="tiny faint">{timeAgo(r.createdAt)}</span>
                        </div>
                        <div className="row wrap" style={{ gap: 6, marginTop: 5 }}>
                          <Badge tone="accent">{mod?.code}</Badge>
                          <span className="small muted">{mod?.name}</span>
                        </div>
                        {r.note && (
                          <p className="small faint" style={{ marginTop: 8, paddingLeft: 11, borderLeft: '2px solid var(--border)' }}>
                            “{r.note}”
                          </p>
                        )}
                      </div>

                      <div className="row" style={{ gap: 7 }}>
                        {r.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => { app.dispatch({ type: 'request/accept', id: r.id }); app.toast(`Accepted ${std?.name}`) }}
                            >
                              <Check width={14} height={14} /> Accept
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => { app.dispatch({ type: 'request/reject', id: r.id }); app.toast('Request rejected', 'err') }}
                            >
                              <X width={14} height={14} /> Reject
                            </button>
                          </>
                        )}
                        {r.status === 'accepted' && (
                          <span className="row tiny faint" style={{ gap: 5 }}>
                            <Clock width={13} height={13} /> Waiting for payment
                          </span>
                        )}
                        {r.status === 'paid' && <Badge tone="success"><Check width={12} height={12} /> Paid &amp; confirmed</Badge>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
