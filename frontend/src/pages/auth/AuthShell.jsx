/** Centered branded frame shared by every auth screen. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <div className="auth-brand">
          <div className="brand-mark">GK</div>
          <div>
            <div className="brand-name">gurukela.lk</div>
            <div className="brand-sub">Learning platform</div>
          </div>
        </div>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="muted small auth-sub">{subtitle}</p>}
        {children}
      </div>
      {footer && <div className="auth-foot muted small">{footer}</div>}
    </div>
  )
}
