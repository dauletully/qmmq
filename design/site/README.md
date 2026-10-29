# Дизайн сайта qmmq.kz — для вёрстки и бэкенда

Сайт — «постоянный дом» ассоциации: организация, 14 лет истории, команда, каталог мероприятий, сообщество, новости. Лендинг XII конкурса остаётся отдельной продающей страницей (`contest.qmmq.kz`), сайт на него ссылается.

## Ссылки

| Что | Ссылка |
|---|---|
| Макет «Сайт QMMQ» — холст, 35 артбордов 390 и 1440 | https://claude.ai/artifact/QHe81uFdkkUYtrtNpte2tk |
| Дизайн-система «QMMQ» — обновлена: слой сайта, 23 новых компонента с превью | https://claude.ai/artifact/TUnmWWAMb1Pc1iJJAvFpsa |
| Макет лендинга XII конкурса (для сравнения) | https://claude.ai/artifact/Ntsphun6Sp8T9otrSAUjsX |

Artifact приватные: чтобы их увидели другие, владелец делится ими через меню Share.

## Файлы

```
design/site/
  README.md                       этот документ
  project/                        исходники холста (один в один то, что опубликовано в Artifact)
    canvas.json                   раскладка артбордов, заметки, запись о дизайн-системе
    Main.dc.html, M-*.dc.html     артборды 390 (Main — главная, точка входа холста; M = mobile)
    D-*.dc.html                   артборды 1440 (D = desktop)
    assets/qmmq-logo.png          логотип (копия public/brand/qmmq-logo.png)
    ds/qmmq/                      копия дизайн-системы, которую подключают артборды
  design-system/                  исходники обновления дизайн-системы
    site.css                      ← единственный новый CSS: слой сайта (добавляется к bundle.css лендинга)
    components/bundle.css         = design/system/project/components/bundle.css + site.css (сборка)
    components/<Name>/            README.md и preview.html 23 новых компонентов (+ Stat с правкой)
    README.md                     брендбук с новым разделом «Сайт qmmq.kz»
```

- `design/system/project/` (источник ДС лендинга) **не трогался**: чтобы репозиторий совпал с опубликованной ДС, нужно скопировать `design/site/design-system/` поверх `design/system/project/` (bundle.css, README.md, папки компонентов). `design/tokens.css` не менялся — токены те же.
- Посмотреть артборд локально: открыть `project/<имя>.dc.html` в браузере из папки `project/` — стили подхватываются по относительному пути `ds/qmmq/…`, отсутствие `support.js` не мешает. Так же измерялись высоты в `canvas.json`.

## Ключевые решения

- **Та же система, что на лендинге**: палитра A «Синий и золото», Golos Text, сетка 4 / 12 колонок, поля 20 / 80 px, контейнер 1280, блоки 64 / 112 px, фоны чередуются белый / `surface-alt`, синие ленты — шапка, первый экран, призыв к подписке, подвал.
- **Логотип**: на лендинге уже стоит настоящий знак (`public/brand/qmmq-logo.png`) в белой плашке — на сайте тот же `q-logo` (40 px в шапке, 56 px в подвале). Текстовый `q-mark` остаётся запасным.
- **Статус показываем, а не называем**: `q-status` с точкой и датой — «Регистрация до 30 ноября», «Анонс», «Лист ожидания», «Прошло · итоги». Без счётчика до минут: на сайте только дата.
- **Три цвета предметов** — в тегах карточек, чипах фильтров, иконках чатов. Цвет всегда с названием предмета.
- **Люди и цифры**: квадратные ч/б портреты (`q-person`), реальные имена только из `docs/research/facts.md`, цифры с подписью периода и источником («по данным ассоциации»).
- **Mobile-first**: артборды 390 — основные; на 1440 те же блоки раскладываются в 2–4 колонки и пары «контент 8 / панель 4». Касание ≥ 44 px, контраст по таблице `system/project/contrast.md`, все элементы управления — настоящие `a`/`button`/`input`+`label`.
- **Корневые модификаторы** `q-m` / `q-d` на артбордах фиксированной ширины; в Next.js они превращаются в медиазапросы `min-width: 1024px` / `1440px` (правила `.q-d .x {…}` → `@media (min-width: 1024px) { .x {…} }`).
- **Языки**: RU / KZ на всём сайте (`/kz`), EN — только «Об ассоциации» и «Партнёрам» (переключатель там с тремя пунктами). Казахский на 20–30 % длиннее — ни один блок не фиксирует высоту под русскую строку.

