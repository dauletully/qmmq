#!/usr/bin/env bash
# Сводка по серверу qmmq.kz: контейнеры, релиз, диск, память, бэкапы.
#   bash /opt/qmmq/scripts/status.sh
# С Mac: ssh qmmq 'bash /opt/qmmq/scripts/status.sh'
set -uo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"
load_env

section() { printf '\n\033[1m— %s —\033[0m\n' "$*"; }

section "Контейнеры"
dc ps --format 'table {{.Service}}\t{{.Status}}\t{{.Image}}'

section "Релиз"
echo "Активный: $(cat "$STATE_DIR/current" 2>/dev/null || echo нет)"
tail -n 5 "$STATE_DIR/releases.log" 2>/dev/null

section "Диск"
df -h / | sed 's/^/  /'
avail_pct=$(df --output=pcent / | tail -1 | tr -dc '0-9')
[ "${avail_pct:-0}" -lt 85 ] || warn "Диск заполнен на ${avail_pct}% — почистите: docker system prune -f; docker builder prune -f"
echo
docker system df
echo
if db_running; then
  echo "База:  $(dc exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "SELECT pg_size_pretty(pg_database_size(current_database()))")"
fi
echo "Медиа: $(docker run --rm --network none -v "$MEDIA_VOLUME:/data:ro" --entrypoint du "$(tools_image)" -sh /data | cut -f1)"
echo "Локальные бэкапы: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1) в $BACKUP_DIR"

section "Память"
free -h

section "Бэкапы"
systemctl list-timers qmmq-backup.timer --no-pager 2>/dev/null | head -n 2
systemctl show qmmq-backup.service -p Result -p ExecMainExitTimestamp 2>/dev/null | sed 's/^/  /'
echo "Последняя локальная копия: $(ls -1d "$BACKUP_DIR"/20??-??-??_?????? 2>/dev/null | tail -n 1 || echo нет)"

section "Обновления системы"
if [ -f /var/run/reboot-required ]; then
  warn "Нужна перезагрузка (обновлено ядро) — автоматически в 04:30, или: sudo reboot"
else
  echo "Перезагрузка не требуется"
fi
