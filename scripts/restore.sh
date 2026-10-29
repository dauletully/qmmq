#!/usr/bin/env bash
# Восстановление qmmq.kz из резервной копии (см. scripts/backup.sh).
#
#   restore.sh list                     — копии в бакете (новые внизу)
#   restore.sh fetch  [ID|latest]       — скачать копию в /var/backups/qmmq/restore/ID и сверить суммы
#   restore.sh verify [ID|latest|ПАПКА] — ПРОВЕРКА восстановления на чистой временной базе:
#                                         прод не трогается, в конце — сравнение с живой базой
#   restore.sh apply  ID|ПАПКА --yes    — ВОССТАНОВИТЬ прод: заменить базу и медиафайлы копией
#   restore.sh apply  ФАЙЛ.dump --yes   — восстановить только базу из дампа (например, predeploy)
#
# ID — имя папки копии, например 2026-10-30_030000. ПАПКА — локальная копия
# (/var/backups/qmmq/<ID>). Перед apply автоматически делается локальная копия текущего состояния.
set -euo pipefail
shopt -s inherit_errexit

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"

CHECK_CONTAINER=qmmq-restore-check
load_env

latest_id() {
  rclone lsf --dirs-only "$REMOTE/" | sed 's|/$||' | { grep -E '^20[0-9]{2}-[0-9]{2}-[0-9]{2}_[0-9]{6}$' || true; } | sort | tail -n 1
}

verify_sums() {
  ( cd "$1" && sha256sum -c --quiet SHA256SUMS ) || die "Контрольные суммы в $1 не сходятся"
  ok "Контрольные суммы совпадают"
}

# Найти копию: локальная папка, или скачать из бакета (ID / latest).
resolve() {
  local arg=${1:-latest} id dir
  if [ -d "$arg" ]; then
    dir=$(cd "$arg" && pwd)
  elif [ -d "$BACKUP_DIR/$arg" ] && [ -f "$BACKUP_DIR/$arg/SHA256SUMS" ]; then
    dir=$BACKUP_DIR/$arg
  else
    setup_rclone
    id=$arg
    [ "$id" = latest ] && id=$(latest_id)
    [ -n "$id" ] || die "В $REMOTE нет копий"
    dir=$BACKUP_DIR/restore/$id
    log "Скачиваю $REMOTE/$id/ → $dir" >&2
    mkdir -p "$dir"
    rclone copy "$REMOTE/$id/" "$dir/" --retries 5 >&2
  fi
  [ -f "$dir/db.dump" ] && [ -f "$dir/SHA256SUMS" ] || die "В $dir нет db.dump/SHA256SUMS"
  verify_sums "$dir" >&2
  echo "$dir"
}

live_counts() {
  dc exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At <<<"$TABLE_COUNTS_SQL"
}

cleanup_check() {
  docker rm -f "$CHECK_CONTAINER" >/dev/null 2>&1 || true
  [ -n "${TMP_MEDIA:-}" ] && rm -rf "$TMP_MEDIA"
  return 0
}

