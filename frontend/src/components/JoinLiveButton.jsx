import { useApp } from '../store/AppContext.jsx'
import { Video } from './icons.jsx'

/**
 * Student "Join/Watch live" button. Group classes and seminars are a YouTube
 * broadcast (`youtubeUrl`) — opens the embedded YouTube player. One-on-one slots
 * use the in-site Daily room (`hasZoom`) or fall back to an external Meet/Zoom
 * link. Renders nothing when there is no way to join yet.
 *
 *   <JoinLiveButton type="seminar" refId={s.id} youtubeUrl={s.youtubeUrl} title={s.title} label="Watch live" />
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

  // Group classes / seminars are a YouTube broadcast — watch it embedded.
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
