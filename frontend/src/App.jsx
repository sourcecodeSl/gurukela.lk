import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { PageSkeleton } from './components/ui.jsx'
import { useApp } from './store/AppContext.jsx'
import { useAuth } from './store/AuthContext.jsx'
import { isProfileComplete } from './lib/profile.js'

// Every route below is code-split with React.lazy so the initial download only
// carries the shell + the one page being viewed. A guest never ships the
// admin/instructor pages; a signed-in student never ships the marketing site.
// Suspense shows a page-shaped skeleton while each chunk streams in.
const SiteRoutes = lazy(() => import('./site/SiteRoutes.jsx'))

const Discover = lazy(() => import('./pages/student/Discover.jsx'))
const InstructorProfile = lazy(() => import('./pages/student/InstructorProfile.jsx'))
const GroupClasses = lazy(() => import('./pages/student/GroupClasses.jsx'))
const StudentSeminars = lazy(() => import('./pages/student/Seminars.jsx'))
const MyBookings = lazy(() => import('./pages/student/MyBookings.jsx'))
const Schedule = lazy(() => import('./pages/student/Schedule.jsx'))
const Subjects = lazy(() => import('./pages/student/Subjects.jsx'))
const StudentMaterials = lazy(() => import('./pages/student/Materials.jsx'))
const StudentProfile = lazy(() => import('./pages/student/Profile.jsx'))
const StudentPayments = lazy(() => import('./pages/student/Payments.jsx'))
const PayReturn = lazy(() => import('./pages/student/PayReturn.jsx'))

const InstructorDashboard = lazy(() => import('./pages/instructor/Dashboard.jsx'))
const Requests = lazy(() => import('./pages/instructor/Requests.jsx'))
const Slots = lazy(() => import('./pages/instructor/Slots.jsx'))
const Classes = lazy(() => import('./pages/instructor/Classes.jsx'))
const InstructorSeminars = lazy(() => import('./pages/instructor/Seminars.jsx'))
const Modules = lazy(() => import('./pages/instructor/Modules.jsx'))
const Curriculum = lazy(() => import('./pages/instructor/Curriculum.jsx'))
const Lessons = lazy(() => import('./pages/instructor/Lessons.jsx'))
const InstructorMaterials = lazy(() => import('./pages/instructor/Materials.jsx'))
const Reviews = lazy(() => import('./pages/instructor/Reviews.jsx'))
const Profile = lazy(() => import('./pages/instructor/Profile.jsx'))
const InstructorQuestionBanks = lazy(() => import('./pages/instructor/QuestionBanks.jsx'))

const Overview = lazy(() => import('./pages/admin/Overview.jsx'))
const AdminQuestionBanks = lazy(() => import('./pages/admin/QuestionBanks.jsx'))
const Catalogue = lazy(() => import('./pages/admin/Catalogue.jsx'))
const Instructors = lazy(() => import('./pages/admin/Instructors.jsx'))
const InstructorDetail = lazy(() => import('./pages/admin/InstructorDetail.jsx'))
const Payments = lazy(() => import('./pages/admin/Payments.jsx'))
const PayMethods = lazy(() => import('./pages/admin/PayMethods.jsx'))
const Ads = lazy(() => import('./pages/admin/Ads.jsx'))

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
  return (
    <Suspense fallback={<Spinner />}>
      <SiteRoutes />
    </Suspense>
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

  // First data load — render the app shell with a content skeleton so every
  // route shows a page-shaped placeholder instead of a bare centered spinner.
  if (!ready) {
    return (
      <Layout>
        <PageSkeleton />
      </Layout>
    )
  }

  const home = HOME[role] || '/discover'

  return (
    <Layout>
      <RequireProfile>
      <Suspense fallback={<PageSkeleton />}>
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
        <Route path="/payments" element={<Only role="student"><StudentPayments /></Only>} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/profile" element={<StudentProfile />} />

        {/* instructor */}
        <Route path="/teach" element={<Only role="instructor"><InstructorDashboard /></Only>} />
        <Route path="/teach/requests" element={<Only role="instructor"><Requests /></Only>} />
        <Route path="/teach/slots" element={<Only role="instructor"><Slots /></Only>} />
        <Route path="/teach/classes" element={<Only role="instructor"><Classes /></Only>} />
        <Route path="/teach/seminars" element={<Only role="instructor"><InstructorSeminars /></Only>} />
        <Route path="/teach/modules" element={<Only role="instructor"><Modules /></Only>} />
        <Route path="/teach/subject-lessons" element={<Only role="instructor"><Curriculum /></Only>} />
        <Route path="/teach/lessons" element={<Only role="instructor"><Lessons /></Only>} />
        <Route path="/teach/materials" element={<Only role="instructor"><InstructorMaterials /></Only>} />
        <Route path="/teach/mcq-banks" element={<Only role="instructor"><InstructorQuestionBanks /></Only>} />
        <Route path="/teach/reviews" element={<Only role="instructor"><Reviews /></Only>} />
        <Route path="/teach/profile" element={<Only role="instructor"><Profile /></Only>} />

        {/* admin */}
        <Route path="/admin" element={<Only role="admin"><Overview /></Only>} />
        <Route path="/admin/catalogue" element={<Only role="admin"><Catalogue /></Only>} />
        <Route path="/admin/instructors" element={<Only role="admin"><Instructors /></Only>} />
        <Route path="/admin/instructors/:id" element={<Only role="admin"><InstructorDetail /></Only>} />
        <Route path="/admin/payments" element={<Only role="admin"><Payments /></Only>} />
        <Route path="/admin/pay-methods" element={<Only role="admin"><PayMethods /></Only>} />
        <Route path="/admin/ads" element={<Only role="admin"><Ads /></Only>} />
        <Route path="/admin/mcq-banks" element={<Only role="admin"><AdminQuestionBanks /></Only>} />

        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
      </Suspense>
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
