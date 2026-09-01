import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { useApp } from './store/AppContext.jsx'

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

export default function App() {
  const { session } = useApp()
  const home = HOME[session.role]

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
