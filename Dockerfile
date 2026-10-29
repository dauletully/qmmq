# syntax=docker/dockerfile:1
#
# Продакшен-образ qmmq.kz: Next.js 16 (output: 'standalone') + Payload CMS 3.
# Собирается на сервере (x86_64) из deploy/docker-compose.yml — см. docs/DEPLOY.md.
#
# Цели сборки (target):
#   runner   — образ приложения: `node server.js` из standalone-сборки;
#   migrator — исходники + все зависимости; по умолчанию выполняет `pnpm payload migrate`.

ARG NODE_IMAGE=node:24-trixie-slim

# ---------- общая база: Node 24 + pnpm той же версии, что у разработчика ----------
FROM ${NODE_IMAGE} AS base
ARG PNPM_VERSION=12.16.1
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@${PNPM_VERSION} && pnpm --version
WORKDIR /app

# ---------- зависимости (кешируется, пока не менялся lock-файл) ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
RUN --mount=type=cache,id=qmmq-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store

# ---------- исходники: используется для миграций базы ----------
FROM deps AS migrator
COPY . .
ENV NODE_ENV=production
CMD ["pnpm", "payload", "migrate"]

# ---------- сборка Next.js ----------
FROM migrator AS builder
# Потолок кучи Node для `next build`. Скрипт build из package.json ставит 8000 МБ —
# на ВМ с 4 ГБ ОЗУ это уводит сборку в swap, поэтому next build вызывается напрямую
# с меньшим лимитом (меняется переменной NODE_BUILD_HEAP_MB в deploy/.env).
ARG NODE_BUILD_HEAP_MB=3072
RUN --mount=type=cache,id=qmmq-next-cache,target=/app/.next/cache \
    mkdir -p public \
 && NODE_OPTIONS="--no-deprecation --max-old-space-size=${NODE_BUILD_HEAP_MB}" pnpm exec next build

# ---------- итоговый образ приложения ----------
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --no-create-home --shell /usr/sbin/nologin nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# media — папка загрузок Payload (staticDir коллекции media, относительно /app);
# в продакшене на неё монтируется том qmmq_media, права берутся отсюда.
RUN mkdir -p media .next/cache && chown nextjs:nodejs media .next/cache

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
