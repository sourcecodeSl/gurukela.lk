import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import Portrait from '../site/art/Portrait.jsx'
import { Card, money } from './ui.jsx'
import { Star } from './icons.jsx'

/**
 * Instructor card for the student portal. Visually mirrors the public site's
 * lecturer card (illustrated portrait, medium badge, subject-above-name, rating
 * + students footer) so a signed-in student sees the same design language — with
 * the portal's booking extras (price and free slots) kept in a slim footer.
 */
export default function InstructorCard({ instructor: ins }) {
  const app = useApp()
  const subject = app.subjectsOf(ins.id)[0]
  const stream = subject && app.streamById[subject.streamId]
  // Mirror the profile page: only count slots that are still upcoming and open.
  const openSlots = app.slotsOf(ins.id).filter((s) => {
    if (s.status !== 'open') return false
    const end = new Date(s.date)
    const [h, m] = (s.end || '23:59').split(':').map(Number)
    end.setHours(h, m, 0, 0)
    return end >= new Date()
  }).length
  const medium = ins.languages?.[0]

  return (
    <Card hover pad={false} className="tutor">
      <Link to={`/instructor/${ins.id}`} className="tutor__photo" aria-label={`View ${ins.name}`}>
        <Portrait id={ins.id} name={ins.name} photoUrl={ins.photoUrl} />
        {medium && <span className="tutor__medium">{medium} medium</span>}
        {stream && <span className="tutor__subject-badge">{stream.name}</span>}
      </Link>

      <div className="tutor__body">
        {openSlots > 0 && (
          <span className="tutor__slots-line">
            {openSlots} free {openSlots === 1 ? 'slot' : 'slots'}
          </span>
        )}
        <Link to={`/instructor/${ins.id}`} className="tutor__name truncate">{ins.name}</Link>
        <div className="tutor__meta">
          <span className="tutor__rating">
            <Star width={14} height={14} fill="currentColor" />
            {ins.rating.toFixed(1)}
          </span>
          <span>{ins.studentCount.toLocaleString('en-LK')} students</span>
        </div>
      </div>

      <div className="tutor__foot">
        <div className="tutor__price">
          <b>{money(ins.hourlyRate)}</b>
          <span>per hour</span>
        </div>
        <div className="spacer" />
        <Link className="btn btn-primary btn-sm" to={`/instructor/${ins.id}`}>
          View profile
        </Link>
      </div>
    </Card>
  )
}
