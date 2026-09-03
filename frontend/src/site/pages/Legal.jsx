/**
 * The four policy pages — Terms, Privacy, Refund and LMS Guidelines — share
 * one layout and read their content from `legal` in siteData. A side rail
 * moves between them, matching the footer links on the reference site.
 */

import { Link, NavLink } from 'react-router-dom'
import { Info, Mail, Phone } from '../art/Icons.jsx'
import { PageBanner, Section } from '../components.jsx'
import { contact, legal } from '../siteData.js'

const PAGES = [
  { to: '/terms', key: 'terms', label: 'Terms & Conditions' },
  { to: '/privacy', key: 'privacy', label: 'Privacy Policy' },
  { to: '/refund', key: 'refund', label: 'Refund Policy' },
  { to: '/guidelines', key: 'guidelines', label: 'LMS Guidelines' },
]

export default function Legal({ page }) {
  const doc = legal[page]
  if (!doc) return null

  return (
    <>
      <PageBanner title={doc.title} text={doc.intro} />

      <Section>
        <div className="gk-legal">
          <nav className="gk-legal__nav" aria-label="Policies">
            {PAGES.map((p) => (
              <NavLink key={p.to} to={p.to} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
                {p.label}
              </NavLink>
            ))}
          </nav>

          <article className="gk-legal__body">
            <h2>{doc.title}</h2>
            <p className="gk-legal__updated">Last updated {doc.updated}</p>
            <p className="gk-legal__intro">{doc.intro}</p>

            {doc.sections.map((s) => (
              <section className="gk-legal__section" key={s.heading}>
                <h3>{s.heading}</h3>
                <ul>
                  {s.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}

            <div className="gk-note" style={{ marginTop: 38 }}>
              <Info size={17} />
              <span>
                Questions about this page? Write to{' '}
                <a href={`mailto:${contact.email}`} className="gk-link">
                  {contact.email}
                </a>{' '}
                or call {contact.phones[0]}. Complaints go to {contact.complaintsLine}.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
              <a href={`tel:${contact.phones[0].replace(/\s/g, '')}`} className="gk-btn gk-btn--ghost gk-btn--sm">
                <Phone size={15} />
                {contact.phones[0]}
              </a>
              <a href={`mailto:${contact.email}`} className="gk-btn gk-btn--ghost gk-btn--sm">
                <Mail size={15} />
                Email us
              </a>
              <Link to="/contact" className="gk-btn gk-btn--ghost gk-btn--sm">
                Contact page
              </Link>
            </div>
          </article>
        </div>
      </Section>
    </>
  )
}
