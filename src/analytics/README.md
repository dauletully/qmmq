# Модуль аналитики

Своя аналитика лендинга: события пишутся в нашу базу, отчёты — в админке (`/admin/analytics`,
пункт меню «Аналитика → Отчёты», сводка на главной админки). Без GA4, Метрики и cookie-баннеров.
Договор — `docs/ARCHITECTURE.md`, раздел «Аналитика».

```
payload.ts                  что модуль добавляет в Payload (подключается в payload.config.ts)
shared.ts                   имена событий, блоков, мест кнопок — общие для трекера и отчётов
client/                     трекер для лендинга (без зависимостей, ~2,8 КБ gzip вместе с пикселями)
  index.ts                  AnalyticsTracker, track, getAttribution
collections/AnalyticsEvents коллекция analytics-events (скрыта из меню)
globals/AnalyticsSettings   analytics-settings: ступени плана, исключения
server/ingest.ts            приём событий POST /api/lp
server/reports.ts           SQL-отчёты (агрегация в PostgreSQL)
server/channels.ts          определение источника (Instagram, WhatsApp, …)
admin/                      раздел «Аналитика», сводка на главной, пункт меню
dev/seed-events.ts          демо-данные для разработки
```

## Как подключить на лендинге

Один раз на странице лендинга (серверный компонент). Пиксели читаются из глобальной `integrations`
(доступ только admin — поэтому Local API без пользователя, как по умолчанию):

```tsx
import config from '@payload-config'
import { getPayload } from 'payload'

import { AnalyticsTracker } from '@/analytics/client'

const payload = await getPayload({ config })
const integrations = await payload.findGlobal({ slug: 'integrations', depth: 0 })

// внутри разметки страницы
<AnalyticsTracker
  locale={locale} // 'ru' | 'kk'
  landing={landing.slug} // для фильтра «Лендинг» в отчётах
  pixels={{
    metaPixelId: integrations.pixels?.metaPixelId,
    tiktokPixelId: integrations.pixels?.tiktokPixelId,
  }}
/>
```

Разметка — всё остальное трекер ловит сам:

```tsx
<section data-section="pricing">…</section>              // hero, audience, benefits, program, pricing,
                                                          // speakers, history, stories, address,
                                                          // partners, faq, contacts
<a href="#register" data-cta="hero">Зарегистрироваться</a>  // header, hero, pricing, stories, final, sticky
<a href="https://wa.me/7701…">WhatsApp</a>                 // whatsapp_click — автоматически
```

Формы (клиентские компоненты) вызывают трекер сами:

```tsx
import { getAttribution, track } from '@/analytics/client'

track('form_open', { form: 'school' }) // открыли форму в модальном окне
track('form_start', { form: 'registration' }) // первый ввод в любое поле (один раз)
track('form_error', { form: 'registration', field: 'phone' }) // ответ 400 или ошибка на клиенте

const res = await fetch('/api/forms/registration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ landing, locale, fields, attribution: getAttribution(), hp, startedAt }),
})
const json = await res.json()
if (json.ok) track('form_submit', { form: 'registration', leadId: json.leadId })

track('regulations_download') // открыли PDF положения
track('lang_switch', { to: 'kk' }) // переключили язык
```

`form` — `registration` | `school` | `regulations`. `form_submit` уходит на сервер сразу, не дожидаясь
пакета, и именно он отправляет конверсию в пиксели — вызывать его нужно **только после ответа 200**.

Регистрация на телефоне идёт в два шага: `form_start`, `form_submit` и `form_error` получают
`step: 1 | 2` (на компьютере форма одна — без `step`). Заявка создаётся после шага 1, поэтому
`form_submit { step: 1 }` — это и есть лид; `step: 2` лишь дополняет его и конверсию в пиксели
не отправляет. В воронке отчётов `form_submit` считается по посетителю — два шага не удваивают.

## Как это работает

- **Посетитель** — анонимный `visitorId` в localStorage браузера. **Визит** — `sessionId`, новый после
  30 минут бездействия. Если localStorage недоступен (бывает во встроенных браузерах), ID живут до
  перезагрузки страницы.
- **Источник** — first-touch: UTM и referrer первого захода этого браузера. Порядок определения:
  `utm_source` → домен referrer (включая `android-app://com.whatsapp/` и т. п.) → встроенный браузер
  Instagram / Facebook / TikTok / Telegram по User-Agent → «Прямые и без источника».
  WhatsApp и Telegram часто не передают referrer, поэтому ссылки, которые рассылает команда,
  размечайте: `?utm_source=whatsapp&utm_medium=message&utm_campaign=…`. Для рекламы Meta удобно
  `utm_source={{site_source_name}}` (ig / fb / msg / an распознаются).
