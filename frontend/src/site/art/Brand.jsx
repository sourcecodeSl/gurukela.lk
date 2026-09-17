/**
 * Brand assets — the GetClass logo.
 *
 * The logo is the raster lockup in /public/brand (processed from the master
 * "Get Class Logo.png": trimmed, transparent background, plus white variants
 * for dark surfaces and a square icon crop of the cap+G mark).
 *
 *   logo.png / logo-white.png            full lockup (mark + GetClass.lk + tagline)
 *   logo-icon.png / logo-icon-white.png  square mark only
 */

const SRC = {
  full: '/brand/logo.png',
  fullWhite: '/brand/logo-white.png',
  icon: '/brand/logo-icon.png',
  iconWhite: '/brand/logo-icon-white.png',
}

/** Icon-only mark. `on="dark"` swaps to the white variant. */
export function Mark({ size = 40, on = 'light' }) {
  return (
    <img
      src={on === 'dark' ? SRC.iconWhite : SRC.icon}
      alt="GetClass"
      width={size}
      height={size}
      style={{ display: 'block', width: size, height: size, objectFit: 'contain' }}
    />
  )
}

/** Full lockup image (mark + wordmark + tagline). */
export function Logo({ height = 44, on = 'light' }) {
  return (
    <img
      src={on === 'dark' ? SRC.fullWhite : SRC.full}
      alt="GetClass.lk"
      style={{ display: 'block', height, width: 'auto', objectFit: 'contain' }}
    />
  )
}

export function Wordmark({ on = 'light' }) {
  return (
    <span className="gk-brand__text">
      <span className="gk-brand__name" style={on === 'dark' ? { color: '#fff' } : undefined}>
        GetClass
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
