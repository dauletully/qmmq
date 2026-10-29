'use client'

import { useEffect } from 'react'

import { groupThousands } from '@/i18n/format'

import { POSITION_KEY } from './LangSwitch'

const COUNT_MS = 1200

// «10 000+» → { prefix: '', n: 10000, suffix: '+' }
function parseCount(text: string) {
  const m = /^([^\d]*)([\d\s ]+)(.*)$/.exec(text.trim())
  if (!m) return null
  const n = Number(m[2].replace(/[\s ]/g, ''))
  return Number.isFinite(n) && n > 0 ? { prefix: m[1], n, suffix: m[3] } : null
}

function countUp(el: HTMLElement, final: string) {
  const p = parseCount(final)
  if (!p) return
  const start = performance.now()
  const step = (now: number) => {
    const k = Math.min(1, (now - start) / COUNT_MS)
    const eased = 1 - Math.pow(1 - k, 3)
    el.textContent = `${p.prefix}${groupThousands(p.n * eased)}${k === 1 ? p.suffix : ''}`
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1))
  if (!id) return
  const el = document.getElementById(id)
  const details = el?.closest('details')
  if (details && !details.open) details.open = true
}

function restoreLangPosition() {
  let pos: { id: string; ratio: number } | null = null
  try {
    pos = JSON.parse(sessionStorage.getItem(POSITION_KEY) || 'null')
    sessionStorage.removeItem(POSITION_KEY)
  } catch {}
  if (!pos || location.hash !== `#${pos.id}`) return
  const el = document.getElementById(pos.id)
  if (!el) return
  const header = document.querySelector('.lp-header')?.getBoundingClientRect().height ?? 0
  const top = el.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top: top - header + pos.ratio * el.offsetHeight, behavior: 'instant' })
}

// Лёгкие эффекты страницы: проявление блоков, досчёт цифр, подсветка пункта меню,
// раскрытие аккордеона по якорю, возврат позиции после смены языка.
export function Motion() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hasIO = 'IntersectionObserver' in window
    const cleanups: Array<() => void> = []

    const reveal = Array.from(document.querySelectorAll<HTMLElement>('.lp-reveal'))
    const counters = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'))
    if (!hasIO || reduce) {
      reveal.forEach((el) => el.classList.add('is-in'))
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (!en.isIntersecting) continue
            en.target.classList.add('is-in')
            io.unobserve(en.target)
          }
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
      )
      reveal.forEach((el) => io.observe(el))
      cleanups.push(() => io.disconnect())

      // Цифры, которые ещё не видны, досчитываются при появлении; видимые в первые 1,5 с — сразу.
      const early = performance.now() < 1500
      const cio = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (!en.isIntersecting) continue
            const el = en.target as HTMLElement
            cio.unobserve(el)
            countUp(el, el.dataset.count || '')
          }
        },
        { threshold: 0.5 },
      )
      for (const el of counters) {
        const r = el.getBoundingClientRect()
        const visible = r.top < window.innerHeight && r.bottom > 0
        const p = parseCount(el.dataset.count || '')
        if (!p || (visible && !early)) continue
        el.textContent = `${p.prefix}0`
        cio.observe(el)
      }
      cleanups.push(() => cio.disconnect())

      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.lp-nav a[href^="#"]'))
      const targets = links
        .map((a) => document.getElementById(a.hash.slice(1)))
        .filter((el): el is HTMLElement => Boolean(el))
      if (targets.length) {
        const nio = new IntersectionObserver(
          (entries) => {
            for (const en of entries) {
              if (!en.isIntersecting) continue
              for (const a of links) {
                const on = a.hash === `#${en.target.id}`
                a.classList.toggle('is-active', on)
                if (on) a.setAttribute('aria-current', 'true')
                else a.removeAttribute('aria-current')
              }
            }
          },
          { rootMargin: '-45% 0px -50% 0px' },
        )
        targets.forEach((el) => nio.observe(el))
        cleanups.push(() => nio.disconnect())
      }
    }

    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    cleanups.push(() => window.removeEventListener('hashchange', openFromHash))
    requestAnimationFrame(restoreLangPosition)

    return () => cleanups.forEach((fn) => fn())
  }, [])

  return null
}
