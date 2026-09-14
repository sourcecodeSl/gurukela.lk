import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { api } from '../api/client.js'
import { Video } from './icons.jsx'
import ZoomRoom from './ZoomRoom.jsx'

/**
 * Host control for a live teaching session (slot / group class / seminar).
 *
 * With Zoom configured it runs the class in-site: "Start live class" creates the
 * Zoom meeting (once), starts the teaching-hours timer and opens the embedded
 * room as host (only the host can record). Without Zoom it falls back to a plain
 * Start/End that just tracks teaching hours alongside the manual Meet link.
 *
 *   <LiveSessionControl type="slot" refId={slot.id} title="…" />
 */
const pad = (n) => String(n).padStart(2, '0')
const fmtElapsed = (secs) => {
  const s = Math.max(0, Math.floor(secs))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

export default function LiveSessionControl({ type, refId, title, size = 'sm' }) {
  const app = useApp()
  const active = app.liveSessionOf(type, refId)
  const zoom = app.zoomEnabled
  const [extra, setExtra] = useState(0)
  const [busy, setBusy] = useState(false)
  const [roomOpen, setRoomOpen] = useState(false)

  // Tick once a second while a session is open; resets when a new one starts.
  useEffect(() => {
    setExtra(0)
    if (!active) return
    const t = setInterval(() => setExtra((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [active?.id])

  const btn = `btn btn-${size}`

  const startHours = () => app.dispatch({ type: 'live/start', sessionType: type, id: refId })
  const endHours = () => app.dispatch({ type: 'live/end', sessionType: type, id: refId })

  // Zoom flow: ensure the meeting exists, start the timer, open the room.
  const startLiveClass = async () => {
    setBusy(true)
    try {
      await api.post(`/live/${type}/${refId}/meeting`)
      await startHours()
      setRoomOpen(true)
      app.toast('Live class started — you are the host')
    } catch (e) {
      app.toast(e.message || 'Could not start the live class', 'err')
    } finally {
      setBusy(false)
    }
  }

  // Plain hours-only flow (no Zoom configured).
  const start = async () => {
    setBusy(true)
    try {
      await startHours()
      app.toast('Live session started — teaching time is being tracked')
    } catch {
      /* dispatch surfaced the error */
    } finally {
      setBusy(false)
    }
  }

  const end = async () => {
    setBusy(true)
    setRoomOpen(false)
    try {
      await endHours()
      app.toast('Session ended — teaching time recorded')
    } catch {
      /* dispatch surfaced the error */
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {active ? (
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span className="row tiny" style={{ gap: 6, color: 'var(--danger)', fontWeight: 700 }}>
            <span className="live-dot" /> LIVE · {fmtElapsed((active.elapsedSecs || 0) + extra)}
          </span>
          <div className="spacer" />
          {zoom && (
            <button className={`${btn} btn-outline`} disabled={busy} onClick={() => setRoomOpen(true)}>
              <Video width={14} height={14} /> Rejoin room
            </button>
          )}
          <button
            className={`${btn} btn-outline`}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            disabled={busy}
            onClick={end}
          >
            End session
          </button>
        </div>
      ) : zoom ? (
        <button className={`${btn} btn-primary`} disabled={busy} onClick={startLiveClass}>
          <Video width={14} height={14} /> Start live class
        </button>
      ) : (
        <button className={`${btn} btn-outline`} disabled={busy} onClick={start}>
          <Video width={14} height={14} /> Start session
        </button>
      )}

      {roomOpen && (
        <ZoomRoom type={type} refId={refId} title={title} onClose={() => setRoomOpen(false)} />
      )}
    </>
  )
}
