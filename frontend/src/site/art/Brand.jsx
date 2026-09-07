/**
 * Brand assets — the Gurukela mark and lockup.
 *
 * The mark is a brain rising out of an open book under a stack of tutes:
 * what is read becomes what is known. Drawn as SVG so it stays sharp at
 * favicon size and at hero size alike.
 *
 * The brain silhouette is a union of overlapping white circles rather than
 * one traced outline — the lobes stay round and even at 20px, where a single
 * hand-drawn path turns to mush. Its folds are strokes in the tile colour, so
 * they read as gaps cut out of the white.
 */

export function Mark({ size = 40, on = 'light' }) {
  const id = `gk-mark-${on}`
  const tile = on === 'dark' ? '#0d8552' : '#0a6a41'

  /* One hemisphere, mirrored for the other: [cx, cy, r] of each lobe. */
  const lobes = [
    [20.4, 16.3, 2.9],
    [17.5, 18.9, 3.0],
    [17.1, 22.6, 2.9],
    [18.7, 25.9, 2.8],
    [21.2, 27.7, 2.5],
  ]

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Gurukela">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={on === 'dark' ? '#2fbb80' : '#12a065'} />
          <stop offset="1" stopColor={on === 'dark' ? '#0d8552' : '#085232'} />
        </linearGradient>
        {/* The light the book throws up onto the brain. */}
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="48" height="48" rx="13" fill={`url(#${id}-a)`} />

      {/* stack of tutes above the brain */}
      <g fill="#ffffff">
        <rect x="21.6" y="6.0" width="4.8" height="1.5" rx=".75" />
        <rect x="20.2" y="8.1" width="7.6" height="1.6" rx=".8" />
        <rect x="19.0" y="10.2" width="10" height="1.7" rx=".85" />
      </g>

      <ellipse cx="24" cy="31" rx="9" ry="6" fill={`url(#${id}-glow)`} />

      {/* brain */}
      <g fill="#ffffff">
        {lobes.map(([cx, cy, r]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r={r} />
            <circle cx={48 - cx} cy={cy} r={r} />
          </g>
        ))}
        <ellipse cx="24" cy="22.2" rx="4.8" ry="6.6" />
        <rect x="23.2" y="11.6" width="1.6" height="4" rx=".8" />
      </g>

      {/* folds cut back out of the brain */}
      <g stroke={tile} strokeWidth="1.15" strokeLinecap="round" fill="none">
        <path d="M24 13.4v15.6" />
        <path d="M21.4 16.6c-2 .5-2.6 2-1.3 3.2" />
        <path d="M19.6 22.1c-1.8.4-2.2 1.9-.8 2.9" />
        <path d="M21.3 26.6c-1.3.5-1.5 1.5-.4 2.2" />
        <path d="M26.6 16.6c2 .5 2.6 2 1.3 3.2" />
        <path d="M28.4 22.1c1.8.4 2.2 1.9.8 2.9" />
        <path d="M26.7 26.6c1.3.5 1.5 1.5.4 2.2" />
      </g>

      {/* open book */}
      <g fill="#ffffff">
        <path d="M23.1 34.1c-3.6-2.9-9-3.6-14.4-2.4l-.6 6.9c5.2-1.2 10.6-.5 15 2.3v-6.8Z" />
        <path d="M24.9 34.1c3.6-2.9 9-3.6 14.4-2.4l.6 6.9c-5.2-1.2-10.6-.5-15 2.3v-6.8Z" />
      </g>
      {/* page edges */}
      <g stroke={tile} strokeWidth=".9" strokeLinecap="round" fill="none" opacity=".85">
        <path d="M10.6 34.2c3.6-.4 7.2.2 10.4 1.9" />
        <path d="M37.4 34.2c-3.6-.4-7.2.2-10.4 1.9" />
      </g>
    </svg>
  )
}

export function Wordmark({ on = 'light' }) {
  return (
    <span className="gk-brand__text">
      <span className="gk-brand__name" style={on === 'dark' ? { color: '#fff' } : undefined}>
        Gurukela
      </span>
      <span className="gk-brand__sub">Online Academy</span>
    </span>
  )
}

export default function Brand({ size = 40, on = 'light' }) {
  return (
    <>
      <Mark size={size} on={on} />
      <Wordmark on={on} />
    </>
  )
}
