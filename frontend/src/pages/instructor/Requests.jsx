import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Field, Modal, Spinner, StatusBadge, Tabs, fmtDate, fmtTime, money, timeAgo, slotEnded } from '../../components/ui.jsx'
import { Inbox, Check, X, Clock, Info, Users, Calendar } from '../../components/icons.jsx'

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'closed', label: 'Closed' },
]

export default function Requests() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const [tab, setTab] = useState('pending')
  const [proposeFor, setProposeFor] = useState(null) // { studentId, studentName }
  const [acceptFor, setAcceptFor] = useState(null) // custom request awaiting a price
  const [acceptSlotFor, setAcceptSlotFor] = useState(null) // slot request awaiting a note
  const [rescheduleFor, setRescheduleFor] = useState(null) // custom request to counter-offer

  const all = app.requestsForInstructor(me.id)

  // Drop any request whose time has passed — slot-based ones by their slot,
  // custom (slot-less) ones by their proposed date/time.
  const reqEnded = (r) => {
    const slot = app.slotById[r.slotId]
    return slot ? slotEnded(slot) : slotEnded({ date: r.reqDate, end: r.reqEnd })
  }
  const live = all.filter((r) => !reqEnded(r))

  const matchesTab = (r) =>
    tab === 'closed'
      ? ['rejected', 'paid', 'lost'].includes(r.status)
      : tab === 'pending'
        ? ['pending', 'proposed', 'rescheduled'].includes(r.status)
        : r.status === tab

  // Slot-based requests are grouped by slot (students competing for one hour);
  // custom (slot-less) requests are shown as their own cards.
  const grouped = useMemo(() => {
    const bySlot = {}
    for (const r of live) {
      if (!r.slotId || !matchesTab(r)) continue
      ;(bySlot[r.slotId] ||= []).push(r)
    }
    return Object.entries(bySlot)
      .map(([slotId, requests]) => ({ slot: app.slotById[slotId], requests }))
      .filter((g) => g.slot)
      .sort((a, b) => new Date(a.slot.date) - new Date(b.slot.date))
  }, [live, tab, app])

  const customReqs = useMemo(
    () =>
      live
        .filter((r) => !r.slotId && matchesTab(r))
        .sort((a, b) => new Date(a.reqDate) - new Date(b.reqDate)),
    [live, tab]
  )

  const counts = {
    pending: live.filter((r) => ['pending', 'proposed', 'rescheduled'].includes(r.status)).length,
    accepted: live.filter((r) => r.status === 'accepted').length,
    closed: live.filter((r) => ['rejected', 'paid', 'lost'].includes(r.status)).length,
  }

  return (
    <>
      <div className="page-head">
        <h1>Slot requests</h1>
        <p className="sub">
          Accept as many students as you like for a slot; the platform gives it to whoever pays first and closes the rest.
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

      {grouped.length === 0 && customReqs.length === 0 ? (
        <Card>
          <Empty icon={Inbox} title={`No ${tab} requests`}>
            {tab === 'pending' ? 'When students request one of your free slots, they land here.' : 'Nothing in this list yet.'}
          </Empty>
        </Card>
      ) : (
        <div className="col" style={{ gap: 'var(--gap)' }}>
          {customReqs.map((r) => (
            <CustomRequestCard
              key={r.id}
              r={r}
              app={app}
              onAccept={() => setAcceptFor(r)}
              onReschedule={() => setRescheduleFor(r)}
            />
          ))}
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
                              onClick={() => setAcceptSlotFor({ r, std })}
                            >
                              <Check width={14} height={14} /> Accept
                            </button>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => setProposeFor({ studentId: r.studentId, studentName: std?.name })}
                            >
                              <Calendar width={14} height={14} /> Propose a slot
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => { app.dispatch({ type: 'request/reject', id: r.id }); app.toast('Request rejected', 'err') }}
                            >
                              <X width={14} height={14} /> Reject
                            </button>
                          </>
                        )}
                        {r.status === 'proposed' && (
                          <span className="row tiny faint" style={{ gap: 5 }}>
                            <Clock width={13} height={13} /> Waiting for student to confirm
                          </span>
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

      {proposeFor && (
        <ProposeModal
          me={me}
          student={proposeFor}
          onClose={() => setProposeFor(null)}
        />
      )}

      {acceptFor && (
        <AcceptPriceModal
          r={acceptFor}
          app={app}
          onClose={() => setAcceptFor(null)}
        />
      )}

      {acceptSlotFor && (
        <AcceptNoteModal
          r={acceptSlotFor.r}
          std={acceptSlotFor.std}
          app={app}
          onClose={() => setAcceptSlotFor(null)}
        />
      )}

      {rescheduleFor && (
        <RescheduleModal
          r={rescheduleFor}
          app={app}
          onClose={() => setRescheduleFor(null)}
        />
      )}
    </>
  )
}

