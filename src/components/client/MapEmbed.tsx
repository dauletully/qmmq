'use client'

import { MapPin } from 'lucide-react'
import { useState } from 'react'

type Props = {
  url: string | null
  labels: { later: string; show: string; open: string; title: string }
}

// Ссылка из админки → адрес для <iframe>, если сервис это позволяет (Google, Яндекс, 2ГИС).
function embedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (
      /google\./.test(u.hostname) &&
      (u.pathname.startsWith('/maps/embed') || u.searchParams.get('output') === 'embed')
    )
      return url
    if (/yandex\./.test(u.hostname)) {
      if (u.pathname.startsWith('/map-widget/')) return url
      if (
        /^\/maps\/?$/.test(u.pathname) &&
        (u.searchParams.get('ll') || u.searchParams.get('pt'))
      ) {
        u.pathname = '/map-widget/v1/'
        return u.toString()
      }
    }
    if (u.hostname === 'widgets.2gis.com') return url
  } catch {}
  return null
}

// Карта загружается только по нажатию — не мешает LCP и не тянет сторонние скрипты заранее.
export function MapEmbed({ url, labels }: Props) {
  const [shown, setShown] = useState(false)
  const embed = url ? embedUrl(url) : null
  return (
    <div className="q-grid-bg q-grid-bg--light lp-map">
      {shown && embed ? (
        <iframe
          src={embed}
          title={labels.title}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <>
          <span className="lp-map__pin" aria-hidden="true">
            <MapPin className="q-icon q-icon--lg" />
          </span>
          {!url && <p className="q-small">{labels.later}</p>}
          {url && embed && (
            <button type="button" className="q-btn q-btn--secondary" onClick={() => setShown(true)}>
              {labels.show}
            </button>
          )}
          {url && !embed && (
            <a className="q-btn q-btn--secondary" href={url} target="_blank" rel="noopener">
              {labels.open}
            </a>
          )}
        </>
      )}
    </div>
  )
}
