/**
 * Campaign — the promotional gallery. The reference site runs a set of flyer
 * sliders here; this version shows the same offers as designed posters, with a
 * scrolling rail at the top and a full grid underneath.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Flyer from '../art/Flyer.jsx'
import { ArrowLeft, ArrowRight, Cart, Check, Info } from '../art/Icons.jsx'
import { PageBanner, Section, SectionHead, FlyerCard, CtaBand } from '../components.jsx'
import { useCart } from '../CartContext.jsx'
import { campaigns } from '../siteData.js'

/** Parses "Rs. 2,500 / month" into 2500; free offers become 0. */
const priceOf = (label) => {
  const n = Number(String(label).replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function Spotlight() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const c = campaigns[i]

  useEffect(() => {
    if (paused) return undefined
    const t = setInterval(() => setI((n) => (n + 1) % campaigns.length), 6000)
    return () => clearInterval(t)
  }, [paused])

  const step = (d) => setI((n) => (n + d + campaigns.length) % campaigns.length)

  return (
    <div
      className="gk-grid gk-grid--2"
      style={{ gap: 48, alignItems: 'center' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ maxWidth: 380, width: '100%', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--sh-lg)' }}>
        <Flyer art={c.art} />
      </div>

      <div>
        <span className="gk-chip gk-chip--solid">{c.badge}</span>
        <h2 style={{ margin: '18px 0 10px' }}>{c.title}</h2>
        <p style={{ color: 'var(--g-600)', fontWeight: 700, marginBottom: 14 }}>{c.subtitle}</p>
        <p style={{ color: 'var(--muted)', fontSize: 16 }}>{c.detail}</p>

        <div style={{ display: 'flex', gap: 26, marginTop: 26, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--faint)' }}>
              When
            </div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{c.period}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--faint)' }}>
              Fee
            </div>
            <div style={{ fontWeight: 800, marginTop: 4, color: 'var(--g-700)', fontSize: 18 }}>
              {c.price}
              {c.was && <span className="gk-flyer__was">{c.was}</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 30, flexWrap: 'wrap' }}>
          <Link to="/register" className="gk-btn gk-btn--primary">
            Reserve a seat
            <ArrowRight size={17} />
          </Link>
          <button type="button" className="gk-btn gk-btn--ghost" onClick={() => step(-1)} aria-label="Previous campaign">
            <ArrowLeft size={17} />
          </button>
          <button type="button" className="gk-btn gk-btn--ghost" onClick={() => step(1)} aria-label="Next campaign">
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="gk-hero__dots" style={{ marginTop: 24 }}>
          {campaigns.map((x, n) => (
            <button
              key={x.id}
              type="button"
              aria-label={`Show ${x.title}`}
              className={`gk-hero__dot${n === i ? ' is-on' : ''}`}
              style={n === i ? { background: 'var(--g-600)' } : { background: 'var(--line-2)' }}
              onClick={() => setI(n)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Campaign() {
  const cart = useCart()

  return (
    <>
      <PageBanner
        title="Campaign"
        text="Every offer running at Gurukela right now — trial weeks, new batches, revision programmes, scholarships and free seminars."
      />

      <Section>
        <Spotlight />
      </Section>

      {/* ---- poster rail ---- */}
      <Section tone="paper" tight>
        <SectionHead
          eyebrow="Promotional campaign"
          title="This season's flyers"
          text="Scroll through the posters, or save one to share with your batch group."
        />
        <div className="gk-poster-rail">
          {campaigns.map((c) => (
            <div className="gk-poster" key={`rail-${c.id}`}>
              <Flyer art={c.art} />
            </div>
          ))}
        </div>
      </Section>

      {/* ---- full grid ---- */}
      <Section>
        <SectionHead
          eyebrow="All offers"
          title="Pick what fits your year"
          text="Add an offer to your cart and complete it at checkout, or reserve a seat and pay at the office."
        />
        <div className="gk-grid gk-grid--3">
          {campaigns.map((c) => {
            const inCart = cart.has(c.id)
            const amount = priceOf(c.price)
            return (
              <FlyerCard
                key={c.id}
                campaign={c}
                action={
                  <button
                    type="button"
                    className={`gk-btn ${inCart ? 'gk-btn--ghost' : 'gk-btn--primary'} gk-btn--sm`}
                    onClick={() =>
                      inCart
                        ? cart.remove(c.id)
                        : cart.add({ id: c.id, title: c.title, sub: c.subtitle, amount })
                    }
                  >
                    {inCart ? (
                      <>
                        <Check size={15} />
                        Added
                      </>
                    ) : (
                      <>
                        <Cart size={15} />
                        Add
                      </>
                    )}
                  </button>
                }
              />
            )
          })}
        </div>

        <div className="gk-note gk-note--gold" style={{ marginTop: 28 }}>
          <Info size={17} />
          <span>
            Campaign prices hold until the batch fills. A free offer still needs an account so we can reserve your
            seat and send the tute.
          </span>
        </div>
      </Section>

      <Section tight>
        <CtaBand
          title="Complete your enrolment"
          text="Everything in your cart is held for you. Sign in to pay, or reserve the seat and settle it at the office."
          primary={{ to: '/checkout', label: 'Go to payment options' }}
          secondary={{ to: '/lecturers', label: 'Browse lecturers' }}
        />
      </Section>
    </>
  )
}
