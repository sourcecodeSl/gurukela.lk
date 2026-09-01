import { useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Field, Modal, fmtDate, money } from '../../components/ui.jsx'
import { Plus, Users, Trash, Clock, Calendar, Edit } from '../../components/icons.jsx'

const blank = { title: '', description: '', moduleId: '', schedule: '', weeks: 8, seats: 30, price: 10000, level: 'A/L', startsAt: '' }

export default function Classes() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const [editing, setEditing] = useState(null)

  const classes = app.classesOf(me.id)
  const myModules = app.modulesOf(me.id)

  return (
    <>
      <div className="page-head">
        <div className="row wrap">
          <div style={{ flex: 1 }}>
            <h1>Group classes</h1>
            <p className="sub">Fixed batches with a set schedule. Students pay and join directly — no approval needed.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setEditing({ ...blank })}>
            <Plus width={16} height={16} /> New class
          </button>
        </div>
      </div>

      {classes.length === 0 ? (
        <Card>
          <Empty
            icon={Users}
            title="No group classes yet"
            action={<button className="btn btn-primary" onClick={() => setEditing({ ...blank })}><Plus width={15} height={15} /> Create a class</button>}
          >
            Create a batch once and every student who pays joins the same schedule.
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-2">
          {classes.map((c) => {
            const mod = app.moduleById[c.moduleId]
            const students = app.enrollments.filter((e) => e.type === 'group' && e.refId === c.id)
            return (
              <Card key={c.id} className="col" style={{ gap: 12 }}>
                <div className="row" style={{ gap: 6 }}>
                  <Badge tone="accent">{mod?.code}</Badge>
                  <Badge>{c.level}</Badge>
                  <div className="spacer" />
                  <Badge tone={c.enrolled >= c.seats ? 'danger' : 'success'}>
                    {c.enrolled}/{c.seats} seats
                  </Badge>
                </div>

                <div>
                  <h3>{c.title}</h3>
                  <p className="small muted" style={{ marginTop: 4 }}>{c.description}</p>
                </div>

                <div className="col small muted" style={{ gap: 4 }}>
                  <span className="row" style={{ gap: 6 }}><Clock width={14} height={14} />{c.schedule}</span>
                  <span className="row" style={{ gap: 6 }}>
                    <Calendar width={14} height={14} />Starts {fmtDate(c.startsAt, { day: 'numeric', month: 'long' })} · {c.weeks} weeks
                  </span>
                </div>

                <div className="meter"><i style={{ width: `${(c.enrolled / c.seats) * 100}%` }} /></div>

                {students.length > 0 && (
                  <div className="row" style={{ gap: 0 }}>
                    {students.slice(0, 6).map((e, i) => (
                      <span key={e.id} style={{ marginLeft: i ? -8 : 0, border: '2px solid var(--surface)', borderRadius: '50%' }}>
                        <Avatar name={app.studentById[e.studentId]?.name} hue={app.studentById[e.studentId]?.hue} size={26} />
                      </span>
                    ))}
                    <span className="tiny faint" style={{ marginLeft: 8 }}>{students.length} paid enrolment{students.length === 1 ? '' : 's'}</span>
                  </div>
                )}

                <hr className="divider" />

                <div className="row">
                  <div className="col">
                    <span className="bold" style={{ fontSize: 16 }}>{money(c.price)}</span>
                    <span className="tiny faint">revenue {money(c.price * c.enrolled)}</span>
                  </div>
                  <div className="spacer" />
                  <button className="btn btn-sm btn-outline" onClick={() => setEditing(c)}>
                    <Edit width={14} height={14} /> Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      app.dispatch({ type: 'group/remove', id: c.id })
                      app.toast('Class removed', 'err')
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
        <ClassModal
          value={editing}
          modules={myModules}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => {
            if (editing.id) {
              app.dispatch({ type: 'group/update', id: editing.id, payload })
              app.toast('Class updated')
            } else {
              app.dispatch({ type: 'group/add', payload: { ...payload, instructorId: me.id } })
              app.toast('Class published')
            }
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function ClassModal({ value, modules, onClose, onSubmit }) {
  const [f, setF] = useState({
    ...value,
    startsAt: value.startsAt ? new Date(value.startsAt).toISOString().slice(0, 10) : '',
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const valid = f.title.trim() && f.moduleId && f.schedule.trim() && f.startsAt

  return (
    <Modal
      open
      onClose={onClose}
      width={560}
      title={value.id ? 'Edit group class' : 'Create group class'}
      subtitle="Students see this immediately and can pay to join."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() =>
              onSubmit({
                ...f,
                weeks: Number(f.weeks),
                seats: Number(f.seats),
                price: Number(f.price),
                startsAt: new Date(`${f.startsAt}T00:00:00`).toISOString(),
              })
            }
          >
            {value.id ? 'Save changes' : 'Publish class'}
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <Field label="Class title">
          <input className="input" placeholder="e.g. A/L Calculus Intensive — Batch 2026" value={f.title} onChange={set('title')} />
        </Field>

        <Field label="Module" hint="Only modules you are registered to teach.">
          <select className="select" value={f.moduleId} onChange={set('moduleId')}>
            <option value="">Select a module…</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.code} — {m.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Description">
          <textarea className="textarea" placeholder="What will students cover?" value={f.description} onChange={set('description')} />
        </Field>

        <Field label="Schedule" hint="Free text, e.g. Mon &amp; Wed, 7:00 PM - 8:30 PM">
          <input className="input" placeholder="Mon & Wed, 7:00 PM - 8:30 PM" value={f.schedule} onChange={set('schedule')} />
        </Field>

        <div className="row" style={{ gap: 12 }}>
          <Field label="Starts on">
            <input className="input" type="date" value={f.startsAt} onChange={set('startsAt')} />
          </Field>
          <Field label="Duration (weeks)">
            <input className="input" type="number" min="1" value={f.weeks} onChange={set('weeks')} />
          </Field>
        </div>

        <div className="row" style={{ gap: 12 }}>
          <Field label="Seats">
            <input className="input" type="number" min="1" value={f.seats} onChange={set('seats')} />
          </Field>
          <Field label="Price (Rs.)">
            <input className="input" type="number" min="0" step="500" value={f.price} onChange={set('price')} />
          </Field>
          <Field label="Level">
            <select className="select" value={f.level} onChange={set('level')}>
              {['Beginner', 'Intermediate', 'Advanced', 'O/L', 'A/L'].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  )
}