## Глобальные элементы

| Элемент | 390 | 1440 | Данные |
|---|---|---|---|
| Шапка `q-sitehead` | 56 px: логотип · RU/KZ · кнопка меню | 72 px: логотип · 7 пунктов (активный — золотая линия снизу) · RU/KZ(/EN) · кнопка «Вступить в сообщество» | `site-settings` (название, логотип), меню фиксировано в коде |
| Меню `q-menu` (M-Menu) | полноэкранный лист на `brand`: 7 строк по 56 px с шевронами, подпункты у «Мероприятий», «Сообщества», «Новостей»; внизу язык, кнопка, телефон и WhatsApp | — | то же |
| Крошки `q-crumbs` | на всех внутренних страницах, точки-разделители | то же | из маршрута |
| Шапка страницы `q-pagehero` | синяя (разделы) или светлая `--light` (каталоги, формы, тексты) | то же, текст до 840 px | `pages` / коллекция раздела |
| Подвал `q-sitefoot` | четыре блока столбиком: о нас + соцсети, разделы, контакты, документы + язык; реквизиты одной строкой | четыре колонки 4 / 2 / 3 / 3 | `site-settings`: контакты, соцсети, реквизиты, документы |
| Подписка `q-subscribe` | синяя лента: e-mail + кнопка, ссылки на каналы | 7 / 5 | `leads.type = subscribe` (предложение) или сервис рассылки |

## Страницы

Высоты — измеренные, они же в `canvas.json`.

### Главная `/` — Main (390) 8389 · D-Home 6129 · M-Home-KZ 8667 (черновой перевод)
- **390**: синий первый экран с сеткой и построением Евклида, надзаголовок, h1 «Профессиональное сообщество … с 2012 года», абзац, две кнопки во всю ширину, три цифры строками (`q-stat--row`). Далее: «Ближайшие мероприятия» — 3 `q-event` столбиком + кнопка «Все мероприятия»; «Три причины» — 3 `q-tile`; «14 лет в цифрах» — цифры строками + полоса по уровням + легенда; «Истории роста» — карусель `q-story` 316 px + точки + кнопка; «Новости» — 3 `q-news--row`; «Партнёры» — `q-partner` столбиком; подписка; подвал.
- **1440**: первый экран 7 / 5 (текст / построение), цифры 72 px столбцами; мероприятия 3 в ряд; причины 3 в ряд с заголовком `q-sechead--split`; цифры `q-stat--md` 3 столбца + полоса справа (8 / 4); истории 3 в ряд; новости 3 в ряд с обложками 16:10; партнёры 3 × 2; подписка 7 / 5; подвал 4 колонки.
- **Данные**: `pages.home` (hero: heading, lead, stats[], primaryCta, secondaryCta; reasons[]: icon, title, text; figures[], levelsBar[]: value, label, kind), `events` (ближайшие 3 по `startDate ≥ today`, статус вычисляется), `people` + `stories` (истории: person → people, quote, achievement, publishConsent), `news` (3 последних), `partners` (`showOnHome`, порядок), `site-settings`.
- **Поведение**: досчёт цифр при появлении, карусель историй с привязкой (390) / сетка (1440), «Все мероприятия» ведёт в каталог с фильтром «Ближайшие».

### Об ассоциации `/about` — M-About 8718 · D-About 5449
- Синяя шапка с крошками и тремя языками; миссия и три причины (`q-tile`); таймлайн 2011 → 2026 (`q-tl` вертикальный / `q-tlh` горизонтальный, `is-now` у декабря 2026); команда и совет (`q-people` 2 / 4 колонки: президент Кайрош Макишев, вице-президент Бахнур Зиябеков, 4 места совета — заглушки); блок академика (`q-feature`: квадратный портрет, регалии, цитата «Богатство казахов — не под землёй…», связь с конкурсами); документы (`q-doc`: устав, свидетельство; реквизиты `q-kv`; благодарности `q-gallery`).
- **Данные**: `pages.about` (mission, reasons[], milestones[] с `kind`, academician: person → people, regalia[], quote, quoteSource, ties[]), `people` с ролями `president | vicePresident | council`, `documents` (`kind`: charter, certificate, requisites, thanks), `site-settings.requisites`.

