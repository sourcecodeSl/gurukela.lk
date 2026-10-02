import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Spinner, fmtDate } from '../../components/ui.jsx'
import { Search, Shield, Check, X, Users } from '../../components/icons.jsx'

export default function Students() {
  const app = useApp()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  // Which "<studentId>:<action>" is mid-request — drives the inline spinner
  // and disables the row's buttons so a click can't be fired twice.
  const [busy, setBusy] = useState(null)

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const filtered = app.students.filter((s) => {
      if (filter === 'verified' && !s.phoneVerified) return false
      if (filter === 'unverified' && s.phoneVerified) return false
      if (filter === 'banned' && !s.banned) return false
      if (
        needle &&
        !`${s.name} ${s.code || ''} ${s.email || ''} ${s.phone || ''} ${s.grade || ''}`
          .toLowerCase()
          .includes(needle)
      )
        return false
      return true
    })
    const by = {
      recent: (a, b) => new Date(b.joinedAt) - new Date(a.joinedAt),
      name: (a, b) => a.name.localeCompare(b.name),
      grade: (a, b) => (a.grade || '').localeCompare(b.grade || ''),
    }
    return [...filtered].sort(by[sort])
  }, [app.students, q, filter, sort])

  // Wrap a dispatch in a busy flag so the row shows a spinner and blocks
  // repeat clicks while the API call is in flight.
  const run = async (key, fn) => {
    if (busy) return
    setBusy(key)
    try {
      await fn()
    } catch {
      /* dispatch already surfaced the error via a toast */
    } finally {
      setBusy(null)
    }
  }

  const verifiedCount = app.students.filter((s) => s.phoneVerified).length

  return (
    <>
      <div className="page-head">
        <h1>Students</h1>
        <p className="sub">{app.students.length} registered · {verifiedCount} phone-verified.</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="search" style={{ flex: '1 1 240px' }}>
            <Search className="ico" width={17} height={17} />
            <input className="input" placeholder="Search by name, ID, phone, email…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="row wrap" style={{ gap: 7 }}>
            {[['all', 'All'], ['verified', 'Verified'], ['unverified', 'Unverified'], ['banned', 'Banned']].map(([id, label]) => (
              <button key={id} className={`chip ${filter === id ? 'on' : ''}`} onClick={() => setFilter(id)}>
                {label}
              </button>
            ))}
          </div>
          <select className="select" style={{ width: 170 }} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Sort: newest</option>
            <option value="name">Sort: name</option>
            <option value="grade">Sort: grade</option>
          </select>
        </div>
      </Card>

      {list.length === 0 ? (
        <Card><Empty icon={Users} title="No students match" /></Card>
      ) : (
        <Card pad={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th><th>Student ID</th><th>Phone</th><th>Grade</th><th>Subjects</th><th>Joined</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="row" style={{ gap: 11 }}>
                        <Avatar name={s.name} hue={s.hue} size={36} />
                        <div className="col" style={{ lineHeight: 1.35, minWidth: 0 }}>
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                          {s.email && <span className="tiny faint truncate">{s.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="small bold">{s.code || '—'}</td>
                    <td className="small">{s.phone || '—'}</td>
                    <td className="small">
                      {s.grade || '—'}
                      {s.examYear ? <span className="tiny faint"> · {s.examYear}</span> : null}
                    </td>
                    <td>
                      <div className="row wrap" style={{ gap: 5, maxWidth: 200 }}>
                        {(s.subjectIds || []).slice(0, 2).map((id) => (
                          <Badge key={id}>{app.subjectById[id]?.name || '—'}</Badge>
                        ))}
                        {(s.subjectIds?.length || 0) > 2 && <Badge>+{s.subjectIds.length - 2}</Badge>}
                        {!(s.subjectIds?.length) && <span className="tiny faint">—</span>}
                      </div>
                    </td>
                    <td className="small faint">{s.joinedAt ? fmtDate(s.joinedAt, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td>
                      <div className="col" style={{ gap: 5, alignItems: 'flex-start' }}>
                        {s.phoneVerified ? (
                          <Badge tone="success"><Shield width={11} height={11} /> Verified</Badge>
                        ) : (
                          <Badge tone="warning">Unverified</Badge>
                        )}
                        {s.banned && <Badge tone="danger">Banned</Badge>}
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 7, justifyContent: 'flex-end', marginLeft: 'auto' }}>
                        <button
                          className={`btn btn-sm ${s.banned ? 'btn-primary' : 'btn-ghost'}`}
                          disabled={!!busy}
                          onClick={() => run(`${s.id}:ban`, async () => {
                            const next = !s.banned
                            if (next && !(await app.confirm({
                              title: 'Ban this student?',
                              text: `${s.name} will no longer be able to sign in or access the platform.`,
                              confirmText: 'Ban',
                            }))) return
                            await app.dispatch({ type: 'student/setBanned', id: s.id, banned: next })
                            app.toast(next ? `${s.name} banned` : `${s.name} unbanned`, next ? 'err' : 'ok')
                          })}
                        >
                          {busy === `${s.id}:ban` ? <Spinner /> : s.banned ? <><Check width={14} height={14} /> Unban</> : <><X width={14} height={14} /> Ban</>}
                        </button>
                      </div>
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
