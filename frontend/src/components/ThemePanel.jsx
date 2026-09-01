import { useTheme } from '../theme/ThemeContext.jsx'
import { X, Sun, Moon, Monitor, Refresh, Sparkle } from './icons.jsx'

/** Right-hand drawer where the user builds their own colour theme. */
export default function ThemePanel({ onClose }) {
  const { theme, set, reset, presets } = useTheme()

  const Section = ({ title, children, hint }) => (
    <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 13.5 }}>{title}</h3>
      </div>
      {children}
      {hint && <p className="tiny faint" style={{ marginTop: 9 }}>{hint}</p>}
    </div>
  )

  return (
    <>
      <div className="scrim" style={{ zIndex: 105 }} onClick={onClose} />
      <aside className="drawer" aria-label="Theme settings">
        <div
          className="row"
          style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 2 }}
        >
          <Sparkle width={18} height={18} className="accent" />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15.5 }}>Appearance</h2>
            <p className="tiny faint">Make it yours — changes apply instantly</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <Section title="Mode">
          <div className="seg">
            {[
              ['light', 'Light', Sun],
              ['dark', 'Dark', Moon],
              ['system', 'Auto', Monitor],
            ].map(([id, label, Icon]) => (
              <button key={id} className={theme.mode === id ? 'on' : ''} onClick={() => set({ mode: id })}>
                <span className="row" style={{ justifyContent: 'center', gap: 6 }}>
                  <Icon width={14} height={14} />
                  {label}
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Accent colour">
          <div className="swatches">
            {presets.map((p) => (
              <button
                key={p.id}
                title={p.name}
                aria-label={p.name}
                className={`swatch ${theme.hue === p.hue ? 'on' : ''}`}
                style={{ background: `linear-gradient(135deg, hsl(${p.hue} ${p.sat}% 55%), hsl(${p.hue + 25} ${p.sat}% 43%))` }}
                onClick={() => set({ hue: p.hue, sat: p.sat })}
              />
            ))}
          </div>
        </Section>

        <Section title="Fine tune" hint="Drag for a colour that is not in the presets. The whole interface — surfaces, borders and highlights — is derived from these two values.">
          <div className="field" style={{ marginBottom: 16 }}>
            <div className="row">
              <label style={{ flex: 1 }}>Hue</label>
              <span className="tiny faint">{theme.hue}&deg;</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={theme.hue}
              onChange={(e) => set({ hue: +e.target.value })}
              style={{
                background:
                  'linear-gradient(to right, hsl(0 70% 55%), hsl(60 70% 55%), hsl(120 70% 55%), hsl(180 70% 55%), hsl(240 70% 55%), hsl(300 70% 55%), hsl(360 70% 55%))',
              }}
            />
          </div>
          <div className="field">
            <div className="row">
              <label style={{ flex: 1 }}>Intensity</label>
              <span className="tiny faint">{theme.sat}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              value={theme.sat}
              onChange={(e) => set({ sat: +e.target.value })}
              style={{
                background: `linear-gradient(to right, hsl(${theme.hue} 15% 60%), hsl(${theme.hue} 95% 50%))`,
              }}
            />
          </div>
        </Section>

        <Section title="Corner style">
          <div className="seg">
            {[
              ['sharp', 'Sharp'],
              ['soft', 'Soft'],
              ['round', 'Round'],
            ].map(([id, label]) => (
              <button key={id} className={theme.radius === id ? 'on' : ''} onClick={() => set({ radius: id })}>
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Density">
          <div className="seg">
            {[
              ['comfortable', 'Comfortable'],
              ['compact', 'Compact'],
            ].map(([id, label]) => (
              <button key={id} className={theme.density === id ? 'on' : ''} onClick={() => set({ density: id })}>
                {label}
              </button>
            ))}
          </div>
        </Section>

        <div style={{ padding: 20 }}>
          <button className="btn btn-outline btn-block" onClick={reset}>
            <Refresh width={15} height={15} />
            Reset to default theme
          </button>
        </div>
      </aside>
    </>
  )
}
