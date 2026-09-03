/**
 * Line icons for the public site.
 *
 * Drawn on a 24px grid with a 1.7 stroke so they sit correctly next to
 * Inter at 14–16px. `currentColor` everywhere, so they inherit from CSS.
 */

const make = (paths, opts = {}) =>
  function Icon({ size = 20, ...rest }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={opts.fill ? 'currentColor' : 'none'}
        stroke={opts.fill ? 'none' : 'currentColor'}
        strokeWidth={opts.sw || 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...rest}
      >
        {paths}
      </svg>
    )
  }

/* ---- navigation & chrome ---- */
export const Menu = make(<path d="M4 7h16M4 12h16M4 17h16" />)
export const Close = make(<path d="M6 6l12 12M18 6 6 18" />)
export const ArrowRight = make(<path d="M4 12h15m-6-6.5 6.5 6.5-6.5 6.5" />)
export const ArrowLeft = make(<path d="M20 12H5m6-6.5L4.5 12 11 18.5" />)
export const ChevronRight = make(<path d="m9.5 5.5 7 6.5-7 6.5" />)
export const ChevronDown = make(<path d="m5.5 9.5 6.5 7 6.5-7" />)
export const Search = make(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </>
)

/* ---- contact ---- */
export const Phone = make(
  <path d="M6.5 3.5h3l1.5 4-2 1.4a12.5 12.5 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" />
)
export const Mail = make(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.8 6.8 7.1 5.3a2 2 0 0 0 2.2 0l7.1-5.3" />
  </>
)
export const Pin = make(
  <>
    <path d="M12 21c4.2-4.2 6.5-7.4 6.5-10.4A6.5 6.5 0 0 0 5.5 10.6C5.5 13.6 7.8 16.8 12 21Z" />
    <circle cx="12" cy="10.4" r="2.4" />
  </>
)
export const Clock = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.2V12l3.2 2" />
  </>
)
export const WhatsApp = make(
  <path d="M20 11.6a8 8 0 0 1-11.9 7L3.5 20l1.5-4.4A8 8 0 1 1 20 11.6Zm-11.3-3c-.3 0-.7.1-1 .5-.4.4-1 1-1 2.3s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.2 2.4.9 2.9.7 3.4.7.5-.1 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.2-.6-.4l-2-1c-.3-.1-.5-.2-.7.1l-.9 1.2c-.2.2-.3.3-.6.1a8 8 0 0 1-2.3-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-.9-2c-.2-.5-.4-.4-.6-.4Z" />,
  { fill: true }
)
export const Facebook = make(
  <path d="M14.3 21v-7.4h2.5l.4-2.9h-2.9V8.9c0-.8.2-1.4 1.5-1.4h1.5V5a20 20 0 0 0-2.3-.1c-2.3 0-3.8 1.4-3.8 3.9v2h-2.5v2.9h2.5V21h3.1Z" />,
  { fill: true }
)
export const TikTok = make(
  <path d="M16.2 3h-2.6v11.4a2.3 2.3 0 1 1-1.8-2.2V9.5a5 5 0 1 0 4.4 5V9.1a6 6 0 0 0 3.3 1V7.5a3.4 3.4 0 0 1-3.3-3.4V3Z" />,
  { fill: true }
)
export const YouTube = make(
  <path d="M21.3 8a2.4 2.4 0 0 0-1.7-1.7C18 5.9 12 5.9 12 5.9s-6 0-7.6.4A2.4 2.4 0 0 0 2.7 8a25 25 0 0 0-.4 4.6c0 1.6.1 3.1.4 4.6a2.4 2.4 0 0 0 1.7 1.7c1.6.4 7.6.4 7.6.4s6 0 7.6-.4a2.4 2.4 0 0 0 1.7-1.7c.3-1.5.4-3 .4-4.6s-.1-3.1-.4-4.6ZM10.1 15.4V9.7l5 2.9-5 2.8Z" />,
  { fill: true }
)

