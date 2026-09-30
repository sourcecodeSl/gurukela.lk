import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client.js'
import { Maximize, Minimize } from './icons.jsx'

/**
 * In-site live class using Daily.co's prebuilt call UI (grid/speaker view,
 * participants, chat, screen share and the full control bar) embedded in a
 * full-screen overlay.
 *
 * The server's /join endpoint decides the role: the owning teacher gets an owner
 * token (can manage/record), students a guest token. `onClose` fires when the
 * user leaves or the call ends.
 */
export default function DailyRoom({ type, refId, title, onClose }) {
  const [status, setStatus] = useState('loading') // loading | joining | joined | error
  const [error, setError] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const overlayRef = useRef(null)
  const containerRef = useRef(null)
  const frameRef = useRef(null)

  // Keep the latest onClose without re-running the join effect on every parent
  // re-render (e.g. the host's per-second "LIVE" timer).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Keep the button in sync with the actual fullscreen state (covers Esc, the OS
  // back gesture, or the browser's own fullscreen chrome).
  useEffect(() => {
    const sync = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  // Native fullscreen on the whole overlay so the call fills the phone screen.
  // Best-effort landscape lock too — the video is far bigger sideways on a phone,
  // and it silently no-ops on desktop / where the browser disallows it.
  async function toggleFullscreen() {
    const el = overlayRef.current
    if (!el) return
    const inFs = document.fullscreenElement || document.webkitFullscreenElement
    try {
      if (!inFs) {
        if (el.requestFullscreen) await el.requestFullscreen()
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
        try {
          await window.screen?.orientation?.lock?.('landscape')
        } catch {
          /* orientation lock not permitted (desktop, iOS Safari, etc.) */
        }
      } else {
        try {
          window.screen?.orientation?.unlock?.()
        } catch {
          /* ignore */
        }
        if (document.exitFullscreen) await document.exitFullscreen()
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
      }
    } catch {
      /* fullscreen request rejected — leave the layout as-is */
    }
  }

  useEffect(() => {
    let cancelled = false
    let joined = false

    ;(async () => {
      try {
        const cfg = await api.get(`/live/${type}/${refId}/join`)
        if (cancelled) return

        const DailyIframe = (await import('@daily-co/daily-js')).default
        if (cancelled || !containerRef.current) return

        // Guard against a lingering instance (Daily forbids duplicates) — e.g. a
        // previous room whose cleanup didn't finish before this one mounted.
        try {
          DailyIframe.getCallInstance()?.destroy()
        } catch {
          /* none */
        }

        const frame = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: true,
          iframeStyle: { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 },
        })
        frameRef.current = frame

        frame
          .on('joined-meeting', () => {
            joined = true
            if (!cancelled) setStatus('joined')
          })
          .on('left-meeting', (e) => {
            console.log('[Daily] left-meeting', e)
            // Only treat a leave as "close" once we actually joined. A leave that
            // fires during the connect handshake is a failed join — surface it
            // instead of silently bouncing back to the page.
            if (joined) onCloseRef.current?.()
            else if (!cancelled) {
              setError('The live class ended or could not be joined. Try “New meeting”.')
              setStatus('error')
            }
          })
          .on('error', (e) => {
            console.error('[Daily] error', e)
            if (!cancelled) {
              setError(e?.errorMsg || e?.error?.msg || 'Could not join the live class')
              setStatus('error')
            }
          })

        setStatus('joining')
        await frame.join({ url: cfg.roomUrl, token: cfg.token, userName: cfg.userName })
      } catch (e) {
        console.error('[Daily] join threw', e)
        if (!cancelled) {
          setError(e?.message || 'Could not join the live class')
          setStatus('error')
        }
      }
    })()

    return () => {
      cancelled = true
      const f = frameRef.current
      frameRef.current = null
      if (f) {
        try {
          f.destroy()
        } catch {
          /* already destroyed */
        }
      }
    }
  }, [type, refId])

  return (
    <div className="zoom-overlay" ref={overlayRef}>
      <div className="zoom-bar">
        <span className="bold truncate" style={{ flex: 1 }}>{title || 'Live class'}</span>
        <button
          className="btn btn-sm"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
          style={{
            background: 'rgba(255,255,255,.1)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,.2)',
          }}
        >
          {isFullscreen ? <Minimize width={16} height={16} /> : <Maximize width={16} height={16} />}
        </button>
        <button className="btn btn-sm btn-danger" onClick={() => onCloseRef.current?.()}>Leave</button>
      </div>
      <div ref={containerRef} style={{ position: 'relative', flex: 1, minHeight: 0 }}>
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
      </div>
    </div>
  )
}
