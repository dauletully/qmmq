# Архитектура qmmq.kz

Сайт Казахстанской ассоциации учителей математики и лендинг XII конкурса учителей — **одно приложение, одна база, одна админка**. Исходные ТЗ: «ТЗ на сайт» и «ТЗ на лендинг» от 29.10.2026.

## Решения

| Вопрос | Решение | Почему |
|---|---|---|
| Стек | Next.js 16 + Payload CMS 3 + PostgreSQL 17 | Админка живёт внутри приложения: один деплой, один язык (TypeScript). Payload даёт роли, локализацию полей RU/KZ/EN, черновики, очередь задач |
| Хостинг | Yandex Cloud Kazakhstan, одна ВМ, Docker Compose | Закон РК «О персональных данных»: база с ФИО и телефонами — на территории РК |
| Домены | `contest.qmmq.kz` — лендинг конкурса; `qmmq.kz` — сайт (пока сайта нет — редирект на лендинг) | Лендинг остаётся отдельной продающей страницей, как в ТЗ |
| Оплата | Онлайн-оплаты пока нет. Заявка → amoCRM (новая воронка) → менеджер принимает оплату | Договор с платёжным провайдером в работе |
| CRM | amoCRM — источник правды по продажам. Заявка сначала сохраняется у нас, затем уходит в amoCRM с повторами при ошибке | Заявки не теряются, даже если amoCRM недоступна |
| Оплаты в аналитике | amoCRM шлёт вебхук при смене этапа; этап «Оплачено» помечает заявку оплаченной | Прогресс к плану 200 / 300 / 400 и конверсия до оплаты по источникам |
| Аналитика | Своя, данные в нашей базе, отчёты в админке. Без GA4 и Метрики | Решение заказчика |
| Рекламные пиксели | Meta и TikTok: ID вводятся в админке, без разработчика | Таргет будет, подключат позже |
| Уведомления | Средствами amoCRM (без Telegram и e-mail с сайта) | Решение заказчика |
| WhatsApp | WhatsApp Business API подключается к amoCRM, не к сайту. На сайте — только ссылка `wa.me` | Переписка и рассылки ведутся из CRM |
| Контент | Всё, что видно на лендинге, редактируется в админке; казахские тексты заполняет команда | ТЗ: «изменить дату и цену в админке силами команды» |
| Git | Локальный репозиторий; деплой с машины разработчика по SSH | Решение заказчика |

## Очереди

1. **Сейчас — лендинг конкурса.** Дизайн-система, лендинг mobile-first, 3 формы → amoCRM, своя аналитика, пиксели, деплой.
2. **Сайт, первая очередь** (по ТЗ сайта): главная, об ассоциации, каталог мероприятий, новости, партнёрам, контакты — RU/KZ, EN для двух страниц.
3. **Вторая очередь** (январь–февраль 2027): личный кабинет, генерация сертификатов с QR и `/verify/[номер]`, библиотека с уровнями доступа, каталог сообщества, рассылка, онлайн-оплата.

Модель данных первой очереди уже рассчитана на сайт: мероприятие, человек, партнёр — общие сущности, лендинг лишь ссылается на них.

## Структура кода

```
src/
  payload.config.ts        сборка модулей (не содержит логики)
  collections/             коллекции Payload, index.ts — список
  globals/                 глобальные настройки, index.ts — список
  endpoints/               корневые API-эндпоинты (/api/...), index.ts — список
  jobs/                    очередь задач (отправка в amoCRM), index.ts — конфиг
  lib/amocrm/              клиент amoCRM API v4
  lib/forms/               схемы и обработка форм (общие для сервера и клиента); site.ts — формы сайта
  lib/revalidate.ts        теги кеша лендинга и сайта, хуки сброса
  lib/eventStatus.ts       статус мероприятия по датам (open / closed / finished)
  seed/                    начальные данные: content.ts + index.ts — лендинг, site-content.ts — сайт
  lib/constants.ts         предметы, регионы РК, стаж — значения и подписи RU/KZ
  admin/                   кастомные компоненты админки (кнопки amoCRM и т. п.)
  analytics/               модуль аналитики: payload.ts (подключение), client/ (трекер), admin/ (отчёты)
  app/(frontend)/          публичные страницы; _lib/data.ts — данные лендинга, _lib/site-data.ts — данные сайта,
                           news/rss.xml/route.ts — RSS, sitemap.ts — карта сайта
  app/(payload)/           админка Payload (генерируется)
design/                    токены и решения дизайн-системы для вёрстки
deploy/, scripts/          деплой и бэкапы
docs/                      документация
```

