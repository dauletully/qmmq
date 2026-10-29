import localFont from 'next/font/local'

// Golos Text (OFL, см. _fonts/OFL.txt) — локальные файлы, сборка не ходит в сеть.
// Четыре подмножества Google Fonts под одним именем 'Golos Text' с unicode-range: браузер
// скачивает только нужные. Казахские буквы — в cyrillic-ext, знак ₸ — в latin-ext.
// Предзагружаются latin и cyrillic; казахская версия — fonts-kk.ts (те же файлы + cyrillic-ext).

export const golosLatin = localFont({
  src: './_fonts/golos-latin.woff2',
  weight: '400 700',
  display: 'swap',
  preload: true,
  variable: '--font-golos',
  adjustFontFallback: 'Arial',
  declarations: [
    { prop: 'font-family', value: "'Golos Text'" },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
})

export const golosCyrillic = localFont({
  src: './_fonts/golos-cyrillic.woff2',
  weight: '400 700',
  display: 'swap',
  preload: true,
  variable: '--font-golos-cyr',
  adjustFontFallback: false,
  declarations: [
    { prop: 'font-family', value: "'Golos Text'" },
    { prop: 'unicode-range', value: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116' },
  ],
})

export const golosCyrillicExt = localFont({
  src: './_fonts/golos-cyrillic-ext.woff2',
  weight: '400 700',
  display: 'swap',
  preload: false,
  variable: '--font-golos-cyr-ext',
  adjustFontFallback: false,
  declarations: [
    { prop: 'font-family', value: "'Golos Text'" },
    {
      prop: 'unicode-range',
      value: 'U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F',
    },
  ],
})

export const golosLatinExt = localFont({
  src: './_fonts/golos-latin-ext.woff2',
  weight: '400 700',
  display: 'swap',
  // только знак ₸ и редкая латиница — без предзагрузки, чтобы не отнимать канал у первого экрана
  preload: false,
  variable: '--font-golos-lat-ext',
  adjustFontFallback: false,
  declarations: [
    { prop: 'font-family', value: "'Golos Text'" },
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
})

export const fontVariables = [golosLatin, golosCyrillic, golosCyrillicExt, golosLatinExt]
  .map((f) => f.variable)
  .join(' ')
