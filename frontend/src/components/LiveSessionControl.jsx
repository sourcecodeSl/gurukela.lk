import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { api } from '../api/client.js'
import { confirmAction } from '../lib/confirm.js'
import { Video } from './icons.jsx'

/**
 * Host control for a live teaching session (slot / group class / seminar).
 *
 * 1-on-1 slots run in-site via Daily: "Start live class" creates the room and
 * opens it as host. Group classes and seminars instead use an external meeting
 * link the teacher pastes (Zoom / Google Meet / any) — "Start live class" marks
 * the class Live (teaching-hours timer + students' Join button) and opens the
 * link; students join through the same link.
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

export default function LiveSessionControl({ type, refId, title, meetLink, size = 'sm' }) {
  const app = useApp()
  const active = app.liveSessionOf(type, refId)
  // Group classes / seminars use an external meeting link the teacher pastes
  // (Zoom / Meet / any); only 1-on-1 slots use the in-site Daily room.
  const external = type === 'group' || type === 'seminar'
  const zoom = app.zoomEnabled && !external
  const [extra, setExtra] = useState(0)
  const [busy, setBusy] = useState(false)
  const openRoom = () => app.openLiveRoom(type, refId, title)
  const openLink = () => meetLink && window.open(meetLink, '_blank', 'noopener')

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

  // External-link flow (group class / seminar): the teacher hosts on their own
  // Zoom/Meet link; here we start the teaching-hours timer so the class shows
  // "Live" and students get their Join button, then open the link for the host.
  const startExternal = async () => {
    if (!meetLink) {
      app.toast('Add a meeting link first — edit the class and paste your Zoom/Meet link', 'err')
      return
    }
    setBusy(true)
    try {
      await startHours()
      openLink()
      app.toast('Live class started — students can now join via the link')
    } catch {
      /* dispatch surfaced the error */
    } finally {
      setBusy(false)
    }
  }

  // Zoom flow: ensure the meeting exists, start the timer, open the room.
  const startLiveClass = async () => {
    setBusy(true)
    try {
      await api.post(`/live/${type}/${refId}/meeting`)
      await startHours()
      openRoom()
      app.toast('Live class started — you are the host')
    } catch (e) {
      app.toast(e.message || 'Could not start the live class', 'err')
    } finally {
      setBusy(false)
    }
  }

  // Force a brand-new Zoom meeting and open it. The reliable one-click fix when
  // the current meeting is dead/expired — e.g. a stale "Live now" session left
  // over from before, whose stored meeting no longer works.
  const newMeeting = async () => {
    setBusy(true)
    try {
      await api.post(`/live/${type}/${refId}/meeting`, { force: true })
      openRoom()
      app.toast('New meeting created — you are the host')
    } catch (e) {
      app.toast(e.message || 'Could not create a new meeting', 'err')
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
    const ok = await confirmAction({
      title: 'End this session?',
      text: 'The live class will close and teaching time will be recorded. Students will no longer be able to join.',
      confirmText: 'End session',
      cancelText: 'Keep going',
    })
    if (!ok) return
    setBusy(true)
    app.closeLiveRoom()
    try {
      await endHours()
      app.toast('Session ended — teaching time recorded')
    } catch {
      /* dispatch surfaced the error */
    } finally {
      setBusy(false)
    }
  }

  // External-link control for group classes / seminars.
  if (external) {
    return active ? (
      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
        <span className="row tiny" style={{ gap: 6, color: 'var(--danger)', fontWeight: 700 }}>
          <span className="live-dot" /> LIVE · {fmtElapsed((active.elapsedSecs || 0) + extra)}
        </span>
        <div className="spacer" />
        {meetLink && (
          <button className={`${btn} btn-outline`} disabled={busy} onClick={openLink}>
            <Video width={14} height={14} /> Open link
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
    ) : (
      <button className={`${btn} btn-live`} style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={startExternal}>
        <Video width={14} height={14} /> Start live class
      </button>
    )
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
            <>
              <button className={`${btn} btn-outline`} disabled={busy} onClick={openRoom}>
                <Video width={14} height={14} /> Rejoin room
              </button>
              <button className={`${btn} btn-primary`} disabled={busy} onClick={newMeeting}>
                <Video width={14} height={14} /> New meeting
              </button>
            </>
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
        <button className={`${btn} btn-live`} style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={startLiveClass}>
          <Video width={14} height={14} /> Start live class
        </button>
      ) : (
        <button className={`${btn} btn-outline`} style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={start}>
          <Video width={14} height={14} /> Start session
        </button>
      )}
    </>
  )
}