## Языки

- Локали Payload: `ru` (по умолчанию), `kk` и `en`; `fallback: true` (пустое поле на kk/en отдаёт русский текст).
- `en` заполняется только для страниц «Об ассоциации» (`about-page`, команда, документы) и «Партнёрам» (`partners-page`, партнёры) — `EN_ENABLED_PAGES` в `lib/constants.ts`; у текстовых страниц `pages` английская версия включается отметкой `showInEn`. Остальные страницы сайта на `/en` не отдаются (хелперы `site-data.ts` подставляют `ru`).
- URL: русская версия без префикса (`/`), казахская — `/kz` (внутри это локаль `kk`), английская — `/en`. `hreflang`: `ru-KZ`, `kk-KZ`, `en`.
- Интерфейс админки — на русском.

## Модель данных

Поля с пометкой *loc* — локализованные (RU/KZ).

### Коллекции

**users** — сотрудники с доступом в админку. `name`, `role`: `admin` | `editor` | `manager`.
- admin — всё, включая интеграции; editor — контент; manager — заявки и аналитика (только чтение контента).

**media** — изображения и PDF. `alt` *loc*. Размеры: `thumb` 400, `card` 800, `hero` 1600, `og` 1200×630; формат WebP.

**people** — единая сущность «человек» (команда, спикеры, жюри, педагоги-мастера, авторы историй).
`name`, `photo`, `roles[]` (`team` | `speaker` | `jury` | `master`), `position` *loc* (регалии), `contribution` *loc* (одна строка о вкладе), `subjects[]`, `region`, `school` *loc*, `firstParticipationYear`, `studentAchievements` *loc*, `publishConsent` (без согласия человек не показывается на сайте), `order`.
Для сайта: `teamPosition` *loc* (должность на `/about/team`, роль `team`), `bio` *loc*, `quote` *loc*, `contact` (group: `email`, `phone`, `url` — показывается только у команды и в каталоге), `showInCatalog` (каталог педагогов-мастеров `/community/people` — только с явного согласия; нужны роль `master`, `publishConsent` и эта отметка).

**partners** — `name` *loc* (полное название), `logo`, `url`, `kind` (`ministry` | `organizer` | `partner` | `university` | `sponsor` | `media`), `order`.
Для страницы «Партнёрам»: `showOnPartnersPage` (блок «Нас поддерживали»), `years`, `description` *loc*.

**events** — мероприятие (конкурс, олимпиада, семинар, тренинг). Здесь — цена и даты, единые для лендинга и сайта.
`title` *loc*, `slug`, `type`, `subjects[]`, `level` (`international` | `republic` | `regional` | `city`), `format` (`offline` | `online`), `region`, `city` *loc*, `venue` *loc*, `venueAddress` *loc*, `mapUrl`, `startDate`, `endDate`, `registrationDeadline`, `price` (₸), `groupMinSize`, `program[]` (день: `date`, `title` *loc*, `items[]`: `time`, `title` *loc*, `description` *loc*), `regulationsPdf`, `certificateSample`, `participantsChatUrl`.
Для каталога `/events` и итогов: `cover`, `description` *loc* (rich text), `forWhom` *loc*, `documentIssued` *loc*, `contestSeason` (номер сезона конкурса учителей → `/contest/[год]`), `statusOverride` (`auto` | `open` | `closed` | `finished`) и виртуальное `status` (`open` | `closed` | `finished`; при `auto` вычисляется по датам в `lib/eventStatus.ts`: прошла дата окончания — `finished`, прошёл срок регистрации — `closed`), `results` (group: `summary` *loc*, `winners[]` — `place` (`grand_prix` | `1` | `2` | `3` | `special`), `person` → people или `name`, `detail` *loc*, `prize` *loc*; `photos[]`, `tasksFile`, `pressRelease` *loc*). Лендинг мероприятия находится обратной связью `landings.event`.

