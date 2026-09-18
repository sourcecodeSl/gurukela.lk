import { Fragment, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Stat, Stars, fmtDate, hours, money } from '../../components/ui.jsx'
import { ChevronLeft, ChevronDown, ChevronRight, Users, Money, Clock, Ticket, Shield } from '../../components/icons.jsx'

/**
 * Admin view of a single instructor: their students and each student's
 * payments. Everything is derived from the payments/enrollments already loaded
 * for the admin, grouped by student so the admin can inspect earnings and who
 * is studying with this instructor.
 */
export default function InstructorDetail() {
  const { id } = useParams()
  const app = useApp()
  const [expanded, setExpanded] = useState(() => new Set())

  const ins = app.instructorById[id]

  // Describe what a payment was for, mirroring the admin Payments page but
  // covering seminars too (group / seminar / one-to-one slot).
  const labelFor = (enr) => {
    if (!enr) return 'Payment'
    if (enr.type === 'group') return app.classById[enr.refId]?.title || 'Group class'
    if (enr.type === 'seminar') return app.seminarById[enr.refId]?.title || 'Seminar'
    return 'One-to-one session'
  }
  const kindLabel = (enr) =>
    enr?.type === 'group' ? 'Group class' : enr?.type === 'seminar' ? 'Seminar' : 'One-to-one'

  // Group this instructor's payments by student.
  const students = useMemo(() => {
    const byStudent = {}
    for (const p of app.payments) {
      if (p.instructorId !== id) continue
      const enr = app.enrollments.find((e) => e.id === p.enrollmentId)
      const std = app.studentById[p.studentId]
      const row = (byStudent[p.studentId] ||= {
        id: p.studentId,
        student: std || { id: p.studentId, name: 'Unknown student', hue: 205 },
        payments: [],
        total: 0,
      })
      row.payments.push({ ...p, enr, label: labelFor(enr), kind: kindLabel(enr) })
      row.total += Number(p.amount) || 0
    }
    return Object.values(byStudent)
      .map((s) => ({
        ...s,
        payments: s.payments.sort((a, b) => new Date(b.at) - new Date(a.at)),
      }))
      .sort((a, b) => b.total - a.total)
  }, [app.payments, app.enrollments, app.studentById, app.classById, app.seminarById, id])

  const totals = useMemo(() => {
    const all = students.flatMap((s) => s.payments)
    const collected = all.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const earning = all.reduce((sum, p) => sum + (Number(p.instructorEarning) || 0), 0)
    return { collected, earning, payments: all.length }
  }, [students])

  const toggle = (sid) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(sid) ? next.delete(sid) : next.add(sid)
      return next
    })

  if (!ins) {
    return (
      <>
        <div className="page-head">
          <Link to="/admin/instructors" className="row small muted" style={{ gap: 4, marginBottom: 8 }}>
            <ChevronLeft width={15} height={15} /> Back to instructors
          </Link>
          <h1>Instructor</h1>
        </div>
        <Card><Empty icon={Users} title="Instructor not found" /></Card>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <Link to="/admin/instructors" className="row small muted" style={{ gap: 4, marginBottom: 10 }}>
          <ChevronLeft width={15} height={15} /> Back to instructors
        </Link>
        <div className="row" style={{ gap: 14, alignItems: 'center' }}>
          <Avatar name={ins.name} hue={ins.hue} size={52} src={ins.photoUrl || undefined} />
          <div className="col" style={{ lineHeight: 1.4, minWidth: 0 }}>
            <div className="row" style={{ gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0 }}>{ins.name}</h1>
              {ins.verified ? (
                <Badge tone="success"><Shield width={11} height={11} /> Verified</Badge>
              ) : (
                <Badge tone="warning">Pending</Badge>
              )}
            </div>
            <span className="sub">{[ins.title, ins.city].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <Stat label="Students" value={students.length} sub="who have paid" icon={Users} />
        <Stat label="Total collected" value={money(totals.collected)} sub={`${totals.payments} payments`} icon={Money} />
        <Stat label="Instructor earnings" value={money(totals.earning)} sub="after commission" icon={Ticket} />
        <Stat label="Teaching hours" value={hours(ins.teachingHours)} icon={Clock} />
      </div>

      {students.length === 0 ? (
        <Card><Empty icon={Users} title="No paying students yet" >This instructor has no recorded payments.</Empty></Card>
      ) : (
        <Card pad={false}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th /><th>Student</th><th>Payments</th><th>Total paid</th><th /></tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const open = expanded.has(s.id)
                  return (
                    <Fragment key={s.id}>
                      <tr onClick={() => toggle(s.id)} style={{ cursor: 'pointer' }}>
                        <td style={{ width: 30 }}>
                          {open ? <ChevronDown width={16} height={16} /> : <ChevronRight width={16} height={16} />}
                        </td>
                        <td>
                          <div className="row" style={{ gap: 10 }}>
                            <Avatar name={s.student.name} hue={s.student.hue} size={30} />
                            <div className="col" style={{ lineHeight: 1.3, minWidth: 0 }}>
                              <span className="small" style={{ fontWeight: 600 }}>{s.student.name}</span>
                              {s.student.grade && <span className="tiny faint">Grade {s.student.grade}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="small">{s.payments.length}</td>
                        <td className="bold">{money(s.total)}</td>
                        <td className="small muted" style={{ textAlign: 'right' }}>
                          {open ? 'Hide' : 'View'} payments
                        </td>
                      </tr>
                      {open && (
                        <tr>
                          <td colSpan={5} style={{ padding: 0, background: 'var(--surface-2, rgba(0,0,0,0.02))' }}>
                            <table className="table" style={{ margin: 0 }}>
                              <thead>
                                <tr><th style={{ width: 30 }} /><th>Paid for</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
                              </thead>
                              <tbody>
                                {s.payments.map((p) => (
                                  <tr key={p.id}>
                                    <td />
                                    <td>
                                      <div className="col" style={{ lineHeight: 1.35 }}>
                                        <span className="small truncate" style={{ maxWidth: 240 }}>{p.label}</span>
                                        <Badge tone="accent" style={{ alignSelf: 'flex-start', marginTop: 3 }}>{p.kind}</Badge>
                                      </div>
                                    </td>
                                    <td className="bold">{money(p.amount)}</td>
                                    <td className="small muted" style={{ textTransform: 'capitalize' }}>{p.method}</td>
                                    <td><Badge tone="success">{p.status}</Badge></td>
                                    <td className="small muted">{fmtDate(p.at, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