cmd_list() {
  setup_rclone
  echo "Копии в $REMOTE (хранятся 30 дней):"
  rclone lsf --dirs-only "$REMOTE/" | sed 's|/$||' | sort
  echo
  echo "Локальные копии в $BACKUP_DIR:"
  ls -1d "$BACKUP_DIR"/20??-??-??_?????? 2>/dev/null || echo "  нет"
  ls -1 "$BACKUP_DIR"/predeploy/*.dump 2>/dev/null || true
}

cmd_verify() {
  local dir image restored live rc=0 n_restored n_live media_expected media_restored
  dir=$(resolve "${1:-latest}")
  image=$(tools_image)
  trap cleanup_check EXIT
  cleanup_check

  log "Чистая временная база в контейнере $CHECK_CONTAINER ($image, без сети)"
  docker run -d --name "$CHECK_CONTAINER" --network none \
    -e POSTGRES_USER=qmmq -e POSTGRES_PASSWORD=check -e POSTGRES_DB=qmmq_restore_check \
    "$image" > /dev/null
  # Готовность проверяем по TCP: при инициализации временный сервер слушает только сокет.
  for _ in $(seq 1 60); do
    docker exec "$CHECK_CONTAINER" pg_isready -h 127.0.0.1 -U qmmq -d qmmq_restore_check >/dev/null 2>&1 && break
    sleep 1
  done
  docker exec "$CHECK_CONTAINER" pg_isready -h 127.0.0.1 -U qmmq -d qmmq_restore_check >/dev/null \
    || die "Временная база не запустилась"

  log "pg_restore $dir/db.dump"
  docker exec -i "$CHECK_CONTAINER" pg_restore -U qmmq -d qmmq_restore_check \
    --no-owner --no-privileges --exit-on-error < "$dir/db.dump" \
    || die "pg_restore завершился с ошибкой — копия НЕ восстанавливается"
  ok "База восстановлена без ошибок"

  restored=$(docker exec -i "$CHECK_CONTAINER" psql -U qmmq -d qmmq_restore_check -At <<<"$TABLE_COUNTS_SQL")
  n_restored=$(grep -c . <<<"$restored" || true)
  [ "$n_restored" -gt 0 ] || { warn "В восстановленной базе нет таблиц"; rc=1; }
  grep -q '^payload_migrations|' <<<"$restored" || { warn "Нет таблицы payload_migrations"; rc=1; }
  grep -q '^users[|][1-9]' <<<"$restored" || warn "В таблице users нет записей (копия сделана до создания администратора?)"

  if db_running; then
    live=$(live_counts)
    n_live=$(grep -c . <<<"$live" || true)
    echo
    printf '%-40s %12s %12s\n' "таблица" "в копии" "сейчас"
    LC_ALL=C join -t'|' -a1 -a2 -e '-' -o '0,1.2,2.2' \
      <(LC_ALL=C sort -t'|' -k1,1 <<<"$restored") <(LC_ALL=C sort -t'|' -k1,1 <<<"$live") \
      | awk -F'|' '{printf "%-40s %12s %12s\n", $1, $2, $3}'
    echo "(расхождения в числе строк нормальны: после бэкапа в базу продолжают писать)"
    [ "$n_restored" -eq "$n_live" ] || { warn "Набор таблиц отличается: в копии $n_restored, сейчас $n_live"; rc=1; }
  fi

  if [ -f "$dir/media.tar.gz" ]; then
    log "Распаковка media.tar.gz во временную папку"
    TMP_MEDIA=$(mktemp -d "$BACKUP_DIR/restore-check.XXXXXX")
    tar -xzf "$dir/media.tar.gz" -C "$TMP_MEDIA" || { warn "Архив медиа не распаковывается"; rc=1; }
    media_restored=$(find "$TMP_MEDIA" -type f | wc -l)
    media_expected=$(sed -n 's/^media_files=//p' "$dir/manifest.txt" 2>/dev/null || true)
    if [ -n "$media_expected" ] && [ "$media_expected" != "$media_restored" ]; then
      warn "Медиафайлов распаковано $media_restored, в манифесте $media_expected"; rc=1
    else
      ok "Медиафайлов распаковано: $media_restored"
    fi
  else
    warn "В копии нет media.tar.gz"; rc=1
  fi

  echo
  if [ $rc -eq 0 ]; then
    ok "ПРОВЕРКА ВОССТАНОВЛЕНИЯ ПРОЙДЕНА: $(basename "$dir")"
  else
    die "ПРОВЕРКА ВОССТАНОВЛЕНИЯ НЕ ПРОЙДЕНА: $(basename "$dir") — см. предупреждения выше"
  fi
}

restore_db_from() {
  local dump=$1
  log "Пересоздаю базу $POSTGRES_DB"
  dc stop app
  dc exec -T db psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\" WITH (FORCE);" \
    -c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\";"
  log "pg_restore $dump"
  dc exec -T db pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    --no-owner --no-privileges --exit-on-error < "$dump"
  ok "База восстановлена"
}

cmd_apply() {
  local arg=${1:-} confirm=${2:-} dir="" dump
  [ -n "$arg" ] || die "Укажите копию: restore.sh apply ID|ПАПКА|ФАЙЛ.dump --yes"
  [ "$confirm" = "--yes" ] || die "Это заменит базу и медиафайлы на проде. Повторите с --yes"
  db_running || die "Контейнер базы не запущен"

  if [ -f "$arg" ]; then
    dump=$(cd "$(dirname "$arg")" && pwd)/$(basename "$arg")
  else
    dir=$(resolve "$arg")
    dump=$dir/db.dump
  fi

  log "Страховочная копия текущего состояния (локально)"
  bash "$SCRIPT_DIR/backup.sh" --local

  restore_db_from "$dump"

  if [ -n "$dir" ] && [ -f "$dir/media.tar.gz" ]; then
    log "Восстанавливаю медиафайлы (том $MEDIA_VOLUME)"
    docker run --rm -i --network none -v "$MEDIA_VOLUME:/data" --entrypoint sh "$(tools_image)" \
      -c 'find /data -mindepth 1 -delete && tar -xzf - -C /data && chown -R 1001:1001 /data' \
      < "$dir/media.tar.gz"
    ok "Медиафайлы восстановлены"
  fi

  log "Догоняю схему базы до текущего релиза (payload migrate)"
  dc --profile tools run --rm migrate || warn "Миграции не применились — проверьте вывод выше"

  dc up -d --wait --wait-timeout 300
  ok "Восстановление завершено. Проверьте сайт и /admin."
}

case "${1:-}" in
  list)   cmd_list ;;
  fetch)  shift; resolve "${1:-latest}" ;;
  verify) shift; cmd_verify "$@" ;;
  apply)  shift; cmd_apply "$@" ;;
  *) sed -n '2,13p' "$0"; exit 1 ;;
esac
