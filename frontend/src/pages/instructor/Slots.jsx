import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Field, Modal, StatusBadge, fmtDate, fmtTime, money } from '../../components/ui.jsx'
import { Plus, Clock, Trash, Users, Calendar, Video } from '../../components/icons.jsx'

const toLocalDate = (d) => d.toISOString().slice(0, 10)

/** Instructor publishes the evening windows they are free, e.g. 7pm - 10pm. */
export default function Slots() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const [open, setOpen] = useState(false)
  const [meetSlot, setMeetSlot] = useState(null)

  const slots = useMemo(
    () => app.slotsOf(me.id).slice().sort((a, b) => new Date(a.date) - new Date(b.date) || a.start.localeCompare(b.start)),
    [app, me.id]
  )

  const byDate = useMemo(() => {
    const map = {}
    for (const s of slots) (map[s.date.slice(0, 10)] ||= []).push(s)
    return Object.entries(map)
  }, [slots])

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>My free time slots</h1>
            <p className="sub">Publish the hours you are available. Students request a module for a slot and you decide.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus width={16} height={16} /> Add slots
          </button>
        </div>
      </div>

      {byDate.length === 0 ? (
        <Card>
          <Empty
            icon={Clock}
            title="No free slots published"
            action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus width={15} height={15} /> Add your first slot</button>}
          >
            Add a window such as 7:00 PM – 10:00 PM and split it into hourly sessions students can request.
          </Empty>
        </Card>
      ) : (
        <div className="col" style={{ gap: 'var(--gap)' }}>
          {byDate.map(([date, daySlots]) => (
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
                  return (
                    <div key={s.id} className={`slot ${s.status === 'booked' ? 'taken' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 9 }}>
                      <div className="row">
                        <Clock width={15} height={15} className="faint" />
                        <span style={{ fontWeight: 700, flex: 1 }}>{fmtTime(s.start)} – {fmtTime(s.end)}</span>
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
                          <span className="tiny">{app.studentById[winner.studentId]?.name} secured this slot</span>
                        </div>
                      )}
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
                      {s.status === 'open' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ alignSelf: 'flex-start', color: 'var(--danger)' }}
                          onClick={() => {
                            app.dispatch({ type: 'slot/remove', id: s.id })
                            app.toast('Slot removed', 'err')
                          }}
                        >
                          <Trash width={14} height={14} /> Remove
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddSlotsModal
        open={open}
        defaultPrice={me.hourlyRate}
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
      </div>
    </Modal>
  )
}

/**
 * Splits an availability window into equal sessions, which is how instructors
 * actually think about it ("I'm free 7 to 10, one hour each").
 */
function AddSlotsModal({ open, onClose, onSubmit, defaultPrice }) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [date, setDate] = useState(toLocalDate(tomorrow))
  const [until, setUntil] = useState('')
  const [weekdays, setWeekdays] = useState([]) // empty = every day in range
  const [from, setFrom] = useState('19:00')
  const [to, setTo] = useState('22:00')
  const [length, setLength] = useState(60)
  const [price, setPrice] = useState(defaultPrice)

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
        <div className="row" style={{ gap: 12 }}>
          <Field label="Start date">
            <input className="input" type="date" value={date} min={toLocalDate(new Date())} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Repeat until" hint="Optional — publish the same window every day up to here.">
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
          <div className="row wrap" style={{ gap: 7 }}>
            {[30, 60, 90, 120].map((n) => (
              <button key={n} className={`chip ${length === n ? 'on' : ''}`} onClick={() => setLength(n)}>
                {n < 60 ? `${n} min` : `${n / 60} hr${n > 60 ? 's' : ''}`}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Price per session (Rs.)">
          <input className="input" type="number" min="0" step="100" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>

        <div>
          <label className="small bold" style={{ display: 'block', marginBottom: 8 }}>
            Preview — {preview.length} session{preview.length === 1 ? '' : 's'}
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