### Мероприятия `/events` — M-Events 4219 · D-Events 2425 · M-Events-Filters 844
- Светлая шапка; фильтры: на 390 — поиск, чип «Фильтры (2)», горизонтальная лента чипов предметов, сегмент «Ближайшие | Архив»; чип открывает нижний лист `q-sheet` (M-Events-Filters) с группами предмет / тип / формат / уровень / регион / год и кнопками «Сбросить» и «Показать 7». На 1440 — одна строка: поиск, чипы предметов, селекты тип · формат · уровень · регион · год, выбранные чипы с «×» и «Сбросить», счётчик «Найдено 7».
- Список: «Ближайшие» — `q-event` (на 1440 `q-event--row`: дата 72 px · содержание · статус и цена справа); «Прошедшие» — `q-event--past` со статусом «Прошло · итоги» и ссылкой «Победители, фото, задачи»; пагинация `q-pager`; ссылка в архив `/events/archive` (та же страница с фильтром «Архив», отдельного артборда нет).
- **Данные**: `events` (title, slug, type, subjects[], level, format, city, region, startDate, endDate, registrationDeadline, price, groupMinSize) + вычисляемый `status` (`announced | open | waitlist | closed | past`) и `year` из `startDate`.
- **Поведение**: фильтры живут в query-параметрах (`?subject=math&year=2026`), применяются без перезагрузки; лист на 390 — модальный, с фокус-ловушкой; поиск по названию и городу; пагинация по 10, на 390 допустима кнопка «Показать ещё» (`q-loadmore`).

### Карточка мероприятия `/events/[slug]` — регистрация открыта: M-Event-Open 6614 · D-Event-Open 4557; после события: M-Event-Results 6462 · D-Event-Results 4765
- **Открыта**: синяя шапка (крошки, теги предметов, h1, строки даты / города / формата, `q-status--lg`, строка о Министерстве, кнопки «Зарегистрироваться — 50 000 ₸» → лендинг и «Скачать положение»); полоса якорей `q-anchors`; описание; «Что получает участник» `q-checks`; программа по дням `q-acc` + `q-sched` («—:—»); спикеры и жюри `q-people`; стоимость: карточка цены с «входит / не входит», золотая плашка «Условия для школ — от 5 участников» (кто платит, документы для бухгалтерии, письмо директору, замена участника), образец документа `q-doc`; площадка `q-contact` + `q-map`; организаторы `q-partners`. На 1440 — 8 / 4 с закреплённой панелью `q-aside` (цена, даты, город, дедлайн, документ, кнопки, WhatsApp).
- **Итоги**: шапка со статусом «Прошло», якоря Итоги · Победители · Фото · Задачи · Пресса; цифры (115 · 75+ · 45 · 2); победители — `q-winners` строками (390) / `q-table` (1440) с бейджами `q-place`; галерея `q-gallery` с подписями «что · где · год»; задачи и решения `q-doc` с уровнями доступа `q-access`; пресс-релиз и ссылки на публикации; организаторы; призыв «Следующее мероприятие».
- **Данные** (есть): `events.program[]`, `regulationsPdf`, `certificateSample`, `venue*`, `mapUrl`, `participantsChatUrl`; `people`, `partners`. **Нужно добавить** — см. «Модель данных».
- **Поведение**: якоря подсвечиваются по прокрутке; карта грузится по кнопке; после `registrationDeadline` кнопки → «Записаться в лист ожидания», статус → `waitlist`; после `endDate` страница показывает блок итогов, если он заполнен.

