import type { DeviceType } from '../shared'

// Встроенные браузеры приложений — отдельной строкой в отчёте: в них открывается ~80 % трафика.
export const IN_APP_BROWSERS = [
  'Instagram',
  'Facebook',
  'WhatsApp',
  'TikTok',
  'Telegram',
  'Android WebView',
  'iOS WebView',
]

const BROWSERS: [RegExp, string][] = [
  [/Instagram/, 'Instagram'],
  [/FBAN|FBAV|FB_IAB|FBIOS/, 'Facebook'],
  [/musical_ly|BytedanceWebview|TikTok/, 'TikTok'],
  [/WhatsApp/, 'WhatsApp'],
  [/Telegram/, 'Telegram'],
  [/YaBrowser|YaSearchBrowser|YaApp/, 'Яндекс Браузер'],
  [/SamsungBrowser/, 'Samsung Internet'],
  [/OPR\/|Opera|OPiOS/, 'Opera'],
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/Firefox|FxiOS/, 'Firefox'],
  [/; wv\)/, 'Android WebView'],
  [/CriOS|Chrome\//, 'Chrome'],
  [/(iPhone|iPad|iPod).*AppleWebKit(?!.*Safari)/, 'iOS WebView'],
  [/Safari\//, 'Safari'],
]

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/CrOS/, 'ChromeOS'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
]

const pick = (ua: string, list: [RegExp, string][]) =>
  list.find(([re]) => re.test(ua))?.[1] ?? 'Другой'

export function parseUserAgent(ua: string, clientDevice?: DeviceType) {
  let device: DeviceType = 'desktop'
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) {
    device = 'tablet'
  } else if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) {
    device = 'mobile'
  }
  // iPadOS притворяется Mac — тут вернее определение на клиенте (по сенсорному экрану).
  if (clientDevice && device === 'desktop' && clientDevice === 'tablet') device = 'tablet'

  return { device, browser: pick(ua, BROWSERS), os: pick(ua, SYSTEMS) }
}