/** A student-proposed custom time (no slot exists yet). */
function CustomRequestCard({ r, app, onAccept, onReschedule }) {
  const std = app.studentById[r.studentId]
  const mod = app.moduleById[r.moduleId]
  const date = r.reqDate
  return (
    <Card pad={false}>
      <div className="row wrap" style={{ padding: 'var(--pad)', gap: 12, borderBottom: '1px solid var(--border)' }}>
        <div
          className="col center"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r)', padding: '8px 12px', minWidth: 58 }}
        >
          <span className="tiny bold">{fmtDate(date, { weekday: 'short' })}</span>
          <span style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.1 }}>{new Date(date).getDate()}</span>
          <span className="tiny">{fmtDate(date, { month: 'short' })}</span>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div className="row" style={{ gap: 8 }}>
            <h3>{fmtTime(r.reqStart)} – {fmtTime(r.reqEnd)}</h3>
            <Badge tone="accent"><Calendar width={12} height={12} /> Custom time</Badge>
          </div>
          <p className="small muted" style={{ marginTop: 2 }}>
            {r.status === 'rescheduled' ? `You proposed ${money(r.reqPrice)}` : 'Student picked this time — you set the price'}
          </p>
        </div>
      </div>

      <div style={{ padding: '4px var(--pad) var(--pad)' }}>
        <div className="row wrap" style={{ gap: 12, padding: '14px 0', alignItems: 'flex-start' }}>
          <Avatar name={std?.name} hue={std?.hue} size={40} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="row wrap" style={{ gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{std?.name}</span>
              <StatusBadge status={r.status} />
              <span className="tiny faint">{timeAgo(r.createdAt)}</span>
            </div>
            {mod && (
              <div className="row wrap" style={{ gap: 6, marginTop: 5 }}>
                <Badge tone="accent">{mod.code}</Badge>
                <span className="small muted">{mod.name}</span>
              </div>
            )}
            {r.note && (
              <p className="small faint" style={{ marginTop: 8, paddingLeft: 11, borderLeft: '2px solid var(--border)' }}>
                “{r.note}”
              </p>
            )}
          </div>

          <div className="row" style={{ gap: 7 }}>
            {r.status === 'pending' && (
              <>
                <button className="btn btn-sm btn-success" onClick={onAccept}>
                  <Check width={14} height={14} /> Accept
                </button>
                <button className="btn btn-sm btn-outline" onClick={onReschedule}>
                  <Calendar width={14} height={14} /> Reschedule
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => { app.dispatch({ type: 'request/reject', id: r.id }); app.toast('Request rejected', 'err') }}
                >
                  <X width={14} height={14} /> Reject
                </button>
              </>
            )}
            {r.status === 'rescheduled' && (
              <span className="row tiny faint" style={{ gap: 5 }}>
                <Clock width={13} height={13} /> Waiting for student to confirm the new time
              </span>
            )}
            {r.status === 'rejected' && <StatusBadge status="rejected" />}
          </div>
        </div>
      </div>
    </Card>
  )
}

