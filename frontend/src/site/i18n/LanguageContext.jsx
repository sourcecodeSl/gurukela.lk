/**
 * Language for the public site: English or Sinhala.
 *
 * Two lookups, because the site has two kinds of text:
 *
 *   t('nav.home')  — interface chrome, from the dictionary in strings.js
 *   tr(value)      — content out of siteData, where a translatable value is
 *                    written as { en, si } instead of a bare string
 *
 * `tr` falls back to English for anything not translated yet and passes plain
 * strings straight through, so content can be converted a field at a time
 * without ever leaving a gap on the page.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STRINGS } from './strings.js'

export const LANGS = [
  { id: 'en', short: 'EN', label: 'English' },
  { id: 'si', short: 'සිං', label: 'සිංහල' },
]

const KEY = 'gurukela.lang'
const DEFAULT = 'en'

const LangCtx = createContext(null)
export const useLang = () => useContext(LangCtx)

function load() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'si') return saved
    // No choice stored yet — follow the browser, but only for Sinhala.
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('si')) return 'si'
  } catch {
    /* private windows and blocked storage fall through to the default */
  }
  return DEFAULT
}

/** Resolve one value: { en, si } → a string; anything else is returned as-is. */
export function pick(value, lang) {
  if (Array.isArray(value)) return value.map((v) => pick(v, lang))
  if (value && typeof value === 'object' && ('en' in value || 'si' in value)) {
    return value[lang] ?? value.en ?? ''
  }
  return value
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      /* not fatal — the choice just won't survive a reload */
    }
    // Screen readers, hyphenation and font fallback all key off this.
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback(
    (key) => {
      const entry = STRINGS[key]
      if (!entry) return key // a missing key shows itself rather than blanking the UI
      return entry[lang] ?? entry.en ?? key
    },
    [lang]
  )

  const tr = useCallback((value) => pick(value, lang), [lang])

  const value = useMemo(
    () => ({ lang, setLang, t, tr, isSi: lang === 'si' }),
    [lang, t, tr]
  )

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>
}
