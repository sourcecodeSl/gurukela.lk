import { useApp } from '../store/AppContext.jsx'
import { Video } from './icons.jsx'

/**
 * Student "Join live" button. One-on-one slots run in-site via the Daily room
 * (`hasZoom`). Group classes and seminars use an external meeting link
 * (`meetLink`) the teacher pastes — opens Zoom/Meet/etc. in a new tab.
 * (`youtubeUrl` is still honoured for any old broadcast data.) Renders nothing
 * when there is no way to join yet.
 *
 *   <JoinLiveButton type="seminar" refId={s.id} meetLink={reg.meetLink} title={s.title} label="Join live" />
 */
export default function JoinLiveButton({
  type,
  refId,
  hasZoom,
  meetLink,
  youtubeUrl,
  title,
  size = 'sm',
  label = 'Join live',
}) {
  const app = useApp()

  // 1-on-1 slots: the in-site Daily room.
  if (type === 'slot' && app.zoomEnabled && hasZoom) {
    return (
      <button
        className={`btn btn-primary btn-${size}`}
        onClick={() => app.openLiveRoom(type, refId, title)}
      >
        <Video width={14} height={14} /> {label}
      </button>
    )
  }

  // Group classes / seminars (and slots with a manual link): external meeting link.
  if (meetLink) {
    return (
      <a className={`btn btn-primary btn-${size}`} href={meetLink} target="_blank" rel="noreferrer">
        <Video width={14} height={14} /> {label}
      </a>
    )
  }

  // Legacy YouTube broadcast — watch embedded (kept for old data only).
  if (youtubeUrl) {
    return (
      <button
        className={`btn btn-primary btn-${size}`}
        onClick={() => app.openLiveRoom(type, refId, title, youtubeUrl)}
      >
        <Video width={14} height={14} /> {label}
      </button>
    )
  }

  return null
}
