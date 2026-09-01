import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext.jsx'
import PaymentModal from '../../components/PaymentModal.jsx'
import { Avatar, Badge, Card, Empty, fmtDate, money } from '../../components/ui.jsx'
import { Search, Users, Clock, Calendar, Check } from '../../components/icons.jsx'

export default function GroupClasses() {
  const app = useApp()
  const [q, setQ] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [availability, setAvailability] = useState('all')
  const [sort, setSort] = useState('soonest')
  const [payClass, setPayClass] = useState(null)

  const studentId = app.session.role === 'student' ? app.session.id : null

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const filtered = app.groupClasses.filter((c) => {
      const mod = app.moduleById[c.moduleId]
      if (subjectId && mod?.subjectId !== subjectId) return false
      if (availability === 'open' && c.enrolled >= c.seats) return false
      if (needle) {
        const ins = app.instructorById[c.instructorId]
        const hay = `${c.title} ${c.description} ${mod?.name} ${mod?.code} ${ins?.name}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    const by = {
      soonest: (a, b) => new Date(a.startsAt) - new Date(b.startsAt),
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      popular: (a, b) => b.enrolled - a.enrolled,
    }
    return [...filtered].sort(by[sort])
  }, [app, q, subjectId, availability, sort])

  return (
    <>
      <div className="page-head">
        <h1>Group classes</h1>
        <p className="sub">Pre-scheduled batches — pay once and join straight away, no request needed.</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="search" style={{ flex: '1 1 240px' }}>
            <Search className="ico" width={17} height={17} />
            <input className="input" placeholder="Search classes…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="select" style={{ width: 180 }} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">All subjects</option>
            {app.subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select className="select" style={{ width: 160 }} value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="all">All classes</option>
            <option value="open">Seats available</option>
          </select>
          <select className="select" style={{ width: 180 }} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="soonest">Starting soonest</option>
            <option value="popular">Most popular</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
          </select>
        </div>
      </Card>

      {list.length === 0 ? (
        <Card><Empty icon={Users} title="No classes match your search">Try a different subject or clear the availability filter.</Empty></Card>
      ) : (
        <div className="grid grid-3">
          {list.map((c) => {
            const ins = app.instructorById[c.instructorId]
            const mod = app.moduleById[c.moduleId]
            const full = c.enrolled >= c.seats
            const joined = app.enrollments.some(
              (e) => e.type === 'group' && e.refId === c.id && e.studentId === studentId
            )
            return (
              <Card key={c.id} hover className="col" style={{ gap: 13 }}>
                <div className="row" style={{ gap: 6 }}>
                  <Badge tone="accent">{mod?.code}</Badge>
                  <Badge>{c.level}</Badge>
                  <div className="spacer" />
                  {full ? <Badge tone="danger">Full</Badge> : <Badge tone="success">{c.seats - c.enrolled} left</Badge>}
                </div>

                <div>
                  <h3 style={{ lineHeight: 1.35 }}>{c.title}</h3>
                  <p className="small muted" style={{ marginTop: 5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.description}
                  </p>
                </div>

                <Link to={`/instructor/${ins.id}`} className="row" style={{ gap: 9 }}>
                  <Avatar name={ins.name} hue={ins.hue} size={30} />
                  <div className="col" style={{ lineHeight: 1.3 }}>
                    <span className="small" style={{ fontWeight: 600 }}>{ins.name}</span>
                    <span className="tiny faint">★ {ins.rating} · {ins.reviewCount} reviews</span>
                  </div>
                </Link>

                <div className="col small muted" style={{ gap: 5 }}>
                  <span className="row" style={{ gap: 6 }}><Clock width={14} height={14} />{c.schedule}</span>
                  <span className="row" style={{ gap: 6 }}>
                    <Calendar width={14} height={14} />
                    Starts {fmtDate(c.startsAt, { day: 'numeric', month: 'long' })} · {c.weeks} weeks
                  </span>
                </div>

                <div>
                  <div className="tiny faint" style={{ marginBottom: 5 }}>{c.enrolled} of {c.seats} seats taken</div>
                  <div className="meter"><i style={{ width: `${(c.enrolled / c.seats) * 100}%` }} /></div>
                </div>

                <hr className="divider" />

                <div className="row">
                  <div className="col">
                    <span className="bold" style={{ fontSize: 16 }}>{money(c.price)}</span>
                    <span className="tiny faint">{money(Math.round(c.price / c.weeks))} / week</span>
                  </div>
                  <div className="spacer" />
                  {joined ? (
                    <Badge tone="success"><Check width={12} height={12} /> Enrolled</Badge>
                  ) : (
                    <button className="btn btn-primary btn-sm" disabled={full || !studentId} onClick={() => setPayClass(c)}>
                      Pay &amp; join
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {payClass && (
        <PaymentModal
          open
          title="Join group class"
          cta="Pay & enrol"
          total={payClass.price}
          lines={[
            { label: 'Class', value: payClass.title },
            { label: 'Instructor', value: app.instructorById[payClass.instructorId]?.name },
            { label: 'Schedule', value: payClass.schedule },
            { label: 'Seats left', value: payClass.seats - payClass.enrolled },
          ]}
          onClose={() => setPayClass(null)}
          onConfirm={(method) => {
            app.dispatch({ type: 'group/join', id: payClass.id, studentId, method })
            setPayClass(null)
            app.toast('Enrolled — welcome to the class!')
          }}
        />
      )}
    </>
  )
}