**landings** — продающая страница мероприятия. Фиксированные вкладки, по одной на блок (не конструктор — чтобы редактор не сломал дизайн):
`internalTitle`, `slug`, `event` (→ events), и вкладки:
- `hero`: `eyebrow` *loc*, `heading` *loc*, `subheading` *loc*, `partnerNote` *loc* («Совместно с Министерством просвещения РК»), `partnerLogo`, `stats[]` (`value`, `label` *loc*), `primaryCta` *loc*, `secondaryCta` *loc*
- `audience`: `heading` *loc*, `cards[]` (`subject`, `title` *loc*, `text` *loc*)
- `benefits`: `heading` *loc*, `items[]` (`icon` — имя иконки Lucide из списка, `title` *loc*, `text` *loc*)
- `program`: `heading` *loc*, `note` *loc* (само расписание берётся из `event.program`)
- `pricing`: `heading` *loc*, `includes[]` *loc*, `documentNote` *loc* (какой документ получает участник), `groupTerms` *loc*, `deadlineNote` *loc*
- `speakers`: `heading` *loc*, `people[]` (→ people, порядок вручную)
- `history`: `heading` *loc*, `milestones[]` (`period`, `title` *loc*, `text` *loc*), `figures[]` (`value`, `label` *loc*), `prizes[]` (`title` *loc*, `value` *loc*, `text` *loc*)
- `stories`: `heading` *loc*, `items[]` (`person` → people, `quote` *loc*, `achievement` *loc*)
- `address`: `heading` *loc*, `body` *loc* (rich text), `author` (→ people), `signature` *loc*
- `partners`: `heading` *loc*, `items[]` (→ partners)
- `faq`: `heading` *loc*, `items[]` (`question` *loc*, `answer` *loc*)
- `contacts`: `heading` *loc*, `finalCta` *loc* (контакты берутся из site-settings, адрес — из event)
- `forms`: `howHeardOptions[]` *loc*, `schoolNote` *loc* («Менеджер перезвонит в рабочее время»), `consentText` *loc*
- `thankYou`: `heading` *loc*, `body` *loc*
- `seo`: `title` *loc*, `description` *loc*, `ogImage`

**leads** — заявки со всех форм. Создаются только сервером через API форм.
- `type`: `registration` | `waitlist` | `school` | `regulations` (лендинг) | `community` | `speaker` | `partner` | `feedback` (формы сайта)
- `event` (→ events), `landing` (→ landings), `locale` (`ru` | `kk` | `en`)
- Формы сайта: `speakerRole` (`speaker` | `jury` | `both`), `topic`, `partnerFormat` (`general_sponsor` | `sponsor` | `prizes` | `venue` | `media` | `other`), `wantsCatalog` (согласие на карточку в каталоге педагогов — карточку в `people` создаёт редактор), `message`, `sourcePath` (страница формы). У `partner` организация — в `organization` / `contactPerson`
- `incomplete` — заявка неполная: на телефоне регистрация идёт в два шага, после первого есть только ФИО, предмет, телефон и согласие (колонка и фильтр «Только неполные» в списке). `completeToken` — sha256 одноразового токена второго шага (скрыт, гасится после второго шага)
- Участник: `fullName`, `subject`, `region`, `city`, `school`, `experience` (`lt5` | `5to15` | `gt15`), `phone`, `email`, `howHeard`
- Школа: `organization`, `contactPerson`, `participantsCount`, `subjects[]`
- `consent`, `consentAt`
- `attribution` (group): `visitorId`, `sessionId`, `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`, `referrer`, `landingPath`, `device`
- `amo` (group): `syncStatus` (`pending` | `sent` | `failed` | `disabled` | `skipped` — тип заявки не для amoCRM, см. `AMO_LEAD_TYPES`), `leadId`, `contactId`, `attempts`, `lastError`, `syncedAt`, `pipelineId`, `statusId`
- `payment` (group): `paid`, `paidAt`

**subscribers** — подписка на рассылку из подвала (не заявка, в amoCRM не уходит). `email` (уникален: повторная подписка обновляет запись и снова включает её), `subject`, `region`, `locale`, `active`, `consentAt`, `source` (страница формы). Выгрузка активных в CSV для Excel — кнопка над списком (`GET /api/subscribers/export.csv`, только сотрудники; разделитель `;`, BOM).

**news** — новости (`/news`, `/news/[slug]`, RSS). Черновики: `versions.drafts`, посетителям отдаётся только `_status = published`. `title` *loc*, `slug`, `cover`, `excerpt` *loc*, `body` *loc* (rich text), `tags[]` (свободные теги для фильтра), `gallery[]` (`image`, `caption` *loc*), `publishedAt` (ставится при первой публикации), `relatedEvent` (→ events), `sourceName`, `sourceUrl` (если новость — пересказ публикации), `seo` (`title` *loc*, `description` *loc*, `ogImage`).

