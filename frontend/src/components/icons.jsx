/** Minimal inline icon set — 24x24 stroke icons that inherit currentColor. */

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const make = (paths) =>
  function Icon(props) {
    return (
      <svg {...base} {...props}>
        {paths}
      </svg>
    )
  }

export const Compass = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5z" />
  </>
)
export const Users = make(
  <>
    <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
    <circle cx="9" cy="7" r="3.2" />
    <path d="M22 20v-1.5a4 4 0 0 0-3-3.87" />
    <path d="M16 3.6a4 4 0 0 1 0 7.75" />
  </>
)
export const Calendar = make(
  <>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
  </>
)
export const Clock = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 1.9" />
  </>
)
export const Ticket = make(
  <>
    <path d="M4 8.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.2a2.3 2.3 0 0 0 0 4.6v1.2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.2a2.3 2.3 0 0 0 0-4.6z" />
    <path d="M14 6.5v11" strokeDasharray="2 2.4" />
  </>
)
export const Star = make(<path d="m12 3.6 2.6 5.3 5.9.86-4.25 4.14 1 5.86L12 17l-5.25 2.76 1-5.86L3.5 9.76l5.9-.86z" />)
export const Shield = make(
  <>
    <path d="M12 3 5 5.8v5.1c0 4.3 2.9 8.3 7 9.5 4.1-1.2 7-5.2 7-9.5V5.8z" />
    <path d="m9.2 12 2 2 3.6-3.7" />
  </>
)
export const Book = make(
  <>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5z" />
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19v4H6.5A2.5 2.5 0 0 1 4 19.5z" />
  </>
)
export const Layers = make(
  <>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 13 9 5 9-5" />
  </>
)
export const Grid = make(
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </>
)
export const Search = make(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.5-3.5" />
  </>
)
export const Palette = make(
  <>
    <path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-.9.8-1.7 1.7-1.7H16A5 5 0 0 0 21 10c0-3.9-4-7-9-7z" />
    <circle cx="7.8" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="10.2" cy="7.6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="8.2" r="1.1" fill="currentColor" stroke="none" />
  </>
)
export const Check = make(<path d="m4.5 12.5 5 5 10-11" />)
export const X = make(<path d="M6 6l12 12M18 6 6 18" />)
export const Plus = make(<path d="M12 5v14M5 12h14" />)
export const Trash = make(
  <>
    <path d="M4 7h16M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
    <path d="M6.5 7.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-11.5" />
  </>
)
export const Edit = make(
  <>
    <path d="M4 20h4l10-10a2.4 2.4 0 0 0-3.4-3.4L4.6 16.6z" />
    <path d="m14 7 3 3" />
  </>
)
export const Card = make(
  <>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 10h19" />
  </>
)
export const Wallet = make(
  <>
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1.5" />
    <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
    <circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
  </>
)
export const Bell = make(
  <>
    <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5" />
    <path d="M13.7 19a2 2 0 0 1-3.4 0" />
  </>
)
export const ChevronRight = make(<path d="m9.5 5.5 7 6.5-7 6.5" />)
export const ChevronLeft = make(<path d="m14.5 5.5-7 6.5 7 6.5" />)
export const ChevronDown = make(<path d="m5.5 9.5 6.5 7 6.5-7" />)
export const Menu = make(<path d="M4 7h16M4 12h16M4 17h16" />)
export const Sun = make(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
  </>
)
export const Moon = make(<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5" />)
export const Monitor = make(
  <>
    <rect x="2.5" y="4" width="19" height="13" rx="2.2" />
    <path d="M8.5 21h7M12 17v4" />
  </>
)
export const Sparkle = make(
  <>
    <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M18.5 16.5 19 18l1.5.5-1.5.5-.5 1.5-.5-1.5L16.5 18l1.5-.5z" />
  </>
)
export const Trending = make(
  <>
    <path d="m3 16.5 5.5-5.5 3.5 3.5L21 6" />
    <path d="M15.5 6H21v5.5" />
  </>
)
export const Money = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2.1c1.6.4 2.7.9 2.7 2.2s-1.2 2.1-2.7 2.1c-1.2 0-2.2-.5-2.7-1.5M12 6.2v11.6" />
  </>
)
export const Video = make(
  <>
    <rect x="2.5" y="6" width="13" height="12" rx="2.4" />
    <path d="m15.5 10.5 6-3v9l-6-3z" />
  </>
)
export const Inbox = make(
  <>
    <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    <path d="M4.6 5.5h14.8l1.6 7.5v4.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13z" />
  </>
)
export const MapPin = make(
  <>
    <path d="M19 10.5c0 5-7 11-7 11s-7-6-7-11a7 7 0 1 1 14 0z" />
    <circle cx="12" cy="10.3" r="2.6" />
  </>
)
export const Globe = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.2 9.5h17.6M3.2 14.5h17.6" />
    <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
  </>
)
export const Award = make(
  <>
    <circle cx="12" cy="9" r="5.5" />
    <path d="m8.5 13.8-1.3 7.2 4.8-2.6 4.8 2.6-1.3-7.2" />
  </>
)
export const Logout = make(
  <>
    <path d="M14 4.5H6.5A2 2 0 0 0 4.5 6.5v11a2 2 0 0 0 2 2H14" />
    <path d="M17 8.5 20.5 12 17 15.5M20 12H9.5" />
  </>
)
export const Refresh = make(
  <>
    <path d="M20 11.5a8 8 0 1 0-.6 4.5" />
    <path d="M20 5v6.5h-6" />
  </>
)
export const Info = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.7v.6" />
  </>
)
export const Filter = make(<path d="M4 5.5h16l-6.2 7.4v5.6l-3.6 2v-7.6z" />)