/** Instructor sets a price to accept a custom request (materializes the slot). */
function AcceptPriceModal({ r, app, onClose }) {
  const std = app.studentById[r.studentId]
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (price === '' || Number(price) < 0) return
    setBusy(true)
    try {
      await app.dispatch({ type: 'request/accept', id: r.id, price: Number(price), note: note.trim() || null })
      app.toast(`Accepted ${std?.name} — waiting for payment`)
      onClose()
    } catch {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title="Accept custom time request"
      subtitle={`${fmtDate(r.reqDate, { weekday: 'long', day: 'numeric', month: 'long' })} · ${fmtTime(r.reqStart)}–${fmtTime(r.reqEnd)}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy || price === ''}>
            {busy ? <><Spinner /> Accepting…</> : 'Accept & set price'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Session price (LKR)" hint="The student pays this to secure the slot.">
          <input className="input" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 2000" />
        </Field>
        <Field label="Message to student" hint="Optional — shown to the student with the acceptance.">
          <textarea
            className="input"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="e.g. Bring your textbook. I'll share the meet link before the session."
          />
        </Field>
      </div>
    </Modal>
  )
}

/** Instructor accepts a slot-based request, optionally with a message. */
function AcceptNoteModal({ r, std, app, onClose }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await app.dispatch({ type: 'request/accept', id: r.id, note: note.trim() || null })
      app.toast(`Accepted ${std?.name}`)
      onClose()
    } catch {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={`Accept ${std?.name || 'request'}`}
      subtitle="Accepting does not reserve the slot until the student pays."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? <><Spinner /> Accepting…</> : 'Accept'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Message to student" hint="Optional — shown to the student with the acceptance.">
          <textarea
            className="input"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="e.g. Bring your textbook. I'll share the meet link before the session."
          />
        </Field>
      </div>
    </Modal>
  )
}

/** Instructor counter-offers a different date/time/price on a custom request. */
function RescheduleModal({ r, app, onClose }) {
  const std = app.studentById[r.studentId]
  const [date, setDate] = useState((r.reqDate || '').slice(0, 10))
  const [start, setStart] = useState(r.reqStart || '')
  const [end, setEnd] = useState(r.reqEnd || '')
  const [price, setPrice] = useState(r.reqPrice != null ? String(r.reqPrice) : '')
  const [busy, setBusy] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const valid = date && start && end && end > start && price !== '' && Number(price) >= 0

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    try {
      await app.dispatch({
        type: 'request/reschedule',
        id: r.id,
        payload: { date, start, end, price: Number(price) },
      })
      app.toast(`New time proposed to ${std?.name}`)
      onClose()
    } catch {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title="Propose a different time"
      subtitle="The student confirms it and then pays, or declines it."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy || !valid}>
            {busy ? <><Spinner /> Sending…</> : 'Send proposal'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Date">
          <input className="input" type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div className="row" style={{ gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="From">
              <input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="To">
              <input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          </div>
        </div>
        <Field label="Session price (LKR)">
          <input className="input" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 2000" />
        </Field>
      </div>
    </Modal>
  )
}

/** Instructor picks one of their open slots + a lesson to propose to a student. */
function ProposeModal({ me, student, onClose }) {
  const app = useApp()
  const openSlots = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return app
      .slotsOf(me.id)
      .filter((s) => s.status === 'open' && s.acceptingRequests && new Date(s.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [app, me.id])
  const modules = useMemo(() => app.modulesOf(me.id), [app, me.id])
  const [slotId, setSlotId] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!slotId) return
    setBusy(true)
    try {
      await app.dispatch({
        type: 'request/propose',
        payload: { studentId: student.studentId, slotId, moduleId: moduleId || null, note: note || null },
      })
      app.toast(`Slot proposed to ${student.studentName}`)
      onClose()
    } catch {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={`Propose a slot to ${student.studentName}`}
      subtitle="The student confirms it into a request you then accept, or declines it."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy || !slotId}>
            {busy ? <><Spinner /> Sending…</> : 'Send proposal'}
          </button>
        </>
      }
    >
      {openSlots.length === 0 ? (
        <Empty icon={Calendar} title="No open slots">
          Add a free slot under “My Free Slots” before proposing one.
        </Empty>
      ) : (
        <div className="col" style={{ gap: 14 }}>
          <Field label="Time slot">
            <select className="input" value={slotId} onChange={(e) => setSlotId(e.target.value)}>
              <option value="">Choose a slot…</option>
              {openSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtTime(s.start)}–{fmtTime(s.end)} · {money(s.price)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lesson" hint="Optional — which lesson this session covers.">
            <select className="input" value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
              <option value="">No specific lesson</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.code} · {m.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Note" hint="Optional message shown to the student.">
            <textarea
              className="input"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. This time suits your schedule better."
            />
          </Field>
        </div>
      )}
    </Modal>
  )
}
