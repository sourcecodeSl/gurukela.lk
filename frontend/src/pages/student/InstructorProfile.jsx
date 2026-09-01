import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../store/AppContext.jsx'
import PaymentModal from '../../components/PaymentModal.jsx'
import {
  Avatar, Badge, Card, Empty, Field, Modal, Stars, StatusBadge, Tabs,
  fmtDate, fmtDay, fmtTime, hours, money, timeAgo,
} from '../../components/ui.jsx'
import {
  Shield, Clock, MapPin, Users, Globe, Star, Calendar, Check, Info,
} from '../../components/icons.jsx'

export default function InstructorProfile() {
  const { id } = useParams()
  const app = useApp()
  const navigate = useNavigate()
  const ins = app.instructorById[id]

  const [tab, setTab] = useState('overview')
  const [requestSlot, setRequestSlot] = useState(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [payClass, setPayClass] = useState(null)

  const studentId = app.session.role === 'student' ? app.session.id : null

  const modules = app.modulesOf(id)
  const reviews = app.reviewsOf(id)
  const slots = app.slotsOf(id)
  const classes = app.classesOf(id)
  const myRequests = app.slotRequests.filter((r) => r.studentId === studentId)

  const eligibility = useMemo(
    () => (studentId ? app.reviewEligibility(studentId, id) : { eligible: false, reason: 'not-enrolled', days: 0 }),
    [app, studentId, id]
  )

  if (!ins) {
    return (
      <Card>
        <Empty icon={Info} title="Instructor not found" action={<Link className="btn btn-primary" to="/discover">Back to search</Link>} />
      </Card>
    )
  }

  const ratingBreakdown = [5, 4, 3, 2, 1].map((n) => ({
    stars: n,
    count: reviews.filter((r) => r.rating === n).length,
  }))

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'slots', label: 'Free time slots', count: slots.filter((s) => s.status === 'open').length },
    { id: 'classes', label: 'Group classes', count: classes.length },
    { id: 'reviews', label: 'Reviews', count: reviews.length },
  ]

  return (
    <>
      {/* ------------------------------- header ------------------------------- */}
      <Card style={{ marginBottom: 20, overflow: 'hidden', padding: 0 }}>
        <div
          style={{
            height: 92,
            background: `linear-gradient(120deg, hsl(${ins.hue} 62% 52%), hsl(${ins.hue + 40} 60% 42%))`,
          }}
        />
        <div style={{ padding: 'var(--pad)' }}>
          <div className="row wrap" style={{ alignItems: 'flex-end', gap: 16 }}>
            <div style={{ border: '4px solid var(--surface)', borderRadius: '50%', background: 'var(--surface)', marginTop: -62 }}>
              <Avatar name={ins.name} hue={ins.hue} size={84} />
            </div>
            <div style={{ flex: 1, minWidth: 220, paddingBottom: 4 }}>
              <div className="row" style={{ gap: 8 }}>
                <h1 style={{ fontSize: 23 }}>{ins.name}</h1>
                {ins.verified && (
                  <Badge tone="accent">
                    <Shield width={12} height={12} /> Verified
                  </Badge>
                )}
              </div>
              <p className="muted">{ins.title}</p>
              <div className="row wrap" style={{ gap: 14, marginTop: 8 }}>
                <Stars value={ins.rating} size="lg" showValue count={ins.reviewCount} />
                <span className="row small muted" style={{ gap: 5 }}>
                  <Clock width={14} height={14} /> {hours(ins.teachingHours)} hours taught
                </span>
                <span className="row small muted" style={{ gap: 5 }}>
                  <Users width={14} height={14} /> {ins.studentCount} students
                </span>
                <span className="row small muted" style={{ gap: 5 }}>
                  <MapPin width={14} height={14} /> {ins.city}
                </span>
              </div>
            </div>
            <div className="col" style={{ gap: 8, paddingBottom: 4 }}>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                <span style={{ fontSize: 21, fontWeight: 800 }}>{money(ins.hourlyRate)}</span>
                <span className="small faint">/ hour</span>
              </div>
              <button className="btn btn-primary" onClick={() => setTab('slots')}>
                <Calendar width={16} height={16} />
                Book a free slot
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {/* ------------------------------- overview ------------------------------- */}
      {tab === 'overview' && (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)' }}>
          <div className="col" style={{ gap: 'var(--gap)' }}>
            <Card>
              <h2 style={{ marginBottom: 10 }}>About</h2>
              <p className="muted" style={{ lineHeight: 1.7 }}>{ins.bio}</p>
              <div className="row wrap" style={{ gap: 8, marginTop: 16 }}>
                {ins.highlights.map((h) => (
                  <Badge key={h} tone="accent">
                    <Check width={12} height={12} /> {h}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card>
              <h2 style={{ marginBottom: 4 }}>Modules taught</h2>
              <p className="small muted" style={{ marginBottom: 14 }}>
                Chosen from the catalogue the platform administrator maintains.
              </p>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
                {modules.map((m) => {
                  const sub = app.subjectById[m.subjectId]
                  return (
                    <div key={m.id} className="slot" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
                      <div className="row" style={{ gap: 7, width: '100%' }}>
                        <span className="tiny bold accent">{m.code}</span>
                        <div className="spacer" />
                        <Badge>{m.level}</Badge>
                      </div>
                      <div style={{ fontWeight: 600 }}>{m.name}</div>
                      <div className="tiny faint">{sub?.name} · {m.hours} hrs</div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          <div className="col" style={{ gap: 'var(--gap)' }}>
            <Card>
              <h3 style={{ marginBottom: 14 }}>At a glance</h3>
              {[
                ['Experience', `${ins.experienceYears} years`],
                ['Avg. response', `${ins.responseMins} min`],
                ['Total students', ins.studentCount],
                ['Hours taught', ins.teachingHours.toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} className="row" style={{ padding: '7px 0' }}>
                  <span className="small muted" style={{ flex: 1 }}>{k}</span>
                  <span className="small bold">{v}</span>
                </div>
              ))}
              <hr className="divider" style={{ margin: '10px 0' }} />
              <div className="row wrap" style={{ gap: 6 }}>
                <Globe width={14} height={14} className="faint" />
                {ins.languages.map((l) => (
                  <Badge key={l}>{l}</Badge>
                ))}
              </div>
            </Card>

            <Card>
              <h3 style={{ marginBottom: 12 }}>Rating breakdown</h3>
              {ratingBreakdown.map((b) => (
                <div key={b.stars} className="row" style={{ gap: 9, marginBottom: 7 }}>
                  <span className="tiny muted" style={{ width: 26 }}>{b.stars}★</span>
                  <div className="meter" style={{ flex: 1 }}>
                    <i style={{ width: `${reviews.length ? (b.count / reviews.length) * 100 : 0}%` }} />
                  </div>
                  <span className="tiny faint" style={{ width: 18, textAlign: 'right' }}>{b.count}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* ------------------------------- free slots ------------------------------- */}
      {tab === 'slots' && (
        <>
          <Card style={{ marginBottom: 16, background: 'var(--accent-soft)', borderColor: 'var(--accent-border)' }}>
            <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
              <Info width={18} height={18} className="accent" style={{ flex: 'none', marginTop: 2 }} />
              <div>
                <h3 style={{ fontSize: 14 }}>How free slots work</h3>
                <p className="small muted" style={{ marginTop: 3 }}>
                  Send a request for the module you need. The instructor accepts or rejects it — and once accepted,
                  <b> the first student to complete the payment secures the slot.</b>
                </p>
              </div>
            </div>
          </Card>

          {slots.length === 0 ? (
            <Card><Empty icon={Clock} title="No free slots published yet" >This instructor has not opened any one-to-one time slots. Check the group classes tab instead.</Empty></Card>
          ) : (
            <div className="grid grid-2">
              {slots.map((slot) => {
                const mine = myRequests.find((r) => r.slotId === slot.id && r.status !== 'lost' && r.status !== 'rejected')
                const contenders = app.slotRequests.filter(
                  (r) => r.slotId === slot.id && (r.status === 'pending' || r.status === 'accepted')
                ).length
                return (
                  <Card key={slot.id} hover>
                    <div className="row" style={{ alignItems: 'flex-start' }}>
                      <div
                        className="col center"
                        style={{
                          background: 'var(--accent-soft)',
                          color: 'var(--accent)',
                          borderRadius: 'var(--r)',
                          padding: '8px 12px',
                          minWidth: 58,
                        }}
                      >
                        <span className="tiny bold">{fmtDay(slot.date)}</span>
                        <span style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.1 }}>
                          {new Date(slot.date).getDate()}
                        </span>
                        <span className="tiny">{fmtDate(slot.date, { month: 'short' })}</span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ gap: 7 }}>
                          <span style={{ fontWeight: 700 }}>
                            {fmtTime(slot.start)} – {fmtTime(slot.end)}
                          </span>
                          <StatusBadge status={slot.status} />
                        </div>
                        <p className="small muted" style={{ marginTop: 2 }}>{money(slot.price)} for the session</p>
                        {contenders > 0 && slot.status === 'open' && (
                          <p className="tiny faint" style={{ marginTop: 4 }}>
                            {contenders} student{contenders === 1 ? '' : 's'} already requested this slot
                          </p>
                        )}
                      </div>
                    </div>

                    <hr className="divider" style={{ margin: '13px 0' }} />

                    {slot.status === 'booked' ? (
                      <button className="btn btn-block" disabled>Already booked</button>
                    ) : mine ? (
                      <div className="row" style={{ gap: 8 }}>
                        <StatusBadge status={mine.status} />
                        <div className="spacer" />
                        <Link className="btn btn-sm btn-outline" to="/bookings">
                          {mine.status === 'accepted' ? 'Pay now' : 'View request'}
                        </Link>
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary btn-block"
                        disabled={!studentId}
                        onClick={() => setRequestSlot(slot)}
                      >
                        {studentId ? 'Request this slot' : 'Switch to a student account to book'}
                      </button>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ------------------------------- group classes ------------------------------- */}
      {tab === 'classes' && (
        classes.length === 0 ? (
          <Card><Empty icon={Users} title="No group classes scheduled" >This instructor currently teaches one-to-one only.</Empty></Card>
        ) : (
          <div className="grid grid-2">
            {classes.map((c) => {
              const mod = app.moduleById[c.moduleId]
              const full = c.enrolled >= c.seats
              const joined = app.enrollments.some(
                (e) => e.type === 'group' && e.refId === c.id && e.studentId === studentId
              )
              return (
                <Card key={c.id} hover className="col" style={{ gap: 12 }}>
                  <div className="row" style={{ gap: 7 }}>
                    <Badge tone="accent">{mod?.code}</Badge>
                    <Badge>{c.level}</Badge>
                    <div className="spacer" />
                    {full ? <Badge tone="danger">Full</Badge> : <Badge tone="success">{c.seats - c.enrolled} seats left</Badge>}
                  </div>
                  <div>
                    <h3>{c.title}</h3>
                    <p className="small muted" style={{ marginTop: 4 }}>{c.description}</p>
                  </div>
                  <div className="col small muted" style={{ gap: 5 }}>
                    <span className="row" style={{ gap: 6 }}><Clock width={14} height={14} />{c.schedule}</span>
                    <span className="row" style={{ gap: 6 }}><Calendar width={14} height={14} />Starts {fmtDate(c.startsAt, { day: 'numeric', month: 'long' })} · {c.weeks} weeks</span>
                  </div>
                  <div>
                    <div className="row tiny faint" style={{ marginBottom: 5 }}>
                      <span style={{ flex: 1 }}>{c.enrolled} of {c.seats} enrolled</span>
                    </div>
                    <div className="meter"><i style={{ width: `${(c.enrolled / c.seats) * 100}%` }} /></div>
                  </div>
                  <hr className="divider" />
                  <div className="row">
                    <div className="col">
                      <span className="bold" style={{ fontSize: 16 }}>{money(c.price)}</span>
                      <span className="tiny faint">full course</span>
                    </div>
                    <div className="spacer" />
                    {joined ? (
                      <Badge tone="success"><Check width={12} height={12} /> Enrolled</Badge>
                    ) : (
                      <button className="btn btn-primary" disabled={full || !studentId} onClick={() => setPayClass(c)}>
                        Pay &amp; join
                      </button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )
      )}

      {/* ------------------------------- reviews ------------------------------- */}
      {tab === 'reviews' && (
        <div className="col" style={{ gap: 'var(--gap)' }}>
          <Card>
            <div className="row wrap" style={{ gap: 20 }}>
              <div className="col center" style={{ alignItems: 'center', minWidth: 130 }}>
                <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-.03em' }}>{ins.rating.toFixed(1)}</span>
                <Stars value={ins.rating} size="lg" />
                <span className="small muted" style={{ marginTop: 4 }}>{reviews.length} verified reviews</span>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div
                  className="row"
                  style={{ gap: 9, background: 'var(--success-soft)', color: 'var(--success)', padding: '10px 13px', borderRadius: 'var(--r)', alignItems: 'flex-start' }}
                >
                  <Shield width={16} height={16} style={{ flex: 'none', marginTop: 2 }} />
                  <span className="small" style={{ fontWeight: 500 }}>
                    Every review here comes from a student who paid for classes with this instructor and completed at
                    least one month of learning. Nobody else can post one.
                  </span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <ReviewGate eligibility={eligibility} onWrite={() => setReviewOpen(true)} role={app.session.role} />
                </div>
              </div>
            </div>
          </Card>

          {reviews.length === 0 ? (
            <Card><Empty icon={Star} title="No reviews yet" >Once students complete a month of classes, their reviews will appear here.</Empty></Card>
          ) : (
            <div className="grid grid-2">
              {reviews.map((r) => {
                const std = app.studentById[r.studentId]
                return (
                  <Card key={r.id} className="col" style={{ gap: 10 }}>
                    <div className="row">
                      <Avatar name={std?.name || 'Student'} hue={std?.hue ?? 240} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <span style={{ fontWeight: 600 }} className="truncate">{std?.name || 'Student'}</span>
                          <Badge tone="success"><Shield width={11} height={11} /> Verified</Badge>
                        </div>
                        <span className="tiny faint">
                          {r.daysStudied} days of classes · {timeAgo(r.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Stars value={r.rating} />
                    <p className="small muted" style={{ lineHeight: 1.65 }}>{r.text}</p>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------- modals ------------------------------- */}
      <RequestModal
        key={requestSlot?.id || 'none'}
        slot={requestSlot}
        instructor={ins}
        modules={modules}
        onClose={() => setRequestSlot(null)}
        onSubmit={(payload) => {
          app.dispatch({ type: 'request/create', payload: { ...payload, slotId: requestSlot.id, studentId } })
          setRequestSlot(null)
          app.toast('Request sent — waiting for the instructor to accept')
          navigate('/bookings')
        }}
      />

      <WriteReviewModal
        open={reviewOpen}
        instructor={ins}
        days={eligibility.days}
        onClose={() => setReviewOpen(false)}
        onSubmit={({ rating, text }) => {
          app.dispatch({
            type: 'review/add',
            payload: { instructorId: ins.id, studentId, rating, text, daysStudied: eligibility.days },
          })
          setReviewOpen(false)
          app.toast('Thanks — your review is published')
        }}
      />

      {payClass && (
        <PaymentModal
          open
          title="Join group class"
          total={payClass.price}
          cta="Pay & enrol"
          lines={[
            { label: 'Class', value: payClass.title },
            { label: 'Instructor', value: ins.name },
            { label: 'Schedule', value: payClass.schedule },
            { label: 'Duration', value: `${payClass.weeks} weeks` },
          ]}
          onClose={() => setPayClass(null)}
          onConfirm={(method) => {
            app.dispatch({ type: 'group/join', id: payClass.id, studentId, method })
            setPayClass(null)
            app.toast('You are enrolled — see it under My Bookings')
          }}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */

function ReviewGate({ eligibility, onWrite, role }) {
  if (role !== 'student') {
    return <p className="small faint">Switch to the student account to see your review eligibility.</p>
  }
  if (eligibility.eligible) {
    return (
      <button className="btn btn-primary" onClick={onWrite}>
        <Star width={15} height={15} /> Write a review
      </button>
    )
  }
  const messages = {
    'not-enrolled': 'You can review this instructor after you pay for a class and complete one month of learning.',
    'too-early': `You have been learning for ${eligibility.days} days. ${eligibility.daysLeft} more days until you can review.`,
    'already-reviewed': 'You have already reviewed this instructor. Thank you!',
  }
  return (
    <div className="col" style={{ gap: 8 }}>
      <button className="btn" disabled>
        <Star width={15} height={15} /> Write a review
      </button>
      <span className="tiny faint">{messages[eligibility.reason]}</span>
      {eligibility.reason === 'too-early' && (
        <div className="meter" style={{ maxWidth: 240 }}>
          <i style={{ width: `${(eligibility.days / 30) * 100}%` }} />
        </div>
      )}
    </div>
  )
}

function RequestModal({ slot, instructor, modules, onClose, onSubmit }) {
  const [moduleId, setModuleId] = useState('')
  const [note, setNote] = useState('')

  if (!slot) return null

  return (
    <Modal
      open
      onClose={onClose}
      title="Request this time slot"
      subtitle={`${fmtDate(slot.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${fmtTime(slot.start)} – ${fmtTime(slot.end)}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!moduleId} onClick={() => onSubmit({ moduleId, note })}>
            Send request
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 14 }}>
        <div className="row card card-pad" style={{ gap: 11, padding: 13 }}>
          <Avatar name={instructor.name} hue={instructor.hue} size={38} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{instructor.name}</div>
            <div className="tiny faint">Usually replies in {instructor.responseMins} min</div>
          </div>
          <span className="bold">{money(slot.price)}</span>
        </div>

        <Field label="Which module do you need?" hint="Only modules this instructor is registered to teach are listed.">
          <select className="select" value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
            <option value="">Select a module…</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.code} — {m.name}</option>
            ))}
          </select>
        </Field>

        <Field label="What do you want to cover? (optional)">
          <textarea
            className="textarea"
            placeholder="e.g. I need help with integration by parts before my term test."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        <div
          className="row"
          style={{ gap: 9, background: 'var(--warning-soft)', color: 'var(--warning)', padding: '10px 12px', borderRadius: 'var(--r)', alignItems: 'flex-start' }}
        >
          <Info width={16} height={16} style={{ flex: 'none', marginTop: 1 }} />
          <span className="tiny" style={{ fontWeight: 500 }}>
            Other students may request the same slot. After the instructor accepts, the slot goes to whoever pays first.
          </span>
        </div>
      </div>
    </Modal>
  )
}

function WriteReviewModal({ open, instructor, days, onClose, onSubmit }) {
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Review ${instructor.name}`}
      subtitle={`Verified after ${days} days of paid classes`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={text.trim().length < 10} onClick={() => onSubmit({ rating, text: text.trim() })}>
            Publish review
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 16 }}>
        <Field label="Your rating">
          <div className="row" style={{ gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                aria-label={`${n} stars`}
                style={{ background: 'none', border: 0, cursor: 'pointer', padding: 2, color: 'var(--star)' }}
              >
                <Star width={26} height={26} fill={n <= rating ? 'currentColor' : 'none'} opacity={n <= rating ? 1 : 0.3} />
              </button>
            ))}
            <span className="muted small" style={{ marginLeft: 6 }}>{rating}.0</span>
          </div>
        </Field>
        <Field label="Your experience" hint="At least 10 characters.">
          <textarea
            className="textarea"
            placeholder="What did the classes help you with?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  )
}