**materials** — библиотека `/materials`. `title` *loc*, `kind` (`regulations` | `tasks` | `presentation` | `video` | `other`), `file` или `videoUrl`, `subject`, `event` (→ events), `year`, `access` (`public` | `registered` | `participants`), `description` *loc*. Карточка видна всем; `file` и `videoUrl` закрыты полевым доступом для всех уровней, кроме `public` (см. «Доступ к материалам»).

**documents** — документы ассоциации (`/about/documents`): `title` *loc*, `file`, `kind` (`charter` | `certificate` | `gratitude` | `requisites` | `report` | `other`), `order`, `description` *loc*.

**pages** — типовые текстовые страницы (`/[slug]`: политика, оферта, правила). `title` *loc*, `slug`, `body` *loc* (rich text), `showInEn`, `seo`; черновики как у news.

**analytics-events** — сырые события аналитики (скрыта из меню). Владелец — модуль аналитики.

### Глобальные настройки

**site-settings** — название ассоциации *loc*, логотип, телефоны, WhatsApp, e-mail, адрес *loc*, соцсети, реквизиты *loc*, договор-оферта и политика конфиденциальности (PDF или текст), `activeLanding` (какой лендинг открывается на `contest.qmmq.kz`).

**home-page** — главная сайта: `hero` (`heading` *loc*, `lead` *loc*, `featuredEvent` → events — пусто: ближайшее открытое, `primaryCta` *loc*, `secondaryCta` *loc*), `about` и `community` (`heading` *loc*, `text` *loc*), `seo`. Списки мероприятий, новостей и партнёров собираются автоматически.

**about-page** — «Об ассоциации» (есть `en`): `heading`, `lead`, `cover`, `mission` (rich text), `figures[]`, история (`historyHeading`, `historyLead`, `timeline[]`: `year`, `period` *loc*, `title` *loc*, `text` *loc*, `event` → events), заголовки блоков команды и документов, `seoTitle`, `seoDescription`. Команда — `people` с ролью `team`; документы — коллекция `documents`.

**partners-page** — «Партнёрам» (есть `en`): `heading`, `lead`, `formats[]` (`icon`, `title` *loc*, `text` *loc*), `sponsorPack` (PDF), `pastPartnersHeading`, `contactHeading`, `contactNote`, `seo`. Логотипы прошлых партнёров — `partners` с `showOnPartnersPage`.

**integrations** (только admin):
- `amocrm`: `enabled`, `baseUrl` (например, `https://school.amocrm.ru`), `accessToken` (долгосрочный токен), `pipelineId`, `newStatusId`, `paidStatusIds[]`, `fieldMap` (id созданных полей, заполняется автоматически), `webhookSecret`
- `pixels`: `metaPixelId`, `tiktokPixelId` (пусто — пиксель не загружается)

**analytics-settings** — цели плана (по умолчанию 200 / 300 / 400 оплат), исключения. Владелец — модуль аналитики.

## API форм

```
POST /api/forms/:type        type = registration | school | regulations
Content-Type: application/json

{
  "landing": "contest-2026",
  "locale": "ru" | "kk",
  "fields": { ... },                 // поля формы, см. leads
  "attribution": { ... },            // из getAttribution() модуля аналитики
  "hp": "",                          // honeypot, должен быть пустым
  "startedAt": 1730000000000,        // когда форма открыта (отсев ботов)
  "step": 1                          // только registration: первый шаг двухшаговой формы
}

200 { "ok": true, "leadId": 123, "redirect": "/spasibo" }       // registration, school
200 { "ok": true, "leadId": 123, "type": "registration", "token": "…" } // registration, step 1
200 { "ok": true, "leadId": 123, "pdfUrl": "/api/media/file/…" } // regulations
400 { "ok": false, "errors": { "phone": "invalid_phone" } }      // ключи ошибок, тексты — на клиенте
429 { "ok": false, "error": "rate_limited" }
```

Регистрация в два шага (телефон, < 1024 px; на компьютере — одна форма со всеми полями):

```
POST  /api/forms/registration   { …, "step": 1, "fields": { fullName, subject, phone, consent } }
      → заявка сохраняется сразу с incomplete = true и уходит в amoCRM; ответ содержит одноразовый token
PATCH /api/forms/registration/:leadId
      { "token": "…", "locale": "ru", "fields": { region, city, school, experience, email, howHeard }, "hp": "", "startedAt": … }
      → 200 { "ok": true, "leadId": 123, "type": "registration", "redirect": "/spasibo" }
      → 403 { "ok": false, "error": "invalid_token" }   // чужой или использованный токен, заявка старше суток
```

