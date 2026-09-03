/**
 * Contact Us — the address, every published line, the map plate and an enquiry
 * form. The form has nowhere to post yet, so it validates and confirms locally
 * and tells the visitor plainly to use WhatsApp for anything urgent.
 */

import { useState } from 'react'
import { MapPlate } from '../art/Decor.jsx'
import { Check, Clock, Info, Mail, Phone, Pin, WhatsApp } from '../art/Icons.jsx'
import { PageBanner, Section, SectionHead, Accordion } from '../components.jsx'
import { contact, faqs, streams } from '../siteData.js'

const EMPTY = { name: '', phone: '', email: '', stream: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(EMPTY)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      setError('Please give us your name, a phone number and your question.')
      return
    }
    setError('')
    setSent(true)
    setForm(EMPTY)
  }

  return (
    <>
      <PageBanner
        title="Contact Us"
        text="Call, message or write — a person answers between 8.00 a.m. and 8.00 p.m., Monday to Saturday."
      />

      <Section>
        <div className="gk-contact-grid">
          {/* ---- details ---- */}
          <div>
            <SectionHead eyebrow="Reach us" title="Every line we publish" />

            <div className="gk-info">
              <div className="gk-info__row">
                <span className="gk-info__icon">
                  <Pin size={20} />
                </span>
                <div>
                  <b>Office</b>
                  <p>{contact.address}</p>
                </div>
              </div>

              <div className="gk-info__row">
                <span className="gk-info__icon">
                  <Phone size={20} />
                </span>
                <div>
                  <b>Enrolments</b>
                  <p>
                    <a href={`tel:${contact.phones[0].replace(/\s/g, '')}`}>{contact.phones[0]}</a>
                    {' / '}
                    <a href={`tel:${contact.phones[1].replace(/\s/g, '')}`}>{contact.phones[1]}</a>
                  </p>
                </div>
              </div>

              <div className="gk-info__row">
                <span className="gk-info__icon">
                  <Phone size={20} />
                </span>
                <div>
                  <b>Tute section &amp; technical</b>
                  <p>
                    <a href={`tel:${contact.tuteLine.replace(/\s/g, '')}`}>{contact.tuteLine}</a>
                  </p>
                </div>
              </div>

              <div className="gk-info__row">
                <span className="gk-info__icon">
                  <Phone size={20} />
                </span>
                <div>
                  <b>Complaints &amp; suggestions</b>
                  <p>
                    <a href={`tel:${contact.complaintsLine.replace(/\s/g, '')}`}>{contact.complaintsLine}</a>
                  </p>
                </div>
              </div>

              <div className="gk-info__row">
                <span className="gk-info__icon">
                  <Mail size={20} />
                </span>
                <div>
                  <b>Email</b>
                  <p>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </p>
                </div>
              </div>

              <div className="gk-info__row">
                <span className="gk-info__icon">
                  <Clock size={20} />
                </span>
                <div>
                  <b>Working hours</b>
                  <p>{contact.hours}</p>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="gk-btn gk-btn--primary gk-btn--block"
              style={{ marginTop: 18 }}
            >
              <WhatsApp size={19} />
              Message us on WhatsApp
            </a>

            <div className="gk-map">
              <MapPlate />
            </div>
          </div>

          {/* ---- form ---- */}
          <div>
            <form className="gk-card gk-form" onSubmit={submit} noValidate>
              <div>
                <h2 style={{ fontSize: 24 }}>Send us a question</h2>
                <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14.5 }}>
                  Tell us the grade and stream and we will point you at the right lecturer.
                </p>
              </div>

              {sent && (
                <div className="gk-note">
                  <Check size={17} />
                  <span>
                    Thank you — your message is noted. Enquiries are answered within one working day; for anything
                    urgent, WhatsApp is faster.
                  </span>
                </div>
              )}

              {error && (
                <div className="gk-note gk-note--gold">
                  <Info size={17} />
                  <span>{error}</span>
                </div>
              )}

              <div className="gk-form__row">
                <div className="gk-field">
                  <label htmlFor="c-name">Full name</label>
                  <input id="c-name" className="gk-input" value={form.name} onChange={set('name')} placeholder="Your name" />
                </div>
                <div className="gk-field">
                  <label htmlFor="c-phone">Phone number</label>
                  <input id="c-phone" className="gk-input" value={form.phone} onChange={set('phone')} placeholder="07X XXX XXXX" />
                </div>
              </div>

              <div className="gk-form__row">
                <div className="gk-field">
                  <label htmlFor="c-email">Email (optional)</label>
                  <input id="c-email" className="gk-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                </div>
                <div className="gk-field">
                  <label htmlFor="c-stream">Stream</label>
                  <select id="c-stream" className="gk-select" style={{ width: '100%' }} value={form.stream} onChange={set('stream')}>
                    <option value="">Choose a stream</option>
                    {streams.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="gk-field">
                <label htmlFor="c-msg">Your question</label>
                <textarea
                  id="c-msg"
                  className="gk-textarea"
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Which subject are you looking for, and which grade is the student in?"
                />
                <span className="gk-field__hint">
                  Please do not send payment details or passwords through this form.
                </span>
              </div>

              <button type="submit" className="gk-btn gk-btn--primary gk-btn--block">
                Send enquiry
              </button>
            </form>
          </div>
        </div>
      </Section>

      <Section tone="paper">
        <div className="gk-grid gk-grid--2" style={{ gap: 48, alignItems: 'start' }}>
          <SectionHead
            eyebrow="Before you call"
            title="Answers to the usual questions"
            text="Most enquiries are one of these six. If yours is not, the form above reaches the same desk."
          />
          <Accordion items={faqs} />
        </div>
      </Section>
    </>
  )
}
