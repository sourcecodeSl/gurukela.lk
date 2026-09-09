/**
 * Home-page ad rail. Fetches the active ads from the API and rides them on the
 * same auto-scrolling marquee as the results wall — a long horizontal strip in
 * the normal page flow, so the ads never float or pin over the other sections.
 */

import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { ResultRail } from './components.jsx'

function AdCard({ ad, duplicate }) {
  const [imgOk, setImgOk] = useState(Boolean(ad.imageUrl))
  const hasImg = Boolean(ad.imageUrl) && imgOk

  // Text-only cards (no image, or a broken one) get a modifier so they keep a
  // consistent size and centre their content instead of looking thin/empty.
  const cls = `gk-ad gk-ad--rail${hasImg ? '' : ' gk-ad--noimg'}`

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

  if (!ad.link) {
    return <div className={cls} aria-hidden={duplicate || undefined}>{body}</div>
  }

  const external = /^https?:\/\//i.test(ad.link)
  return (
    <a
      className={cls}
      href={ad.link}
      aria-hidden={duplicate || undefined}
      {...(duplicate ? { tabIndex: -1 } : {})}
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

  return (
    <div className="gk-ad-marquee" aria-label="Advertisements">
      <ResultRail
        items={ads}
        interval={3.6}
        glide={0.9}
        renderItem={(ad, i, duplicate) => (
          <AdCard key={`${ad.id}-${i}`} ad={ad} duplicate={duplicate} />
        )}
      />
    </div>
  )
}
