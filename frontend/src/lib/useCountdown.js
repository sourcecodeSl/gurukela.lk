import { useEffect, useMemo, useState } from 'react'

/**
 * Live countdown driven by a server-computed `secondsLeft` value (avoids
 * parsing DB datetime strings on the client, which have no timezone and would
 * otherwise be read as local time). Re-anchors whenever `secondsLeft` changes
 * — e.g. each poll refresh — so it stays in sync with the server clock.
 * Returns whole seconds remaining, ticking down to 0.
 */
export function useCountdown(secondsLeft) {
  // Anchor an absolute target the moment we receive a fresh server value.
  const target = useMemo(
    () => (secondsLeft != null && secondsLeft >= 0 ? Date.now() + secondsLeft * 1000 : 0),
    [secondsLeft]
  )
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
