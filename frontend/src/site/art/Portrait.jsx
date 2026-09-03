/**
 * Lecturer portraits.
 *
 * The panel is illustrated rather than photographed: one drawn portrait per
 * lecturer, with the hair, garment, backdrop and pattern chosen deterministically
 * from the lecturer id. The same person therefore looks the same on the card,
 * the profile and the checkout row, and nothing depends on an uploaded photo.
 */

/** Small stable string hash → non-negative int. */
function hash(str = '') {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const BACKDROPS = [
  ['#eefaf4', '#d5f4e4'],
  ['#e6f6ef', '#c2ecd8'],
  ['#f1faf5', '#dcf1e6'],
  ['#e9f7f1', '#cdeee0'],
]

const SKIN = ['#e8b98f', '#d9a377', '#c58a5f', '#b0744c', '#f0c9a3']
const HAIR = ['#26170f', '#3a2418', '#1a1a1a', '#4a3423', '#5c5c5c']
const GARMENT = [
  ['#0d8552', '#0a6a41'],
  ['#12a065', '#0d8552'],
  ['#1f5f8b', '#164a6d'],
  ['#3f4a55', '#2d353d'],
  ['#8a6d3b', '#6b542c'],
  ['#7a3b52', '#5e2c3f'],
]

export default function Portrait({ id = '', name = '', size, style = 'card' }) {
  const h = hash(id || name)
  const [bg1, bg2] = BACKDROPS[h % BACKDROPS.length]
  const skin = SKIN[(h >> 3) % SKIN.length]
  const hair = HAIR[(h >> 5) % HAIR.length]
  const [g1, g2] = GARMENT[(h >> 7) % GARMENT.length]
  const hairStyle = (h >> 9) % 6
  const glasses = ((h >> 13) % 3) === 0
  const pattern = (h >> 11) % 3
  const beard = ((h >> 17) % 4) === 0 && hairStyle < 3

  const uid = `p-${(id || name).replace(/\W/g, '')}`
  const shade = `#${((parseInt(skin.slice(1), 16) - 0x0f0a08) >>> 0).toString(16).padStart(6, '0')}`

  return (
    <svg
      viewBox="0 0 200 200"
      width={size ?? '100%'}
      height={size ?? '100%'}
      role="img"
      aria-label={name ? `Portrait of ${name}` : 'Lecturer portrait'}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={bg1} />
          <stop offset="1" stopColor={bg2} />
        </linearGradient>
        <linearGradient id={`${uid}-gm`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={g1} />
          <stop offset="1" stopColor={g2} />
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <rect width="200" height="200" rx={style === 'round' ? 100 : 0} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid}-clip)`}>
        <rect width="200" height="200" fill={`url(#${uid}-bg)`} />

        {/* backdrop pattern */}
        {pattern === 0 && (
          <g fill="none" stroke="#0d8552" strokeOpacity=".12" strokeWidth="1.4">
            <circle cx="100" cy="104" r="52" />
            <circle cx="100" cy="104" r="70" />
            <circle cx="100" cy="104" r="88" />
          </g>
        )}
        {pattern === 1 && (
          <g fill="#0d8552" fillOpacity=".1">
            {Array.from({ length: 30 }, (_, i) => (
              <circle key={i} cx={16 + (i % 6) * 34} cy={16 + Math.floor(i / 6) * 34} r="3" />
            ))}
          </g>
        )}
        {pattern === 2 && (
          <g stroke="#0d8552" strokeOpacity=".1" strokeWidth="1.3">
            {Array.from({ length: 7 }, (_, i) => (
              <path key={i} d={`M${-40 + i * 40} 210 L${40 + i * 40} -10`} />
            ))}
          </g>
        )}

        {/* shoulders */}
        <path d="M28 200c0-32 22-52 50-58h44c28 6 50 26 50 58H28Z" fill={`url(#${uid}-gm)`} />
        {/* collar */}
        <path d="M83 143l17 20 17-20 9 4-26 30-26-30 9-4Z" fill="#ffffff" fillOpacity=".92" />
        <path d="M100 163l-6 12 6 9 6-9-6-12Z" fill={g2} fillOpacity=".55" />

        {/* neck */}
        <path d="M87 122h26v24c0 6-26 6-26 0v-24Z" fill={shade} />
        {/* head */}
        <ellipse cx="100" cy="94" rx="34" ry="39" fill={skin} />
        {/* ears */}
        <ellipse cx="65" cy="97" rx="6" ry="9" fill={skin} />
        <ellipse cx="135" cy="97" rx="6" ry="9" fill={skin} />

        {/* hair */}
        {hairStyle === 0 && (
          <path d="M64 92c-2-26 14-42 36-42s38 16 36 42c-3-14-9-20-16-22-9 6-38 8-46-2-6 4-9 12-10 24Z" fill={hair} />
        )}
        {hairStyle === 1 && (
          <path d="M64 94c-3-28 14-45 36-45 21 0 38 16 36 45-4-16-8-23-14-26-14 10-31 5-41 1-9 4-14 12-17 25Z" fill={hair} />
        )}
        {hairStyle === 2 && (
          <>
            <path d="M66 88c0-24 15-39 34-39s34 15 34 39c-6-12-13-17-20-18-12 5-30 5-40-1-4 4-6 10-8 19Z" fill={hair} />
            <circle cx="100" cy="42" r="13" fill={hair} />
          </>
        )}
        {hairStyle === 3 && (
          <path d="M62 96c-3-30 15-47 38-47s41 17 38 47c-2-8-4-13-7-17v46c-6 4-10-14-11-32-12 6-28 7-42 2-2 16-6 32-11 30v-46c-3 4-4 9-5 17Z" fill={hair} />
        )}
        {hairStyle === 4 && (
          <path d="M68 84c2-22 15-35 32-35 18 0 31 14 32 36-4-10-9-15-15-16-13 6-32 4-42-3-3 4-5 9-7 18Z" fill={hair} opacity=".92" />
        )}
        {hairStyle === 5 && (
          <g fill={hair}>
            <circle cx="76" cy="72" r="15" />
            <circle cx="100" cy="60" r="17" />
            <circle cx="124" cy="72" r="15" />
            <circle cx="68" cy="90" r="11" />
            <circle cx="132" cy="90" r="11" />
          </g>
        )}

        {/* brows */}
        <path d="M80 87q9-5 18 0M102 87q9-5 18 0" stroke={hair} strokeWidth="3.2" strokeLinecap="round" fill="none" />
        {/* eyes */}
        <ellipse cx="88" cy="97" rx="4.2" ry="4.6" fill="#20302a" />
        <ellipse cx="112" cy="97" rx="4.2" ry="4.6" fill="#20302a" />
        <circle cx="89.4" cy="95.6" r="1.4" fill="#fff" fillOpacity=".85" />
        <circle cx="113.4" cy="95.6" r="1.4" fill="#fff" fillOpacity=".85" />
        {/* nose + mouth */}
        <path d="M100 100v7l4 3" stroke={shade} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M91 116q9 8 18 0" stroke="#8a4a42" strokeWidth="2.6" strokeLinecap="round" fill="none" />

        {beard && (
          <path d="M70 100c1 22 13 33 30 33s29-11 30-33c-4 16-16 21-30 21s-26-5-30-21Z" fill={hair} fillOpacity=".9" />
        )}

        {glasses && (
          <g stroke="#2c3f36" strokeWidth="2.6" fill="none" opacity=".85">
            <rect x="74" y="88" width="26" height="19" rx="7" />
            <rect x="100" y="88" width="26" height="19" rx="7" />
            <path d="M100 96h0M74 94l-8 2M126 94l8 2" />
          </g>
        )}
      </g>
    </svg>
  )
}
