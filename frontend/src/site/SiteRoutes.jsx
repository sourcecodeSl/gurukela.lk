/**
 * Every public (signed-out) route, wrapped in the marketing shell.
 *
 * Auth lives here now and talks to the real API: one /login with a
 * Student/Lecturer switch, /register for students, and /lecturer-registration
 * on its own URL. A successful sign-in flips AuthContext to 'authed' and
 * App.jsx replaces this whole tree with the LMS.
 */

import { Link, Route, Routes } from 'react-router-dom'
import SiteLayout from './SiteLayout.jsx'
import { CartProvider } from './CartContext.jsx'
import { PageBanner, Section } from './components.jsx'

import Home from './pages/Home.jsx'
import Lecturers from './pages/Lecturers.jsx'
import LecturerProfile from './pages/LecturerProfile.jsx'
import About from './pages/About.jsx'
import Campaign from './pages/Campaign.jsx'
import Contact from './pages/Contact.jsx'
import Checkout from './pages/Checkout.jsx'
import Legal from './pages/Legal.jsx'
import { Login, Register, LecturerRegister } from './pages/SiteAuth.jsx'

function NotFound() {
  return (
    <>
      <PageBanner title="Page not found" crumb="404" text="That link does not lead anywhere on gurukela.lk." />
      <Section>
        <div className="gk-empty">
          <h3>We could not find that page</h3>
          <p>It may have moved, or the link may be mistyped. Everything is reachable from the home page.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="gk-btn gk-btn--primary">
              Go home
            </Link>
            <Link to="/lecturers" className="gk-btn gk-btn--ghost">
              See the lecturer panel
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}

export default function SiteRoutes() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <CartProvider>
            <SiteLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/lecturers" element={<Lecturers />} />
                <Route path="/lecturers/:id" element={<LecturerProfile />} />
                <Route path="/about" element={<About />} />
                <Route path="/campaign" element={<Campaign />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/checkout" element={<Checkout />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/lecturer-registration" element={<LecturerRegister />} />

                <Route path="/terms" element={<Legal page="terms" />} />
                <Route path="/privacy" element={<Legal page="privacy" />} />
                <Route path="/refund" element={<Legal page="refund" />} />
                <Route path="/guidelines" element={<Legal page="guidelines" />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </SiteLayout>
          </CartProvider>
        }
      />
    </Routes>
  )
}