### Конкурс учителей `/contest`, `/contest/[год]` — M-Contest 6800 · D-Contest 4071
- Синяя шапка с карточкой текущего сезона (XII · 5–6 декабря 2026 · статус · цена · «Страница конкурса» → лендинг); лента сезонов `q-years` (I 2013 … X 2023, XI «уточняется», XII `is-next`); карточки сезонов `q-season` (1440 — 4 в ряд); «Победители по годам» — селект года + `q-winners` / `q-table` (год · место · имя · школа, город · предмет); «Как проходит конкурс» — 3 `q-tile`; призыв на лендинг.
- `/contest/[год]` — та же страница, открытая на сезоне: лента с `aria-current`, карточка сезона сверху, таблица отфильтрована (отдельный артборд не делался).
- **Данные**: предлагаемые `seasons` (или `events.seasonNumber`) и `winners` — см. ниже; текущий сезон — `site-settings.activeLanding → landings.event`.

### Сообщество `/community` — M-Community 6618 · D-Community 4398
- Синяя шапка с двумя кнопками; «Что даёт сообщество» — 4 `q-tile`; «Чаты по предметам» — 3 карточки `q-subject` с ссылками Telegram / WhatsApp; «Педагоги-мастера» — `q-people` 4 + ссылка в каталог; истории (как на главной); золотая плашка «Стать спикером или членом жюри».
- **Данные**: `pages.community` (benefits[], chatLinks — лучше в `site-settings.chatLinks[]`: subject, telegramUrl, whatsappUrl), `people` (`roles` содержит `master`, `catalogConsent`), `stories`.

### Каталог педагогов `/community/people` — M-People 3599 · D-People 2263
- Светлая шапка; фильтры: поиск, чипы предметов, селект региона, на 1440 — роль; сетка `q-people` 2 / 4 колонки (первым — академик с тегом «Жюри»); пагинация; `q-note` «Хотите попасть в каталог…».
- **Данные**: `people` с `publishConsent` и `catalogConsent`, `subjects[]`, `region`, `city`, `school`, `firstParticipationYear`, `roles[]`. **Поведение**: фильтры в query, пагинация по 24.

### Вступление `/community/join` — M-Join 4957 · D-Join 3371
- Светлая шапка; вкладки `q-tabs` «Вступить в сообщество» | «Стать спикером / членом жюри»; форма 1 (ФИО, предметы чипами, регион → город, школа, стаж сегментом, телефон WhatsApp с маской, e-mail, «как хотите участвовать» чекбоксами, согласие на каталог — необязательно, согласие на обработку); форма 2 (роль чипами, предметы, тема / опыт, регалии и достижения учеников, ссылка на материалы, телефон, e-mail, согласие); шаги «Что дальше» `q-steps`. На 1440 — 8 / 4 с панелью «Что даёт сообщество» и контактами.
- **Данные / API**: `POST /api/forms/community` и `/api/forms/speaker` (те же правила: zod-схема, honeypot, `startedAt`, нормализация телефона, заявка → amoCRM с тегом типа). Ошибки — сводка `q-summary` над формой, как на лендинге.

### Новости `/news`, `/news/[slug]` — M-News 3197 · D-News 2591 · M-News-Article 5019 · D-News-Article 3978
- Список: светлая шапка с вкладками «Новости | Материалы», чипы тегов, крупная карточка `q-news--feature`, затем `q-news--row` (390) / сетка 3 (1440), пагинация.
- Статья: крошки, теги, h1 `q-h1--page`, дата · автор · время чтения, обложка с подписью, `q-prose` (заголовки, списки, цитата `blockquote` с золотой линией), галерея, «Поделиться», «По теме» — карточка связанного мероприятия и 2 новости. На 1440 — 8 / 4 с закреплённой панелью (мероприятие, документы).
- **Данные**: коллекция `news` — см. ниже. **Поведение**: теги — фильтр в query; галерея открывается во весь экран с подписями; «Скопировать ссылку».

