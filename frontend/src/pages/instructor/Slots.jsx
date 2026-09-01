import { useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Field, Modal, StatusBadge, fmtDate, fmtTime, money } from '../../components/ui.jsx'
import { Plus, Clock, Trash, Users, Calendar } from '../../components/icons.jsx'

const toLocalDate = (d) => d.toISOString().slice(0, 10)

/** Instructor publishes the evening windows they are free, e.g. 7pm - 10pm. */
export default function Slots() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const [open, setOpen] = useState(false)

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
    </>
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
  const [from, setFrom] = useState('19:00')
  const [to, setTo] = useState('22:00')
  const [length, setLength] = useState(60)
  const [price, setPrice] = useState(defaultPrice)

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
            disabled={preview.length === 0}
            onClick={() =>
              onSubmit(
                preview.map((p) => ({
                  date: new Date(`${date}T00:00:00`).toISOString(),
                  start: p.start,
                  end: p.end,
                  price: Number(price),
                }))
              )
            }
          >
            Publish {preview.length || ''} slot{preview.length === 1 ? '' : 's'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Date">
          <input className="input" type="date" value={date} min={toLocalDate(new Date())} onChange={(e) => setDate(e.target.value)} />
        </Field>

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
