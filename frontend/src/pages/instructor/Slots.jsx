import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Field, Modal, PendingVerificationNotice, StatusBadge, fmtDate, fmtTime, money } from '../../components/ui.jsx'
import { Plus, Clock, Trash, Users, Calendar, Video, Layers, Book, Check } from '../../components/icons.jsx'
import QuizManager from './QuizManager.jsx'
import PaperManager from './PaperManager.jsx'
import MaterialManager from './MaterialManager.jsx'
import LiveSessionControl from '../../components/LiveSessionControl.jsx'

// Local YYYY-MM-DD (avoids the UTC day-shift that toISOString would introduce).
const toLocalDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Preset session lengths in minutes; the instructor can also enter a custom one.
const LENGTH_PRESETS = [30, 60, 90, 120, 180]
const fmtLen = (n) => (n < 60 ? `${n} min` : `${n / 60} hr${n > 60 ? 's' : ''}`)

/** Instructor publishes the evening windows they are free, e.g. 7pm - 10pm. */
export default function Slots() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const canPublish = me.verified
  const [open, setOpen] = useState(false)
  const [meetSlot, setMeetSlot] = useState(null)
  const [quizSlot, setQuizSlot] = useState(null)
  const [papersSlot, setPapersSlot] = useState(null)
  const [materialsSlot, setMaterialsSlot] = useState(null)
  const [showPast, setShowPast] = useState(false)
  // Multi-select mode: instructors can tick several open slots and remove them
  // in one go instead of deleting each one on its own.
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(() => new Set())

  const slots = useMemo(
    () => app.slotsOf(me.id).slice().sort((a, b) => new Date(a.date) - new Date(b.date) || a.start.localeCompare(b.start)),
    [app, me.id]
  )

  // Students this instructor already knows (from past requests / enrolments) —
  // the pool they can reserve a private slot for.
  const myStudents = useMemo(() => {
    const map = new Map()
    for (const r of app.slotRequests) if (r.studentId) map.set(r.studentId, r.studentName || app.studentById[r.studentId]?.name || 'Student')
    for (const e of app.enrollments) if (e.studentId) map.set(e.studentId, e.studentName || app.studentById[e.studentId]?.name || 'Student')
    return [...map].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [app.slotRequests, app.enrollments, app.studentById])

  const byDate = useMemo(() => {
    const map = {}
    for (const s of slots) (map[s.date.slice(0, 10)] ||= []).push(s)
    return Object.entries(map)
  }, [slots])

  // Split days into upcoming (today onward) and past, so finished slots don't
  // pile up above the ones that still matter. Past days are newest-first.
  const todayStr = toLocalDate(new Date())
  const upcoming = byDate.filter(([d]) => d >= todayStr)
  const past = byDate.filter(([d]) => d < todayStr).reverse()
  const pastCount = past.reduce((n, [, list]) => n + list.length, 0)

  // Only open (not-yet-booked) slots can be removed, so those are the ones
  // eligible for selection.
  const selectableIds = useMemo(() => slots.filter((s) => s.status === 'open').map((s) => s.id), [slots])
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id))

  const toggleSelect = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(selectableIds))

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelected(new Set())
  }

  const removeSelected = async () => {
    const ids = [...selected].filter((id) => selectableIds.includes(id))
    if (ids.length === 0) return
    if (!(await app.confirm({
      title: `Remove ${ids.length} slot${ids.length === 1 ? '' : 's'}?`,
      text: 'The selected time slots will be permanently removed.',
      confirmText: 'Remove',
    }))) return
    ids.forEach((id) => app.dispatch({ type: 'slot/remove', id }))
    app.toast(`${ids.length} slot${ids.length === 1 ? '' : 's'} removed`, 'err')
    exitSelectMode()
  }

  const renderDay = ([date, daySlots]) => (
    <Card key={date} pad={false}>
      <div className="row" style={{ padding: 'var(--pad)', paddingBottom: 12, gap: 10 }}>
        <Calendar width={17} height={17} className="accent" />
        <h3 style={{ flex: 1 }}>{fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
        <Badge>{daySlots.length} slot{daySlots.length === 1 ? '' : 's'}</Badge>
      </div>
      <div style={{ padding: '0 var(--pad) var(--pad)' }} className="grid grid-2">
        {daySlots.map((s) => {
          const reqs = app.slotRequests.filter((r) => r.slotId === s.id)
          const pending = reqs.filter((r) => r.status === 'pending')
          const winner = reqs.find((r) => r.status === 'paid')
          const selectable = selectMode && s.status === 'open'
          const isSelected = selected.has(s.id)
          return (
            <div
              key={s.id}
              className={`slot ${s.status === 'booked' ? 'taken' : ''} ${selectable ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
              style={{ flexDirection: 'column', alignItems: 'stretch', gap: 9 }}
              onClick={selectable ? () => toggleSelect(s.id) : undefined}
            >
              <div className="row">
                {selectable && (
                  <span className={`slot-check ${isSelected ? 'on' : ''}`} aria-hidden>
                    {isSelected && <Check width={13} height={13} />}
                  </span>
                )}
                <Clock width={15} height={15} className="faint" />
                <span style={{ fontWeight: 700, flex: 1 }}>{fmtTime(s.start)} – {fmtTime(s.end)}</span>
                {s.visibleTo && (
                  <Badge tone="accent" title={`Only visible to ${app.studentById[s.visibleTo]?.name || 'one student'}`}>
                    Private · {app.studentById[s.visibleTo]?.name || 'student'}
                  </Badge>
                )}
                {s.status === 'open' && !s.acceptingRequests && <Badge>Paused</Badge>}
                <StatusBadge status={s.status} />
              </div>
              <div className="row small muted">
                <span style={{ flex: 1 }}>{money(s.price)}</span>
                {pending.length > 0 && (
                  <span className="row tiny" style={{ gap: 5, color: 'var(--warning)' }}>
                    <Users width={12} height={12} /> {pending.length} pending
                  </span>
                )}
              </div>
              {winner && (
                <div className="row" style={{ gap: 8 }}>
                  <Avatar name={app.studentById[winner.studentId]?.name} hue={app.studentById[winner.studentId]?.hue} size={24} />
                  <span className="tiny" style={{ flex: 1 }}>{app.studentById[winner.studentId]?.name} secured this slot</span>
                  <button className="btn btn-sm btn-outline" onClick={() => setQuizSlot(s)}>
                    <Layers width={14} height={14} /> MCQ
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => setPapersSlot(s)}>
                    <Book width={14} height={14} /> Papers
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => setMaterialsSlot(s)}>
                    <Book width={14} height={14} /> Materials
                  </button>
                </div>
              )}
              {!app.zoomEnabled && !selectable && (
                <div className="row" style={{ gap: 8 }}>
                  <Video width={13} height={13} className={s.meetLink ? 'accent' : 'faint'} />
                  {s.meetLink ? (
                    <>
                      <a className="tiny accent truncate" href={s.meetLink} target="_blank" rel="noreferrer" style={{ flex: 1 }}>
                        {s.meetLink.replace(/^https?:\/\//, '')}
                      </a>
                      <button className="btn btn-ghost btn-sm" onClick={() => setMeetSlot(s)}>Edit</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'flex-start' }} onClick={() => setMeetSlot(s)}>
                      + Add Google Meet link
                    </button>
                  )}
                </div>
              )}
              {s.status === 'booked' && (app.zoomEnabled || s.meetLink) && (
                <LiveSessionControl type="slot" refId={s.id} title={`${fmtTime(s.start)} – ${fmtTime(s.end)} session`} />
              )}
              {s.status === 'open' && !selectMode && (
                <div className="row" style={{ gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      const next = !s.acceptingRequests
                      app.dispatch({ type: 'slot/setActive', id: s.id, acceptingRequests: next })
                      app.toast(next ? 'Slot is now accepting requests' : 'Requests paused for this slot')
                    }}
                  >
                    {s.acceptingRequests ? 'Pause requests' : 'Resume requests'}
                  </button>
                  <div className="spacer" />
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={async () => {
                      if (!(await app.confirm({ title: 'Remove slot?', text: 'This time slot will be permanently removed.', confirmText: 'Remove' }))) return
                      app.dispatch({ type: 'slot/remove', id: s.id })
                      app.toast('Slot removed', 'err')
                    }}
                  >
                    <Trash width={14} height={14} /> Remove
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>My free time slots</h1>
            <p className="sub">Publish the hours you are available. Students request a lesson for a slot and you decide.</p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            {selectableIds.length > 0 && (
              selectMode ? (
                <button className="btn btn-ghost" onClick={exitSelectMode}>Cancel</button>
              ) : (
                <button className="btn btn-outline" onClick={() => setSelectMode(true)} disabled={!canPublish}>
                  <Check width={16} height={16} /> Select
                </button>
              )
            )}
            <button className="btn btn-primary" onClick={() => setOpen(true)} disabled={!canPublish}>
              <Plus width={16} height={16} /> Add slots
            </button>
          </div>
        </div>
      </div>

      {!canPublish && <PendingVerificationNotice status={me.verificationStatus} />}

      {selectMode && (
        <div className="row wrap slot-select-bar" style={{ gap: 10, alignItems: 'center' }}>
          <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
            <span className="small bold">Select all ({selectableIds.length})</span>
          </label>
          <div className="spacer" style={{ flex: 1 }} />
          <span className="small muted">{selected.size} selected</span>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--danger)', color: '#fff' }}
            disabled={selected.size === 0}
            onClick={removeSelected}
          >
            <Trash width={14} height={14} /> Remove selected
          </button>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 ? (
        <Card>
          <Empty
            icon={Clock}
            title="No free slots published"
            action={<button className="btn btn-primary" onClick={() => setOpen(true)} disabled={!canPublish}><Plus width={15} height={15} /> Add your first slot</button>}
          >
            Add a window such as 7:00 PM – 10:00 PM and split it into hourly sessions students can request.
          </Empty>
        </Card>
      ) : (
        <div className="col" style={{ gap: 'var(--gap)' }}>
          {upcoming.length === 0 ? (
            <Card>
              <Empty icon={Clock} title="No upcoming slots">
                Your published slots have all finished. Add new ones, or review past slots below.
              </Empty>
            </Card>
          ) : (
            upcoming.map(renderDay)
          )}

          {past.length > 0 && (
            <>
              <button
                className="btn btn-ghost btn-sm"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => setShowPast((v) => !v)}
              >
                {showPast ? 'Hide' : 'Show'} past slots ({pastCount})
              </button>
              {showPast && (
                <div className="col" style={{ gap: 'var(--gap)', opacity: 0.65 }}>
                  {past.map(renderDay)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <AddSlotsModal
        open={open}
        defaultPrice={me.hourlyRate}
        students={myStudents}
        onClose={() => setOpen(false)}
        onSubmit={(rows) => {
          rows.forEach((row) => app.dispatch({ type: 'slot/add', payload: { instructorId: me.id, ...row } }))
          setOpen(false)
          app.toast(`${rows.length} slot${rows.length === 1 ? '' : 's'} published`)
        }}
      />

      {meetSlot && (
        <MeetModal
          slot={meetSlot}
          onClose={() => setMeetSlot(null)}
          onSubmit={(meetLink) => {
            app.dispatch({ type: 'slot/setMeet', id: meetSlot.id, meetLink })
            app.toast(meetLink ? 'Meet link saved' : 'Meet link removed')
            setMeetSlot(null)
          }}
        />
      )}

      {quizSlot && (
        <QuizManager
          slot={quizSlot}
          title={`${fmtDate(quizSlot.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${fmtTime(quizSlot.start)} – ${fmtTime(quizSlot.end)}`}
          onClose={() => setQuizSlot(null)}
        />
      )}

      {papersSlot && (
        <PaperManager
          slot={papersSlot}
          title={`${fmtDate(papersSlot.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${fmtTime(papersSlot.start)} – ${fmtTime(papersSlot.end)}`}
          onClose={() => setPapersSlot(null)}
        />
      )}

      {materialsSlot && (
        <MaterialManager
          slot={materialsSlot}
          title={`${fmtDate(materialsSlot.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${fmtTime(materialsSlot.start)} – ${fmtTime(materialsSlot.end)}`}
          onClose={() => setMaterialsSlot(null)}
        />
      )}
    </>
  )
}

/** Attach a Google Meet link to a slot. Instructors create a room on Google
 *  Meet (one click) and paste the URL here; the student sees a Join button. */
function MeetModal({ slot, onClose, onSubmit }) {
  const [link, setLink] = useState(slot.meetLink || '')
  const valid = !link.trim() || /^https?:\/\//i.test(link.trim())

  return (
    <Modal
      open
      onClose={onClose}
      title="Google Meet link"
      subtitle={`${fmtTime(slot.start)} – ${fmtTime(slot.end)} session`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} onClick={() => onSubmit(link.trim())}>
            Save link
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <a className="btn btn-outline btn-block" href="https://meet.google.com/new" target="_blank" rel="noreferrer">
          <Video width={16} height={16} /> Create a new Meet room
        </a>
        <p className="tiny faint" style={{ marginTop: -4 }}>
          Opens Google Meet in a new tab. Start the meeting, copy its link and paste it below.
        </p>
        <Field label="Meet link">
          <input
            className="input"
            placeholder="https://meet.google.com/abc-defg-hij"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          {!valid && <span className="hint" style={{ color: 'var(--danger)' }}>Must start with http:// or https://</span>}
        </Field>
        <p className="tiny faint" style={{ marginTop: -4 }}>
          In Google Meet only you (the host) can record the session — students who join cannot.
          Use the “Start session” button on this slot when the class begins so your teaching hours are counted.
        </p>
      </div>
    </Modal>
  )
}

/**
 * Splits an availability window into equal sessions, which is how instructors
 * actually think about it ("I'm free 7 to 10, one hour each").
 */
function AddSlotsModal({ open, onClose, onSubmit, defaultPrice, students = [] }) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [date, setDate] = useState(toLocalDate(tomorrow))
  const [until, setUntil] = useState('')
  const [weekdays, setWeekdays] = useState([]) // empty = every day in range
  const [from, setFrom] = useState('19:00')
  const [to, setTo] = useState('22:00')
  const [length, setLength] = useState(60)
  const [custom, setCustom] = useState(false)
  const [price, setPrice] = useState(defaultPrice)
  // '' = public (anyone can request); a student id = private to that one student.
  const [visibleTo, setVisibleTo] = useState('')

  const toggleWeekday = (d) =>
    setWeekdays((w) => (w.includes(d) ? w.filter((x) => x !== d) : [...w, d]))

  // The window split into equal sessions.
  const preview = useMemo(() => {
    const [fh, fm] = from.split(':').map(Number)
    const [th, tm] = to.split(':').map(Number)
    const startMin = fh * 60 + fm
    const endMin = th * 60 + tm
    if (endMin <= startMin) return []

    const out = []
    for (let m = startMin; m + length <= endMin; m += length) {
      const fmt = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
      out.push({ start: fmt(m), end: fmt(m + length) })
    }
    return out
  }, [from, to, length])

  // Every calendar day the slots will be published on (one, or a repeating range).
  const dates = useMemo(() => {
    const start = new Date(`${date}T00:00:00`)
    if (isNaN(start)) return []
    if (!until) return [date]
    const end = new Date(`${until}T00:00:00`)
    if (isNaN(end) || end < start) return [date]
    const out = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (weekdays.length === 0 || weekdays.includes(d.getDay())) out.push(toLocalDate(d))
    }
    return out
  }, [date, until, weekdays])

  const totalSlots = preview.length * dates.length

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publish free time slots"
      subtitle="Set a window and it is split into bookable sessions."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={totalSlots === 0}
            onClick={() =>
              onSubmit(
                dates.flatMap((d) =>
                  preview.map((p) => ({
                    date: d,
                    start: p.start,
                    end: p.end,
                    price: Number(price),
                    visibleTo: visibleTo || null,
                  }))
                )
              )
            }
          >
            Publish {totalSlots || ''} slot{totalSlots === 1 ? '' : 's'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <Field label="Start date">
            <input className="input" type="date" value={date} min={toLocalDate(new Date())} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Repeat until" hint="Optional; publish the same window every day up to here.">
            <input className="input" type="date" value={until} min={date} onChange={(e) => setUntil(e.target.value)} />
          </Field>
        </div>

        {until && (
          <Field label="On these days" hint="Leave all off to repeat every day in the range.">
            <div className="row wrap" style={{ gap: 6 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((lbl, d) => (
                <button key={d} type="button" className={`chip ${weekdays.includes(d) ? 'on' : ''}`} onClick={() => toggleWeekday(d)}>
                  {lbl}
                </button>
              ))}
            </div>
          </Field>
        )}

        <div className="row" style={{ gap: 12 }}>
          <Field label="Available from">
            <input className="input" type="time" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Available until">
            <input className="input" type="time" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>

        <Field label="Session length">
          <div className="row wrap" style={{ gap: 7, alignItems: 'center' }}>
            {LENGTH_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className={`chip ${!custom && length === n ? 'on' : ''}`}
                onClick={() => {
                  setCustom(false)
                  setLength(n)
                }}
              >
                {fmtLen(n)}
              </button>
            ))}
            <button
              type="button"
              className={`chip ${custom ? 'on' : ''}`}
              onClick={() => setCustom(true)}
            >
              Custom
            </button>
            {custom && (
              <span className="row" style={{ gap: 6, alignItems: 'center' }}>
                <input
                  className="input"
                  type="number"
                  min="5"
                  step="5"
                  value={length}
                  onChange={(e) => setLength(Math.max(5, Number(e.target.value) || 0))}
                  style={{ width: 90 }}
                  aria-label="Custom session length in minutes"
                />
                <span className="small muted">min</span>
              </span>
            )}
          </div>
        </Field>

        <Field label="Price per session (Rs.)">
          <input className="input" type="number" min="0" step="100" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>

        <Field
          label="Who can see this?"
          hint={
            visibleTo
              ? 'Only the chosen student will see and be able to request these slots.'
              : 'Public — any student can request these slots.'
          }
        >
          {students.length === 0 ? (
            <p className="tiny faint">
              You have no students yet, so these slots will be public. Once students book with you, you can reserve a slot for one of them.
            </p>
          ) : (
            <select className="select" value={visibleTo} onChange={(e) => setVisibleTo(e.target.value)}>
              <option value="">Public — any student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>Private — only {s.name}</option>
              ))}
            </select>
          )}
        </Field>

        <div>
          <label className="small bold" style={{ display: 'block', marginBottom: 8 }}>
            Preview: {preview.length} session{preview.length === 1 ? '' : 's'}
            {dates.length > 1 && <> × {dates.length} days = <span className="accent">{totalSlots} slots</span></>}
          </label>
          {preview.length === 0 ? (
            <p className="small" style={{ color: 'var(--danger)' }}>The end time must be after the start time.</p>
          ) : (
            <div className="row wrap" style={{ gap: 7 }}>
              {preview.map((p) => (
                <Badge key={p.start} tone="accent">{fmtTime(p.start)} – {fmtTime(p.end)}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
