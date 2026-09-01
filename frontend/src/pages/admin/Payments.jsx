import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Stat, fmtDate, money } from '../../components/ui.jsx'
import { Money, Users, Ticket, Clock, Search } from '../../components/icons.jsx'

export default function Payments() {
  const app = useApp()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return app.payments
      .map((p) => {
        const enr = app.enrollments.find((e) => e.id === p.enrollmentId)
        const std = app.studentById[p.studentId]
        const isGroup = enr?.type === 'group'
        const cls = isGroup ? app.classById[enr.refId] : null
        const slot = !isGroup && enr ? app.slotById[enr.refId] : null
        const ins = app.instructorById[isGroup ? cls?.instructorId : slot?.instructorId]
        return { ...p, enr, std, ins, isGroup, label: isGroup ? cls?.title : `1-to-1 session` }
      })
      .filter((r) => {
        if (type === 'group' && !r.isGroup) return false
        if (type === 'slot' && r.isGroup) return false
        if (needle && !`${r.std?.name} ${r.ins?.name} ${r.label}`.toLowerCase().includes(needle)) return false
        return true
      })
      .sort((a, b) => new Date(b.at) - new Date(a.at))
  }, [app, q, type])

  const total = rows.reduce((s, r) => s + r.amount, 0)
  const groupTotal = rows.filter((r) => r.isGroup).reduce((s, r) => s + r.amount, 0)

  return (
    <>
      <div className="page-head">
        <h1>Payments</h1>
        <p className="sub">Every successful transaction on the platform.</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <Stat label="Total collected" value={money(total)} sub={`${rows.length} payments`} icon={Money} />
        <Stat label="Group classes" value={money(groupTotal)} icon={Users} />
        <Stat label="One-to-one slots" value={money(total - groupTotal)} icon={Clock} />
        <Stat label="Avg. transaction" value={money(rows.length ? Math.round(total / rows.length) : 0)} icon={Ticket} />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="search" style={{ flex: '1 1 240px' }}>
            <Search className="ico" width={17} height={17} />
            <input className="input" placeholder="Search by student, instructor or class…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="row wrap" style={{ gap: 7 }}>
            {[['all', 'All'], ['group', 'Group classes'], ['slot', 'Free slots']].map(([id, label]) => (
              <button key={id} className={`chip ${type === id ? 'on' : ''}`} onClick={() => setType(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card><Empty icon={Money} title="No payments found" /></Card>
      ) : (
        <Card pad={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Student</th><th>Paid for</th><th>Instructor</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <Avatar name={r.std?.name} hue={r.std?.hue} size={30} />
                        <span className="small" style={{ fontWeight: 600 }}>{r.std?.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="col" style={{ lineHeight: 1.35 }}>
                        <span className="small truncate" style={{ maxWidth: 220 }}>{r.label}</span>
                        <Badge tone="accent" style={{ alignSelf: 'flex-start', marginTop: 3 }}>
                          {r.isGroup ? 'Group class' : 'Free slot'}
                        </Badge>
                      </div>
                    </td>
                    <td className="small muted">{r.ins?.name || '—'}</td>
                    <td className="bold">{money(r.amount)}</td>
                    <td className="small muted" style={{ textTransform: 'capitalize' }}>{r.method}</td>
                    <td><Badge tone="success">{r.status}</Badge></td>
                    <td className="small muted">{fmtDate(r.at, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
