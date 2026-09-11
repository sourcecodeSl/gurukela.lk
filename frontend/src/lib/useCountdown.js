import { useEffect, useState } from 'react'

/**
 * Seconds remaining until `endsAt` (an ISO string / Date), ticking every second.
 * Returns 0 once elapsed or when `endsAt` is falsy. Used by the live MCQ timer.
 */
export function useCountdown(endsAt) {
  const target = endsAt ? new Date(endsAt).getTime() : 0
  const calc = () => (target ? Math.max(0, Math.round((target - Date.now()) / 1000)) : 0)
  const [left, setLeft] = useState(calc)

  useEffect(() => {
    if (!target) return setLeft(0)
    setLeft(calc())
    const t = setInterval(() => setLeft(calc()), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return left
}

/** Format a seconds count as m:ss (e.g. 615 -> "10:15"). */
export const fmtCountdown = (secs) => {
  const s = Math.max(0, Math.floor(secs))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
