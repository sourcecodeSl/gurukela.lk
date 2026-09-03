import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, tokenStore, setUnauthorizedHandler } from '../api/client.js'

/**
 * Owns the authenticated identity: JWT token, the user record and their
 * profile (instructor/student). The token is the single source of access;
 * every guarded route and API call depends on it.
 *
 * status: 'loading' (restoring session) | 'authed' | 'guest'
 */
const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [status, setStatus] = useState(() => (tokenStore.get() ? 'loading' : 'guest'))
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  const applySession = useCallback((token, nextUser, nextProfile) => {
    if (token) tokenStore.set(token)
    setUser(nextUser)
    setProfile(nextProfile ?? null)
    setStatus('authed')
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setProfile(null)
    setStatus('guest')
  }, [])

  // A 401 from any call means the token is dead — drop the session.
  useEffect(() => {
    setUnauthorizedHandler(() => logout())
  }, [logout])

  // Restore the session on first load if a token is present.
  useEffect(() => {
    if (!tokenStore.get()) return
    let cancelled = false
    ;(async () => {
      try {
        const { user: u, profile: p } = await api.get('/auth/me')
        if (!cancelled) applySession(null, u, p)
      } catch {
        if (!cancelled) logout()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [applySession, logout])

  /* -------------------------- actions -------------------------- */

  /**
   * `expectRole` lets a caller (the site's Student/Lecturer switch) reject an
   * account of the wrong kind. The check runs *before* the session is applied —
   * once applySession fires, App.jsx has already swapped in the LMS and there is
   * no longer anywhere to show the error.
   */
  const login = useCallback(
    async ({ identifier, password, expectRole }) => {
      const isEmail = identifier.includes('@')
      const body = { password, [isEmail ? 'email' : 'phone']: identifier }
      const res = await api.post('/auth/login', body, { auth: false })

      if (expectRole && res.user.role !== expectRole && res.user.role !== 'admin') {
        const err = new Error('WRONG_ROLE')
        err.actualRole = res.user.role
        throw err
      }

      applySession(res.token, res.user, null)
      // Pull the full profile in the background.
      try {
        const me = await api.get('/auth/me')
        applySession(null, me.user, me.profile)
      } catch {
        /* profile fetch is best-effort */
      }
      return res.user
    },
    [applySession]
  )

  const registerStudent = useCallback(
    (payload) => api.post('/auth/register/student', payload, { auth: false }),
    []
  )
  const registerInstructor = useCallback(
    (payload) => api.post('/auth/register/instructor', payload, { auth: false }),
    []
  )

  const verifyPhone = useCallback(
    async ({ phone, code }) => {
      const res = await api.post('/auth/verify-phone/confirm', { phone, code }, { auth: false })
      applySession(res.token, res.user, null)
      try {
        const me = await api.get('/auth/me')
        applySession(null, me.user, me.profile)
      } catch {
        /* best-effort */
      }
      return res.user
    },
    [applySession]
  )

  const resendOtp = useCallback(
    (phone) => api.post('/auth/verify-phone/request', { phone }, { auth: false }),
    []
  )
  const forgotPassword = useCallback(
    (phone) => api.post('/auth/forgot-password', { phone }, { auth: false }),
    []
  )
  const resetPassword = useCallback(
    (payload) => api.post('/auth/reset-password', payload, { auth: false }),
    []
  )

  const value = useMemo(
    () => ({
      status,
      user,
      profile,
      role: user?.role || null,
      profileId: profile?.id || null,
      isAuthed: status === 'authed',
      login,
      logout,
      registerStudent,
      registerInstructor,
      verifyPhone,
      resendOtp,
      forgotPassword,
      resetPassword,
      setProfile,
    }),
    [
      status,
      user,
      profile,
      login,
      logout,
      registerStudent,
      registerInstructor,
      verifyPhone,
      resendOtp,
      forgotPassword,
      resetPassword,
    ]
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
