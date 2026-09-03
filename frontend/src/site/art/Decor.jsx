/**
 * Small illustrated pieces: achievement medals, the hero's grid lines, the
 * office map plate and the payment logos. Each is drawn rather than sourced,
 * so nothing on the site depends on an external image.
 */

/* ---------------------------------------------------------------- */
/* Faint engineering grid laid over the hero and banners             */
/* ---------------------------------------------------------------- */

export function GridLines() {
  return (
    <svg className="gk-hero__grid-lines" preserveAspectRatio="none" viewBox="0 0 1200 640" aria-hidden="true">
      <g stroke="#68d3a5" strokeWidth="1">
        {Array.from({ length: 25 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 50} 0v640`} />
        ))}
        {Array.from({ length: 14 }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${i * 50}h1200`} />
        ))}
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------- */
/* Achievement medal — the ribbon colour changes with the placing    */
/* ---------------------------------------------------------------- */

const MEDAL_TONE = {
  gold: ['#f2c14e', '#c98a12', '#7a5306'],
  silver: ['#dbe4e0', '#a9b7b1', '#6d7a74'],
  green: ['#68d3a5', '#12a065', '#085232'],
}

export function Medal({ tone = 'green', label = '', size = 74 }) {
  const [light, mid, dark] = MEDAL_TONE[tone] || MEDAL_TONE.green
  const uid = `m-${tone}-${label.replace(/\W/g, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={label || 'Achievement medal'}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={mid} />
        </linearGradient>
      </defs>
      <path d="M22 4h14L28 30l-13-4 7-22Z" fill={mid} opacity=".75" />
      <path d="M58 4H44l8 26 13-4-7-22Z" fill={dark} opacity=".75" />
      <circle cx="40" cy="48" r="26" fill={`url(#${uid})`} />
      <circle cx="40" cy="48" r="20" fill="none" stroke="#ffffff" strokeOpacity=".6" strokeWidth="1.6" strokeDasharray="3 5" />
      <path
        d="m40 36 3.4 6.9 7.6 1.1-5.5 5.4 1.3 7.6L40 53.4l-6.8 3.6 1.3-7.6-5.5-5.4 7.6-1.1L40 36Z"
        fill="#ffffff"
        fillOpacity=".92"
      />
    </svg>
  )
}

/* ---------------------------------------------------------------- */
/* Office map plate for the contact page                             */
/* ---------------------------------------------------------------- */

export function MapPlate({ road = 'Main Road', place = 'Colombo' }) {
  return (
    <svg viewBox="0 0 640 300" width="100%" role="img" aria-label="Map showing the Gurukela office">
      <rect width="640" height="300" fill="#eefaf4" />

      {/* blocks */}
      <g fill="#d5f4e4">
        <rect x="24" y="26" width="140" height="86" rx="8" />
        <rect x="196" y="20" width="118" height="64" rx="8" />
        <rect x="352" y="34" width="150" height="78" rx="8" />
        <rect x="534" y="26" width="86" height="96" rx="8" />
        <rect x="30" y="168" width="122" height="104" rx="8" />
        <rect x="188" y="182" width="140" height="92" rx="8" />
        <rect x="366" y="164" width="112" height="112" rx="8" />
        <rect x="512" y="176" width="108" height="96" rx="8" />
      </g>

      {/* roads */}
      <g stroke="#ffffff" strokeWidth="14" strokeLinecap="round">
        <path d="M0 146h640" />
        <path d="M176 0v300" />
        <path d="M344 0v300" />
        <path d="M498 0v300" />
      </g>
      <g stroke="#a6e8c9" strokeWidth="1.6" strokeDasharray="9 11">
        <path d="M0 146h640" />
        <path d="M176 0v300" />
      </g>

      <text x="196" y="138" fill="#5d7268" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">
        {road}
      </text>

      {/* pin */}
      <g transform="translate(344 146)">
        <circle r="34" fill="#12a065" fillOpacity=".16" />
        <circle r="20" fill="#12a065" fillOpacity=".22" />
        <path d="M0-28c9.4 0 17 7.6 17 17 0 12-11 22.6-17 30-6-7.4-17-18-17-30 0-9.4 7.6-17 17-17Z" fill="#0d8552" />
        <circle cx="0" cy="-11" r="6.4" fill="#fff" />
      </g>
      <g transform="translate(376 128)">
        <rect width="146" height="44" rx="10" fill="#ffffff" />
        <text x="14" y="20" fill="#0c1a13" fontSize="13" fontWeight="800" fontFamily="Inter, sans-serif">
          Gurukela Academy
        </text>
        <text x="14" y="35" fill="#5d7268" fontSize="11.5" fontFamily="Inter, sans-serif">
          {place}
        </text>
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------- */
/* Payment method marks for the checkout page                        */
/* ---------------------------------------------------------------- */

export function PayMark({ kind }) {
  if (kind === 'card') {
    return (
      <svg width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">
        <rect width="44" height="30" rx="6" fill="#0d8552" />
        <rect y="8" width="44" height="6" fill="#063a26" opacity=".55" />
        <rect x="6" y="19" width="14" height="4" rx="2" fill="#a6e8c9" />
        <circle cx="31" cy="21" r="5" fill="#ffffff" fillOpacity=".85" />
        <circle cx="37" cy="21" r="5" fill="#68d3a5" fillOpacity=".85" />
      </svg>
    )
  }
  if (kind === 'bank') {
    return (
      <svg width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">
        <rect width="44" height="30" rx="6" fill="#eefaf4" />
        <path d="M8 13 22 6l14 7H8Z" fill="#0d8552" />
        <g fill="#0d8552">
          <rect x="11" y="15" width="3.4" height="8" rx="1.2" />
          <rect x="18" y="15" width="3.4" height="8" rx="1.2" />
          <rect x="25" y="15" width="3.4" height="8" rx="1.2" />
          <rect x="8" y="24" width="28" height="2.6" rx="1.3" />
        </g>
      </svg>
    )
  }
  return (
    <svg width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">
      <rect width="44" height="30" rx="6" fill="#f2c14e" />
      <path d="M14 8h9a6 6 0 0 1 0 12h-4v4h-5V8Zm5 4v4h4a2 2 0 0 0 0-4h-4Z" fill="#063a26" />
      <circle cx="33" cy="15" r="4" fill="#063a26" fillOpacity=".8" />
    </svg>
  )
}
