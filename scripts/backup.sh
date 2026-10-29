#!/usr/bin/env bash
# Резервная копия qmmq.kz: дамп PostgreSQL + архив медиафайлов → Yandex Object Storage (KZ).
#
#   bash /opt/qmmq/scripts/backup.sh          — полная копия с выгрузкой в бакет
#   bash /opt/qmmq/scripts/backup.sh --local  — только на диск сервера (например, перед восстановлением)
#
# Автоматически: systemd-таймер qmmq-backup.timer, ежедневно в 03:00 по Алматы
# (deploy/systemd/, ставится при деплое). Журнал: journalctl -u qmmq-backup.service
#
# Что получается: s3://<бакет>/daily/<ГГГГ-ММ-ДД_ЧЧММСС>/
#   db.dump        — pg_dump -Fc (восстанавливается pg_restore)
#   media.tar.gz   — содержимое тома qmmq_media (/app/media)
#   manifest.txt   — время, релиз, размеры, число строк в таблицах
#   SHA256SUMS     — контрольные суммы
# Срок хранения в бакете — 30 дней (правило жизненного цикла бакета на префикс daily/).
# Сервисный аккаунт может только читать и загружать — удалить копии с сервера нельзя.
set -euo pipefail
shopt -s inherit_errexit

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"

LOCAL_ONLY=0
[ "${1:-}" = "--local" ] && LOCAL_ONLY=1

load_env
exec 8>"$STATE_DIR/backup.lock"
flock -n 8 || die "Бэкап уже выполняется"

db_running || die "Контейнер базы не запущен (cd $QMMQ_DIR/deploy && docker compose ps)"

avail_kb=$(df -Pk "$BACKUP_DIR" | awk 'NR==2 {print $4}')
[ "${avail_kb:-0}" -gt 2097152 ] || die "На диске меньше 2 ГБ свободно — бэкап не помещается (bash $QMMQ_DIR/scripts/status.sh)"

ID=$(date +%Y-%m-%d_%H%M%S)
WORK=$BACKUP_DIR/$ID
mkdir -p "$WORK"
trap 'rm -f "$WORK"/*.part' EXIT

log "Бэкап $ID"

log "Дамп базы $POSTGRES_DB"
dc exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$WORK/db.dump.part"
mv "$WORK/db.dump.part" "$WORK/db.dump"
dc exec -T db pg_restore --list < "$WORK/db.dump" > /dev/null || die "Дамп повреждён (pg_restore --list)"
ok "db.dump $(human_size "$(stat -c %s "$WORK/db.dump")")"

log "Архив медиафайлов (том $MEDIA_VOLUME)"
docker run --rm --network none -v "$MEDIA_VOLUME:/data:ro" --entrypoint tar "$(tools_image)" \
  -C /data -czf - . > "$WORK/media.tar.gz.part"
mv "$WORK/media.tar.gz.part" "$WORK/media.tar.gz"
media_files=$(tar -tzf "$WORK/media.tar.gz" | grep -vc '/$' || true)
ok "media.tar.gz $(human_size "$(stat -c %s "$WORK/media.tar.gz")"), файлов: $media_files"

{
  echo "backup_id=$ID"
  echo "created_at=$(date -Iseconds)"
  echo "host=$(hostname)"
  echo "release=$(cat "$STATE_DIR/current" 2>/dev/null || echo unknown)"
  echo "database=$POSTGRES_DB"
  echo "media_files=$media_files"
  echo "db_dump_bytes=$(stat -c %s "$WORK/db.dump")"
  echo "media_bytes=$(stat -c %s "$WORK/media.tar.gz")"
  echo "# table|rows"
  dc exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -v ON_ERROR_STOP=1 <<<"$TABLE_COUNTS_SQL"
} > "$WORK/manifest.txt"
( cd "$WORK" && sha256sum db.dump media.tar.gz manifest.txt > SHA256SUMS )

if [ $LOCAL_ONLY -eq 0 ]; then
  setup_rclone
  log "Выгрузка в $REMOTE/$ID/"
  rclone copy "$WORK" "$REMOTE/$ID/" --retries 5 --low-level-retries 10 --stats-one-line --stats 30s
  rclone check "$WORK" "$REMOTE/$ID/" --one-way \
    || die "Копия в бакете не совпадает с локальной — бэкап НЕ считается выполненным"
  ok "Выгружено и сверено: $REMOTE/$ID/"
else
  warn "Режим --local: в бакет не выгружалось"
fi

# Локально держим последние BACKUP_KEEP_LOCAL копий.
keep=${BACKUP_KEEP_LOCAL:-2}
ls -1d "$BACKUP_DIR"/20??-??-??_?????? 2>/dev/null | sort | head -n -"$keep" | xargs -r rm -rf || true

if [ $LOCAL_ONLY -eq 0 ] && [ -n "${BACKUP_PING_URL:-}" ]; then
  curl -fsS -m 10 --retry 3 "$BACKUP_PING_URL" > /dev/null || warn "Не удалось отправить пинг на BACKUP_PING_URL"
fi

ok "Бэкап $ID готов: $WORK"
