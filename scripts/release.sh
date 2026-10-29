#!/usr/bin/env bash
# Релизы qmmq.kz на сервере: сборка, миграции, переключение, откат.
#
#   release.sh deploy <sha> [--pull]  — вызывается из scripts/deploy.sh (с Mac), не руками;
#                                       исходники уже распакованы в /var/lib/qmmq/releases/<sha>
#   release.sh rollback [<sha>]       — вернуть предыдущий (или указанный) релиз без пересборки
#   release.sh list                   — история релизов
#
# Порядок деплоя (старая версия работает до последнего шага):
#   1) сборка образов qmmq-app:<sha> и qmmq-migrate:<sha>;
#   2) дамп базы перед миграцией (/var/backups/qmmq/predeploy);
#   3) миграции Payload (`payload migrate`) — при ошибке деплой останавливается;
#   4) переключение: код → /opt/qmmq, перезапуск контейнера app (Caddy держит запросы),
#      caddy reload, проверка; если новая версия не поднялась — автоматический возврат.
set -euo pipefail
shopt -s inherit_errexit

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"

KEEP_RELEASES=${KEEP_RELEASES:-3}
RELEASES_LOG=$STATE_DIR/releases.log
CURRENT_FILE=$STATE_DIR/current
LOCK_FILE=$STATE_DIR/release.lock

current_release() { cat "$CURRENT_FILE" 2>/dev/null || true; }
# Релизы из истории, от новых к старым, без повторов.
recent_releases() { { tac "$RELEASES_LOG" 2>/dev/null || true; } | awk '!seen[$3]++ {print $3}'; }

lock() {
  exec 9>"$LOCK_FILE"
  flock -n 9 || die "Другой деплой или откат уже выполняется"
}

# docker compose для распакованного релиза (до переключения).
dcr() {
  local rel=$1; shift
  docker compose --project-directory "$rel/deploy" \
    -f "$rel/deploy/docker-compose.yml" --env-file "$ENV_FILE" "$@"
}

# Первый деплой: создать deploy/.env со сгенерированными секретами и остановиться.
ensure_env() {
  local rel=$1 pw secret
  [ -f "$ENV_FILE" ] && return 0
  [ -f "$rel/deploy/.env.example" ] || die "В релизе нет deploy/.env.example"
  mkdir -p "$(dirname "$ENV_FILE")"
  pw=$(openssl rand -hex 24)
  secret=$(openssl rand -hex 32)
  ( umask 077
    sed -e "s|^PAYLOAD_SECRET=.*|PAYLOAD_SECRET=$secret|" \
        -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$pw|" \
        -e "s|^DATABASE_URL=.*|DATABASE_URL=postgres://qmmq:$pw@db:5432/qmmq|" \
        "$rel/deploy/.env.example" > "$ENV_FILE" )
  chmod 600 "$ENV_FILE"
  log "Создан $ENV_FILE: PAYLOAD_SECRET, POSTGRES_PASSWORD и DATABASE_URL сгенерированы."
  log "Заполните ACME_EMAIL и BACKUP_S3_* (nano $ENV_FILE), сохраните копию файла"
  log "в менеджере паролей и запустите scripts/deploy.sh ещё раз."
  exit 3
}

check_env() {
  local missing="" v
  for v in DATABASE_URL PAYLOAD_SECRET SITE_URL LANDING_HOST POSTGRES_PASSWORD ACME_EMAIL; do
    [ -n "${!v:-}" ] || missing="$missing $v"
  done
  [ -z "$missing" ] || die "В $ENV_FILE не заполнены:$missing"
  [ ${#PAYLOAD_SECRET} -ge 32 ] || die "PAYLOAD_SECRET короче 32 символов — сгенерируйте: openssl rand -hex 32"
  case "$DATABASE_URL" in
    *"$POSTGRES_PASSWORD"*) ;;
    *) warn "DATABASE_URL не содержит POSTGRES_PASSWORD — проверьте, что пароли совпадают" ;;
  esac
  [ -n "${BACKUP_S3_BUCKET:-}" ] || warn "BACKUP_S3_BUCKET не заполнен — ежедневные бэкапы не будут выгружаться"
}