- **Приём**: `POST /api/lp` (путь нейтральный, его не режут блокировщики). Тело — JSON строкой
  (`text/plain`, так работает `navigator.sendBeacon` без preflight). События копятся в пакет и
  отправляются раз в секунду, при уходе со страницы — `sendBeacon`. Сервер отвечает сразу, запись в
  базу — после ответа.
- **Не записываются**: боты (`isbot`, в том числе headless-браузеры и Lighthouse), сотрудники,
  вошедшие в админку (браузер получает ответ `off` и больше ничего не шлёт, его прошлые события
  удаляются), устройства с `?notrack=1` (вернуть — `?notrack=0`), ID из «Аналитика: цели и
  исключения». IP-адрес не хранится; используется только для ограничения частоты (300 запросов в
  минуту с IP, 60 — с посетителя; пакет до 25 событий и 16 КБ).
- Если админка и лендинг на разных доменах (qmmq.kz и contest.qmmq.kz), cookie админки на лендинг не
  приходит — тогда сотрудникам нужно один раз открыть лендинг с `?notrack=1` на своих телефонах.

## Пиксели Meta и TikTok

Подключаются, только если передан ID. Заглушки `fbq` / `ttq` создаются сразу и копят вызовы, а сами
скрипты (`fbevents.js`, `events.js`) грузятся после первого касания / прокрутки / нажатия клавиши
или через ~3,5 с простоя после загрузки — первая отрисовка и PageSpeed не страдают. При `notrack`
и у сотрудников пиксели не загружаются.

| Событие трекера                                    | Meta Pixel                                | TikTok Pixel           |
| -------------------------------------------------- | ----------------------------------------- | ---------------------- |
| `page_view`                                        | `PageView`                                | `ttq.page()`           |
| `form_submit` `{ form: 'registration' }`           | `Lead` `{ content_name: 'registration' }` | `CompleteRegistration` |
| `form_submit` `{ form: 'school' }`                 | `Lead` `{ content_name: 'school' }`       | `SubmitForm`           |
| `whatsapp_click`                                   | `Contact`                                 | `Contact`              |
| `form_submit` `{ form: 'regulations' }`, остальные | —                                         | —                      |

Для `Lead` / `CompleteRegistration` / `SubmitForm` передаётся `eventID` / `event_id` = `lead-<leadId>`:
если позже подключат серверную отправку (Meta Conversions API, TikTok Events API), сервер отправит
тот же ID по номеру заявки, и платформы не посчитают конверсию дважды.

## Отчёты

Период — сегодня (по часам) / 7 / 30 дней / всё время, сутки по времени Казахстана (UTC+5);
фильтр по лендингу. Все цифры считает PostgreSQL (`payload.db.drizzle`), в память выгружаются только
итоговые строки.

- **Заявки** — регистрации, лист ожидания и заявки от школ (скачивание положения — отдельно).
  Конверсия — заявки / визиты.
- **Оплаты за период** — по дате оплаты (`leads.payment.paidAt`). **План** — все оплаты кампании,
  ступени из `analytics-settings` (по умолчанию 200 / 300 / 400); оплаченная заявка от школы
  считается по числу участников (переключается там же).
- **Источники и UTM** — посетители по first-touch; заявки привязаны к посетителю через
  `attribution.visitorId`, а если трекер не сработал — по UTM / referrer из самой заявки.
- **Воронка** — посетители, дошедшие до шага: зашли → увидели «Стоимость» → нажали кнопку
  регистрации → начали форму → отправили → оплатили. «Дошёл до шага» = сделал этот шаг или любой
  следующий, поэтому воронка не растёт вниз.
- **Досмотр блоков** — доля визитов, в которых блок был виден ≥ 40 % (высокий блок — ≥ 40 % экрана).

## Демо-данные

Только для разработки, на своей базе:

```
DATABASE_URL=postgres://dauletuly@127.0.0.1:5433/qmmq_analytics \
  pnpm payload run src/analytics/dev/seed-events.ts reset days=30 visitors=2500
```

`reset` удаляет прошлые демо-данные (посетители `seed…` и их заявки). Если коллекция `leads`
подключена, создаются и заявки, часть — оплаченные.