### Материалы `/materials` — M-Materials 3683 · D-Materials 1877
- Светлая шапка с вкладками; фильтры: тип (положения · задачи и решения · презентации · видео), предметы, год, доступ; легенда уровней доступа; список `q-doc` (1440 — 2 колонки) с иконкой типа, метаданными (формат · год · размер), бейджем `q-access` и действием (скачать / замок); `q-note` о личном кабинете; пагинация.
- **Данные**: коллекция `materials`. **Поведение**: открытые файлы скачиваются сразу; `participants` / `members` до личного кабинета показывают замок и подсказку «Доступ появится в личном кабинете» (вторая очередь).

### Партнёрам `/partners` — M-Partners 6568 · D-Partners 3922
- Синяя шапка (три языка); цифры аудитории; «Форматы сотрудничества» — 4 `q-tile`; «Партнёры прошлых лет» по группам (`q-partners`: министерства, вузы и школы, спонсоры, методические организации) с годом и ролью; «Пакет спонсора» `q-doc` + форма запроса (`q-form-card`: организация, контактное лицо, телефон, e-mail, формат, сообщение, согласие); контакт координатора. На 1440 — 7 / 5.
- **Данные**: `pages.partners` (formats[], audienceStats[], sponsorPackage → media, coordinator → people), `partners` с `year` / `roleNote` / `group`; `POST /api/forms/partner`.

### Контакты `/contacts` — M-Contacts 3894 · D-Contacts 2274
- Светлая шапка; строки `q-contact` (адрес, телефон, WhatsApp, e-mail, часы); карта `q-map` по кнопке; соцсети `q-social`; форма «Написать нам» (имя, телефон или e-mail, тема, сообщение, согласие); реквизиты `q-kv`. На 1440 — 5 / 7.
- **Данные**: `site-settings` (phones, whatsapp, email, address, hours, socials[], requisites, mapUrl); `POST /api/forms/contact`.

### Служебные
- **Типовая текстовая страница** (политика, оферта, любая `pages`) — M-Page 3997 · D-Page 2707: светлая шапка, дата обновления, оглавление `q-toc` (на 1440 закреплено слева, 4 / 8), `q-prose`, кнопка «Скачать PDF». Данные: `pages` (title, slug, updatedAt, body rich text, pdf).
- **404** — M-404 1975 · D-404 1331: синяя лента с сеткой и построением, «404» золотом, h1, абзац, кнопки «На главную» и «Мероприятия», поиск, ссылки на разделы.
- **Меню** — M-Menu 844. **«Спасибо», вход, личный кабинет** — не рисовались: «Спасибо» берётся с лендинга (`Mobile-Thanks`), кабинет — вторая очередь.

## Модель данных: что есть и что предлагается

Есть в `docs/ARCHITECTURE.md` и используется как есть: `events`, `people`, `partners`, `media`, `landings`, `leads`, `site-settings`. Ниже — что нужно добавить (бэкенд строится параллельно, поэтому имена предложены в том же стиле; *loc* — локализованное поле).

**events — дополнить**
- `description` *loc* (rich text), `audienceNote` *loc*, `includes[]` *loc*, `excludes[]` *loc*, `benefits[]` (icon, title *loc*, text *loc*)
- `schoolTerms` (group): `payerOptions` *loc*, `accountingDocs` *loc*, `invitationLetter` (bool + PDF), `replaceUntil` (date)
- `programPdf` (→ media), `organizers[]` (partner → partners, `role` *loc*), `people[]` (person → people, `role`: jury | speaker, `note` *loc*)
- `region` (enum из `lib/constants.ts`) — для фильтра; `registrationOpen` (ручной override статуса)
- `results` (group): `summary` *loc*, `figures[]` (value, label *loc*), `winners[]` (person → people или `name`, `place`: grand | 1 | 2 | 3, `subject`, `school` *loc*, `city` *loc*, `score`, `publishConsent`, `sourceNote` *loc*), `placeCounts` (1 / 2 / 3), `prizesNote` *loc*, `gallery[]` (media, caption *loc*), `documents[]` (→ materials), `pressRelease` (→ media), `pressLinks[]` (outlet, title, url, date)
- `seasonNumber` (римская цифра для конкурсов) — или отдельная коллекция `seasons` (number, event → events, year, participantsNote *loc*, sourceNote *loc*)
- Статус вычисляется на сервере: `announced` (нет `registrationDeadline`), `open`, `waitlist` (после дедлайна до старта), `past` (после `endDate`, с итогами — если `results.summary` заполнен).

