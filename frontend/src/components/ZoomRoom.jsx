import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client.js'

/**
 * In-site Zoom live class using the Meeting SDK **Client View** (ZoomMtg) — the
 * same full desktop-Zoom UI (gallery/speaker view, participants, chat, screen
 * share and the full control bar) that people know from the Zoom app, rather
 * than the small fixed box of the Component View.
 *
 * The Client View mounts a full-screen React app into `#zmmtg-root` and loads
 * its assets from Zoom's CDN. The server's /join endpoint decides the role: the
 * owning teacher joins as host (can record), students as attendees. `onClose`
 * fires when the user leaves or the meeting ends.
 */

// SDK version must match the installed @zoom/meetingsdk so the CDN assets line up.
const ZOOM_SDK_VERSION = '6.2.0'

export default function ZoomRoom({ type, refId, title, onClose }) {
  const [status, setStatus] = useState('loading') // loading | joining | joined | error
  const [error, setError] = useState('')

  // Keep the latest onClose without re-running the join effect on every parent
  // re-render (e.g. the host's per-second "LIVE" timer).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    let cancelled = false
    let joined = false

    ;(async () => {
      try {
        const cfg = await api.get(`/live/${type}/${refId}/join`)
        if (cancelled) return

        const { ZoomMtg } = await import('@zoom/meetingsdk')

        // Load the client UI + wasm from Zoom's CDN (matching our SDK version) so
        // we don't have to bundle/serve the SDK's hundreds of asset chunks.
        ZoomMtg.setZoomJSLib(`https://source.zoom.us/${ZOOM_SDK_VERSION}/lib`, '/av')
        ZoomMtg.preLoadWasm()
        ZoomMtg.prepareWebSDK()

        // The Client View paints into a full-screen #zmmtg-root; show it while the
        // meeting is up and reveal our loading/error overlay through it otherwise.
        const root = document.getElementById('zmmtg-root')
        if (root) root.style.display = 'block'

        // Reflect the real meeting lifecycle in our UI. 2 = connected/joined,
        // 3 = disconnected (left or host ended) → bubble up so the app closes it.
        ZoomMtg.inMeetingServiceListener?.('onMeetingStatus', (data) => {
          if (cancelled) return
          if (data?.meetingStatus === 2) setStatus('joined')
          if (data?.meetingStatus === 3) onCloseRef.current?.()
        })

        if (cancelled) return
        setStatus('joining')

        ZoomMtg.init({
          // Client View navigates here on Leave; stay on the current SPA page so
          // the in-memory live-room state clears and we return where we were.
          leaveUrl: window.location.href,
          patchJsMedia: true,
          disablePreview: true,
          success: () => {
            if (cancelled) return
            ZoomMtg.join({
              sdkKey: cfg.sdkKey,
              signature: cfg.signature,
              meetingNumber: String(cfg.meetingNumber),
              passWord: cfg.passcode || '',
              userName: cfg.userName,
              zak: cfg.zak, // present only for the host
              success: () => {
                joined = true
                if (!cancelled) setStatus('joined')
              },
              error: (e) => {
                if (!cancelled) {
                  setError(e?.reason || e?.errorMessage || 'Could not join the live class')
                  setStatus('error')
                }
              },
            })
          },
          error: (e) => {
            if (!cancelled) {
              setError(e?.reason || e?.errorMessage || 'Could not start the Zoom client')
              setStatus('error')
            }
          },
        })
      } catch (e) {
        if (!cancelled) {
          setError(e?.reason || e?.message || 'Could not join the live class')
          setStatus('error')
        }
      }
    })()

    return () => {
      cancelled = true
      ;(async () => {
        try {
          const { ZoomMtg } = await import('@zoom/meetingsdk')
          if (joined) ZoomMtg.leave({ success: () => {}, error: () => {} })
        } catch {
          /* SDK never loaded / already left */
        }
        const root = document.getElementById('zmmtg-root')
        if (root) root.style.display = 'none'
      })()
    }
  }, [type, refId])

  return (
    <>
      {/* Zoom's Client View mounts its full-screen UI into this element. */}
      <div id="zmmtg-root" style={{ display: 'none' }} />

      {status !== 'joined' && (
        <div className="zoom-overlay">
          <div className="zoom-bar">
            <span className="bold truncate" style={{ flex: 1 }}>{title || 'Live class'}</span>
            <button className="btn btn-sm btn-danger" onClick={() => onCloseRef.current?.()}>Leave</button>
          </div>
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
        </div>
      )}
    </>
  )
}
