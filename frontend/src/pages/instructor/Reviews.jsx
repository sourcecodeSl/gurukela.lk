import { useApp } from '../../store/AppContext.jsx'
import { Avatar, Badge, Card, Empty, Stars, Stat, timeAgo } from '../../components/ui.jsx'
import { Star, Shield, Users, Award } from '../../components/icons.jsx'

export default function Reviews() {
  const app = useApp()
  const me = app.instructorById[app.session.id]
  const reviews = app.reviewsOf(me.id).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const breakdown = [5, 4, 3, 2, 1].map((n) => ({ stars: n, count: reviews.filter((r) => r.rating === n).length }))
  const avgDays = reviews.length
    ? Math.round(reviews.reduce((s, r) => s + r.daysStudied, 0) / reviews.length)
    : 0

  return (
    <>
      <div className="page-head">
        <h1>Reviews</h1>
        <p className="sub">Only students who paid and studied with you for at least a month can leave one.</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <Stat label="Average rating" value={me.rating.toFixed(1)} sub={`${me.reviewCount} reviews`} icon={Star} />
        <Stat label="5-star reviews" value={breakdown[0].count} icon={Award} />
        <Stat label="Students taught" value={me.studentCount} icon={Users} />
        <Stat label="Avg. study length" value={`${avgDays} days`} sub="before reviewing" icon={Shield} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(240px, 1fr) minmax(0, 2fr)' }}>
        <Card style={{ alignSelf: 'flex-start' }}>
          <h3 style={{ marginBottom: 14 }}>Breakdown</h3>
          <div className="col center" style={{ alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-.03em' }}>{me.rating.toFixed(1)}</span>
            <Stars value={me.rating} size="lg" />
          </div>
          {breakdown.map((b) => (
            <div key={b.stars} className="row" style={{ gap: 9, marginBottom: 7 }}>
              <span className="tiny muted" style={{ width: 26 }}>{b.stars}★</span>
              <div className="meter" style={{ flex: 1 }}>
                <i style={{ width: `${reviews.length ? (b.count / reviews.length) * 100 : 0}%` }} />
              </div>
              <span className="tiny faint" style={{ width: 18, textAlign: 'right' }}>{b.count}</span>
            </div>
          ))}
        </Card>

        {reviews.length === 0 ? (
          <Card><Empty icon={Star} title="No reviews yet">They arrive once your students pass their first month.</Empty></Card>
        ) : (
          <div className="col" style={{ gap: 12 }}>
            {reviews.map((r) => {
              const std = app.studentById[r.studentId]
              return (
                <Card key={r.id}>
                  <div className="row" style={{ gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                    <Avatar name={std?.name} hue={std?.hue} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row wrap" style={{ gap: 7 }}>
                        <span style={{ fontWeight: 600 }}>{std?.name}</span>
                        <Badge tone="success"><Shield width={11} height={11} /> Verified student</Badge>
                      </div>
                      <span className="tiny faint">{r.daysStudied} days of paid classes · {timeAgo(r.createdAt)}</span>
                    </div>
                    <Stars value={r.rating} />
                  </div>
                  <p className="muted" style={{ lineHeight: 1.7 }}>{r.text}</p>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
