import { useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Empty, Field, Modal, PendingVerificationNotice, fmtDate, money } from '../../components/ui.jsx'
import { Plus, Video, Trash, Clock, Calendar, Edit, Users } from '../../components/icons.jsx'

const blank = {
  title: '', description: '', subjectId: '', bannerUrl: '',
  startsAt: '', durationMins: 60, isFree: true, price: 2000, seats: 0, meetLink: '',
}

export default function Seminars() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const canPublish = me.verified
  const [editing, setEditing] = useState(null)

  const seminars = app.seminarsOf(me.id)
  const mySubjects = app.subjectsOf(me.id)

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>Seminars</h1>
            <p className="sub">One-off live sessions (free or paid). They appear on the public site; students need an account to register and get the join link.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setEditing({ ...blank })} disabled={!canPublish}>
            <Plus width={16} height={16} /> New seminar
          </button>
        </div>
      </div>

      {!canPublish && <PendingVerificationNotice status={me.verificationStatus} />}

      {seminars.length === 0 ? (
        <Card>
          <Empty
            icon={Video}
            title="No seminars yet"
            action={<button className="btn btn-primary" onClick={() => setEditing({ ...blank })} disabled={!canPublish}><Plus width={15} height={15} /> Create a seminar</button>}
          >
            Host a live webinar for many students at once — free to attract new students, or paid.
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-2">
          {seminars.map((s) => {
            const subject = app.subjectById[s.subjectId]
            const full = s.seats > 0 && s.registered >= s.seats
            return (
              <Card key={s.id} className="col" style={{ gap: 12 }}>
                <div className="row" style={{ gap: 6 }}>
                  {subject && <Badge tone="accent">{subject.name}</Badge>}
                  <Badge tone={s.isFree ? 'success' : 'accent'}>{s.isFree ? 'Free' : money(s.price)}</Badge>
                  <div className="spacer" />
                  <Badge tone={full ? 'danger' : 'success'}>
                    <Users width={12} height={12} /> {s.registered}{s.seats > 0 ? `/${s.seats}` : ''} registered
                  </Badge>
                </div>

                <div>
                  <h3>{s.title}</h3>
                  <p className="small muted" style={{ marginTop: 4 }}>{s.description}</p>
                </div>

                <div className="col small muted" style={{ gap: 4 }}>
                  <span className="row" style={{ gap: 6 }}>
                    <Calendar width={14} height={14} />
                    {s.startsAt ? fmtDate(s.startsAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Time TBA'}
                  </span>
                  <span className="row" style={{ gap: 6 }}><Clock width={14} height={14} />{s.durationMins} mins</span>
                  {s.meetLink
                    ? <span className="row tiny faint" style={{ gap: 6 }}><Video width={13} height={13} />Live link set</span>
                    : <span className="row tiny" style={{ gap: 6, color: 'var(--warning)' }}><Video width={13} height={13} />No live link yet</span>}
                </div>

                <hr className="divider" />

                <div className="row">
                  <span className="tiny faint">
                    {s.isFree ? 'Free seminar' : `Revenue ${money(s.price * s.registered)}`}
                  </span>
                  <div className="spacer" />
                  <button className="btn btn-sm btn-outline" onClick={() => setEditing(s)}>
                    <Edit width={14} height={14} /> Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={async () => {
                      if (!(await app.confirm({ title: 'Delete seminar?', text: 'This seminar will be permanently removed.', confirmText: 'Delete' }))) return
                      app.dispatch({ type: 'seminar/remove', id: s.id })
                      app.toast('Seminar removed', 'err')
                    }}
                  >
                    <Trash width={14} height={14} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {editing && (
        <SeminarModal
          value={editing}
          subjects={mySubjects}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => {
            if (editing.id) {
              app.dispatch({ type: 'seminar/update', id: editing.id, payload })
              app.toast('Seminar updated')
            } else {
              app.dispatch({ type: 'seminar/add', payload })
              app.toast('Seminar published')
            }
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function SeminarModal({ value, subjects, onClose, onSubmit }) {
  const [f, setF] = useState({
    ...value,
    startsAt: value.startsAt ? new Date(value.startsAt).toISOString().slice(0, 16) : '',
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const valid = f.title.trim() && f.startsAt

  return (
    <Modal
      open
      onClose={onClose}
      width={560}
      title={value.id ? 'Edit seminar' : 'Create seminar'}
      subtitle="Students see this on the public site and can register (free) or pay to join."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() =>
              onSubmit({
                ...f,
                durationMins: Number(f.durationMins),
                seats: Number(f.seats),
                price: f.isFree ? 0 : Number(f.price),
                startsAt: new Date(f.startsAt).toISOString(),
              })
            }
          >
            {value.id ? 'Save changes' : 'Publish seminar'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Seminar title">
          <input className="input" placeholder="e.g. Free O/L Maths Revision — Paper Discussion" value={f.title} onChange={set('title')} />
        </Field>

        <Field label="Subject" hint="Optional — only subjects you teach.">
          <select className="select" value={f.subjectId} onChange={set('subjectId')}>
            <option value="">No specific subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Description">
          <textarea className="textarea" placeholder="What is this seminar about?" value={f.description} onChange={set('description')} />
        </Field>

        <Field label="Banner image URL (optional)" hint="Shown on the public seminar card.">
          <input className="input" placeholder="https://…" value={f.bannerUrl || ''} onChange={set('bannerUrl')} />
        </Field>

        <div className="row" style={{ gap: 12 }}>
          <Field label="Date &amp; time">
            <input className="input" type="datetime-local" value={f.startsAt} onChange={set('startsAt')} />
          </Field>
          <Field label="Duration (mins)">
            <input className="input" type="number" min="15" step="15" value={f.durationMins} onChange={set('durationMins')} />
          </Field>
        </div>

        <div className="row" style={{ gap: 12, alignItems: 'flex-end' }}>
          <Field label="Access">
            <select
              className="select"
              value={f.isFree ? 'free' : 'paid'}
              onChange={(e) => setF({ ...f, isFree: e.target.value === 'free' })}
            >
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
          {!f.isFree && (
            <Field label="Price (Rs.)">
              <input className="input" type="number" min="0" step="500" value={f.price} onChange={set('price')} />
            </Field>
          )}
          <Field label="Seats" hint="0 = unlimited">
            <input className="input" type="number" min="0" value={f.seats} onChange={set('seats')} />
          </Field>
        </div>

        <Field label="Live link (Google Meet / Zoom)" hint="Registered students get a Join button. You can add it later too.">
          <input className="input" placeholder="https://meet.google.com/abc-defg-hij" value={f.meetLink || ''} onChange={set('meetLink')} />
        </Field>
      </div>
    </Modal>
  )
}
