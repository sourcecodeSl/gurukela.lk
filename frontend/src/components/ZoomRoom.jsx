import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client.js'

/**
 * In-site Zoom live class (Meeting SDK — Component View). Renders a full-screen
 * overlay with the embedded meeting. The server's /join endpoint decides the
 * role: the owning teacher joins as host (can record), students as attendees
 * (cannot record). `onClose` fires when the user leaves or the meeting ends.
 */
export default function ZoomRoom({ type, refId, title, onClose }) {
  const rootRef = useRef(null)
  const clientRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | joining | joined | error
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const cfg = await api.get(`/live/${type}/${refId}/join`)
        if (cancelled) return

        const ZoomMtgEmbedded = (await import('@zoom/meetingsdk/embedded')).default
        const client = ZoomMtgEmbedded.createClient()
        clientRef.current = client

        await client.init({
          zoomAppRoot: rootRef.current,
          language: 'en-US',
          patchJsMedia: true,
          customize: {
            video: { isResizable: true, viewSizes: { default: { width: 1000, height: 600 } } },
          },
        })

        // When the meeting connection closes (user left / host ended), bubble up.
        client.on('connection-change', (payload) => {
          if (payload?.state === 'Closed' && !cancelled) onClose?.()
        })

        if (cancelled) return
        setStatus('joining')
        await client.join({
          sdkKey: cfg.sdkKey,
          signature: cfg.signature,
          meetingNumber: cfg.meetingNumber,
          password: cfg.passcode,
          userName: cfg.userName,
          zak: cfg.zak, // present only for the host
        })
        if (!cancelled) setStatus('joined')
      } catch (e) {
        if (!cancelled) {
          setError(e?.reason || e?.message || 'Could not join the live class')
          setStatus('error')
        }
      }
    })()

    return () => {
      cancelled = true
      try {
        clientRef.current?.leave?.()
      } catch {
        /* already left */
      }
    }
  }, [type, refId, onClose])

  const leave = async () => {
    try {
      await clientRef.current?.leave?.()
    } catch {
      /* ignore */
    }
    onClose?.()
  }

  return (
    <div className="zoom-overlay">
      <div className="zoom-bar">
        <span className="bold truncate" style={{ flex: 1 }}>{title || 'Live class'}</span>
        <button className="btn btn-sm btn-danger" onClick={leave}>Leave</button>
      </div>

      {status !== 'joined' && (
        <div className="zoom-status">
          {status === 'error' ? (
            <div className="col" style={{ gap: 12, alignItems: 'center' }}>
              <p style={{ color: 'var(--danger)', maxWidth: 420, textAlign: 'center' }}>{error}</p>
              <button className="btn btn-outline" onClick={() => onClose?.()}>Close</button>
            </div>
          ) : (
            <p className="muted">{status === 'joining' ? 'Joining the live class…' : 'Preparing the room…'}</p>
          )}
        </div>
      )}

      {/* Zoom mounts the meeting UI here. */}
      <div ref={rootRef} className="zoom-root" />
    </div>
  )
}
