/**
 * In-site YouTube Live viewer for group classes and seminars — a one-to-many
 * broadcast (unlike the two-way Daily call used for 1-on-1 slots). The instructor
 * streams on YouTube and pastes the watch/stream URL; enrolled/registered
 * students watch it embedded in a full-screen overlay.
 *
 *   <YouTubeRoom url={youtubeUrl} title="…" onClose={…} />
 */

// Pull the 11-char video id out of any common YouTube URL shape:
//   youtu.be/<id>, watch?v=<id>, live/<id>, embed/<id>, shorts/<id>.
export function youtubeId(url) {
  if (!url) return null
  const s = String(url).trim()
  // Bare id pasted on its own.
  if (/^[\w-]{11}$/.test(s)) return s
  try {
    const u = new URL(s)
    const v = u.searchParams.get('v')
    if (v) return v
    const m = u.pathname.match(/\/(?:live|embed|shorts|v)\/([\w-]{11})/)
    if (m) return m[1]
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1, 12)
      if (id) return id
    }
  } catch {
    /* not a URL */
  }
  return null
}

export default function YouTubeRoom({ url, title, onClose }) {
  const id = youtubeId(url)

  return (
    <div className="zoom-overlay">
      <div className="zoom-bar">
        <span className="bold truncate" style={{ flex: 1 }}>{title || 'Live class'}</span>
        <button className="btn btn-sm btn-danger" onClick={() => onClose?.()}>Leave</button>
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {id ? (
          <iframe
            title={title || 'Live class'}
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="zoom-status">
            <div className="col" style={{ gap: 12, alignItems: 'center' }}>
              <p style={{ color: 'var(--danger)', maxWidth: 420, textAlign: 'center' }}>
                This live link isn’t a valid YouTube URL. Ask the teacher to re-share it.
              </p>
              {url && (
                <a className="btn btn-outline" href={url} target="_blank" rel="noreferrer">
                  Open on YouTube
                </a>
              )}
              <button className="btn btn-ghost" onClick={() => onClose?.()}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
