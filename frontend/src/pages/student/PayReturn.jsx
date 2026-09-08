import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../../store/AppContext.jsx'
import { api } from '../../api/client.js'
import { Card, Empty } from '../../components/ui.jsx'
import { Check, Clock, X } from '../../components/icons.jsx'

/**
 * Landing page after returning from PayHere. The booking is confirmed by the
 * server-side notify callback, so here we just poll our own status endpoint a
 * few times and reflect the result.
 */
export default function PayReturn({ cancelled = false }) {
  const app = useApp()
  const [params] = useSearchParams()
  const order = params.get('order') || ''
  const [state, setState] = useState(cancelled ? 'cancelled' : 'checking')

  useEffect(() => {
    if (cancelled || !order) return
    let tries = 0
    let timer
    const poll = async () => {
      tries += 1
      try {
        const { paid } = await api.get(`/payments/payhere/status?order=${encodeURIComponent(order)}`)
        if (paid) {
          setState('paid')
          app.refresh?.()
          return
        }
      } catch { /* keep trying */ }
      if (tries >= 6) setState('pending')
      else timer = setTimeout(poll, 2000)
    }
    poll()
    return () => clearTimeout(timer)
  }, [order, cancelled, app])

  const view = {
    checking: { icon: Clock, title: 'Confirming your payment…', body: 'This only takes a moment. Please don’t close this page.' },
    paid: { icon: Check, title: 'Payment successful 🎉', body: 'Your booking is confirmed. You’ll find it under My Bookings and My Schedule.' },
    pending: { icon: Clock, title: 'Payment is processing', body: 'If you completed the payment, your booking will appear shortly under My Bookings. Refresh in a minute.' },
    cancelled: { icon: X, title: 'Payment cancelled', body: 'No charge was made. You can try again anytime from your bookings.' },
  }[state]

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <Card>
        <Empty
          icon={view.icon}
          title={view.title}
          action={
            <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
              <Link className="btn btn-primary" to="/bookings">Go to My Bookings</Link>
              <Link className="btn btn-outline" to="/schedule">My Schedule</Link>
            </div>
          }
        >
          {view.body}
        </Empty>
      </Card>
    </div>
  )
}
