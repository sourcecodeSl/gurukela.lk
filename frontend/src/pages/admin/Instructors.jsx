import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Stars, hours, money } from '../../components/ui.jsx'
import { Search, Shield, Check, X, Users } from '../../components/icons.jsx'

export default function Instructors() {
  const app = useApp()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('rating')

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const filtered = app.instructors.filter((i) => {
      if (filter === 'verified' && !i.verified) return false
      if (filter === 'unverified' && i.verified) return false
      if (needle && !`${i.name} ${i.title} ${i.city}`.toLowerCase().includes(needle)) return false
      return true
    })
    const by = {
      rating: (a, b) => b.rating - a.rating,
      hours: (a, b) => b.teachingHours - a.teachingHours,
      students: (a, b) => b.studentCount - a.studentCount,
      name: (a, b) => a.name.localeCompare(b.name),
    }
    return [...filtered].sort(by[sort])
  }, [app.instructors, q, filter, sort])

  return (
    <>
      <div className="page-head">
        <h1>Instructors</h1>
        <p className="sub">{app.instructors.length} registered · {app.instructors.filter((i) => i.verified).length} verified.</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="search" style={{ flex: '1 1 240px' }}>
            <Search className="ico" width={17} height={17} />
            <input className="input" placeholder="Search instructors…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="row wrap" style={{ gap: 7 }}>
            {[['all', 'All'], ['verified', 'Verified'], ['unverified', 'Unverified']].map(([id, label]) => (
              <button key={id} className={`chip ${filter === id ? 'on' : ''}`} onClick={() => setFilter(id)}>
                {label}
              </button>
            ))}
          </div>
          <select className="select" style={{ width: 190 }} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="rating">Sort: rating</option>
            <option value="hours">Sort: teaching hours</option>
            <option value="students">Sort: students</option>
            <option value="name">Sort: name</option>
          </select>
        </div>
      </Card>

      {list.length === 0 ? (
        <Card><Empty icon={Users} title="No instructors match" /></Card>
      ) : (
        <Card pad={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Instructor</th><th>Modules</th><th>Rating</th><th>Hours</th><th>Students</th><th>Rate</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {list.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div className="row" style={{ gap: 11 }}>
                        <Avatar name={i.name} hue={i.hue} size={36} />
                        <div className="col" style={{ lineHeight: 1.35, minWidth: 0 }}>
                          <Link to={`/instructor/${i.id}`} style={{ fontWeight: 600 }}>{i.name}</Link>
                          <span className="tiny faint truncate">{i.title} · {i.city}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="row wrap" style={{ gap: 5, maxWidth: 200 }}>
                        {app.modulesOf(i.id).slice(0, 2).map((m) => (
                          <Badge key={m.id}>{m.code}</Badge>
                        ))}
                        {i.moduleIds.length > 2 && <Badge>+{i.moduleIds.length - 2}</Badge>}
                      </div>
                    </td>
                    <td><Stars value={i.rating} showValue count={i.reviewCount} /></td>
                    <td className="small bold">{hours(i.teachingHours)}</td>
                    <td className="small">{i.studentCount}</td>
                    <td className="small">{money(i.hourlyRate)}</td>
                    <td>
                      {i.verified ? (
                        <Badge tone="success"><Shield width={11} height={11} /> Verified</Badge>
                      ) : (
                        <Badge tone="warning">Pending</Badge>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${i.verified ? 'btn-ghost' : 'btn-primary'}`}
                        onClick={() => {
                          app.dispatch({ type: 'instructor/verify', id: i.id, verified: !i.verified })
                          app.toast(i.verified ? `${i.name} unverified` : `${i.name} verified`, i.verified ? 'err' : 'ok')
                        }}
                      >
                        {i.verified ? <><X width={14} height={14} /> Revoke</> : <><Check width={14} height={14} /> Verify</>}
                      </button>
                    </td>
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
