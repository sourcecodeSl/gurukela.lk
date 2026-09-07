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
import { useLang, LANGS } from './i18n/LanguageContext.jsx'
import './site.css'

const NAV = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/lecturers', key: 'nav.lecturers' },
  { to: '/campaign', key: 'nav.campaign' },
  { to: '/about', key: 'nav.about' },
  { to: '/contact', key: 'nav.contact' },
]

/** English / Sinhala, in the utility bar. */
function LangSwitch() {
  const { lang, setLang, t } = useLang()
  return (
    <div className="gk-lang" role="group" aria-label={t('lang.label')}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          className={`gk-lang__btn${lang === l.id ? ' is-on' : ''}`}
          aria-pressed={lang === l.id}
          lang={l.id}
          title={l.label}
          onClick={() => setLang(l.id)}
        >
          {l.short}
        </button>
      ))}
    </div>
  )
}

export default function SiteLayout({ children }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const cart = useCart()
  const { t, tr, lang } = useLang()

  // Close the mobile drawer and return to the top whenever the route changes.
  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`gk${lang === 'si' ? ' gk--si' : ''}`} lang={lang}>
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
            <span className="gk-topbar__item">{tr(contact.hours)}</span>
            <LangSwitch />
          </div>
        </div>
      </div>

      {/* ---------- header ---------- */}
      <header className={`gk-header${scrolled ? ' gk-header--scrolled' : ''}`}>
        <div className="gk-wrap">
          <Link to="/" className="gk-brand" aria-label={`${site.name} home`}>
            <Brand size={40} />
          </Link>

          <nav className="gk-nav" aria-label={t('nav.primary')}>
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `gk-nav__link${isActive ? ' is-active' : ''}`}
              >
                {t(n.key)}
              </NavLink>
            ))}
          </nav>

          <div className="gk-header__actions">
            <Link to="/checkout" className="gk-cart" aria-label={`Cart, ${cart.count} items`}>
              <Cart size={17} />
              <span>{t('nav.cart')}</span>
              <span className="gk-cart__count">{cart.count}</span>
            </Link>
            <Link to="/login" className="gk-btn gk-btn--primary gk-btn--sm">
              {t('nav.login')}
            </Link>
            <button
              type="button"
              className="gk-burger"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? t('nav.menu.close') : t('nav.menu.open')}
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
                {t(n.key)}
              </NavLink>
            ))}
            <div className="gk-mobile__actions">
              <Link to="/login" className="gk-btn gk-btn--primary gk-btn--block">
                {t('nav.login')}
              </Link>
              <Link to="/register" className="gk-btn gk-btn--ghost gk-btn--block">
                {t('nav.registerStudent')}
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
              <p className="gk-footer__about">{tr(site.intro)}</p>
            </div>

            <div>
              <h4>{t('footer.academy')}</h4>
              <ul>
                {NAV.map((n) => (
                  <li key={n.to}>
                    <Link to={n.to}>{t(n.key)}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4>{t('footer.streams')}</h4>
              <ul>
                {streams.map((s) => (
                  <li key={s.id}>
                    <Link to={`/lecturers?stream=${s.id}`}>{tr(s.name)}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4>{t('footer.getInTouch')}</h4>
              <ul>
                <li>{tr(contact.address)}</li>
                <li>
                  <a href={`tel:${contact.phones[0].replace(/\s/g, '')}`}>{contact.phones[0]}</a> /{' '}
                  <a href={`tel:${contact.phones[1].replace(/\s/g, '')}`}>{contact.phones[1]}</a>
                </li>
                <li>{t('footer.tuteLine')}: {contact.tuteLine}</li>
                <li>{t('footer.complaints')}: {contact.complaintsLine}</li>
                <li>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="gk-footer__bar">
            <span>
              © {new Date().getFullYear()} {site.name}. {t('footer.rights')}
            </span>
            <nav aria-label={t('footer.legal')}>
              <Link to="/terms">{t('legal.terms')}</Link>
              <Link to="/privacy">{t('legal.privacy')}</Link>
              <Link to="/refund">{t('legal.refund')}</Link>
              <Link to="/guidelines">{t('legal.guidelines')}</Link>
            </nav>
          </div>
        </div>
      </footer>

      <WhatsAppWidget />
    </div>
  )
}
