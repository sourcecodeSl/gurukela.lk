/**
 * Home-page side-rail ads. Fetches the active ads from the API and pins them
 * in the empty left/right gutters beside the centered content on wide screens.
 * The first two (by position) go on the left rail, the next two on the right.
 * Below the gutter breakpoint the same cards collapse into a responsive grid
 * in the normal page flow (handled in site.css) instead of disappearing.
 */

import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

function AdCard({ ad }) {
  const [imgOk, setImgOk] = useState(Boolean(ad.imageUrl))
  const hasImg = Boolean(ad.imageUrl) && imgOk

  // Text-only cards (no image, or a broken one) get a modifier so they keep a
  // consistent size and centre their content instead of looking thin/empty.
  const cls = `gk-ad${hasImg ? '' : ' gk-ad--noimg'}`

  const body = (
    <>
      {ad.imageUrl && imgOk && (
        <img
          className="gk-ad__img"
          src={ad.imageUrl}
          alt={ad.title || 'Advertisement'}
          loading="lazy"
          onError={() => setImgOk(false)}
        />
      )}
      {(ad.title || ad.text) && (
        <div className="gk-ad__body">
          {ad.title && <h4 className="gk-ad__title">{ad.title}</h4>}
          {ad.text && <p className="gk-ad__text">{ad.text}</p>}
        </div>
      )}
    </>
  )

  if (!ad.link) return <div className={cls}>{body}</div>

  const external = /^https?:\/\//i.test(ad.link)
  return (
    <a
      className={cls}
      href={ad.link}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {body}
    </a>
  )
}

export default function SiteAds() {
  const [ads, setAds] = useState([])

  useEffect(() => {
    let alive = true
    api
      .get('/ads', { auth: false })
      .then((rows) => alive && setAds(Array.isArray(rows) ? rows : []))
      .catch(() => {}) // ads are non-critical; fail silently
    return () => {
      alive = false
    }
  }, [])

  if (!ads.length) return null

  const left = ads.slice(0, 2)
  const right = ads.slice(2, 4)

  return (
    <div className="gk-ad-rails" aria-label="Advertisements">
      {left.length > 0 && (
        <aside className="gk-ad-rail gk-ad-rail--left">
          {left.map((ad) => <AdCard key={ad.id} ad={ad} />)}
        </aside>
      )}
      {right.length > 0 && (
        <aside className="gk-ad-rail gk-ad-rail--right">
          {right.map((ad) => <AdCard key={ad.id} ad={ad} />)}
        </aside>
      )}
    </div>
  )
}
