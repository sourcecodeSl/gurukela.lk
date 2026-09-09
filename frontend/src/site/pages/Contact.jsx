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
import { useLang } from '../i18n/LanguageContext.jsx'

const EMPTY = { name: '', phone: '', email: '', stream: '', message: '' }

export default function Contact() {
  const { t, tr } = useLang()
  const [form, setForm] = useState(EMPTY)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      setError(t('contact.form.incomplete'))
      return
    }
    setError('')
    setSent(true)
    setForm(EMPTY)
  }

  return (
    <>
      <PageBanner
        title={t('contact.title')}
        text={t('contact.banner')}
      />

      <Section>
        <div className="gk-contact-grid">
          {/* ---- details ---- */}
          <div>
            <SectionHead eyebrow={t('contact.reach')} title={t('contact.everyLine')} />

            <div className="gk-info">
              <div className="gk-info__row">
                <span className="gk-info__icon">
                  <Pin size={20} />
                </span>
                <div>
                  <b>{t('contact.office')}</b>
                  <p>{tr(contact.address)}</p>
                </div>
              </div>

              <div className="gk-info__row">
                <span className="gk-info__icon">
                  <Phone size={20} />
                </span>
                <div>
                  <b>{t('contact.enrolments')}</b>
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
                  <b>{t('contact.tuteTechnical')}</b>
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
                  <b>{t('contact.complaints')}</b>
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
                  <b>{t('contact.email')}</b>
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
                  <b>{t('contact.hours')}</b>
                  <p>{tr(contact.hours)}</p>
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
              {t('contact.whatsapp')}
            </a>

            <div className="gk-map">
              <MapPlate />
            </div>
          </div>

          {/* ---- form ---- */}
          <div>
            <form className="gk-card gk-form" onSubmit={submit} noValidate>
              <div>
                <h2 style={{ fontSize: 24 }}>{t('contact.form.title')}</h2>
                <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14.5 }}>
                  {t('contact.form.sub')}
                </p>
              </div>

              {sent && (
                <div className="gk-note">
                  <Check size={17} />
                  <span>
                    Thank you. Your message is noted. Enquiries are answered within one working day; for anything
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
                  <label htmlFor="c-name">{t('reg.fullName')}</label>
                  <input id="c-name" className="gk-input" value={form.name} onChange={set('name')} placeholder="Your name" />
                </div>
                <div className="gk-field">
                  <label htmlFor="c-phone">{t('reg.phone')}</label>
                  <input id="c-phone" className="gk-input" value={form.phone} onChange={set('phone')} placeholder="07X XXX XXXX" />
                </div>
              </div>

              <div className="gk-form__row">
                <div className="gk-field">
                  <label htmlFor="c-email">Email (optional)</label>
                  <input id="c-email" className="gk-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                </div>
                <div className="gk-field">
                  <label htmlFor="c-stream">{t('contact.form.stream')}</label>
                  <select id="c-stream" className="gk-select" style={{ width: '100%' }} value={form.stream} onChange={set('stream')}>
                    <option value="">{t('contact.form.chooseStream')}</option>
                    {streams.map((s) => (
                      <option key={s.id} value={s.id}>
                        {tr(s.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="gk-field">
                <label htmlFor="c-msg">{t('contact.form.question')}</label>
                <textarea
                  id="c-msg"
                  className="gk-textarea"
                  value={form.message}
                  onChange={set('message')}
                  placeholder={t('contact.form.questionPlaceholder')}
                />
                <span className="gk-field__hint">
                  {t('contact.form.noSecrets')}
                </span>
              </div>

              <button type="submit" className="gk-btn gk-btn--primary gk-btn--block">
                {t('contact.form.submit')}
              </button>
            </form>
          </div>
        </div>
      </Section>

      <Section tone="paper">
        <div className="gk-grid gk-grid--2" style={{ gap: 48, alignItems: 'start' }}>
          <SectionHead
            eyebrow={t('contact.faq.eyebrow')}
            title={t('contact.faq.title')}
            text={t('contact.faq.text')}
          />
          <Accordion items={faqs} />
        </div>
      </Section>
    </>
  )
}
