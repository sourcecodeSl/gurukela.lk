import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext.jsx'
import PaymentModal from '../../components/PaymentModal.jsx'
import SeminarQuiz from './SeminarQuiz.jsx'
import { Avatar, Badge, Card, Empty, fmtDate, money } from '../../components/ui.jsx'
import { Search, Video, Clock, Calendar, Check, Users } from '../../components/icons.jsx'

export default function Seminars() {
  const app = useApp()
  const [q, setQ] = useState('')
  const [access, setAccess] = useState('all')
  const [paySeminar, setPaySeminar] = useState(null)

  const studentId = app.session.role === 'student' ? app.session.id : null

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return app.seminars
      .filter((s) => {
        if (access === 'free' && !s.isFree) return false
        if (access === 'paid' && s.isFree) return false
        if (needle) {
          const ins = app.instructorById[s.instructorId]
          const subject = app.subjectById[s.subjectId]
          const hay = `${s.title} ${s.description} ${subject?.name || ''} ${ins?.name || ''}`.toLowerCase()
          if (!hay.includes(needle)) return false
        }
        return true
      })
      .sort((a, b) => new Date(a.startsAt || 0) - new Date(b.startsAt || 0))
  }, [app, q, access])

  return (
    <>
      <div className="page-head">
        <h1>Live seminars</h1>
        <p className="sub">One-off live sessions from our instructors. Register for free ones, or pay to join the premium ones.</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="search" style={{ flex: '1 1 240px' }}>
            <Search className="ico" width={17} height={17} />
            <input className="input" placeholder="Search seminars…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="select" style={{ width: 160 }} value={access} onChange={(e) => setAccess(e.target.value)}>
            <option value="all">All seminars</option>
            <option value="free">Free only</option>
            <option value="paid">Paid only</option>
          </select>
        </div>
      </Card>

      {list.length === 0 ? (
        <Card><Empty icon={Video} title="No seminars right now">Check back soon — instructors add new live sessions regularly.</Empty></Card>
      ) : (
        <div className="grid grid-3">
          {list.map((s) => {
            const ins = app.instructorById[s.instructorId]
            const subject = app.subjectById[s.subjectId]
            const full = s.seats > 0 && s.registered >= s.seats
            const reg = app.seminarRegOf(s.id)
            const registered = !!reg
            return (
              <Card key={s.id} hover className="col" style={{ gap: 13 }}>
                <div className="row" style={{ gap: 6 }}>
                  {subject && <Badge tone="accent">{subject.name}</Badge>}
                  <Badge tone={s.isFree ? 'success' : 'accent'}>{s.isFree ? 'Free' : money(s.price)}</Badge>
                  <div className="spacer" />
                  {full && !registered
                    ? <Badge tone="danger">Full</Badge>
                    : s.seats > 0 && <Badge>{s.seats - s.registered} left</Badge>}
                </div>

                <div>
                  <h3 style={{ lineHeight: 1.35 }}>{s.title}</h3>
                  <p className="small muted" style={{ marginTop: 5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.description}
                  </p>
                </div>

                {ins && (
                  <Link to={`/instructor/${ins.id}`} className="row" style={{ gap: 9 }}>
                    <Avatar name={ins.name} hue={ins.hue} size={30} src={ins.photoUrl || undefined} />
                    <div className="col" style={{ lineHeight: 1.3 }}>
                      <span className="small" style={{ fontWeight: 600 }}>{ins.name}</span>
                      <span className="tiny faint">★ {ins.rating} · {ins.reviewCount} reviews</span>
                    </div>
                  </Link>
                )}

                <div className="col small muted" style={{ gap: 5 }}>
                  <span className="row" style={{ gap: 6 }}>
                    <Calendar width={14} height={14} />
                    {s.startsAt ? fmtDate(s.startsAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Time to be announced'}
                  </span>
                  <span className="row" style={{ gap: 6 }}><Clock width={14} height={14} />{s.durationMins} mins</span>
                  <span className="row" style={{ gap: 6 }}><Users width={14} height={14} />{s.registered} registered</span>
                </div>

                <hr className="divider" />

                <div className="row">
                  <span className="bold" style={{ fontSize: 16 }}>{s.isFree ? 'Free' : money(s.price)}</span>
                  <div className="spacer" />
                  {registered ? (
                    reg.meetLink ? (
                      <a className="btn btn-primary btn-sm" href={reg.meetLink} target="_blank" rel="noreferrer">
                        <Video width={14} height={14} /> Join live
                      </a>
                    ) : (
                      <Badge tone="success"><Check width={12} height={12} /> Registered</Badge>
                    )
                  ) : s.isFree ? (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={full || !studentId}
                      onClick={async () => {
                        await app.dispatch({ type: 'seminar/register', id: s.id })
                        app.toast('You are registered — the join link is ready!')
                      }}
                    >
                      Register free
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-sm" disabled={full || !studentId} onClick={() => setPaySeminar(s)}>
                      Pay &amp; join
                    </button>
                  )}
                </div>

                {registered && <SeminarQuiz seminarId={s.id} />}
              </Card>
            )
          })}
        </div>
      )}

      {paySeminar && (
        <PaymentModal
          open
          title="Join seminar"
          cta="Pay & register"
          payFor={{ kind: 'seminar', id: paySeminar.id }}
          total={paySeminar.price}
          lines={[
            { label: 'Seminar', value: paySeminar.title },
            { label: 'Instructor', value: app.instructorById[paySeminar.instructorId]?.name || '—' },
            { label: 'Starts', value: paySeminar.startsAt ? fmtDate(paySeminar.startsAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'TBA' },
          ]}
          onClose={() => setPaySeminar(null)}
          onConfirm={() => {
            setPaySeminar(null)
            app.toast('Registered for the seminar!')
          }}
        />
      )}
    </>
  )
}