check_disk() {
  local avail_gb
  avail_gb=$(df -BG --output=avail /var/lib/docker 2>/dev/null | tail -1 | tr -dc '0-9')
  [ -n "$avail_gb" ] || return 0
  if [ "$avail_gb" -lt 5 ]; then
    die "Свободно ${avail_gb} ГБ — мало для сборки. Освободите место: docker system prune -f; docker builder prune -f"
  fi
}

predeploy_dump() {
  local sha=$1 dir file
  db_running || { log "База ещё не запущена — дамп перед миграцией не нужен"; return 0; }
  dir=$BACKUP_DIR/predeploy
  mkdir -p "$dir"
  file="$dir/$(date +%Y-%m-%d_%H%M%S)_before_$sha.dump"
  log "Дамп базы перед миграцией → $file"
  dc exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$file.part"
  mv "$file.part" "$file"
  # хранить 5 последних
  ls -1t "$dir"/*.dump 2>/dev/null | tail -n +6 | xargs -r rm -f || true
}

health_check() {
  local code i
  for i in $(seq 1 20); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1:3000/api/users/me || true)
    if [ "$code" -ge 200 ] 2>/dev/null && [ "$code" -lt 500 ]; then
      ok "Приложение отвечает (HTTP $code)"
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 -H "Host: ${LANDING_HOST}" http://127.0.0.1/ || true)
      case "$code" in
        3??) ok "Caddy отвечает (HTTP $code → https)";;
        *) warn "Caddy на :80 ответил HTTP $code";;
      esac
      return 0
    fi
    sleep 3
  done
  return 1
}

# Сделать релиз активным: код, теги образов, контейнеры, Caddy.
# Вызывается внутри `if`, поэтому set -e здесь не действует — ошибки собираются в rc.
activate() {
  local sha=$1 rc=0
  docker image inspect "qmmq-app:$sha" >/dev/null 2>&1 || die "Нет образа qmmq-app:$sha"
  if [ -d "$RELEASES_DIR/$sha" ]; then
    rsync -a --delete --exclude=/deploy/.env "$RELEASES_DIR/$sha/" "$QMMQ_DIR/" || rc=1
  else
    warn "Исходники релиза $sha удалены — переключаю только образ, код в $QMMQ_DIR не меняется"
  fi
  docker tag "qmmq-app:$sha" qmmq-app:latest || rc=1
  if docker image inspect "qmmq-migrate:$sha" >/dev/null 2>&1; then
    docker tag "qmmq-migrate:$sha" qmmq-migrate:latest || rc=1
  fi
  log "Перезапуск контейнеров"
  dc up -d --wait --wait-timeout 300 --remove-orphans || rc=1
  dc exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile \
    || warn "caddy reload не удался — проверьте: docker compose logs caddy"
  health_check || rc=1
  return $rc
}

record() {
  local action=$1 sha=$2
  echo "$sha" > "$CURRENT_FILE"
  printf '%s %s %s\n' "$(date -Iseconds)" "$action" "$sha" >> "$RELEASES_LOG"
}

install_timer() {
  local unit
  if ! sudo -n true 2>/dev/null; then
    warn "Нет sudo без пароля — таймер бэкапа не обновлён (см. docs/DEPLOY.md)"
    return 0
  fi
  for unit in qmmq-backup.service qmmq-backup.timer; do
    sudo install -m 0644 "$QMMQ_DIR/deploy/systemd/$unit" "/etc/systemd/system/$unit"
  done
  sudo systemctl daemon-reload
  sudo systemctl enable --now qmmq-backup.timer >/dev/null 2>&1 || warn "Не удалось включить qmmq-backup.timer"
}

prune() {
  local keep sha tag
  keep=$(recent_releases | head -n "$KEEP_RELEASES" || true)
  keep=$(printf '%s\n%s\n' "$keep" "$(current_release)")
  if [ -d "$RELEASES_DIR" ]; then
    for sha in $(ls -1 "$RELEASES_DIR"); do
      grep -qx "$sha" <<<"$keep" || rm -rf "${RELEASES_DIR:?}/$sha"
    done
  fi
  for tag in $(docker image ls qmmq-app --format '{{.Tag}}'; docker image ls qmmq-migrate --format '{{.Tag}}'); do
    [ "$tag" = latest ] && continue
    grep -qx "$tag" <<<"$keep" && continue
    docker image rm "qmmq-app:$tag" "qmmq-migrate:$tag" >/dev/null 2>&1 || true
  done
  docker image prune -f >/dev/null
  docker builder prune -f --filter until=168h >/dev/null 2>&1 || true
}

cmd_deploy() {
  local sha=${1:-} pull="" rel prev started
  [[ $sha =~ ^[0-9a-f]{7,40}$ ]] || die "Использование: release.sh deploy <sha> [--pull]"
  [ "${2:-}" = "--pull" ] && pull="--pull"
  rel=$RELEASES_DIR/$sha
  [ -f "$rel/deploy/docker-compose.yml" ] || die "Нет исходников релиза в $rel"
  lock
  started=$(date +%s)

  ensure_env "$rel"
  load_env
  check_env
  check_disk

  log "Сборка образов релиза $sha (на 2 vCPU — 5–15 минут)"
  APP_TAG=$sha dcr "$rel" --profile tools build $pull app migrate

  predeploy_dump "$sha"

  log "Миграции базы"
  if ! APP_TAG=$sha dcr "$rel" --profile tools run --rm migrate; then
    die "Миграции не применились — работает прежняя версия. Если база изменилась частично, восстановите дамп из $BACKUP_DIR/predeploy (scripts/restore.sh apply <файл.dump> --yes)"
  fi

  prev=$(current_release)
  log "Переключение на $sha"
  if ! activate "$sha"; then
    warn "Новая версия не поднялась. Последние строки лога:"
    dc logs --tail=80 app >&2 || true
    if [ -n "$prev" ] && [ "$prev" != "$sha" ]; then
      warn "Возвращаю предыдущий релиз $prev"
      activate "$prev" && record auto-rollback "$prev"
    fi
    die "Деплой $sha не удался"
  fi
  record deploy "$sha"
  install_timer
  prune
  ok "Релиз $sha работает ($(( $(date +%s) - started )) с)"
}

cmd_rollback() {
  local target=${1:-} cur
  lock
  load_env
  cur=$(current_release)
  if [ -z "$target" ]; then
    target=$(recent_releases | grep -vx "$cur" | head -n 1 || true)
    [ -n "$target" ] || die "Нет предыдущего релиза для отката"
  fi
  log "Откат: $cur → $target"
  warn "Схема базы не откатывается. Если в отменяемом релизе были миграции — сначала"
  warn "  cd $QMMQ_DIR/deploy && docker compose --profile tools run --rm migrate pnpm payload migrate:down"
  warn "или восстановите дамп из $BACKUP_DIR/predeploy (см. docs/DEPLOY.md, «Откат»)."
  activate "$target" || die "Откат на $target не удался — смотрите docker compose logs app"
  record rollback "$target"
  ok "Активен релиз $target"
}

cmd_list() {
  local cur sha
  cur=$(current_release)
  echo "Активный релиз: ${cur:-нет}"
  echo
  echo "История (последние 15):"
  tail -n 15 "$RELEASES_LOG" 2>/dev/null || echo "  пусто"
  echo
  echo "Доступно для мгновенного отката (есть образ):"
  for sha in $(docker image ls qmmq-app --format '{{.Tag}}' | grep -v '^latest$'); do
    if [ "$sha" = "$cur" ]; then echo "  $sha  (активный)"; else echo "  $sha"; fi
  done
}

case "${1:-}" in
  deploy)   shift; cmd_deploy "$@" ;;
  rollback) shift; cmd_rollback "$@" ;;
  list)     cmd_list ;;
  *) sed -n '2,9p' "$0"; exit 1 ;;
esac