- Валидация — одна zod-схема в `src/lib/forms/` для клиента и сервера: `registrationStep1Schema`, `registrationStep2Schema`, `registrationSchema` (их объединение, для одной формы), `schoolSchema`, `regulationsSchema`.
- После `registrationDeadline` заявка на регистрацию сохраняется как `waitlist`.
- Телефон нормализуется в `+7XXXXXXXXXX`.
- Согласие на обработку данных — на первом шаге (закон РК): в базе заявка без согласия не появляется.
- Второй шаг снимает `incomplete`, гасит токен и ставит заявку в очередь amoCRM повторно: сделка уже есть, к ней добавляется примечание с полной заявкой. Honeypot, `startedAt` и лимит частоты общие для обоих шагов.

### Формы сайта

Тот же `POST /api/forms/:type`, `type = community | speaker | partner | feedback | subscribe`. Схемы и обработчик — `src/lib/forms/site.ts` (`handleFormSubmission` делегирует туда по типу). Лендинг не передаётся; вместо него — `path` (страница формы):

```
{ "locale": "ru" | "kk" | "en", "fields": { ... }, "path": "/community/join",
  "attribution": { ... }, "hp": "", "startedAt": 1730000000000 }

200 { "ok": true, "leadId": 123, "type": "community" }   // community, speaker, partner, feedback
200 { "ok": true, "subscriberId": 45 }                   // subscribe
```

Поля: `community` — `fullName`, `subject`, `region`, `school`, `phone`, `email`, `wantsCatalog`, `consent`; `speaker` — + `speakerRole`, `topic`, `experience`, `message` (школа не обязательна); `partner` — `organization`, `contactPerson`, `partnerFormat`, `message`, `phone`, `email`, `consent`; `feedback` — `fullName`, `email`, `phone` (не обязателен), `message`, `consent`; `subscribe` — `email`, `subject`, `region`, `consent`.
Те же защиты (honeypot, `startedAt` — для подписки порог 1,2 с, лимит на IP, размер тела). В amoCRM уходят `community`, `speaker`, `partner` (`AMO_LEAD_TYPES`); `feedback` сохраняется со статусом `skipped` и не отправляется даже кнопкой «Отправить повторно»; `subscribe` пишется в `subscribers`, не в `leads`.

## Данные для страниц сайта

Хелперы — `src/app/(frontend)/_lib/site-data.ts` (аналог `_lib/data.ts` лендинга): `unstable_cache` + `react.cache`, `overrideAccess: false` (черновики, согласия и полевой доступ применяются как для посетителя), локаль `en` только у разрешённых страниц.

| Хелпер | Страницы | Теги кеша |
|---|---|---|
| `getSiteSettings(locale)` | шапка, подвал, контакты | `site-settings`, `landing` |
| `getHome(locale)` | `/` | `site-home`, `site-events`, `site-news`, `site-partners` |
| `getAbout(locale)`, `getTeam`, `getDocuments` | `/about*` | `site-about`, `site-people`, `site-documents` |
| `listEvents(locale, filters)` — фильтры `subject`, `type`, `format`, `level`, `region`, `year`, `scope: upcoming \| archive`; `getEvent(slug, locale)` | `/events`, `/events/archive`, `/events/[slug]` | `site-events` (+ `site-materials`, `site-news`, `landing` у карточки) |
| `listContestSeasons(locale)`, `getContestSeason(year, locale)` | `/contest`, `/contest/[год]` | `site-events`, `site-people` |
| `getMastersCatalog(locale, { subject, region })` | `/community/people` | `site-people` |
| `listNews(locale, { page, tag })`, `getNewsItem(slug, locale)`, `getNewsFeed(locale, limit)` | `/news`, `/news/[slug]`, RSS | `site-news` |
| `listMaterials(locale, { kind, subject, year, eventSlug })` | `/materials` | `site-materials`, `site-events` |
| `getPartnersPage(locale)`, `getPastPartners(locale)` | `/partners` | `site-partners-page`, `site-partners` |
| `getPage(slug, locale)` | `/[slug]` | `site-pages` |
| `getSitemapEntries()` | `sitemap.xml` | `site-events`, `site-news`, `site-pages` |