**people — дополнить**
- `roles[]`: + `president`, `vicePresident`, `council`; `city` *loc*; `catalogConsent` (отдельно от `publishConsent`); `isMentor`; `bio` *loc* для страницы человека (если появится `/community/people/[slug]`).

**partners — дополнить**: `year` (строка «2013» / «2022–2023»), `roleNote` *loc* («Площадка IX конкурса»), `group` (ministry | university | school | sponsor | methodical | media), `showOnHome`.

**Новые коллекции**
- `news`: `title` *loc*, `slug`, `date`, `kind` (results | announce | contest | community | press), `cover` (→ media, `caption` *loc*), `lead` *loc*, `body` *loc* (rich text), `gallery[]` (media, caption *loc*), `relatedEvent` (→ events), `documents[]` (→ materials), `author` *loc*, `seo` (title, description, ogImage), `status` (draft | published).
- `materials`: `title` *loc*, `type` (regulations | tasks | solutions | slides | video | article), `subjects[]`, `year`, `file` (→ media) или `url` (видео), `sizeLabel`, `access` (open | participants | members), `event` (→ events), `order`.
- `documents` (документы организации): `title` *loc*, `kind` (charter | certificate | requisites | sponsorPackage | thanks | offer | policy), `file`, `year`, `organization` *loc* (для благодарностей), `order`.
- `pages`: `title` *loc*, `slug`, `body` *loc*, `updatedAt`, `pdf`, `seo`; плюс фиксированные группы для разделов: `home`, `about` (mission, reasons[], milestones[] с `kind`: default | pause | now, academician), `community`, `partners` (formats[], audienceStats[], sponsorPackage, coordinator), `contest` (intro, howItGoes[]).
- `stories` (или поле `pages.home.stories[]`): `person` (→ people), `quote` *loc*, `achievement` *loc*, `subjects[]`, `publishConsent`.
- `winners` — если не вкладывать в `events.results` (удобнее для страницы «Победители по годам» и `/contest/[год]`): `event`, `year`, `place`, `person` / `name`, `school`, `city`, `subject`, `score`, `sourceNote`.

**leads.type — расширить**: `community` (fullName, subjects[], region, city, school, experience, phone, email, participation[]: meetings | chat | mentoring, catalogConsent), `speaker` (roles[]: speaker | jury, subjects[], topic, achievements, materialsUrl, phone, email), `partner` (organization, contactPerson, phone, email, format, message), `contact` (name, contact, topic, message), `subscribe` (email). Все — через `POST /api/forms/:type`, с тем же honeypot / `startedAt` / согласием и отправкой в amoCRM (своя воронка или теги).

**site-settings — дополнить**: `requisites` структурой (orgName, bin, address, bank, iik, bik, head) вместо одного текста, `hours` *loc*, `socials[]` (network, label, url), `chatLinks[]` (subject, telegramUrl, whatsappUrl), `mapUrl` офиса, `subscribeNote` *loc*, `menu` — фиксирован в коде.

## Поведение (сводно)

- **Фильтры** (`/events`, `/community/people`, `/materials`, теги `/news`): состояние в query-параметрах; чипы предметов — мультивыбор; выбранные фильтры дублируются строкой «активных» с «×» и «Сбросить»; на 390 — нижний лист с кнопкой «Показать N» (N считается на лету), фокус-ловушка, закрытие по Esc и по шторке.
- **Пагинация**: `?page=`; `q-pager` с «←» «→», текущая — синяя; на 390 допустимо «Показать ещё».
- **Карусели** (истории на 390): прокрутка с привязкой, точки; с клавиатуры — стрелки на 1440 (`q-arrows`), карточки в табе-порядке.
- **Якоря** на карточке мероприятия: подсветка по прокрутке, полоса прилипает под шапкой на 1440.
- **Карта** грузится только по кнопке «Показать карту» (LCP).
- **Формы**: одна zod-схема, сводка ошибок `q-summary` + текст под полем, телефон `+7` с маской, регион → город, после отправки — страница «Спасибо» с лендинга (тексты по типу формы).
- **Анимация**: досчёт цифр 1200 мс, прорисовка таймлайна 600 мс, проявление блоков 400 мс; `prefers-reduced-motion` — без анимации.
- **Язык**: переключатель ведёт на ту же страницу в `/kz` (`hreflang` ru-KZ / kk-KZ); EN только у двух страниц.

