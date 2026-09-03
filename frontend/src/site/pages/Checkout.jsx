/**
 * Checkout — the cart and the payment options, matching the reference site's
 * checkout step. The backend is not wired, so choosing a method shows the
 * bank details or explains what happens next rather than charging anything.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import Flyer from '../art/Flyer.jsx'
import Portrait from '../art/Portrait.jsx'
import { PayMark } from '../art/Decor.jsx'
import { ArrowRight, Cart, Check, Info, Shield, Trash } from '../art/Icons.jsx'
import { PageBanner, Section, Ticks } from '../components.jsx'
import { useCart, money } from '../CartContext.jsx'
import { campaigns, lecturerById, contact } from '../siteData.js'

const ADMISSION = 500

const METHODS = [
  { id: 'card', kind: 'card', name: 'Credit or debit card', sub: 'Visa, Mastercard — access opens immediately' },
  { id: 'bank', kind: 'bank', name: 'Bank transfer', sub: 'Deposit and upload the slip; opened within a day' },
  { id: 'ez', kind: 'ez', name: 'eZ Cash / mCash', sub: 'Pay from your mobile reload balance' },
]

// TODO — replace with Gurukela's real account before taking any payment.
const BANK = [
  'Account name — Gurukela Online Academy (Pvt) Ltd',
  'Bank and branch — to be confirmed',
  'Account number — to be confirmed',
  'Reference: your phone number, exactly as registered',
]

/** The little artwork beside a cart line: the flyer for an offer, the lecturer otherwise. */
function RowArt({ item }) {
  const campaign = campaigns.find((c) => c.id === item.id)
  if (campaign) return <Flyer art={campaign.art} />
  const lecturer = item.lecturerId ? lecturerById(item.lecturerId) : null
  if (lecturer) return <Portrait id={lecturer.id} name={lecturer.name} />
  return null
}

export default function Checkout() {
  const cart = useCart()
  const [method, setMethod] = useState('card')
  const [done, setDone] = useState(false)

  const admission = cart.items.some((i) => i.amount > 0) ? ADMISSION : 0
  const grand = cart.total + admission

  if (done) {
    return (
      <>
        <PageBanner title="Seat reserved" crumb="Checkout" />
        <Section>
          <div className="gk-card gk-card__body" style={{ maxWidth: 620, margin: '0 auto', padding: 40, textAlign: 'center' }}>
            <span className="gk-offer__icon" style={{ margin: '0 auto' }}>
              <Check size={26} />
            </span>
            <h2 style={{ margin: '22px 0 12px' }}>Your seat is held</h2>
            <p style={{ color: 'var(--muted)' }}>
              We have noted your selection. Payment is not collected on the website yet — our coordinator will call
              you on the number you registered to confirm the batch and settle the fee.
            </p>
            <div className="gk-note" style={{ marginTop: 24, textAlign: 'left' }}>
              <Info size={17} />
              <span>
                In a hurry? Message {contact.phones[0]} on WhatsApp with your name and the class you chose.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 26, flexWrap: 'wrap' }}>
              <Link to="/lecturers" className="gk-btn gk-btn--primary">
                Back to the panel
              </Link>
              <Link to="/" className="gk-btn gk-btn--ghost">
                Home
              </Link>
            </div>
          </div>
        </Section>
      </>
    )
  }

  return (
    <>
      <PageBanner
        title="Checkout"
        text="Review what you picked, then choose how you would like to pay for the month."
      />

      <Section>
        {cart.count === 0 ? (
          <div className="gk-empty">
            <Cart size={44} style={{ margin: '0 auto', color: 'var(--faint)' }} />
            <h3>Your cart is empty</h3>
            <p>Add a class from a lecturer's profile, or pick one of this season's campaign offers.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/lecturers" className="gk-btn gk-btn--primary">
                Browse lecturers
              </Link>
              <Link to="/campaign" className="gk-btn gk-btn--ghost">
                See the campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="gk-checkout">
            {/* ---- items + methods ---- */}
            <div style={{ display: 'grid', gap: 24 }}>
              <div className="gk-card">
                <div style={{ padding: '18px 18px 0' }}>
                  <h3>Your selection</h3>
                </div>
                <div style={{ marginTop: 8 }}>
                  {cart.items.map((item) => (
                    <div className="gk-cart-row" key={item.id}>
                      <span className="gk-cart-row__art">
                        <RowArt item={item} />
                      </span>
                      <span className="gk-cart-row__main">
                        <b>{item.title}</b>
                        <span>{item.sub}</span>
                      </span>
                      <span className="gk-cart-row__price">
                        {item.amount > 0 ? money(item.amount) : 'Free'}
                      </span>
                      <button
                        type="button"
                        className="gk-icon-btn"
                        onClick={() => cart.remove(item.id)}
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gk-card gk-card__body">
                <h3 style={{ marginBottom: 16 }}>Payment options</h3>
                <div className="gk-pay-methods">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`gk-pay${method === m.id ? ' is-on' : ''}`}
                      onClick={() => setMethod(m.id)}
                      aria-pressed={method === m.id}
                    >
                      <span className="gk-pay__radio" />
                      <PayMark kind={m.kind} />
                      <span className="gk-pay__main">
                        <b>{m.name}</b>
                        <span>{m.sub}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {method === 'bank' && (
                  <div style={{ marginTop: 18 }}>
                    <Ticks items={BANK} />
                  </div>
                )}

                <div className="gk-note" style={{ marginTop: 18 }}>
                  <Shield size={17} />
                  <span>
                    Online payment is not live on this site yet. Confirming below reserves your seat and a
                    coordinator calls you to complete it.
                  </span>
                </div>
              </div>
            </div>

            {/* ---- summary ---- */}
            <aside className="gk-card gk-summary">
              <h3>Summary</h3>
              <div className="gk-summary__line">
                <span>
                  {cart.count} {cart.count === 1 ? 'item' : 'items'}
                </span>
                <span>{money(cart.total)}</span>
              </div>
              {admission > 0 && (
                <div className="gk-summary__line">
                  <span>Admission fee (one time)</span>
                  <span>{money(admission)}</span>
                </div>
              )}
              <div className="gk-summary__line">
                <span>Tute delivery</span>
                <span>Included</span>
              </div>
              <div className="gk-summary__total">
                <span>Total due</span>
                <b>{grand > 0 ? money(grand) : 'Free'}</b>
              </div>

              <button type="button" className="gk-btn gk-btn--primary gk-btn--block" onClick={() => setDone(true)}>
                Confirm and reserve
                <ArrowRight size={17} />
              </button>
              <button type="button" className="gk-btn gk-btn--ghost gk-btn--block" onClick={cart.clear}>
                Clear cart
              </button>

              <p style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 4 }}>
                By confirming you accept our <Link to="/terms" className="gk-link" style={{ fontSize: 12.5 }}>Terms</Link>{' '}
                and <Link to="/refund" className="gk-link" style={{ fontSize: 12.5 }}>Refund Policy</Link>. Fees are
                non-refundable once processed.
              </p>
            </aside>
          </div>
        )}
      </Section>
    </>
  )
}
