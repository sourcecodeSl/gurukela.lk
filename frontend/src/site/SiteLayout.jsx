/**
 * Public site shell: utility bar, sticky header, footer and the floating
 * WhatsApp widget. Wraps every marketing page.
 */

import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Brand, { Mark } from './art/Brand.jsx'
import Skyline from './art/Skyline.jsx'
import { Cart, Close, Mail, Menu, Phone } from './art/Icons.jsx'
import { useCart } from './CartContext.jsx'
import WhatsAppWidget from './WhatsAppWidget.jsx'
import { contact, site, streams } from './siteData.js'
import './site.css'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/lecturers', label: 'Our Lecturers' },
  { to: '/campaign', label: 'Campaign' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
]

export default function SiteLayout({ children }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname, search } = useLocation()
  const cart = useCart()

  // Close the mobile drawer and return to the top whenever the route changes.
  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [pathname, search])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="gk">
      {/* ---------- utility bar ---------- */}
      <div className="gk-topbar">
        <div className="gk-wrap">
          <div className="gk-topbar__items">
            <a className="gk-topbar__item" href={`tel:${contact.phones[0].replace(/\s/g, '')}`}>
              <Phone size={14} />
              {contact.phones[0]} / {contact.phones[1]}
            </a>
            <a className="gk-topbar__item" href={`mailto:${contact.email}`}>
              <Mail size={14} />
              {contact.email}
            </a>
          </div>
          <div className="gk-topbar__items">
            <span className="gk-topbar__item">{contact.hours}</span>
          </div>
        </div>
      </div>

      {/* ---------- header ---------- */}
      <header className={`gk-header${scrolled ? ' gk-header--scrolled' : ''}`}>
        <div className="gk-wrap">
          <Link to="/" className="gk-brand" aria-label={`${site.name} home`}>
            <Brand size={40} />
          </Link>

          <nav className="gk-nav" aria-label="Primary">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `gk-nav__link${isActive ? ' is-active' : ''}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="gk-header__actions">
            <Link to="/checkout" className="gk-cart" aria-label={`Cart, ${cart.count} items`}>
              <Cart size={17} />
              <span>Cart</span>
              <span className="gk-cart__count">{cart.count}</span>
            </Link>
            <Link to="/login" className="gk-btn gk-btn--primary gk-btn--sm">
              Login
            </Link>
            <button
              type="button"
              className="gk-burger"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <Close size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ---------- mobile drawer ---------- */}
        <div className={`gk-mobile${open ? ' is-open' : ''}`}>
          <div className="gk-wrap">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `gk-mobile__link${isActive ? ' is-active' : ''}`}
              >
                {n.label}
              </NavLink>
            ))}
            <div className="gk-mobile__actions">
              <Link to="/login" className="gk-btn gk-btn--primary gk-btn--block">
                Login
              </Link>
              <Link to="/register" className="gk-btn gk-btn--ghost gk-btn--block">
                Register as a student
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="gk-main">{children}</main>

      {/* ---------- footer ---------- */}
      <footer className="gk-footer">
        <Skyline />
        <div className="gk-wrap">
          <div className="gk-footer__grid">
            <div>
              <span className="gk-brand">
                <Mark size={40} on="dark" />
                <span className="gk-brand__text">
                  <span className="gk-brand__name">Gurukela</span>
                  <span className="gk-brand__sub">Online Academy</span>
                </span>
              </span>
              <p className="gk-footer__about">{site.intro}</p>
            </div>

            <div>
              <h4>Academy</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/lecturers">Our Lecturers</Link></li>
                <li><Link to="/campaign">Campaign</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4>Streams</h4>
              <ul>
                {streams.map((s) => (
                  <li key={s.id}>
                    <Link to={`/lecturers?stream=${s.id}`}>{s.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Get in touch</h4>
              <ul>
                <li>{contact.address}</li>
                <li>
                  <a href={`tel:${contact.phones[0].replace(/\s/g, '')}`}>{contact.phones[0]}</a> /{' '}
                  <a href={`tel:${contact.phones[1].replace(/\s/g, '')}`}>{contact.phones[1]}</a>
                </li>
                <li>Tutes &amp; technical: {contact.tuteLine}</li>
                <li>Complaints: {contact.complaintsLine}</li>
                <li>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="gk-footer__bar">
            <span>
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </span>
            <nav aria-label="Legal">
              <Link to="/terms">Terms &amp; Conditions</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/refund">Refund Policy</Link>
              <Link to="/guidelines">LMS Guidelines</Link>
            </nav>
          </div>
        </div>
      </footer>

      <WhatsAppWidget />
    </div>
  )
}
