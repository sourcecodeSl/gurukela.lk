import { useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'
import { Badge, Card, Empty, Field, Modal, PendingVerificationNotice, Tabs, fmtDate, money } from '../../components/ui.jsx'
import { Plus, Video, Trash, Clock, Calendar, Edit, Users, Layers } from '../../components/icons.jsx'
import QuizManager from './QuizManager.jsx'
import LiveSessionControl from '../../components/LiveSessionControl.jsx'

const blank = {
  title: '', description: '', subjectId: '', bannerUrl: '',
  startsAt: '', durationMins: 60, isFree: true, price: 2000, seats: 0, meetLink: '', youtubeUrl: '',
}

export default function Seminars() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const canPublish = me.verified
  const [editing, setEditing] = useState(null)
  const [quizFor, setQuizFor] = useState(null)
  const [tab, setTab] = useState('upcoming')

  const seminars = app.seminarsOf(me.id)
  const mySubjects = app.subjectsOf(me.id)

  // A seminar is "past" only once its scheduled window (start + duration) is over
  // — not the moment it starts. A seminar the teacher has started stays "Live"
  // until it is ended, regardless of the clock, so a running class never drops
  // into Past. Undated seminars stay Upcoming.
  const now = Date.now()
  const isLive = (s) => !!app.liveSessionOf('seminar', s.id)
  const scheduledEnd = (s) =>
    s.startsAt ? new Date(s.startsAt).getTime() + (s.durationMins || 60) * 60000 : Infinity
  const live = seminars.filter(isLive)
  const past = seminars.filter((s) => !isLive(s) && scheduledEnd(s) < now)
  const upcoming = seminars.filter((s) => !isLive(s) && scheduledEnd(s) >= now)

  const renderCard = (s) => {
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
          {s.youtubeUrl
            ? <span className="row tiny faint" style={{ gap: 6 }}><Video width={13} height={13} />YouTube live link set</span>
            : <span className="row tiny" style={{ gap: 6, color: 'var(--warning)' }}><Video width={13} height={13} />No YouTube link yet</span>}
        </div>

        <hr className="divider" />

        <div className="row">
          <span className="tiny faint">
            {s.isFree ? 'Free seminar' : `Revenue ${money(s.price * s.registered)}`}
          </span>
          <div className="spacer" />
          <button className="btn btn-sm btn-outline" onClick={() => setQuizFor(s)}>
            <Layers width={14} height={14} /> MCQ
          </button>
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

        <hr className="divider" />
        <LiveSessionControl type="seminar" refId={s.id} title={s.title} youtubeUrl={s.youtubeUrl} />
      </Card>
    )
  }

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
        <>
          <Tabs
            tabs={[
              ...(live.length ? [{ id: 'live', label: 'Live now', count: live.length }] : []),
              { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
              { id: 'past', label: 'Past', count: past.length },
            ]}
            value={tab === 'live' && !live.length ? 'upcoming' : tab}
            onChange={setTab}
          />
          <div style={{ marginTop: 16 }}>
            {tab === 'live' && live.length ? (
              <div className="grid grid-2">{live.map(renderCard)}</div>
            ) : tab === 'past' ? (
              past.length === 0
                ? <Card><Empty icon={Video} title="No past seminars">Seminars whose live session has finished show up here.</Empty></Card>
                : <div className="grid grid-2" style={{ opacity: 0.65 }}>{past.map(renderCard)}</div>
            ) : upcoming.length === 0 ? (
              <Card><Empty icon={Video} title="No upcoming seminars">Create a new seminar or check the Past tab.</Empty></Card>
            ) : (
              <div className="grid grid-2">{upcoming.map(renderCard)}</div>
            )}
          </div>
        </>
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

      {quizFor && <QuizManager seminar={quizFor} onClose={() => setQuizFor(null)} />}
    </>
  )
}

function SeminarModal({ value, subjects, onClose, onSubmit }) {
  const app = useApp()
  // Keep the datetime as the local wall-clock the teacher picked — no UTC
  // conversion, which previously shifted times by the timezone offset.
  const [f, setF] = useState({
    ...value,
    startsAt: value.startsAt ? String(value.startsAt).slice(0, 16).replace(' ', 'T') : '',
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
                startsAt: f.startsAt ? f.startsAt.replace('T', ' ') + ':00' : null,
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

        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
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

        <Field
          label="YouTube Live link"
          hint="Go live on YouTube (Studio or OBS) and paste the watch/stream URL here. Registered students get a “Watch live” button that plays it inside the site. When it's time, press “Start live class” from your Seminars list. You can add it later too."
        >
          <input
            className="input"
            placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
            value={f.youtubeUrl || ''}
            onChange={set('youtubeUrl')}
          />
        </Field>
      </div>
    </Modal>
  )
}
