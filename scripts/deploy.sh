#!/usr/bin/env bash
# Деплой qmmq.kz с Mac: отправляет коммит на сервер по SSH, там собирает и перезапускает.
#
#   bash scripts/deploy.sh                — текущий коммит (HEAD)
#   bash scripts/deploy.sh <коммит|тег>   — указанный коммит (например, откат с пересборкой)
#   bash scripts/deploy.sh --pull         — заодно обновить базовые образы (Node и т. п.)
#   bash scripts/deploy.sh --no-check     — не проверять сайт снаружи (DNS ещё не настроен)
#
# Сервер: переменная QMMQ_SSH, по умолчанию Host «qmmq» из ~/.ssh/config (см. docs/DEPLOY.md).
# Попадает на сервер только закоммиченное (git archive), незакоммиченные правки — нет.
# Совместим с bash 3.2 из macOS.
set -euo pipefail

HOST=${QMMQ_SSH:-qmmq}
SITE_DOMAIN=${SITE_DOMAIN:-qmmq.kz}
LANDING_HOST=${LANDING_HOST:-contest.qmmq.kz}
REF=HEAD
PULL=""
CHECK=1

for arg in "$@"; do
  case "$arg" in
    --pull) PULL="--pull" ;;
    --no-check) CHECK=0 ;;
    -h|--help) sed -n '2,11p' "$0"; exit 0 ;;
    -*) echo "Неизвестный флаг: $arg" >&2; exit 1 ;;
    *) REF=$arg ;;
  esac
done

red()   { printf '\033[1;31m%s\033[0m\n' "$*" >&2; }
green() { printf '\033[1;32m%s\033[0m\n' "$*"; }
blue()  { printf '\033[1;34m==> %s\033[0m\n' "$*"; }
die()   { red "$*"; exit 1; }

cd "$(git rev-parse --show-toplevel)"

SHA=$(git rev-parse --verify --short=12 "$REF^{commit}" 2>/dev/null) || die "Не найден коммит: $REF"
SUBJECT=$(git log -1 --format=%s "$SHA")

if [ "$REF" = HEAD ] && [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  red "Внимание: есть незакоммиченные изменения — они НЕ попадут на сервер."
  git status --short --untracked-files=no >&2
  printf 'Продолжить деплой коммита %s? [y/N] ' "$SHA"
  read -r answer
  [ "$answer" = y ] || [ "$answer" = Y ] || exit 1
fi

# Продакшен работает только на миграциях: без них база останется пустой.
git cat-file -e "$SHA:src/migrations/index.ts" 2>/dev/null \
  || die "В коммите $SHA нет src/migrations/index.ts. Создайте миграцию: pnpm payload migrate:create <имя>, закоммитьте и повторите (docs/DEPLOY.md → «Миграции»)."

blue "Деплой $SHA «$SUBJECT» → $HOST"
ssh -o BatchMode=yes -o ConnectTimeout=10 "$HOST" true \
  || die "Нет SSH-доступа к $HOST (проверьте ~/.ssh/config, ключ и IP в группе безопасности)"

# Архив коммита → /var/lib/qmmq/releases/<sha> → scripts/release.sh deploy (лежит в самом архиве).
REMOTE="set -euo pipefail
R=/var/lib/qmmq/releases/$SHA
rm -rf \"\$R\" && mkdir -p \"\$R\"
tar -xzf - -C \"\$R\"
bash \"\$R/scripts/release.sh\" deploy $SHA $PULL"

set +e
git archive --format=tar.gz "$SHA" | ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=10 "$HOST" "$REMOTE"
rc=$?
set -e
if [ $rc -eq 3 ]; then
  blue "Первый запуск: на сервере создан /opt/qmmq/deploy/.env. Заполните его и запустите деплой ещё раз."
  exit 3
fi
[ $rc -eq 0 ] || die "Деплой не удался (код $rc). Подробности — в выводе выше."

[ $CHECK -eq 1 ] || { green "Готово: $SHA. Внешняя проверка пропущена (--no-check)."; exit 0; }

blue "Проверка сайта снаружи"
fail=0
check() { # url ожидаемые_коды [ожидаемый_редирект]
  local url=$1 want=$2 loc=${3:-} out code target
  out=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 20 "$url" || true)
  code=${out%% *}
  target=${out#* }
  if printf '%s' "$code" | grep -Eqx "$want" && { [ -z "$loc" ] || [ "$target" = "$loc" ]; }; then
    green "  OK   $url → $code ${target}"
  else
    red   "  FAIL $url → ${code:-нет ответа} ${target} (ожидалось $want ${loc})"
    fail=1
  fi
}
check "https://$LANDING_HOST/"           '200'
check "https://$SITE_DOMAIN/"            '302' "https://$LANDING_HOST/"
check "https://www.$SITE_DOMAIN/"        '301|308' "https://$SITE_DOMAIN/"
check "http://$SITE_DOMAIN/admin"        '301|308' "https://$SITE_DOMAIN/admin"
check "https://$SITE_DOMAIN/admin"       '200|302|307'
check "https://$SITE_DOMAIN/api/users/me" '200'

if [ $fail -eq 0 ]; then
  green "Готово: релиз $SHA работает."
else
  red "Релиз $SHA запущен, но часть проверок не прошла (см. выше и docs/DEPLOY.md → «Неполадки»)."
  exit 2
fi