Теги — `SITE_CACHE_TAGS` в `src/lib/revalidate.ts`; хуки коллекций (`siteRevalidateHooks`) сбрасывают свой тег, общие сущности (events, people, partners, site-settings) — ещё и кеш лендинга. `sitePath(locale, path)` строит путь с префиксом локали.

- **RSS**: `GET /news/rss.xml` (русский) и `/news/rss.xml?lang=kk` — Route Handler `app/(frontend)/news/rss.xml/route.ts`, 30 последних новостей.
- **Sitemap**: `app/(frontend)/sitemap.ts` — на `LANDING_HOST` только лендинг; на основном домене страницы сайта (ru/kk, en у разрешённых) с `hreflang`, динамические разделы из `getSitemapEntries()`.
- **Доступ к материалам**: уровни `registered` и `participants` заложены в модели, но до запуска личного кабинета файл и ссылка на видео отдаются только для `public` (полевой доступ в `materials`). Закрытые материалы показываются в списке с `lockedNote` («Доступно после запуска личного кабинета»). Когда появится кабинет, в `publicFileOnly` добавится проверка пользователя и участия в мероприятии; сами файлы в `media` сейчас публичны по прямой ссылке — для закрытых материалов потребуется отдельное хранилище или проверка в маршруте файла.
- **Автопостинг в Telegram** — не реализован (в первой очереди уведомления только средствами amoCRM); RSS можно подключить к любому RSS→Telegram боту.

## amoCRM

- Авторизация — долгосрочный токен приватной интеграции, `Authorization: Bearer`.
- Заявка → `POST /api/v4/leads/complex` (сделка + контакт), теги: тип заявки и предмет; UTM — в стандартные поля сделки; остальные поля — в кастомные поля сделки (создаются кнопкой в админке) и в примечание.
- Отправка — задача в очереди Payload с повторами; статус виден в карточке заявки.
- Вебхук: `POST /api/amocrm/webhook?secret=…` на смену статуса сделки → обновляет `amo.statusId`, а при статусе из `paidStatusIds` — `payment.paid = true`.

## Аналитика

Клиентский трекер (`src/analytics/client`) — лёгкий скрипт без cookie-баннеров: анонимный `visitorId` (localStorage), `sessionId` (30 минут бездействия), first-touch UTM и referrer.

События: `page_view`, `section_view` (`section`), `cta_click` (`location`), `form_open`, `form_start`, `form_submit` (`form`, `leadId`), `form_error`, `lang_switch`, `whatsapp_click`, `regulations_download`. У двухшаговой регистрации на телефоне `form_start`, `form_submit` и `form_error` несут `step: 1 | 2`; у одной формы на компьютере `step` нет.

Разметка для автотрекинга на лендинге:
- `data-section="<id>"` на каждом блоке (в порядке на странице): `hero`, `gallery`, `audience`, `benefits`, `program`, `pricing`, `speakers`, `history`, `stories`, `address`, `partners`, `faq`, `contacts`
- `data-cta="<location>"` на кнопках регистрации: `header`, `hero`, `pricing`, `stories`, `final`, `sticky`

Отчёты в админке: посетители и визиты по дням, источники и UTM-кампании, устройства, досмотр блоков, воронка «визит → цена → клик → начало формы → заявка → оплата», прогресс к плану. Пиксели Meta и TikTok получают те же события (`Lead` / `SubmitForm`) через трекер.

## Переменные окружения

| Переменная | Пример | Назначение |
|---|---|---|
| `DATABASE_URL` | `postgres://user:pass@db:5432/qmmq` | PostgreSQL |
| `PAYLOAD_SECRET` | `openssl rand -hex 32` | Подпись сессий Payload |
| `SITE_URL` | `https://qmmq.kz` | Абсолютные ссылки, URL вебхука amoCRM |
| `LANDING_HOST` | `contest.qmmq.kz` | Хост, на котором `/` отдаёт активный лендинг |
| `COOKIE_DOMAIN` | `.qmmq.kz` | Домен cookie входа в админку — общий для сайта и лендинга |

## Локальная разработка

- Node 24, pnpm. PostgreSQL 17 — локальный кластер в `.local/pgdata`, порт 5433:
  `/Library/PostgreSQL/17/bin/pg_ctl -D .local/pgdata -l .local/postgres.log start`
- `pnpm dev` — сайт на :3000, админка `/admin`.
- Несколько dev-серверов одновременно: `NEXT_DIST_DIR=.next-<имя> pnpm dev -p <порт>` и своя база в `DATABASE_URL`.
