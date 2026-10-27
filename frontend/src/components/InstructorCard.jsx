import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import Portrait from '../site/art/Portrait.jsx'
import { Card, Modal, money } from './ui.jsx'
import { Star } from './icons.jsx'

/**
 * Instructor card for the student portal. Visually mirrors the public site's
 * lecturer card (illustrated portrait, medium badge, subject-above-name, rating
 * + students footer) so a signed-in student sees the same design language — with
 * the portal's booking extras (price and free slots) kept in a slim footer.
 */
export default function InstructorCard({ instructor: ins }) {
  const app = useApp()
  const [showSubjects, setShowSubjects] = useState(false)
  const subjects = app.subjectsOf(ins.id)
  const subject = subjects[0]
  const stream = subject && app.streamById[subject.streamId]
  // Mirror the profile page: only count slots that are still upcoming and open.
  const openSlots = app.slotsOf(ins.id).filter((s) => {
    if (s.status !== 'open') return false
    const end = new Date(s.date)
    const [h, m] = (s.end || '23:59').split(':').map(Number)
    end.setHours(h, m, 0, 0)
    return end >= new Date()
  }).length
  // Mirror the public site card: show a medium badge for every instructor,
  // falling back to Sinhala (the default medium of instruction) when a teacher
  // hasn't set one yet.
  const medium = ins.languages?.[0] || 'Sinhala'

  return (
    <Card hover pad={false} className="tutor">
      <Link to={`/instructor/${ins.id}`} className="tutor__photo" aria-label={`View ${ins.name}`}>
        <Portrait id={ins.id} name={ins.name} photoUrl={ins.photoUrl} />
        {medium && <span className="tutor__medium">{medium} medium</span>}
        {stream && <span className="tutor__subject-badge">{stream.name}</span>}
      </Link>

      <div className="tutor__body">
        <span className="tutor__slots-line">
          {openSlots > 0 ? `${openSlots} free ${openSlots === 1 ? 'slot' : 'slots'}` : ' '}
        </span>
        <Link to={`/instructor/${ins.id}`} className="tutor__name truncate">{ins.name}</Link>
        {subject && (
          <span className="tutor__subject truncate">
            {subject.name}
            {subjects.length > 1 && (
              <>
                {' '}
                <button
                  type="button"
                  className="tutor__subject-more"
                  onClick={() => setShowSubjects(true)}
                >
                  &amp; {subjects.length - 1} more
                </button>
              </>
            )}
          </span>
        )}
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

      <Modal
        open={showSubjects}
        onClose={() => setShowSubjects(false)}
        title="Subjects"
        subtitle={`${subjects.length} subjects taught by ${ins.name}`}
        width={420}
      >
        <ul className="tutor__subject-list">
          {subjects.map((s) => (
            <li key={s.id}>
              <span>{s.name}</span>
              {app.streamById[s.streamId] && (
                <span className="muted small">{app.streamById[s.streamId].name}</span>
              )}
            </li>
          ))}
        </ul>
      </Modal>
    </Card>
  )
}
