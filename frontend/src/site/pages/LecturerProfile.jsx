/**
 * A single lecturer — the equivalent of the reference site's individual
 * lecture page. Shows the profile, the classes they run, and lets a visitor
 * put a class in the cart before signing in.
 */

import { Link, useParams } from 'react-router-dom'
import Portrait from '../art/Portrait.jsx'
import { ArrowLeft, Award, Calendar, Cart, Check, Clock, Globe, Star, Users, Video } from '../art/Icons.jsx'
import { PageBanner, Section, SectionHead, TutorCard, Ticks, CtaBand } from '../components.jsx'
import { useCart, money } from '../CartContext.jsx'
import { lecturerById, lecturers, streamById } from '../siteData.js'

/** Monthly fee by class type — the admission fee is charged once, separately. */
const FEES = { Theory: 2500, Revision: 2800, 'Paper Class': 3200, Seminar: 1500 }

const SCHEDULE = {
  Theory: 'Tuesdays & Fridays · 6.00 – 8.00 p.m.',
  Revision: 'Saturdays · 8.00 – 11.00 a.m.',
  'Paper Class': 'Sundays · 2.00 – 5.00 p.m.',
  Seminar: 'Announced monthly',
}

export default function LecturerProfile() {
  const { id } = useParams()
  const l = lecturerById(id)
  const cart = useCart()

  if (!l) {
    return (
      <>
        <PageBanner title="Lecturer not found" crumb="Our Lecturers" />
        <Section>
          <div className="gk-empty">
            <h3>That profile is not on the panel</h3>
            <p>The link may be out of date. The full lecturer panel is one click away.</p>
            <Link to="/lecturers" className="gk-btn gk-btn--primary">
              Back to the panel
            </Link>
          </div>
        </Section>
      </>
    )
  }

  const stream = streamById(l.stream)
  const related = lecturers.filter((x) => x.stream === l.stream && x.id !== l.id).slice(0, 4)

  return (
    <>
      <PageBanner title={l.name} crumb="Our Lecturers" text={`${l.title} · ${stream.name}`} />

      <Section>
        <Link to="/lecturers" className="gk-link" style={{ marginBottom: 24 }}>
          <ArrowLeft size={15} />
          All lecturers
        </Link>

        <div className="gk-profile">
          {/* ---- sticky identity card ---- */}
          <aside className="gk-card gk-profile__card">
            <div className="gk-profile__photo">
              <Portrait id={l.id} name={l.name} />
            </div>
            <div className="gk-profile__facts">
              <div className="gk-profile__fact">
                <span>Subject</span>
                <b>{l.subject}</b>
              </div>
              <div className="gk-profile__fact">
                <span>Stream</span>
                <b>{stream.name}</b>
              </div>
              <div className="gk-profile__fact">
                <span>Medium</span>
                <b>{l.medium}</b>
              </div>
              <div className="gk-profile__fact">
                <span>Experience</span>
                <b>{l.years} years</b>
              </div>
              <div className="gk-profile__fact">
                <span>Students taught</span>
                <b>{l.students.toLocaleString('en-LK')}</b>
              </div>
              <div className="gk-profile__fact">
                <span>Rating</span>
                <b style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Star size={14} style={{ color: 'var(--gold)' }} />
                  {l.rating.toFixed(1)}
                </b>
              </div>
              <Link to="/register" className="gk-btn gk-btn--primary gk-btn--block" style={{ marginTop: 6 }}>
                Enrol with {l.name.split(' ')[0]}
              </Link>
            </div>
          </aside>

          {/* ---- detail ---- */}
          <div>
            <div className="gk-pills" style={{ marginBottom: 20 }}>
              <span className="gk-chip">
                <Globe size={14} />
                {l.medium} medium
              </span>
              <span className="gk-chip">
                <Users size={14} />
                {l.students.toLocaleString('en-LK')} students
              </span>
              <span className="gk-chip">
                <Award size={14} />
                {l.years} years teaching
              </span>
            </div>

            <div className="gk-prose">
              <h2>About {l.name}</h2>
              <p style={{ marginTop: 16 }}>{l.bio}</p>
            </div>

            <div style={{ marginTop: 38 }}>
              <h3 style={{ marginBottom: 16 }}>Qualifications</h3>
              <Ticks items={l.qualifications} />
            </div>

            {/* ---- classes ---- */}
            <div style={{ marginTop: 44 }}>
              <h3 style={{ marginBottom: 16 }}>Classes and fees</h3>
              <div className="gk-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {l.classes.map((type) => {
                  const itemId = `${l.id}:${type}`
                  const inCart = cart.has(itemId)
                  return (
                    <article className="gk-card gk-card__body" key={type} style={{ display: 'grid', gap: 10 }}>
                      <span className="gk-chip gk-chip--solid" style={{ justifySelf: 'start' }}>
                        <Video size={14} />
                        {type}
                      </span>
                      <div style={{ fontSize: 13.5, color: 'var(--muted)', display: 'flex', gap: 7, alignItems: 'center' }}>
                        <Clock size={15} />
                        {SCHEDULE[type]}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--g-700)', letterSpacing: '-.02em' }}>
                        {money(FEES[type])}
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}> / month</span>
                      </div>
                      <button
                        type="button"
                        className={`gk-btn ${inCart ? 'gk-btn--ghost' : 'gk-btn--primary'} gk-btn--sm gk-btn--block`}
                        onClick={() =>
                          inCart
                            ? cart.remove(itemId)
                            : cart.add({
                                id: itemId,
                                lecturerId: l.id,
                                title: `${l.subject} — ${type}`,
                                sub: `${l.name} · ${l.medium} medium`,
                                amount: FEES[type],
                              })
                        }
                      >
                        {inCart ? (
                          <>
                            <Check size={15} />
                            In your cart
                          </>
                        ) : (
                          <>
                            <Cart size={15} />
                            Add to cart
                          </>
                        )}
                      </button>
                    </article>
                  )
                })}
              </div>

              <div className="gk-note" style={{ marginTop: 18 }}>
                <Calendar size={17} />
                <span>
                  Fees are billed monthly and include the printed tute. A one-time admission fee applies to a new
                  batch and is shown at checkout.
                </span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {related.length > 0 && (
        <Section tone="paper">
          <SectionHead
            eyebrow="Same stream"
            title={`More from ${stream.name}`}
            text="Students who take this subject usually pair it with one of these."
          />
          <div className="gk-grid gk-grid--4">
            {related.map((r) => (
              <TutorCard key={r.id} lecturer={r} />
            ))}
          </div>
        </Section>
      )}

      <Section tight>
        <CtaBand
          title={`Sit ${l.name.split(' ')[0]}'s first week free`}
          text="Join the live lesson, take the tute, and decide afterwards. No card needed to start the trial."
          primary={{ to: '/register', label: 'Start the free week' }}
          secondary={{ to: '/checkout', label: 'Go to checkout' }}
        />
      </Section>
    </>
  )
}
