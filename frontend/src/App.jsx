import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { useApp } from './store/AppContext.jsx'
import { useAuth } from './store/AuthContext.jsx'

import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import VerifyOtp from './pages/auth/VerifyOtp.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'

import Discover from './pages/student/Discover.jsx'
import InstructorProfile from './pages/student/InstructorProfile.jsx'
import GroupClasses from './pages/student/GroupClasses.jsx'
import MyBookings from './pages/student/MyBookings.jsx'
import Schedule from './pages/student/Schedule.jsx'
import Subjects from './pages/student/Subjects.jsx'

import InstructorDashboard from './pages/instructor/Dashboard.jsx'
import Requests from './pages/instructor/Requests.jsx'
import Slots from './pages/instructor/Slots.jsx'
import Classes from './pages/instructor/Classes.jsx'
import Modules from './pages/instructor/Modules.jsx'
import Reviews from './pages/instructor/Reviews.jsx'

import Overview from './pages/admin/Overview.jsx'
import Catalogue from './pages/admin/Catalogue.jsx'
import Instructors from './pages/admin/Instructors.jsx'
import Payments from './pages/admin/Payments.jsx'

const HOME = { student: '/discover', instructor: '/teach', admin: '/admin' }

/** Keeps a deep link from rendering a page the current role has no data for. */
function Only({ role, children }) {
  const { session } = useApp()
  return session.role === role ? children : <Navigate to={HOME[session.role]} replace />
}

/** Public routes shown while signed out. */
function GuestRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<VerifyOtp />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
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
      <Routes>
        <Route path="/" element={<Navigate to={home} replace />} />

        {/* student */}
        <Route path="/discover" element={<Discover />} />
        <Route path="/instructor/:id" element={<InstructorProfile />} />
        <Route path="/classes" element={<GroupClasses />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/schedule" element={<Schedule />} />

        {/* instructor */}
        <Route path="/teach" element={<Only role="instructor"><InstructorDashboard /></Only>} />
        <Route path="/teach/requests" element={<Only role="instructor"><Requests /></Only>} />
        <Route path="/teach/slots" element={<Only role="instructor"><Slots /></Only>} />
        <Route path="/teach/classes" element={<Only role="instructor"><Classes /></Only>} />
        <Route path="/teach/modules" element={<Only role="instructor"><Modules /></Only>} />
        <Route path="/teach/reviews" element={<Only role="instructor"><Reviews /></Only>} />

        {/* admin */}
        <Route path="/admin" element={<Only role="admin"><Overview /></Only>} />
        <Route path="/admin/catalogue" element={<Only role="admin"><Catalogue /></Only>} />
        <Route path="/admin/instructors" element={<Only role="admin"><Instructors /></Only>} />
        <Route path="/admin/payments" element={<Only role="admin"><Payments /></Only>} />

        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const { status, role } = useAuth()

  // Restoring an existing session — hold the UI to avoid an auth flash.
  if (status === 'loading') return <Spinner />

  // Not signed in → only the auth screens are reachable.
  if (status !== 'authed') return <GuestRoutes />

  return <AuthedApp role={role} />
}
