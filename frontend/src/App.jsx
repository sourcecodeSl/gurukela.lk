import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { useApp } from './store/AppContext.jsx'
import { useAuth } from './store/AuthContext.jsx'
import { isProfileComplete } from './lib/profile.js'

import SiteRoutes from './site/SiteRoutes.jsx'

import Discover from './pages/student/Discover.jsx'
import InstructorProfile from './pages/student/InstructorProfile.jsx'
import GroupClasses from './pages/student/GroupClasses.jsx'
import StudentSeminars from './pages/student/Seminars.jsx'
import MyBookings from './pages/student/MyBookings.jsx'
import Schedule from './pages/student/Schedule.jsx'
import Subjects from './pages/student/Subjects.jsx'
import StudentMaterials from './pages/student/Materials.jsx'
import PayReturn from './pages/student/PayReturn.jsx'

import InstructorDashboard from './pages/instructor/Dashboard.jsx'
import Requests from './pages/instructor/Requests.jsx'
import Slots from './pages/instructor/Slots.jsx'
import Classes from './pages/instructor/Classes.jsx'
import InstructorSeminars from './pages/instructor/Seminars.jsx'
import Modules from './pages/instructor/Modules.jsx'
import Lessons from './pages/instructor/Lessons.jsx'
import InstructorMaterials from './pages/instructor/Materials.jsx'
import Reviews from './pages/instructor/Reviews.jsx'
import Profile from './pages/instructor/Profile.jsx'

import Overview from './pages/admin/Overview.jsx'
import Catalogue from './pages/admin/Catalogue.jsx'
import Instructors from './pages/admin/Instructors.jsx'
import Payments from './pages/admin/Payments.jsx'
import Ads from './pages/admin/Ads.jsx'

const HOME = { student: '/discover', instructor: '/teach', admin: '/admin' }

/** Keeps a deep link from rendering a page the current role has no data for. */
function Only({ role, children }) {
  const { session } = useApp()
  return session.role === role ? children : <Navigate to={HOME[session.role]} replace />
}

/**
 * An instructor with an incomplete profile is locked to the profile page until
 * every required field is filled in. Other roles pass through untouched.
 */
function RequireProfile({ children }) {
  const app = useApp()
  const { pathname } = useLocation()
  const locked =
    app.session.role === 'instructor' &&
    !isProfileComplete(app.instructorById[app.session.id])
  if (locked && pathname !== '/teach/profile') return <Navigate to="/teach/profile" replace />
  return children
}

/** The public gurukela.lk website, shown to anyone who is not signed in. */
function GuestRoutes() {
  return <SiteRoutes />
}

function Spinner() {
  return (
    <div className="auth-wrap">
      <div className="spinner" aria-label="Loading" />
    </div>
  )
}

/** The signed-in app. Waits for the first data load so pages never render
 *  against empty collections (which would crash on `me`). */
function AuthedApp({ role }) {
  const { ready } = useApp()
  if (!ready) return <Spinner />

  const home = HOME[role] || '/discover'

  return (
    <Layout>
      <RequireProfile>
      <Routes>
        <Route path="/" element={<Navigate to={home} replace />} />

        {/* student */}
        <Route path="/discover" element={<Discover />} />
        <Route path="/instructor/:id" element={<InstructorProfile />} />
        <Route path="/classes" element={<GroupClasses />} />
        <Route path="/seminars" element={<StudentSeminars />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/materials" element={<StudentMaterials />} />
        <Route path="/pay/return" element={<PayReturn />} />
        <Route path="/pay/cancel" element={<PayReturn cancelled />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/schedule" element={<Schedule />} />

        {/* instructor */}
        <Route path="/teach" element={<Only role="instructor"><InstructorDashboard /></Only>} />
        <Route path="/teach/requests" element={<Only role="instructor"><Requests /></Only>} />
        <Route path="/teach/slots" element={<Only role="instructor"><Slots /></Only>} />
        <Route path="/teach/classes" element={<Only role="instructor"><Classes /></Only>} />
        <Route path="/teach/seminars" element={<Only role="instructor"><InstructorSeminars /></Only>} />
        <Route path="/teach/modules" element={<Only role="instructor"><Modules /></Only>} />
        <Route path="/teach/lessons" element={<Only role="instructor"><Lessons /></Only>} />
        <Route path="/teach/materials" element={<Only role="instructor"><InstructorMaterials /></Only>} />
        <Route path="/teach/reviews" element={<Only role="instructor"><Reviews /></Only>} />
        <Route path="/teach/profile" element={<Only role="instructor"><Profile /></Only>} />

        {/* admin */}
        <Route path="/admin" element={<Only role="admin"><Overview /></Only>} />
        <Route path="/admin/catalogue" element={<Only role="admin"><Catalogue /></Only>} />
        <Route path="/admin/instructors" element={<Only role="admin"><Instructors /></Only>} />
        <Route path="/admin/payments" element={<Only role="admin"><Payments /></Only>} />
        <Route path="/admin/ads" element={<Only role="admin"><Ads /></Only>} />

        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
      </RequireProfile>
    </Layout>
  )
}

export default function App() {
  const { status, role } = useAuth()

  // Restoring an existing session — hold the UI to avoid an auth flash.
  if (status === 'loading') return <Spinner />

  // Not signed in → the public marketing site (and the LMS auth screens).
  if (status !== 'authed') return <GuestRoutes />

  return <AuthedApp role={role} />
}
