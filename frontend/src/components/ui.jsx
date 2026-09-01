import { useEffect } from 'react'
import { Star, X, Check } from './icons.jsx'

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

export const money = (n) => `Rs. ${Number(n).toLocaleString('en-LK')}`

export const initials = (name = '') =>
  name
    .replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

export const fmtDate = (iso, opts = { day: 'numeric', month: 'short' }) =>
  new Date(iso).toLocaleDateString('en-GB', opts)

export const fmtDay = (iso) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short' })

export const fmtTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

export const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d} days ago`
  const mo = Math.floor(d / 30)
  return mo === 1 ? '1 month ago' : `${mo} months ago`
}

export const hours = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export function Avatar({ name, hue = 245, size = 40, src }) {
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.38),
    background: src ? undefined : `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${hue + 28} 62% 45%))`,
  }
  if (src) return <img className="avatar" src={src} alt={name} style={style} />
  return (
    <div className="avatar" style={style} aria-hidden="true">
      {initials(name)}
    </div>
  )
}

export function Stars({ value = 0, size = 'sm', showValue = false, count }) {
  const full = Math.round(value)
  return (
    <span className="row" style={{ gap: 6 }}>
      <span className={`stars ${size === 'lg' ? 'lg' : ''}`} aria-label={`${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} fill={i <= full ? 'currentColor' : 'none'} opacity={i <= full ? 1 : 0.28} />
        ))}
      </span>
      {showValue && <b style={{ fontSize: size === 'lg' ? 15 : 13 }}>{value.toFixed(1)}</b>}
      {count != null && <span className="faint small">({count})</span>}
    </span>
  )
}

export function Badge({ children, tone = '', ...rest }) {
  return (
    <span className={`badge ${tone ? `badge-${tone}` : ''}`} {...rest}>
      {children}
    </span>
  )
}

export function Card({ children, hover, pad = true, className = '', ...rest }) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${pad ? 'card-pad' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function Modal({ open, onClose, title, subtitle, children, footer, width }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={width ? { maxWidth: width } : undefined} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <h2>{title}</h2>
            {subtitle && <p className="muted small" style={{ marginTop: 4 }}>{subtitle}</p>}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="ico">
          <Icon width={34} height={34} />
        </div>
      )}
      <h3>{title}</h3>
      {children && <p className="small" style={{ maxWidth: 380, margin: '0 auto' }}>{children}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          className={`tab ${value === t.id ? 'on' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count != null && t.count > 0 && (
            <span className="badge badge-accent" style={{ marginLeft: 7 }}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export function Stat({ label, value, sub, icon: Icon, tone }) {
  return (
    <Card>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="stat" style={{ flex: 1 }}>
          <span className="k">{label}</span>
          <span className="v" style={tone ? { color: `var(--${tone})` } : undefined}>{value}</span>
          {sub && <span className="tiny faint">{sub}</span>}
        </div>
        {Icon && (
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 38,
              height: 38,
              borderRadius: 'var(--r)',
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
            }}
          >
            <Icon width={19} height={19} />
          </span>
        )}
      </div>
    </Card>
  )
}

export function Meter({ value, max = 100 }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Toasts({ items }) {
  if (!items.length) return null
  return (
    <div className="toasts">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.kind === 'err' ? <X width={16} height={16} /> : <Check width={16} height={16} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

/** Status pill used across request / booking lists. */
export function StatusBadge({ status }) {
  const map = {
    pending: ['warning', 'Pending'],
    accepted: ['accent', 'Accepted — pay to confirm'],
    rejected: ['danger', 'Rejected'],
    paid: ['success', 'Confirmed'],
    lost: ['danger', 'Slot taken'],
    open: ['success', 'Open'],
    booked: ['danger', 'Booked'],
  }
  const [tone, label] = map[status] || ['', status]
  return <Badge tone={tone}>{label}</Badge>
}
