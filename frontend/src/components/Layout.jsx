import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import { useTheme } from '../theme/ThemeContext.jsx'
import ThemePanel from './ThemePanel.jsx'
import { Avatar, Toasts } from './ui.jsx'
import {
  Compass, Users, Calendar, Clock, Ticket, Layers, Grid, Palette, Inbox,
  Menu, Sun, Moon, Book, Award, Money, Refresh, ChevronDown,
} from './icons.jsx'

/** Nav definition per role — keeps the sidebar declarative. */
const NAV = {
  student: [
    { label: 'Learn', items: [
      { to: '/discover', icon: Compass, text: 'Find Instructors' },
      { to: '/classes', icon: Users, text: 'Group Classes' },
      { to: '/subjects', icon: Layers, text: 'Subjects' },
    ]},
    { label: 'Me', items: [
      { to: '/bookings', icon: Ticket, text: 'My Bookings', badge: 'studentPending' },
      { to: '/schedule', icon: Calendar, text: 'My Schedule' },
    ]},
  ],
  instructor: [
    { label: 'Teaching', items: [
      { to: '/teach', icon: Grid, text: 'Dashboard' },
      { to: '/teach/requests', icon: Inbox, text: 'Slot Requests', badge: 'instructorPending' },
      { to: '/teach/slots', icon: Clock, text: 'My Free Slots' },
      { to: '/teach/classes', icon: Users, text: 'Group Classes' },
    ]},
    { label: 'Profile', items: [
      { to: '/teach/modules', icon: Book, text: 'My Modules' },
      { to: '/teach/reviews', icon: Award, text: 'Reviews' },
    ]},
  ],
  admin: [
    { label: 'Platform', items: [
      { to: '/admin', icon: Grid, text: 'Overview' },
      { to: '/admin/catalogue', icon: Layers, text: 'Subjects & Modules' },
      { to: '/admin/instructors', icon: Users, text: 'Instructors' },
      { to: '/admin/payments', icon: Money, text: 'Payments' },
    ]},
  ],
}

const HOME = { student: '/discover', instructor: '/teach', admin: '/admin' }

const ROLE_LABEL = { student: 'Student', instructor: 'Instructor', admin: 'Administrator' }

export default function Layout({ children }) {
  const app = useApp()
  const { theme, isDark, set } = useTheme()
  const [themeOpen, setThemeOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const { role } = app.session

  const badges = {
    instructorPending: app
      .requestsForInstructor(app.session.id)
      .filter((r) => r.status === 'pending').length,
    studentPending: app
      .requestsOfStudent(app.session.id)
      .filter((r) => r.status === 'accepted').length,
  }

  const title =
    NAV[role].flatMap((g) => g.items).find((i) => i.to === pathname)?.text ||
    (pathname.startsWith('/instructor/') ? 'Instructor profile' : 'EduLink')

  return (
    <div className="shell">
      {navOpen && <div className="scrim only-mobile" onClick={() => setNavOpen(false)} />}

      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">EL</div>
          <div>
            <div className="brand-name">EduLink</div>
            <div className="brand-sub">Learning platform</div>
          </div>
        </div>

        {/* signed-in identity */}
        <div style={{ padding: '0 12px 8px' }}>
          <div className="btn btn-outline btn-block" style={{ justifyContent: 'flex-start', cursor: 'default' }}>
            <span className="row" style={{ gap: 9 }}>
              <Avatar name={app.me?.name || 'User'} hue={app.me?.hue ?? theme.hue} size={24} />
              <span className="col" style={{ alignItems: 'flex-start', lineHeight: 1.2 }}>
                <span style={{ fontSize: 12.5 }}>{app.me?.name || app.user?.email || 'User'}</span>
                <span className="tiny faint" style={{ fontWeight: 500 }}>{ROLE_LABEL[role]}</span>
              </span>
            </span>
          </div>
        </div>

        <nav className="nav">
          {NAV[role].map((group) => (
            <div key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/teach' || item.to === '/admin'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setNavOpen(false)}
                >
                  <item.icon className="ico" />
                  <span>{item.text}</span>
                  {item.badge && badges[item.badge] > 0 && (
                    <span className="count">{badges[item.badge]}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <button className="btn btn-ghost btn-block" style={{ justifyContent: 'flex-start' }} onClick={() => setThemeOpen(true)}>
            <Palette width={17} height={17} />
            Customise theme
          </button>
          <button
            className="btn btn-ghost btn-block"
            style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}
            onClick={() => {
              app.logout?.()
              navigate('/login', { replace: true })
            }}
          >
            <Refresh width={17} height={17} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="btn btn-ghost btn-icon only-mobile" onClick={() => setNavOpen(true)} aria-label="Menu">
            <Menu />
          </button>
          <h1>{title}</h1>
          <div className="spacer" />
          <button
            className="btn btn-ghost btn-icon"
            aria-label="Toggle dark mode"
            title={isDark ? 'Switch to light' : 'Switch to dark'}
            onClick={() => set({ mode: isDark ? 'light' : 'dark' })}
          >
            {isDark ? <Sun /> : <Moon />}
          </button>
          <button className="btn btn-ghost btn-icon" aria-label="Theme settings" onClick={() => setThemeOpen(true)}>
            <Palette />
          </button>
          <Avatar name={app.me?.name || 'User'} hue={app.me?.hue ?? theme.hue} size={32} />
        </header>

        <main className="page">{children}</main>
      </div>

      {themeOpen && <ThemePanel onClose={() => setThemeOpen(false)} />}
      <Toasts items={app.toasts} />
    </div>
  )
}
