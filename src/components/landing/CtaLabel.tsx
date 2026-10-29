import type { Dict } from '@/i18n/dictionary'
import { formatPrice } from '@/i18n/format'

// Подпись кнопки регистрации: до дедлайна — текст и цена, после — «Лист ожидания».
// Обе версии в разметке, видимую выбирает data-reg на .lp (работает и в закешированной странице).
export function CtaLabel({
  t,
  label,
  price,
  short,
}: {
  t: Dict
  label?: string
  price?: number
  short?: boolean
}) {
  const text = label || t.register
  const withPrice = !short && price && !/₸/.test(text)
  return (
    <>
      <span className="if-open lp-cta-label">
        {withPrice ? (
          <>
            {text} <span className="q-btn__sep">—</span>{' '}
            <span className="lp-nowrap">{formatPrice(price)}</span>
          </>
        ) : (
          text
        )}
      </span>
      <span className="if-closed">{short ? t.waitlistShort : t.waitlistCta}</span>
    </>
  )
}
