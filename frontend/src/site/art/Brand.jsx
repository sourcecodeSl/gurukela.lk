/**
 * Brand assets — the Gurukela mark and lockup.
 *
 * The mark is an open book whose pages rise into a leaf: learning that grows.
 * Drawn as SVG so it stays sharp at favicon size and at hero size alike.
 */

export function Mark({ size = 40, on = 'light' }) {
  const id = `gk-mark-${on}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Gurukela">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={on === 'dark' ? '#2fbb80' : '#12a065'} />
          <stop offset="1" stopColor={on === 'dark' ? '#0d8552' : '#085232'} />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="48" height="48" rx="13" fill={`url(#${id}-a)`} />

      {/* leaf rising out of the spine */}
      <path
        d="M24 9c5.4 1.6 8.6 5.2 8.6 9.6 0 3.6-2.6 6.4-6 6.9V29h-5.2v-3.5c-3.4-.5-6-3.3-6-6.9C15.4 14.2 18.6 10.6 24 9Z"
        fill="#ffffff"
        opacity=".95"
      />
      <path d="M24 11.4v13.2" stroke="#0a6a41" strokeWidth="1.5" strokeLinecap="round" opacity=".55" />

      {/* open book */}
      <path
        d="M9 30.5c4.6-2.2 9.2-2.2 13.8 0v8.3c-4.6-2.2-9.2-2.2-13.8 0v-8.3Z"
        fill="#ffffff"
      />
      <path
        d="M25.2 30.5c4.6-2.2 9.2-2.2 13.8 0v8.3c-4.6-2.2-9.2-2.2-13.8 0v-8.3Z"
        fill="#ffffff"
        opacity=".82"
      />
      <path d="M24 30v9" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
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
