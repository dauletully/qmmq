import type { ReactNode } from 'react'

export type DocLinks = { offer: string | null; privacy: string | null }

// «Принимаю условия [договора-оферты](offer)…» → текст со ссылками на документы из настроек сайта.
// Нет документа — ссылка остаётся обычным текстом.
export function renderConsent(text: string, docs: DocLinks): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\[([^\]]+)\]\((offer|privacy)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const href = docs[m[2] as keyof DocLinks]
    out.push(
      href ? (
        <a key={m.index} className="q-link" href={href} target="_blank" rel="noopener">
          {m[1]}
        </a>
      ) : (
        m[1]
      ),
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
