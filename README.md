# qmmq.kz

Сайт Казахстанской ассоциации учителей математики и лендинг XII Международного творческого конкурса учителей математики, физики и информатики (contest.qmmq.kz).

Next.js 16 + Payload CMS 3 + PostgreSQL 17. Одно приложение: публичные страницы, админка (`/admin`), API форм, аналитика.

## Документы

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — решения, модель данных, API форм, amoCRM, аналитика, переменные окружения
- [docs/tz-landing.md](docs/tz-landing.md) — выжимка ТЗ лендинга с принятыми решениями
- [docs/DEPLOY.md](docs/DEPLOY.md) — деплой в Yandex Cloud Kazakhstan, бэкапы, откат
- [docs/research/facts.md](docs/research/facts.md) — проверенные факты для текстов (с источниками)
- [design/README.md](design/README.md) — дизайн-система и раскладка блоков лендинга
- [src/analytics/README.md](src/analytics/README.md) — трекер, события, пиксели

## Локальная разработка

Нужны Node 24 и pnpm. База — локальный кластер PostgreSQL 17 в `.local/pgdata` на порту 5433:

```bash
/Library/PostgreSQL/17/bin/pg_ctl -D .local/pgdata -l .local/postgres.log start
cp .env.example .env   # при первом запуске; PAYLOAD_SECRET — openssl rand -hex 32
pnpm install
pnpm dev               # http://localhost:3000 → лендинг, /admin — админка
pnpm seed              # мероприятие и лендинг contest-2026 (SEED_FORCE=1 — перезаписать тексты)
```

Лендинг без поддомена открывается по `/contest-2026`; с поддоменом — `http://contest.localhost:3000`.

## Проверки

```bash
pnpm tsc --noEmit
pnpm lint
pnpm test:int
```

## Изменения схемы базы

В dev схема синхронизируется сама. Для продакшена после изменения коллекций создайте миграцию и закоммитьте её:

```bash
pnpm payload migrate:create <название>
```

Деплой применяет миграции до переключения версии — см. [docs/DEPLOY.md](docs/DEPLOY.md).
