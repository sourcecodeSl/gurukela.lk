/**
 * Floating WhatsApp launcher with a hover-open chat card.
 *
 * Pointing at the button (or tapping it on touch devices) reveals a small
 * WhatsApp-style panel: a greeting bubble, three quick-reply prompts and a
 * message box. Nothing is sent from here — every action hands the visitor to
 * wa.me with the text pre-filled, so a real person answers in WhatsApp.
 */

import { useEffect, useRef, useState } from 'react'
import { WhatsApp } from './art/Icons.jsx'
import { contact, site } from './siteData.js'

/* Bilingual copy — English first, Sinhala after the slash, as on the cards. */
const GREETING =
  'Hi there! 👋 / ආයුබෝවන්! 👋\n' +
  "Tell us what you need and we'll reply as soon as we can. / " +
  'ඔබට අවශ්‍ය දේ අපට කියන්න — අපි හැකි ඉක්මනින් පිළිතුරු දෙන්නෙමු.'

const QUICK_REPLIES = [
  { label: 'Ask a Question / ප්‍රශ්නයක් අසන්න', text: 'Hi, I have a question about your classes.' },
  { label: 'Course Details / පාඨමාලා විස්තර', text: 'Hi, could you send me the course details?' },
  { label: 'Pricing / මිල ගණන්', text: 'Hi, what are the class fees?' },
]

export default function WhatsAppWidget() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const closeTimer = useRef(null)
  const rootRef = useRef(null)

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  // Close on Escape so keyboard users are never trapped in the card.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const hoverCapable = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches

  const cancelClose = () => clearTimeout(closeTimer.current)
  const hoverOpen = () => {
    if (!hoverCapable()) return
    cancelClose()
    setOpen(true)
  }
  const scheduleClose = () => {
    cancelClose()
    if (hoverCapable()) closeTimer.current = setTimeout(() => setOpen(false), 260)
  }

  const send = (text) => {
    const body = (text || '').trim()
    const url = `https://wa.me/${contact.whatsapp}${body ? `?text=${encodeURIComponent(body)}` : ''}`
    window.open(url, '_blank', 'noopener')
    setDraft('')
  }

  return (
    <div
      className={`gk-wa${open ? ' is-open' : ''}`}
      ref={rootRef}
      onMouseEnter={hoverOpen}
      onMouseLeave={scheduleClose}
      onFocus={() => cancelClose()}
      onBlur={(e) => !rootRef.current?.contains(e.relatedTarget) && setOpen(false)}
    >
      {/* ---------- chat card ---------- */}
      <div className="gk-wa__card" role="dialog" aria-label={`Chat with ${site.name} on WhatsApp`} aria-hidden={!open}>
        <div className="gk-wa__head">
          <span className="gk-wa__avatar">
            <WhatsApp size={24} />
          </span>
          <div className="gk-wa__ident">
            <strong>{site.name} Online</strong>
            <span className="gk-wa__status">
              <i aria-hidden="true" />
              Online — typically replies in minutes / ඔන්ලයින් — විනාඩි කිහිපයකින් පිළිතුරු දෙනවා
            </span>
          </div>
          <button type="button" className="gk-wa__x" onClick={() => setOpen(false)} aria-label="Close chat">
            ✕
          </button>
        </div>

        <div className="gk-wa__body">
          <div className="gk-wa__bubble">
            {GREETING.split('\n').map((line) => (
              <p key={line}>{line}</p>
            ))}
            <span className="gk-wa__from">Support Team / සහාය කණ්ඩායම</span>
          </div>

          <div className="gk-wa__quick">
            {QUICK_REPLIES.map((q) => (
              <button type="button" key={q.label} onClick={() => send(q.text)}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <form
          className="gk-wa__compose"
          onSubmit={(e) => {
            e.preventDefault()
            send(draft || 'Hi, I would like some help.')
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message... / පණිවිඩයක් ටයිප් කරන්න"
            aria-label="Message"
          />
          <button type="submit" aria-label="Send on WhatsApp">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z" fill="currentColor" />
            </svg>
          </button>
        </form>
      </div>

      {/* ---------- launcher ---------- */}
      <button
        type="button"
        className="gk-fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Chat with ${site.name} on WhatsApp`}
      >
        <WhatsApp size={26} />
        <span>WhatsApp us</span>
      </button>
    </div>
  )
}
