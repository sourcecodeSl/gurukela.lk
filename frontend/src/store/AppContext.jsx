import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'

/**
 * Application data store — backed entirely by the backend API.
 * There is no mock/seed data: everything here is fetched from MySQL through
 * the Express endpoints. `dispatch` maps each UI action to an API call and
 * then reloads the affected data so derived counts stay correct.
 */

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 9)}`

const EMPTY = {
  subjects: [],
  modules: [],
  instructors: [],
  students: [],
  reviews: [],
  slots: [],
  slotRequests: [],
  groupClasses: [],
  enrollments: [],
  payments: [],
}

/** Build a students lookup for non-admin roles from names embedded in payloads. */
function synthesizeStudents(reviews, requests, enrollments, meProfile) {
  const map = {}
  const add = (id, name, hue) => {
    if (id && !map[id]) map[id] = { id, name: name || 'Student', hue: hue ?? 205 }
  }
  reviews.forEach((r) => add(r.studentId, r.studentName, r.studentHue))
  requests.forEach((r) => add(r.studentId, r.studentName, r.studentHue))
  enrollments.forEach((e) => add(e.studentId, e.studentName, e.studentHue))
  if (meProfile) add(meProfile.id, meProfile.name, meProfile.hue)
  return Object.values(map)
}

/** Map a UI action to a REST call. Returns { m, p, b } or null. */
function resolveAction(action) {
  const id = action.id
  switch (action.type) {
    case 'subject/add': return { m: 'post', p: '/subjects', b: action.payload }
    case 'subject/update': return { m: 'put', p: `/subjects/${id}`, b: action.payload }
    case 'subject/remove': return { m: 'del', p: `/subjects/${id}` }
    case 'module/add': return { m: 'post', p: '/modules', b: action.payload }
    case 'module/update': return { m: 'put', p: `/modules/${id}`, b: action.payload }
    case 'module/remove': return { m: 'del', p: `/modules/${id}` }
    case 'instructor/setModules': return { m: 'put', p: `/instructors/${id}/modules`, b: { moduleIds: action.moduleIds } }
    case 'instructor/verify': return { m: 'patch', p: `/admin/instructors/${id}/verification`, b: { action: action.verified ? 'verify' : 'revoke' } }
    case 'slot/add': return { m: 'post', p: '/slots', b: action.payload }
    case 'slot/remove': return { m: 'del', p: `/slots/${id}` }
    case 'request/create': return { m: 'post', p: '/slot-requests', b: action.payload }
    case 'request/withdraw': return { m: 'del', p: `/slot-requests/${id}` }
    case 'request/accept': return { m: 'post', p: `/slot-requests/${id}/accept` }
    case 'request/reject': return { m: 'post', p: `/slot-requests/${id}/reject` }
    case 'request/pay': return { m: 'post', p: `/slot-requests/${id}/pay`, b: { method: action.method } }
    case 'group/add': return { m: 'post', p: '/group-classes', b: action.payload }
    case 'group/update': return { m: 'put', p: `/group-classes/${id}`, b: action.payload }
    case 'group/remove': return { m: 'del', p: `/group-classes/${id}` }
    case 'group/join': return { m: 'post', p: `/group-classes/${id}/join`, b: { method: action.method } }
    case 'review/add': return { m: 'post', p: '/reviews', b: action.payload }
    default: return null
  }
}

export function AppProvider({ children }) {
  const auth = useAuth()
  const [state, setState] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false) // first data load finished
  const [toasts, setToasts] = useState([])
  const timers = useRef([])

  const session = useMemo(
    () => ({ role: auth.role || 'student', id: auth.profileId || auth.user?.id || null }),
    [auth.role, auth.profileId, auth.user]
  )

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const toast = useCallback((message, kind = 'ok') => {
    const id = uid('t')
    setToasts((t) => [...t, { id, message, kind }])
    timers.current.push(setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200))
  }, [])

  /* ------------------------- data loading ------------------------- */
  const loadAll = useCallback(async () => {
    if (auth.status !== 'authed') return
    const role = auth.role
    const pid = auth.profileId
    if ((role === 'student' || role === 'instructor') && !pid) return // profile not ready yet

    setLoading(true)
    try {
      const [subjects, modules, groupClasses, reviews, slots] = await Promise.all([
        api.get('/subjects'),
        api.get('/modules'),
        api.get('/group-classes'),
        api.get('/reviews'),
        api.get('/slots'),
      ])

      let instructors, students, slotRequests, enrollments, payments
      if (role === 'admin') {
        ;[instructors, students, slotRequests, enrollments, payments] = await Promise.all([
          api.get('/admin/instructors'),
          api.get('/admin/students'),
          api.get('/slot-requests'),
          api.get('/admin/enrollments'),
          api.get('/admin/payments'),
        ])
      } else {
        ;[instructors, slotRequests] = await Promise.all([
          api.get('/instructors'),
          api.get('/slot-requests'),
        ])
        enrollments =
          role === 'student'
            ? await api.get(`/students/${pid}/enrollments`)
            : await api.get(`/instructors/${pid}/enrollments`)
        payments = []
        // Ensure the signed-in instructor's own record is present for lookups.
        if (role === 'instructor' && auth.profile && !instructors.some((i) => i.id === auth.profile.id)) {
          instructors = [auth.profile, ...instructors]
        }
        students = synthesizeStudents(
          reviews,
          slotRequests,
          enrollments,
          role === 'student' ? auth.profile : null
        )
      }

      setState({
        subjects, modules, instructors, students, reviews,
        slots, slotRequests, groupClasses, enrollments, payments,
      })
    } catch (e) {
      toast(e.message || 'Failed to load data', 'err')
    } finally {
      setLoading(false)
      setReady(true)
    }
  }, [auth.status, auth.role, auth.profileId, auth.profile, toast])

  useEffect(() => {
    if (auth.status === 'authed') loadAll()
    else {
      setState(EMPTY)
      setReady(false)
    }
  }, [auth.status, loadAll])

  /* ------------------------- actions ------------------------- */
  const dispatch = useCallback(
    async (action) => {
      const r = resolveAction(action)
      if (!r) return
      try {
        if (r.m === 'del') await api.del(r.p)
        else await api[r.m](r.p, r.b)
        await loadAll()
      } catch (e) {
        toast(e.message || 'Action failed', 'err')
        throw e
      }
    },
    [loadAll, toast]
  )

  /* ------------------------- derived lookups ------------------------- */
  const helpers = useMemo(() => {
    const moduleById = Object.fromEntries(state.modules.map((m) => [m.id, m]))
    const subjectById = Object.fromEntries(state.subjects.map((s) => [s.id, s]))
    const instructorById = Object.fromEntries(state.instructors.map((i) => [i.id, i]))
    const studentById = Object.fromEntries(state.students.map((s) => [s.id, s]))
    const classById = Object.fromEntries(state.groupClasses.map((g) => [g.id, g]))
    const slotById = Object.fromEntries(state.slots.map((s) => [s.id, s]))

    return {
      moduleById,
      subjectById,
      instructorById,
      studentById,
      classById,
      slotById,
      subjectOf: (moduleId) => subjectById[moduleById[moduleId]?.subjectId],
      modulesOf: (instructorId) =>
        (instructorById[instructorId]?.moduleIds || []).map((id) => moduleById[id]).filter(Boolean),
      subjectsOf: (instructorId) => {
        const ids = new Set(
          (instructorById[instructorId]?.moduleIds || [])
            .map((id) => moduleById[id]?.subjectId)
            .filter(Boolean)
        )
        return [...ids].map((id) => subjectById[id]).filter(Boolean)
      },
      reviewsOf: (instructorId) => state.reviews.filter((r) => r.instructorId === instructorId),
      slotsOf: (instructorId) => state.slots.filter((s) => s.instructorId === instructorId),
      classesOf: (instructorId) => state.groupClasses.filter((g) => g.instructorId === instructorId),
      requestsForInstructor: (instructorId) =>
        state.slotRequests.filter((r) => slotById[r.slotId]?.instructorId === instructorId),
      requestsOfStudent: (studentId) => state.slotRequests.filter((r) => r.studentId === studentId),
      enrollmentsOf: (studentId) => state.enrollments.filter((e) => e.studentId === studentId),

      /**
       * Review gate: the student must have paid for this instructor and
       * have been studying with them for at least 30 days.
       */
      reviewEligibility: (studentId, instructorId) => {
        const relevant = state.enrollments.filter((e) => {
          if (e.studentId !== studentId) return false
          if (e.type === 'group') return classById[e.refId]?.instructorId === instructorId
          return slotById[e.refId]?.instructorId === instructorId
        })
        if (!relevant.length) return { eligible: false, reason: 'not-enrolled', days: 0 }

        const earliest = relevant.reduce(
          (min, e) => Math.min(min, new Date(e.startedAt).getTime()),
          Infinity
        )
        const days = Math.floor((Date.now() - earliest) / 86400000)
        const already = state.reviews.some(
          (r) => r.studentId === studentId && r.instructorId === instructorId
        )
        if (already) return { eligible: false, reason: 'already-reviewed', days }
        if (days < 30) return { eligible: false, reason: 'too-early', days, daysLeft: 30 - days }
        return { eligible: true, reason: 'ok', days }
      },
    }
  }, [state])

  const value = useMemo(
    () => ({
      ...state,
      loading,
      ready,
      dispatch,
      refresh: loadAll,
      session,
      me:
        session.role === 'instructor'
          ? helpers.instructorById[session.id] || auth.profile
          : session.role === 'student'
            ? helpers.studentById[session.id] || auth.profile
            : { id: 'adm-1', name: 'Platform Admin', hue: 245, email: auth.user?.email },
      user: auth.user,
      logout: auth.logout,
      toast,
      toasts,
      ...helpers,
    }),
    [state, loading, ready, dispatch, loadAll, session, helpers, toast, toasts, auth.profile, auth.user, auth.logout]
  )

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
