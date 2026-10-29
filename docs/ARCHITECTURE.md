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
  lib/forms/               схемы и обработка форм (общие для сервера и клиента)
  lib/constants.ts         предметы, регионы РК, стаж — значения и подписи RU/KZ
  admin/                   кастомные компоненты админки (кнопки amoCRM и т. п.)
  analytics/               модуль аналитики: payload.ts (подключение), client/ (трекер), admin/ (отчёты)
  app/(frontend)/          публичные страницы
  app/(payload)/           админка Payload (генерируется)
design/                    токены и решения дизайн-системы для вёрстки
deploy/, scripts/          деплой и бэкапы
docs/                      документация
```

## Языки

- Локали Payload: `ru` (по умолчанию) и `kk`; `fallback: true`. Позже — `en` для двух страниц сайта.
- URL: русская версия без префикса (`/`), казахская — `/kz` (внутри это локаль `kk`). `hreflang`: `ru-KZ`, `kk-KZ`.
- Интерфейс админки — на русском.

## Модель данных

Поля с пометкой *loc* — локализованные (RU/KZ).

### Коллекции

**users** — сотрудники с доступом в админку. `name`, `role`: `admin` | `editor` | `manager`.
- admin — всё, включая интеграции; editor — контент; manager — заявки и аналитика (только чтение контента).

**media** — изображения и PDF. `alt` *loc*. Размеры: `thumb` 400, `card` 800, `hero` 1600, `og` 1200×630; формат WebP.

**people** — единая сущность «человек» (команда, спикеры, жюри, педагоги-мастера, авторы историй).
`name`, `photo`, `roles[]` (`team` | `speaker` | `jury` | `master`), `position` *loc* (регалии), `contribution` *loc* (одна строка о вкладе), `subjects[]`, `region`, `school` *loc*, `firstParticipationYear`, `studentAchievements` *loc*, `publishConsent` (без согласия человек не показывается на сайте), `order`.

**partners** — `name` *loc* (полное название), `logo`, `url`, `kind` (`ministry` | `organizer` | `partner` | `university` | `sponsor` | `media`), `order`.

**events** — мероприятие (конкурс, олимпиада, семинар, тренинг). Здесь — цена и даты, единые для лендинга и сайта.
`title` *loc*, `slug`, `type`, `subjects[]`, `level` (`international` | `republic` | `regional` | `city`), `format` (`offline` | `online`), `city` *loc*, `venue` *loc*, `venueAddress` *loc*, `mapUrl`, `startDate`, `endDate`, `registrationDeadline`, `price` (₸), `groupMinSize`, `program[]` (день: `date`, `title` *loc*, `items[]`: `time`, `title` *loc*, `description` *loc*), `regulationsPdf`, `certificateSample`, `participantsChatUrl`.

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
- `type`: `registration` | `waitlist` | `school` | `regulations`
- `event` (→ events), `landing` (→ landings), `locale`
- Участник: `fullName`, `subject`, `region`, `city`, `school`, `experience` (`lt5` | `5to15` | `gt15`), `phone`, `email`, `howHeard`
- Школа: `organization`, `contactPerson`, `participantsCount`, `subjects[]`
- `consent`, `consentAt`
- `attribution` (group): `visitorId`, `sessionId`, `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`, `referrer`, `landingPath`, `device`
- `amo` (group): `syncStatus` (`pending` | `sent` | `failed` | `disabled`), `leadId`, `contactId`, `attempts`, `lastError`, `syncedAt`, `pipelineId`, `statusId`
- `payment` (group): `paid`, `paidAt`

**analytics-events** — сырые события аналитики (скрыта из меню). Владелец — модуль аналитики.

### Глобальные настройки

**site-settings** — название ассоциации *loc*, логотип, телефоны, WhatsApp, e-mail, адрес *loc*, соцсети, реквизиты *loc*, договор-оферта и политика конфиденциальности (PDF или текст), `activeLanding` (какой лендинг открывается на `contest.qmmq.kz`).

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
  "startedAt": 1730000000000         // когда форма открыта (отсев ботов)
}

200 { "ok": true, "leadId": 123, "redirect": "/spasibo" }       // registration, school
200 { "ok": true, "leadId": 123, "pdfUrl": "/api/media/file/…" } // regulations
400 { "ok": false, "errors": { "phone": "invalid_phone" } }      // ключи ошибок, тексты — на клиенте
429 { "ok": false, "error": "rate_limited" }
```

- Валидация — одна zod-схема в `src/lib/forms/` для клиента и сервера.
- После `registrationDeadline` заявка на регистрацию сохраняется как `waitlist`.
- Телефон нормализуется в `+7XXXXXXXXXX`.

## amoCRM

- Авторизация — долгосрочный токен приватной интеграции, `Authorization: Bearer`.
- Заявка → `POST /api/v4/leads/complex` (сделка + контакт), теги: тип заявки и предмет; UTM — в стандартные поля сделки; остальные поля — в кастомные поля сделки (создаются кнопкой в админке) и в примечание.
- Отправка — задача в очереди Payload с повторами; статус виден в карточке заявки.
- Вебхук: `POST /api/amocrm/webhook?secret=…` на смену статуса сделки → обновляет `amo.statusId`, а при статусе из `paidStatusIds` — `payment.paid = true`.

## Аналитика

Клиентский трекер (`src/analytics/client`) — лёгкий скрипт без cookie-баннеров: анонимный `visitorId` (localStorage), `sessionId` (30 минут бездействия), first-touch UTM и referrer.

События: `page_view`, `section_view` (`section`), `cta_click` (`location`), `form_open`, `form_start`, `form_submit` (`form`, `leadId`), `form_error`, `lang_switch`, `whatsapp_click`, `regulations_download`.

Разметка для автотрекинга на лендинге:
- `data-section="<id>"` на каждом блоке: `hero`, `audience`, `benefits`, `program`, `pricing`, `speakers`, `history`, `stories`, `address`, `partners`, `faq`, `contacts`
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
