import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Dynamic theming.
 *
 * Every colour in the app is derived from three knobs the user controls:
 *   accent hue (0-360), accent saturation, and light/dark/system mode.
 * We write the resolved values onto <html> as CSS custom properties, so any
 * component can just use var(--accent) and follow along automatically.
 */

export const PRESETS = [
  { id: 'indigo', name: 'Indigo', hue: 245, sat: 72 },
  { id: 'violet', name: 'Violet', hue: 275, sat: 68 },
  { id: 'ocean', name: 'Ocean', hue: 205, sat: 78 },
  { id: 'teal', name: 'Teal', hue: 172, sat: 62 },
  { id: 'emerald', name: 'Emerald', hue: 152, sat: 58 },
  { id: 'amber', name: 'Amber', hue: 35, sat: 84 },
  { id: 'rose', name: 'Rose', hue: 348, sat: 72 },
  { id: 'crimson', name: 'Crimson', hue: 8, sat: 70 },
]

const RADII = { sharp: 6, soft: 12, round: 18 }

const DEFAULTS = { hue: 245, sat: 72, mode: 'system', radius: 'soft', density: 'comfortable' }
const STORAGE_KEY = 'edulink.theme'

const ThemeCtx = createContext(null)
export const useTheme = () => useContext(ThemeCtx)

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Paint the resolved palette onto the document root. */
function applyTheme({ hue, sat, radius, density }, dark) {
  const r = document.documentElement.style
  const h = hue
  const s = sat

  if (dark) {
    r.setProperty('--bg', `hsl(${h} 18% 8%)`)
    r.setProperty('--bg-elevated', `hsl(${h} 16% 11%)`)
    r.setProperty('--surface', `hsl(${h} 15% 13%)`)
    r.setProperty('--surface-2', `hsl(${h} 14% 17%)`)
    r.setProperty('--border', `hsl(${h} 12% 22%)`)
    r.setProperty('--border-strong', `hsl(${h} 12% 30%)`)
    r.setProperty('--text', `hsl(${h} 12% 95%)`)
    r.setProperty('--text-muted', `hsl(${h} 8% 66%)`)
    r.setProperty('--text-faint', `hsl(${h} 8% 50%)`)
    r.setProperty('--accent', `hsl(${h} ${s}% 64%)`)
    r.setProperty('--accent-hover', `hsl(${h} ${s}% 70%)`)
    r.setProperty('--accent-fg', `hsl(${h} 40% 10%)`)
    r.setProperty('--accent-soft', `hsl(${h} ${Math.round(s * 0.45)}% 18%)`)
    r.setProperty('--accent-border', `hsl(${h} ${Math.round(s * 0.4)}% 30%)`)
    r.setProperty('--shadow', '0 1px 2px hsl(0 0% 0% / .5), 0 8px 24px hsl(0 0% 0% / .35)')
    r.setProperty('--shadow-sm', '0 1px 2px hsl(0 0% 0% / .5)')
    r.setProperty('--success', 'hsl(150 55% 55%)')
    r.setProperty('--success-soft', 'hsl(150 30% 16%)')
    r.setProperty('--warning', 'hsl(38 85% 60%)')
    r.setProperty('--warning-soft', 'hsl(38 40% 16%)')
    r.setProperty('--danger', 'hsl(2 75% 63%)')
    r.setProperty('--danger-soft', 'hsl(2 35% 18%)')
    r.setProperty('--star', 'hsl(42 95% 60%)')
  } else {
    r.setProperty('--bg', `hsl(${h} 30% 97.5%)`)
    r.setProperty('--bg-elevated', '#ffffff')
    r.setProperty('--surface', '#ffffff')
    r.setProperty('--surface-2', `hsl(${h} 32% 96%)`)
    r.setProperty('--border', `hsl(${h} 22% 90%)`)
    r.setProperty('--border-strong', `hsl(${h} 20% 80%)`)
    r.setProperty('--text', `hsl(${h} 28% 13%)`)
    r.setProperty('--text-muted', `hsl(${h} 12% 42%)`)
    r.setProperty('--text-faint', `hsl(${h} 10% 58%)`)
    r.setProperty('--accent', `hsl(${h} ${s}% 48%)`)
    r.setProperty('--accent-hover', `hsl(${h} ${s}% 41%)`)
    r.setProperty('--accent-fg', '#ffffff')
    r.setProperty('--accent-soft', `hsl(${h} ${Math.round(s * 0.85)}% 96%)`)
    r.setProperty('--accent-border', `hsl(${h} ${Math.round(s * 0.6)}% 86%)`)
    r.setProperty('--shadow', '0 1px 2px hsl(220 20% 40% / .08), 0 8px 24px hsl(220 20% 40% / .08)')
    r.setProperty('--shadow-sm', '0 1px 2px hsl(220 20% 40% / .1)')
    r.setProperty('--success', 'hsl(150 62% 32%)')
    r.setProperty('--success-soft', 'hsl(150 60% 95%)')
    r.setProperty('--warning', 'hsl(32 90% 38%)')
    r.setProperty('--warning-soft', 'hsl(38 90% 95%)')
    r.setProperty('--danger', 'hsl(2 70% 47%)')
    r.setProperty('--danger-soft', 'hsl(2 80% 96%)')
    r.setProperty('--star', 'hsl(38 92% 50%)')
  }

  const rad = RADII[radius] ?? RADII.soft
  r.setProperty('--r-sm', `${Math.round(rad * 0.5)}px`)
  r.setProperty('--r', `${rad}px`)
  r.setProperty('--r-lg', `${Math.round(rad * 1.6)}px`)
  r.setProperty('--r-xl', `${Math.round(rad * 2.2)}px`)
  r.setProperty('--gap', density === 'compact' ? '14px' : '20px')
  r.setProperty('--pad', density === 'compact' ? '14px' : '20px')

  document.documentElement.dataset.mode = dark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(load)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const isDark = theme.mode === 'system' ? systemDark : theme.mode === 'dark'

  useEffect(() => {
    applyTheme(theme, isDark)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
  }, [theme, isDark])

  const value = useMemo(
    () => ({
      theme,
      isDark,
      set: (patch) => setTheme((t) => ({ ...t, ...patch })),
      reset: () => setTheme({ ...DEFAULTS }),
      presets: PRESETS,
    }),
    [theme, isDark]
  )

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}