## Новые компоненты дизайн-системы

Все в `design/site/design-system/components/`, CSS — в `site.css` (префикс `q-`), превью и правила — в README каждого:

SiteHeader (`q-sitehead`, `q-logo`, трёхъязычный `q-lang`) · MobileMenu (`q-menu`) · Breadcrumbs (`q-crumbs`) · PageHero (`q-pagehero`, `--light`) · StatusBadge (`q-status`: open / soon / waitlist / closed / past, `--lg`) · EventCard (`q-event`, `--row`, `--past`) · NewsCard (`q-news`, `--row`, `--feature`) · PersonCard (`q-person`, сетка `q-people` 2 / 4, `--row`) · FeatureBlock (`q-feature`, `--dark`) · Filters (`q-filters`, чипы предметов, `q-select--inline`, `q-search`, `q-active`) · FilterSheet (`q-sheet`, `q-scrim`, `q-fgroup`) · WinnersTable (`q-table` + `q-winners`, бейджи `q-place`) · DocumentCard (`q-doc`, `q-access`, `q-docs--2`) · Pagination (`q-pager`, `q-loadmore`) · PartnerTile (`q-partner`, `q-partners` 3 / 4) · Gallery (`q-gallery`, подписи «что · где · год») · SeasonStrip (`q-years`, `q-season`) · Tile (`q-tile`, `--alt`, `--gold`) · ContactRow (`q-contact`, `q-map`) · Subscribe (`q-subscribe`, `q-social`) · SiteFooter (`q-sitefoot`) · Anchors (`q-anchors`, `q-aside`) · Prose (`q-prose`, `q-toc`). Плюс служебные: `q-wrap`, `q-section(--alt)`, `q-sechead(--split)`, `q-cols--2/3/4/8-4/5-7/4-8`, `q-stat--md`, `q-kv`, `q-steps`, `q-segment`, `q-tabs`, `q-form-card`, `q-draft`.

## Что в макетах — заглушки

Все фото и портреты (сетка с инициалами, «Фото будет добавлено»); телефон, e-mail, WhatsApp, часы работы, банковские реквизиты, карта; четыре члена совета; состав жюри XII кроме академика; время программы («—:—»); площадка XII; «Совместно с Министерством» для XII; дата окончания регистрации «30 ноября» (условная, как на лендинге); второе и третье мероприятия на главной и в каталоге («Анонс», дата и стоимость уточняются); сезоны II–VI и XI; призёры I–III октябрьской олимпиады (только счёт); цифры «~130» и «~40», «20 регионов», «15,6 тыс. подписчиков» — по данным ассоциации / Instagram; пакет спонсора; размеры файлов; тексты политики (структура, «утверждает юрист»); казахский перевод главной (черновик). Истории роста победительниц 2026 года и каталог педагогов публикуются только с согласия.

## Вопросы к заказчику

1. Логотип: подтвердить, что знак из `public/brand/qmmq-logo.png` — окончательный, и есть ли вектор.
2. Состав совета ассоциации, должности, фото одной съёмки; подтверждение имени вице-президента (Бахнур Зиябеков) и его согласие на публикацию.
3. Существовал ли XI конкурс (2024?) и протоколы победителей по сезонам I–X — для таблицы «Победители по годам».
4. Источник цифр «10 000+», «~130», «~40», «20 регионов» — можно ли писать «по данным ассоциации».
5. Ссылки на чаты по предметам (Telegram / WhatsApp), соцсети, телефон, e-mail, часы, банковские реквизиты.
6. Уровни доступа к материалам до личного кабинета: показывать ли закрытые файлы в списке.
7. Какие форматы партнёрства и пакет спонсора; кто координатор.
8. Кто вычитывает казахский и переводит EN-версии двух страниц.
