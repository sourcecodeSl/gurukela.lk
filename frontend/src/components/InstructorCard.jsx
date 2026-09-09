import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import Portrait from '../site/art/Portrait.jsx'
import { Card, money } from './ui.jsx'
import { Shield, Star } from './icons.jsx'

/**
 * Instructor card for the student portal. Visually mirrors the public site's
 * lecturer card (illustrated portrait, medium badge, subject-above-name, rating
 * + students footer) so a signed-in student sees the same design language — with
 * the portal's booking extras (price and free slots) kept in a slim footer.
 */
export default function InstructorCard({ instructor: ins }) {
  const app = useApp()
  const subject = app.subjectsOf(ins.id)[0]
  const openSlots = app.slotsOf(ins.id).filter((s) => s.status === 'open').length
  const medium = ins.languages?.[0]

  return (
    <Card hover pad={false} className="tutor">
      <Link to={`/instructor/${ins.id}`} className="tutor__photo" aria-label={`View ${ins.name}`}>
        <Portrait id={ins.id} name={ins.name} />
        {medium && <span className="tutor__medium">{medium} medium</span>}
        {ins.verified && (
          <span className="tutor__verified" title="Verified">
            <Shield width={14} height={14} />
          </span>
        )}
        {openSlots > 0 && <span className="tutor__slots">{openSlots} free slots</span>}
      </Link>

      <div className="tutor__body">
        {subject && <span className="tutor__subject">{subject.name}</span>}
        <Link to={`/instructor/${ins.id}`} className="tutor__name truncate">{ins.name}</Link>
        <span className="tutor__title truncate">{ins.title}</span>
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
