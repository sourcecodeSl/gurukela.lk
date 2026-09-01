import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import seed from '../data/seed.js'

/**
 * Single in-memory store standing in for the backend.
 *
 * Reducer actions mirror the API calls the Node backend will eventually
 * expose, so wiring the real thing up later is a swap inside `actions`,
 * not a rewrite of the pages.
 */

const STORAGE_KEY = 'edulink.data.v1'
const SESSION_KEY = 'edulink.session'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 9)}`
const nowIso = () => new Date().toISOString()

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* corrupt payload — fall through to a clean seed */
  }
  return structuredClone(seed)
}

function reducer(state, action) {
  switch (action.type) {
    /* ---------------- admin: subjects & modules ---------------- */
    case 'subject/add':
      return { ...state, subjects: [...state.subjects, { id: uid('sub'), ...action.payload }] }

    case 'subject/update':
      return {
        ...state,
        subjects: state.subjects.map((s) => (s.id === action.id ? { ...s, ...action.payload } : s)),
      }

    case 'subject/remove':
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.id !== action.id),
        modules: state.modules.filter((m) => m.subjectId !== action.id),
      }

    case 'module/add':
      return { ...state, modules: [...state.modules, { id: uid('mod'), ...action.payload }] }

    case 'module/update':
      return {
        ...state,
        modules: state.modules.map((m) => (m.id === action.id ? { ...m, ...action.payload } : m)),
      }

    case 'module/remove':
      return {
        ...state,
        modules: state.modules.filter((m) => m.id !== action.id),
        instructors: state.instructors.map((i) => ({
          ...i,
          moduleIds: i.moduleIds.filter((id) => id !== action.id),
        })),
      }

    /* ---------------- instructor: taught modules ---------------- */
    case 'instructor/setModules':
      return {
        ...state,
        instructors: state.instructors.map((i) =>
          i.id === action.id ? { ...i, moduleIds: action.moduleIds } : i
        ),
      }

    case 'instructor/verify':
      return {
        ...state,
        instructors: state.instructors.map((i) =>
          i.id === action.id ? { ...i, verified: action.verified } : i
        ),
      }

    /* ---------------- instructor: free slots ---------------- */
    case 'slot/add':
      return {
        ...state,
        slots: [...state.slots, { id: uid('slt'), status: 'open', bookedBy: null, ...action.payload }],
      }

    case 'slot/remove':
      return {
        ...state,
        slots: state.slots.filter((s) => s.id !== action.id),
        slotRequests: state.slotRequests.filter((r) => r.slotId !== action.id),
      }

    /* ---------------- student: request a free slot ---------------- */
    case 'request/create':
      return {
        ...state,
        slotRequests: [
          ...state.slotRequests,
          { id: uid('req'), status: 'pending', createdAt: nowIso(), ...action.payload },
        ],
      }

    case 'request/withdraw':
      return { ...state, slotRequests: state.slotRequests.filter((r) => r.id !== action.id) }

    /* ---------------- instructor: accept / reject ---------------- */
    case 'request/accept':
      return {
        ...state,
        slotRequests: state.slotRequests.map((r) =>
          r.id === action.id ? { ...r, status: 'accepted', acceptedAt: nowIso() } : r
        ),
      }

    case 'request/reject':
      return {
        ...state,
        slotRequests: state.slotRequests.map((r) =>
          r.id === action.id ? { ...r, status: 'rejected', rejectedAt: nowIso() } : r
        ),
      }

    /* ----------------------------------------------------------------
       Payment for an accepted slot request.
       First paid request wins the slot; every other accepted request on
       that same slot is closed as `lost`.
       ---------------------------------------------------------------- */
    case 'request/pay': {
      const req = state.slotRequests.find((r) => r.id === action.id)
      if (!req) return state
      const slot = state.slots.find((s) => s.id === req.slotId)
      if (!slot || slot.status === 'booked') return state

      const enrollment = {
        id: uid('enr'),
        type: 'slot',
        refId: slot.id,
        requestId: req.id,
        studentId: req.studentId,
        paidAt: nowIso(),
        startedAt: nowIso(),
        amount: slot.price,
      }

      return {
        ...state,
        slots: state.slots.map((s) =>
          s.id === slot.id ? { ...s, status: 'booked', bookedBy: req.studentId } : s
        ),
        slotRequests: state.slotRequests.map((r) => {
          if (r.id === req.id) return { ...r, status: 'paid', paidAt: nowIso() }
          if (r.slotId === req.slotId && (r.status === 'accepted' || r.status === 'pending'))
            return { ...r, status: 'lost' }
          return r
        }),
        enrollments: [...state.enrollments, enrollment],
        payments: [
          ...state.payments,
          {
            id: uid('pay'),
            enrollmentId: enrollment.id,
            studentId: req.studentId,
            amount: slot.price,
            method: action.method || 'card',
            status: 'success',
            at: nowIso(),
          },
        ],
      }
    }

    /* ---------------- group classes ---------------- */
    case 'group/add':
      return { ...state, groupClasses: [...state.groupClasses, { id: uid('grp'), enrolled: 0, ...action.payload }] }

    case 'group/update':
      return {
        ...state,
        groupClasses: state.groupClasses.map((g) => (g.id === action.id ? { ...g, ...action.payload } : g)),
      }

    case 'group/remove':
      return { ...state, groupClasses: state.groupClasses.filter((g) => g.id !== action.id) }

    case 'group/join': {
      const cls = state.groupClasses.find((g) => g.id === action.id)
      if (!cls || cls.enrolled >= cls.seats) return state
      const already = state.enrollments.some(
        (e) => e.type === 'group' && e.refId === cls.id && e.studentId === action.studentId
      )
      if (already) return state

      const enrollment = {
        id: uid('enr'),
        type: 'group',
        refId: cls.id,
        studentId: action.studentId,
        paidAt: nowIso(),
        startedAt: nowIso(),
        amount: cls.price,
      }
      return {
        ...state,
        groupClasses: state.groupClasses.map((g) =>
          g.id === cls.id ? { ...g, enrolled: g.enrolled + 1 } : g
        ),
        enrollments: [...state.enrollments, enrollment],
        payments: [
          ...state.payments,
          {
            id: uid('pay'),
            enrollmentId: enrollment.id,
            studentId: action.studentId,
            amount: cls.price,
            method: action.method || 'card',
            status: 'success',
            at: nowIso(),
          },
        ],
      }
    }

    /* ---------------- reviews ---------------- */
    case 'review/add':
      return {
        ...state,
        reviews: [
          { id: uid('rev'), createdAt: nowIso(), verified: true, ...action.payload },
          ...state.reviews,
        ],
        instructors: state.instructors.map((i) => {
          if (i.id !== action.payload.instructorId) return i
          const total = i.rating * i.reviewCount + action.payload.rating
          const count = i.reviewCount + 1
          return { ...i, reviewCount: count, rating: Math.round((total / count) * 10) / 10 }
        }),
      }

    case 'data/reset':
      return structuredClone(seed)

    default:
      return state
  }
}

/** The three demo identities the role switcher moves between. */
const SESSIONS = {
  student: { role: 'student', id: 'std-1' },
  instructor: { role: 'instructor', id: 'ins-1' },
  admin: { role: 'admin', id: 'adm-1' },
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY)) || SESSIONS.student
    } catch {
      return SESSIONS.student
    }
  })
  const [toasts, setToasts] = useState([])
  const timers = useRef([])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }, [session])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const toast = useCallback((message, kind = 'ok') => {
    const id = uid('t')
    setToasts((t) => [...t, { id, message, kind }])
    timers.current.push(setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200))
  }, [])

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
      dispatch,
      session,
      setSession,
      switchRole: (role) => setSession(SESSIONS[role] || SESSIONS.student),
      me:
        session.role === 'instructor'
          ? helpers.instructorById[session.id]
          : session.role === 'student'
            ? helpers.studentById[session.id]
            : { id: 'adm-1', name: 'Platform Admin', hue: 245 },
      toast,
      toasts,
      ...helpers,
    }),
    [state, session, helpers, toast, toasts]
  )

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
