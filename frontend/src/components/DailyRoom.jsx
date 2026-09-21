import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client.js'

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
  const containerRef = useRef(null)
  const frameRef = useRef(null)

  // Keep the latest onClose without re-running the join effect on every parent
  // re-render (e.g. the host's per-second "LIVE" timer).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const cfg = await api.get(`/live/${type}/${refId}/join`)
        if (cancelled) return

        const DailyIframe = (await import('@daily-co/daily-js')).default
        if (cancelled || !containerRef.current) return

        const frame = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: true,
          iframeStyle: { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 },
        })
        frameRef.current = frame

        frame
          .on('joined-meeting', () => {
            if (!cancelled) setStatus('joined')
          })
          .on('left-meeting', () => onCloseRef.current?.())
          .on('error', (e) => {
            console.error('[Daily] error', e)
            if (!cancelled) {
              setError(e?.errorMsg || 'Could not join the live class')
              setStatus('error')
            }
          })

        setStatus('joining')
        await frame.join({ url: cfg.roomUrl, token: cfg.token, userName: cfg.userName })
      } catch (e) {
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
    <div className="zoom-overlay">
      <div className="zoom-bar">
        <span className="bold truncate" style={{ flex: 1 }}>{title || 'Live class'}</span>
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
