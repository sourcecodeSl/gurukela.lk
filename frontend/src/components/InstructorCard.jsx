import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import { Avatar, Badge, Card, Stars, money, hours } from './ui.jsx'
import { Shield, Clock, MapPin, Users } from './icons.jsx'

export default function InstructorCard({ instructor: ins }) {
  const app = useApp()
  const subjects = app.subjectsOf(ins.id)
  const openSlots = app.slotsOf(ins.id).filter((s) => s.status === 'open').length

  return (
    <Card hover className="col" style={{ gap: 14 }}>
      <div className="row" style={{ alignItems: 'flex-start', gap: 13 }}>
        <Avatar name={ins.name} hue={ins.hue} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 6 }}>
            <Link to={`/instructor/${ins.id}`} style={{ fontWeight: 700, fontSize: 15 }} className="truncate">
              {ins.name}
            </Link>
            {ins.verified && <Shield width={15} height={15} className="accent" aria-label="Verified" />}
          </div>
          <p className="small muted truncate">{ins.title}</p>
          <div style={{ marginTop: 5 }}>
            <Stars value={ins.rating} showValue count={ins.reviewCount} />
          </div>
        </div>
      </div>

      <div className="row wrap" style={{ gap: 6 }}>
        {subjects.slice(0, 3).map((s) => (
          <Badge key={s.id}>{s.name}</Badge>
        ))}
        {subjects.length > 3 && <Badge>+{subjects.length - 3}</Badge>}
      </div>

      <p className="small muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {ins.bio}
      </p>

      <div className="row wrap tiny faint" style={{ gap: 14 }}>
        <span className="row" style={{ gap: 5 }}>
          <Clock width={13} height={13} />
          {hours(ins.teachingHours)} hrs taught
        </span>
        <span className="row" style={{ gap: 5 }}>
          <Users width={13} height={13} />
          {ins.studentCount} students
        </span>
        <span className="row" style={{ gap: 5 }}>
          <MapPin width={13} height={13} />
          {ins.city}
        </span>
      </div>

      <hr className="divider" />

      <div className="row">
        <div className="col">
          <span className="bold" style={{ fontSize: 15 }}>{money(ins.hourlyRate)}</span>
          <span className="tiny faint">per hour</span>
        </div>
        <div className="spacer" />
        {openSlots > 0 && <Badge tone="success">{openSlots} free slots</Badge>}
        <Link className="btn btn-primary btn-sm" to={`/instructor/${ins.id}`}>
          View profile
        </Link>
      </div>
    </Card>
  )
}
