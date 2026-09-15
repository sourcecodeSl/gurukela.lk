import { useEffect, useRef, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { Maximize, Minimize } from './icons.jsx'

/**
 * In-site Zoom live class (Meeting SDK — Component View). Renders a full-screen
 * overlay with the embedded meeting. The server's /join endpoint decides the
 * role: the owning teacher joins as host (can record), students as attendees
 * (cannot record). `onClose` fires when the user leaves or the meeting ends.
 */
export default function ZoomRoom({ type, refId, title, onClose }) {
  const rootRef = useRef(null)
  const overlayRef = useRef(null)
  const clientRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | joining | joined | error
  const [error, setError] = useState('')
  const [isFull, setIsFull] = useState(false)

  // Keep the latest onClose without making it an effect dependency — otherwise a
  // parent that re-renders (e.g. the host's per-second "LIVE" timer) would pass a
  // new function each tick and tear down / re-join the meeting every second.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    let cancelled = false

    // Size the meeting to the actual container (the flex area below the top bar),
    // not to the raw window — guessing the bar height leaves the Zoom canvas
    // taller than its box, which overflows and pushes the video off-screen.
    const measure = () => {
      const r = rootRef.current?.getBoundingClientRect()
      return {
        width: Math.max(320, Math.floor(r?.width || window.innerWidth)),
        height: Math.max(240, Math.floor(r?.height || window.innerHeight - 48)),
      }
    }

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
            video: {
              // Fixed to the container: resizing lets the user drag the video,
              // which flickers the resize handles when the pointer crosses the
              // edge / leaves the class area.
              isResizable: false,
              viewSizes: { default: measure() },
            },
          },
        })

        // When the meeting connection closes (user left / host ended), bubble up.
        client.on('connection-change', (payload) => {
          if (payload?.state === 'Closed' && !cancelled) onCloseRef.current?.()
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
  }, [type, refId])

  // Track fullscreen changes triggered from anywhere (incl. the Esc key).
  useEffect(() => {
    const onFsChange = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const toggleFull = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await overlayRef.current?.requestFullscreen?.()
      }
    } catch {
      /* fullscreen not permitted — ignore */
    }
  }, [])

  const leave = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
    } catch {
      /* ignore */
    }
    try {
      await clientRef.current?.leave?.()
    } catch {
      /* ignore */
    }
    onCloseRef.current?.()
  }

  return (
    <div className="zoom-overlay" ref={overlayRef}>
      <div className="zoom-bar">
        <span className="bold truncate" style={{ flex: 1 }}>{title || 'Live class'}</span>
        <button
          className="btn btn-sm btn-outline"
          onClick={toggleFull}
          title={isFull ? 'Exit full screen' : 'Full screen'}
        >
          {isFull ? <Minimize width={14} height={14} /> : <Maximize width={14} height={14} />}
          <span className="hide-sm">{isFull ? 'Exit full screen' : 'Full screen'}</span>
        </button>
        <button className="btn btn-sm btn-danger" onClick={leave}>Leave</button>
      </div>

      {status !== 'joined' && (
        <div className="zoom-status">
          {status === 'error' ? (
            <div className="col" style={{ gap: 12, alignItems: 'center' }}>
              <p style={{ color: 'var(--danger)', maxWidth: 420, textAlign: 'center' }}>{error}</p>
              <button className="btn btn-outline" onClick={() => onCloseRef.current?.()}>Close</button>
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