/* ---- content ---- */
export const Star = make(<path d="m12 3.7 2.6 5.3 5.8.9-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.9l5.8-.9z" />, { fill: true })
export const Check = make(<path d="m4.5 12.5 5 5 10-11" strokeWidth={2} />)
export const CheckCircle = make(
  <>
    <circle cx="12" cy="12" r="8.6" />
    <path d="m8.4 12.2 2.6 2.6 4.6-5.2" />
  </>
)
export const Users = make(
  <>
    <circle cx="9.5" cy="8" r="3.3" />
    <path d="M3.5 19.5a6 6 0 0 1 12 0" />
    <path d="M16.5 6.2a3.2 3.2 0 0 1 0 6.1M17.5 14.4a5.6 5.6 0 0 1 3.6 5.1" />
  </>
)
export const Book = make(
  <>
    <path d="M4.5 5.2A2 2 0 0 1 6.6 3.5h11.9v14.2H6.6a2 2 0 0 0-2.1 1.8Z" />
    <path d="M4.5 5.2v14.3a2 2 0 0 0 2.1 1.8h11.9v-3.6" />
  </>
)
export const Video = make(
  <>
    <rect x="2.8" y="6" width="12.6" height="12" rx="2.6" />
    <path d="m15.4 13.2 4.2 2.6a.7.7 0 0 0 1.1-.6V8.8a.7.7 0 0 0-1.1-.6l-4.2 2.6z" />
  </>
)
export const Replay = make(
  <>
    <path d="M4.2 9.6A8.2 8.2 0 1 1 3.9 14" />
    <path d="M3.4 4.5v5.2h5.2" />
  </>
)
export const Truck = make(
  <>
    <path d="M2.8 6.6h10.6v10H2.8z" />
    <path d="M13.4 10h3.5l3.3 3.2v3.4h-6.8z" />
    <circle cx="7" cy="18.4" r="1.9" />
    <circle cx="16.6" cy="18.4" r="1.9" />
  </>
)
export const Paper = make(
  <>
    <path d="M6 3h7.5L18.5 8v13H6z" />
    <path d="M13.3 3v5.2h5.2M9 13h6.5M9 16.5h4.5" />
  </>
)
export const Mentor = make(
  <>
    <circle cx="12" cy="7.4" r="3.4" />
    <path d="M5.5 20.5a6.5 6.5 0 0 1 13 0" />
    <path d="M18.3 3.4a4.6 4.6 0 0 1 0 8" opacity=".45" />
  </>
)
export const Chart = make(
  <>
    <path d="M3.5 20.5h17" />
    <path d="M6.8 20.5v-6M11.2 20.5V8.4M15.6 20.5v-3.6M20 20.5V4.6" />
  </>
)
export const Award = make(
  <>
    <circle cx="12" cy="9" r="5.4" />
    <path d="m8.6 13.4-1.4 7 4.8-2.6 4.8 2.6-1.4-7" />
  </>
)
export const Shield = make(
  <>
    <path d="M12 3 5 5.7v5.6c0 4.2 2.8 8.1 7 9.4 4.2-1.3 7-5.2 7-9.4V5.7z" />
    <path d="m9 11.8 2.2 2.2 4-4.3" />
  </>
)
export const Cart = make(
  <>
    <path d="M3 4.5h2.4l2.3 10.6h9.5l2.1-7.6H6.3" />
    <circle cx="9.2" cy="19" r="1.6" />
    <circle cx="16.6" cy="19" r="1.6" />
  </>
)
export const Trash = make(
  <>
    <path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M6.5 6.5 7.6 20a1.3 1.3 0 0 0 1.3 1.2h6.2a1.3 1.3 0 0 0 1.3-1.2l1.1-13.5" />
  </>
)
export const Card = make(
  <>
    <rect x="2.8" y="5" width="18.4" height="14" rx="2.6" />
    <path d="M2.8 9.8h18.4M6.4 15.2h3.2" />
  </>
)
export const Bank = make(
  <>
    <path d="M3.4 9.6 12 4.5l8.6 5.1H3.4z" />
    <path d="M5.8 9.6v8M10 9.6v8M14 9.6v8M18.2 9.6v8M3 20.5h18" />
  </>
)
export const Wallet = make(
  <>
    <rect x="3" y="6" width="18" height="13" rx="2.6" />
    <path d="M16.6 11.4h4.4v3.4h-4.4a1.7 1.7 0 0 1 0-3.4Z" />
  </>
)
export const Info = make(
  <>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 11.2v5M12 7.9v.1" />
  </>
)
export const Quote = make(
  <path d="M9.4 6C6.3 7.5 4.5 10.2 4.5 13.5c0 2.7 1.6 4.5 3.8 4.5 2 0 3.5-1.5 3.5-3.4 0-1.9-1.3-3.3-3.1-3.3h-.5c.3-1.4 1.4-2.6 3-3.4L9.4 6Zm9 0c-3.1 1.5-4.9 4.2-4.9 7.5 0 2.7 1.6 4.5 3.8 4.5 2 0 3.5-1.5 3.5-3.4 0-1.9-1.3-3.3-3.1-3.3h-.5c.3-1.4 1.4-2.6 3-3.4L18.4 6Z" />,
  { fill: true }
)
export const Sparkle = make(
  <path d="M12 3.5 13.6 9l5.4 1.7-5.4 1.7-1.6 5.6-1.6-5.6L5 10.7 10.4 9 12 3.5ZM19 15.5l.7 2.2 2.3.8-2.3.8-.7 2.2-.7-2.2-2.3-.8 2.3-.8.7-2.2Z" />,
  { fill: true }
)
export const Calendar = make(
  <>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.4" />
    <path d="M3.5 9.8h17M8.2 3.2v3.4M15.8 3.2v3.4" />
  </>
)
export const Globe = make(
  <>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M3.6 12h16.8" />
    <path d="M12 3.4a13 13 0 0 1 0 17.2 13 13 0 0 1 0-17.2Z" />
  </>
)
