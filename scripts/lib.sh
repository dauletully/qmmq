#!/usr/bin/env bash
# Общие функции серверных скриптов qmmq.kz (release.sh, backup.sh, restore.sh, status.sh).
# Подключается через `source`; сам по себе ничего не делает.

QMMQ_DIR=${QMMQ_DIR:-/opt/qmmq}              # активная версия кода (рабочая копия)
ENV_FILE=${ENV_FILE:-$QMMQ_DIR/deploy/.env}  # секреты
STATE_DIR=${STATE_DIR:-/var/lib/qmmq}        # история релизов, исходники релизов, блокировки
RELEASES_DIR=$STATE_DIR/releases
BACKUP_DIR=${BACKUP_DIR:-/var/backups/qmmq}
MEDIA_VOLUME=qmmq_media

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m OK\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m !!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mERR\033[0m %s\n' "$*" >&2; exit 1; }

# Читает deploy/.env без выполнения кода: только строки вида КЛЮЧ=значение.
load_env() {
  local file=${1:-$ENV_FILE} line key value
  [ -r "$file" ] || die "Нет файла $file (см. docs/DEPLOY.md, шаг «Первый деплой»)"
  while IFS= read -r line || [ -n "$line" ]; do
    line=${line%$'\r'}
    [[ $line =~ ^[[:space:]]*# ]] && continue
    [[ $line =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
    key=${BASH_REMATCH[1]}
    value=${BASH_REMATCH[2]}
    value=${value%\"}; value=${value#\"}
    value=${value%\'}; value=${value#\'}
    export "$key=$value"
  done < "$file"
  : "${POSTGRES_DB:=qmmq}" "${POSTGRES_USER:=qmmq}"
  export POSTGRES_DB POSTGRES_USER
}

# docker compose для активной версии (/opt/qmmq/deploy).
dc() {
  docker compose --project-directory "$QMMQ_DIR/deploy" \
    -f "$QMMQ_DIR/deploy/docker-compose.yml" --env-file "$ENV_FILE" "$@"
}

# Образ с pg_dump/pg_restore/tar для служебных операций — тот же, что у базы.
tools_image() {
  local id img
  id=$(dc ps -q db 2>/dev/null || true)
  if [ -n "$id" ]; then
    img=$(docker inspect -f '{{.Config.Image}}' "$id" 2>/dev/null || true)
  fi
  echo "${img:-postgres:17-trixie}"
}

db_running() {
  [ -n "$(dc ps -q --status running db 2>/dev/null || true)" ]
}

# rclone настраивается переменными окружения: удалённое хранилище «yos:».
setup_rclone() {
  command -v rclone >/dev/null || die "rclone не установлен (scripts/server-setup.sh ставит его)"
  [ -n "${BACKUP_S3_BUCKET:-}" ] && [ -n "${BACKUP_S3_ACCESS_KEY_ID:-}" ] && [ -n "${BACKUP_S3_SECRET_ACCESS_KEY:-}" ] \
    || die "Не заполнены BACKUP_S3_BUCKET / BACKUP_S3_ACCESS_KEY_ID / BACKUP_S3_SECRET_ACCESS_KEY в $ENV_FILE"
  export RCLONE_CONFIG_YOS_TYPE=s3
  export RCLONE_CONFIG_YOS_PROVIDER=Other
  export RCLONE_CONFIG_YOS_ENV_AUTH=false
  export RCLONE_CONFIG_YOS_ACCESS_KEY_ID=$BACKUP_S3_ACCESS_KEY_ID
  export RCLONE_CONFIG_YOS_SECRET_ACCESS_KEY=$BACKUP_S3_SECRET_ACCESS_KEY
  export RCLONE_CONFIG_YOS_ENDPOINT=${BACKUP_S3_ENDPOINT:-https://storage.yandexcloud.kz}
  export RCLONE_CONFIG_YOS_REGION=${BACKUP_S3_REGION:-kz1}
  export RCLONE_CONFIG_YOS_NO_CHECK_BUCKET=true
  REMOTE="yos:$BACKUP_S3_BUCKET/${BACKUP_S3_PREFIX:-daily}"
}

# Точное число строк в каждой таблице схемы public (вывод: таблица|строк).
# $1 — команда, которая принимает SQL на stdin и выполняет его через psql.
TABLE_COUNTS_SQL="SELECT table_name || '|' || (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"

human_size() { numfmt --to=iec --suffix=B "$1" 2>/dev/null || echo "$1 B"; }
