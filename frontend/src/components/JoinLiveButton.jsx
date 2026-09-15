import { useApp } from '../store/AppContext.jsx'
import { Video } from './icons.jsx'

/**
 * Student "Join live" button. When the class has an in-site Zoom meeting it opens
 * the embedded room (attendee — cannot record). Otherwise it falls back to the
 * external Meet/Zoom link. Renders nothing when there is no way to join yet.
 *
 *   <JoinLiveButton type="seminar" refId={s.id} hasZoom={s.hasZoom} meetLink={reg.meetLink} title={s.title} />
 */
export default function JoinLiveButton({
  type,
  refId,
  hasZoom,
  meetLink,
  title,
  size = 'sm',
  label = 'Join live',
}) {
  const app = useApp()

  if (app.zoomEnabled && hasZoom) {
    return (
      <button
        className={`btn btn-primary btn-${size}`}
        onClick={() => app.openLiveRoom(type, refId, title)}
      >
        <Video width={14} height={14} /> {label}
      </button>
    )
  }

  if (meetLink) {
    return (
      <a className={`btn btn-primary btn-${size}`} href={meetLink} target="_blank" rel="noreferrer">
        <Video width={14} height={14} /> {label}
      </a>
    )
  }

  return null
}
