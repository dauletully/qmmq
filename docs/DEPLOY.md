# Деплой qmmq.kz в Yandex Cloud Kazakhstan

Пошаговая инструкция: от пустого аккаунта до работающего сайта с ежедневными бэкапами.
Все команды выполняются в «Терминале» на Mac и копируются как есть. Команды вида
`ssh qmmq '…'` выполняются на сервере. Где нужно подставить своё значение, оно написано
ЗАГЛАВНЫМИ буквами (например, `ВАШ_EMAIL`).

Каждый шаг заканчивается блоком **«Готово, если»** — не переходите дальше, пока он не выполнен.

## Содержание

- [Схема](#схема)
- [Особенности региона Казахстан](#особенности-региона-казахстан)
- [Стоимость в месяц](#стоимость-в-месяц)
- [Что подготовить заранее](#что-подготовить-заранее)
- [Шаг 1. yc CLI и вход](#шаг-1-yc-cli-и-вход)
- [Шаг 2. Сеть, статический IP, группа безопасности](#шаг-2-сеть-статический-ip-группа-безопасности)
- [Шаг 3. SSH-ключ и виртуальная машина](#шаг-3-ssh-ключ-и-виртуальная-машина)
- [Шаг 4. DNS](#шаг-4-dns)
- [Шаг 5. Подготовка ВМ](#шаг-5-подготовка-вм)
- [Шаг 6. Бакет и сервисный аккаунт для бэкапов](#шаг-6-бакет-и-сервисный-аккаунт-для-бэкапов)
- [Шаг 7. Первый деплой](#шаг-7-первый-деплой)
- [Шаг 8. Первый администратор](#шаг-8-первый-администратор)
- [Шаг 9. Проверка](#шаг-9-проверка)
- [Шаг 10. Бэкапы и проверка восстановления](#шаг-10-бэкапы-и-проверка-восстановления)
- [Шаг 11. Обычный деплой и миграции](#шаг-11-обычный-деплой-и-миграции)
- [Шаг 12. Откат](#шаг-12-откат)
- [Эксплуатация](#эксплуатация)
- [Неполадки](#неполадки)
- [Источники](#источники)

## Схема

```
Интернет
   │  A-записи qmmq.kz, www.qmmq.kz, contest.qmmq.kz → статический IP
   ▼
Группа безопасности qmmq-sg: 22/tcp только с IP администратора; 80/tcp, 443/tcp, 443/udp — всем
   ▼
ВМ qmmq-prod · Ubuntu 24.04 · зона kz1-a · ufw · Docker Compose (/opt/qmmq/deploy)
   ├─ caddy  :80 :443  — HTTPS (Let's Encrypt), редиректы
   │    └─► app :3000  — Next.js 16 + Payload CMS (лендинг, сайт, /admin, /api)
   │           └─► db  — PostgreSQL 17 (наружу не открыт)
   ├─ тома: qmmq_pgdata (база), qmmq_media (загрузки Payload), qmmq_caddy_data (сертификаты)
   └─ systemd-таймер 03:00 (Алматы) → scripts/backup.sh → Object Storage, бакет в регионе kz1
```

| Домен | Что отдаёт |
|---|---|
| `contest.qmmq.kz` | лендинг конкурса (приложение само выбирает его по `LANDING_HOST`) |
| `qmmq.kz/` | пока нет сайта — временный редирект **302** на `https://contest.qmmq.kz/` (UTM-метки сохраняются) |
| `qmmq.kz/admin`, `qmmq.kz/api/…`, прочие пути | приложение |
| `www.qmmq.kz/…` | постоянный редирект **301** на `https://qmmq.kz/…` |
| `http://…` | Caddy перенаправляет на `https://…` |

Где что лежит на сервере:

| Путь | Что |
|---|---|
| `/opt/qmmq` | код активного релиза (обновляется при деплое) |
| `/opt/qmmq/deploy/.env` | **секреты**; в git не попадает, при деплое не перезаписывается |
| `/var/lib/qmmq/releases/<коммит>` | исходники трёх последних релизов (для отката) |
| `/var/lib/qmmq/releases.log` | история деплоев и откатов |
| `/var/backups/qmmq` | две последние локальные копии и дампы перед миграциями |

Файлы в репозитории: `Dockerfile`, `.dockerignore`, `deploy/docker-compose.yml`,
`deploy/caddy/Caddyfile`, `deploy/.env.example`, `deploy/systemd/*`, `scripts/*.sh`.

## Особенности региона Казахстан

Данные (ВМ, диск, база, бэкапы) находятся в регионе Казахстан — это требование закона РК
«О персональных данных». Регион устроен отдельно от российского:

| Что | Значение для Казахстана |
|---|---|
| Консоль | **https://kz.console.yandex.cloud** (не `console.yandex.cloud`) |
| Биллинг | https://kz.center.yandex.cloud/billing |
| Регион / зона | `kz1` / единственная зона **`kz1-a`** |
| Вход в CLI | `yc init … --region=kz` |
| API | `api.yandexcloud.kz:443` (Compute — `compute.api.yandexcloud.kz:443`) |
| Object Storage | эндпоинт **`https://storage.yandexcloud.kz`**, регион **`kz1`** |
| Платформы ВМ | только `standard-v3` (Intel Ice Lake) |
| Образ Ubuntu 24.04 LTS | семейство `ubuntu-2404-lts` в каталоге `standard-images`; ID меняется с каждым обновлением образа (на 29.10.2026 в Marketplace — `fbnfuaevfsaqh5v8bod5`), поэтому ВМ создаём по семейству |

Аккаунты и ресурсы регионов не пересекаются: бакеты российского региона из Казахстана не видны,
а в доменной зоне .kz размещение серверов на территории РК — тоже плюс.
Проверено по документации на 29.10.2026; ссылки — в разделе [Источники](#источники).

## Стоимость в месяц

Цены региона Казахстан, в тенге **с НДС**, 720 часов в месяц.

| Ресурс | Расчёт | ₸ в месяц |
|---|---|---|
| ВМ: 2 vCPU Intel Ice Lake, 100 % | 2 × 8,70 ₸/ч × 720 | ≈ 12 528 |
| ВМ: 4 ГБ RAM | 4 × 2,33 ₸/ч × 720 | ≈ 6 711 |
| Диск SSD 40 ГБ (`network-ssd`) | ≈ 0,095 ₸ за ГБ·ч × 40 × 720 — **оценка**¹ | ≈ 2 700 |
| Статический публичный IP (привязан к ВМ) | 2,02 ₸/ч × 720 | ≈ 1 454 |
| Object Storage: бэкапы, ~10 ГБ | (10 − 1 ГБ бесплатно) × 16,67 ₸ | ≈ 150 |
| Исходящий трафик | первые 100 ГБ в месяц бесплатно | 0 |
| Группы безопасности | не тарифицируются | 0 |
| **Итого** | | **≈ 23 500 ₸** |

- Вариант с **8 ГБ RAM** (если сборка на 4 ГБ окажется медленной, см. [Неполадки](#неполадки)): +6 711 ₸, итого ≈ 30 200 ₸.
- Зарезервированный, но **не привязанный** IP стоит дороже — 4,61 ₸/ч (≈ 3 300 ₸ в месяц). Не оставляйте его без ВМ.
- vCPU с долей 20 % дешевле (3,63 ₸/ч), но сборка Next.js на нём идёт очень долго — не рекомендуется.
- Объём бэкапов: каждый день — дамп базы (мегабайты) + полный архив медиафайлов; хранится 30 копий.
  При 1 ГБ медиа это ≈ 30 ГБ ≈ 500 ₸ в месяц.
- ¹ Цену `network-ssd` в тенге в документации Compute найти не удалось; оценка — по примеру расчёта
  из документации Data Processing. Точную сумму проверьте в калькуляторе:
  https://yandex.cloud/ru-kz/prices (регион «Казахстан»).

## Что подготовить заранее

- [ ] Доступ к панели регистратора домена `qmmq.kz` (нужно будет добавить три A-записи).
- [ ] Почта администратора — для Let's Encrypt (`ACME_EMAIL`).
- [ ] Менеджер паролей — для файла `deploy/.env`, ключей бэкапа и пароля администратора сайта.
- [ ] Решение по памяти ВМ: 4 ГБ (дешевле, сборка дольше) или 8 ГБ.
- [ ] С какого IP администратор заходит на сервер. Если IP меняется (мобильный интернет, домашний
      провайдер) — это нормально, см. [смену IP](#смена-ip-администратора). VPN на время работы отключите.
- [ ] В репозитории есть начальная миграция базы `src/migrations` (см. [шаг 7.1](#71-начальная-миграция)).
- [ ] Mac с репозиторием `~/Desktop/qmmq`, Git и pnpm (как для разработки).

## Шаг 1. yc CLI и вход

Установите CLI Yandex Cloud и перезапустите оболочку:

```bash
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
exec -l $SHELL
yc version
```

Войдите в **казахстанский** регион (почта — та, с которой зарегистрирован аккаунт в
https://kz.console.yandex.cloud):

```bash
yc init --username=ВАШ_EMAIL --region=kz
```

CLI откроет браузер для входа. Дальше в терминале:
1. профиль — `default` (или создайте новый, например `qmmq`);
2. облако — ваше облако;
3. каталог — выберите **Create a new folder** и назовите его `qmmq`
   (если каталог уже есть — выберите его);
4. зона по умолчанию — `Y`, затем **`kz1-a`**.

Значения, которые понадобятся дальше, будем сохранять в файл `~/.qmmq-cloud`.
Если откроете новое окно терминала, выполните `source ~/.qmmq-cloud`.

```bash
touch ~/.qmmq-cloud
yc config list
yc compute zone list
```

**Готово, если:** `yc config list` показывает `cloud-id`, `folder-id` и
`compute-default-zone: kz1-a`, а `yc compute zone list` выводит только `kz1-a`.
Если в списке зоны `ru-central1-*` — CLI смотрит в российский регион: повторите `yc init` с `--region=kz`.

> Сессия CLI живёт до 12 часов; потом `yc` сам попросит войти заново через браузер.

## Шаг 2. Сеть, статический IP, группа безопасности

Сеть и подсеть в зоне `kz1-a`:

```bash
yc vpc network create --name qmmq-net
yc vpc subnet create --name qmmq-subnet-a --zone kz1-a --network-name qmmq-net --range 10.20.0.0/24
```

> Если `network create` отвечает ошибкой квоты — в каталоге уже есть сеть `default`
> (`yc vpc network list`). Тогда используйте её и её подсеть в `kz1-a`
> (`yc vpc subnet list`): замените ниже `qmmq-net` и `qmmq-subnet-a` на их имена.

Статический публичный IP (через него сайт будет доступен всегда, даже после пересоздания ВМ):

```bash
yc vpc address create --name qmmq-ip --external-ipv4 zone=kz1-a
VM_IP=$(yc vpc address get qmmq-ip --format json | awk -F'"' '/"address"/{print $4; exit}')
echo "export VM_IP=$VM_IP" >> ~/.qmmq-cloud
echo "IP сервера: $VM_IP"
```

Ваш текущий IP (SSH будет открыт только для него):

```bash
ADMIN_IP=$(curl -4 -s https://ifconfig.me)
echo "IP администратора: $ADMIN_IP"
```

Группа безопасности: SSH — только с вашего IP, веб — всем, исходящий трафик — разрешён:

```bash
yc vpc security-group create --name qmmq-sg --network-name qmmq-net \
  --rule "description=ssh-admin,direction=ingress,port=22,protocol=tcp,v4-cidrs=[$ADMIN_IP/32]" \
  --rule "description=http,direction=ingress,port=80,protocol=tcp,v4-cidrs=[0.0.0.0/0]" \
  --rule "description=https,direction=ingress,port=443,protocol=tcp,v4-cidrs=[0.0.0.0/0]" \
  --rule "description=http3,direction=ingress,port=443,protocol=udp,v4-cidrs=[0.0.0.0/0]" \
  --rule "description=all-out,direction=egress,protocol=any,v4-cidrs=[0.0.0.0/0]"
SG_ID=$(yc vpc security-group get qmmq-sg --format json | awk -F'"' '/"id"/{print $4; exit}')
echo "export SG_ID=$SG_ID" >> ~/.qmmq-cloud
yc vpc security-group get qmmq-sg
```

Порт 80 нужен Let's Encrypt для выпуска сертификатов и для редиректа на HTTPS.
Порт базы (5432) и приложения (3000) не открываются нигде.

**Готово, если:** `echo $VM_IP` показывает IP-адрес, `echo $SG_ID` — идентификатор, а в выводе
`security-group get` пять правил (`ssh-admin` с вашим IP `/32`, `http`, `https`, `http3`, `all-out`).

## Шаг 3. SSH-ключ и виртуальная машина

Отдельный ключ для сервера (на вопрос о пароле ключа — придумайте его; macOS запомнит его в Связке ключей):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/qmmq_ed25519 -C qmmq-deploy
```

Настройки первого запуска ВМ (cloud-init): пользователь `deploy`, вход только по этому ключу,
пароли и вход root отключены, часовой пояс Алматы:

```bash
cat > ~/qmmq-cloud-init.yaml <<EOF
#cloud-config
users:
  - name: deploy
    groups: sudo
    shell: /bin/bash
    sudo: "ALL=(ALL) NOPASSWD:ALL"
    lock_passwd: true
    ssh_authorized_keys:
      - $(cat ~/.ssh/qmmq_ed25519.pub)
ssh_pwauth: false
disable_root: true
timezone: Asia/Almaty
EOF
cat ~/qmmq-cloud-init.yaml
```

Проверьте, что в строке после `ssh_authorized_keys:` стоит ваш ключ `ssh-ed25519 AAAA… qmmq-deploy`.

Убедитесь, что образ Ubuntu 24.04 доступен в регионе (покажет актуальный ID и дату):

```bash
yc compute image get-latest-from-family ubuntu-2404-lts --folder-id standard-images
```

Создайте ВМ: 2 vCPU (100 %), 4 ГБ RAM, SSD 40 ГБ, статический IP, группа безопасности.
Для 8 ГБ замените `--memory 4` на `--memory 8`.

```bash
yc compute instance create \
  --name qmmq-prod \
  --hostname qmmq-prod \
  --zone kz1-a \
  --platform standard-v3 \
  --cores 2 \
  --core-fraction 100 \
  --memory 4 \
  --create-boot-disk name=qmmq-boot,type=network-ssd,size=40,image-folder-id=standard-images,image-family=ubuntu-2404-lts,auto-delete=false \
  --network-interface subnet-name=qmmq-subnet-a,nat-ip-version=ipv4,nat-address=$VM_IP,security-group-ids=$SG_ID \
  --metadata-from-file user-data=$HOME/qmmq-cloud-init.yaml
```

`auto-delete=false` — диск с базой не удалится, даже если случайно удалить ВМ.
Дополнительно можно включить защиту от удаления ВМ в консоли (ВМ → «Изменить»).

Короткое имя `qmmq` для SSH (им пользуются и скрипты деплоя):

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
cat >> ~/.ssh/config <<EOF

Host qmmq
  HostName $VM_IP
  User deploy
  IdentityFile ~/.ssh/qmmq_ed25519
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
  ServerAliveInterval 30
  AddKeysToAgent yes
  UseKeychain yes
EOF
ssh-add --apple-use-keychain ~/.ssh/qmmq_ed25519
```

Подождите 1–2 минуты, пока ВМ загрузится, и подключитесь:

```bash
ssh qmmq 'whoami; uname -m; lsb_release -ds; timedatectl show -p Timezone --value'
```

**Готово, если:** вывод — `deploy`, `x86_64`, `Ubuntu 24.04.x LTS`, `Asia/Almaty`.
Если `Connection timed out` — проверьте, что `$ADMIN_IP` в группе безопасности совпадает с текущим
`curl -4 -s https://ifconfig.me`. Если `Permission denied (publickey)` — ключ не попал в cloud-init
(или в организации принудительно включён OS Login — тогда отключите его для ВМ в консоли):
удалите ВМ (`yc compute instance delete qmmq-prod`) и диск (`yc compute disk delete qmmq-boot`)
и повторите шаг.

## Шаг 4. DNS

Регистратор домена неизвестен, но действия везде одинаковые. Откройте управление DNS-зоной
`qmmq.kz` там, куда указывают NS-серверы домена (узнать: `dig +short NS qmmq.kz`), и создайте
записи (вместо `IP_СЕРВЕРА` — значение `echo $VM_IP`):

| Тип | Имя (хост) | Значение | TTL |
|---|---|---|---|
| A | `@` (сам `qmmq.kz`; у некоторых регистраторов — пустое поле) | `IP_СЕРВЕРА` | 300 |
| A | `www` | `IP_СЕРВЕРА` | 300 |
| A | `contest` | `IP_СЕРВЕРА` | 300 |

- Удалите для этих трёх имён прежние записи A, **AAAA** и CNAME, если они есть: AAAA-запись на
  чужой адрес ломает выпуск сертификата и открытие сайта по IPv6.
- Если в зоне есть CAA-записи — добавьте `0 issue "letsencrypt.org"`. Если CAA нет — ничего не нужно.
- Через сутки после проверки TTL можно поднять до 3600.

Проверка (обновление DNS занимает от минут до нескольких часов):

```bash
dig +short A qmmq.kz @8.8.8.8
dig +short A www.qmmq.kz @8.8.8.8
dig +short A contest.qmmq.kz @8.8.8.8
dig +short AAAA qmmq.kz @8.8.8.8
dig +short CAA qmmq.kz @8.8.8.8
```

**Готово, если:** три первых команды выводят ваш `$VM_IP`, AAAA — пусто, CAA — пусто или есть
`letsencrypt.org`. Пока DNS обновляется, можно делать шаги 5–7 (первый деплой — с `--no-check`).

## Шаг 5. Подготовка ВМ

Скрипт `scripts/server-setup.sh` один раз настраивает сервер: часовой пояс, обновления,
Docker Engine и Compose, swap 4 ГБ (для сборки), файрвол ufw (22, 80, 443), SSH только по ключу,
автоматические обновления безопасности (с перезагрузкой в 04:30 при обновлении ядра),
rclone для бэкапов, лимиты на размер логов, папки приложения.

```bash
cd ~/Desktop/qmmq
scp scripts/server-setup.sh qmmq:/tmp/server-setup.sh
ssh qmmq 'sudo bash /tmp/server-setup.sh'
ssh qmmq 'sudo reboot'
```

Последняя команда закроет соединение (`Connection … closed by remote host`) — это нормально.
Через минуту проверьте:

```bash
ssh qmmq 'docker version --format "Docker {{.Server.Version}}"; docker compose version; swapon --show; sudo ufw status; systemctl is-enabled unattended-upgrades'
ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password,keyboard-interactive qmmq true
```

**Готово, если:** первая команда показывает версию Docker и Compose (без `permission denied`),
`/swapfile` на 4G, `Status: active` с правилами 22, 80, 443 и `enabled`; вторая — отказ
`Permission denied (publickey)`: вход по паролю отключён.

## Шаг 6. Бакет и сервисный аккаунт для бэкапов

Бакет в регионе Казахстан (имена бакетов глобальные, поэтому добавляем случайный суффикс):

```bash
source ~/.qmmq-cloud
BUCKET=qmmq-backups-$(openssl rand -hex 3)
echo "export BUCKET=$BUCKET" >> ~/.qmmq-cloud
yc storage bucket create --name $BUCKET
yc iam service-account create --name qmmq-backup --description "qmmq.kz backups: upload only"
echo "Бакет: $BUCKET"
```

Бакет создаётся закрытым (без публичного доступа) — так и оставьте.

**Права сервисного аккаунта — только на этот бакет, роль `storage.uploader`** (чтение и загрузка
объектов, **без удаления**: даже при взломе сервера старые копии не стереть, они удаляются только
правилом жизненного цикла). Назначается в консоли:

1. https://kz.console.yandex.cloud → каталог `qmmq` → **Object Storage** → бакет `qmmq-backups-…`.
2. Слева **«Безопасность»** → вкладка **«Права доступа»** → **«Назначить роли»**.
3. Выберите сервисный аккаунт `qmmq-backup`, добавьте роль **`storage.uploader`**, сохраните.

Не выдавайте аккаунту роли на каталог или облако. (Только если в вашем интерфейсе нет прав
доступа на уровне бакета — назначьте `storage.uploader` на каталог `qmmq`: это всё ещё без удаления.)

Статический ключ доступа для S3 API:

```bash
yc iam access-key create --service-account-name qmmq-backup
```

Из вывода сразу сохраните в менеджер паролей `key_id` (идентификатор, начинается с `YCA…`) и
`secret` — секрет показывается **один раз**. Они понадобятся на шаге 7.

Правило жизненного цикла: копии в папке `daily/` удаляются через 30 дней:

```bash
cat > ~/qmmq-lifecycle.json <<'EOF'
{
  "lifecycleRules": [
    {
      "id": "delete-daily-backups-after-30-days",
      "enabled": true,
      "filter": { "prefix": "daily/" },
      "expiration": { "days": "30" }
    }
  ]
}
EOF
yc storage bucket update --name $BUCKET --lifecycle-rules-from-file ~/qmmq-lifecycle.json
```

**Готово, если:** в консоли у бакета на вкладке «Безопасность → Права доступа» у `qmmq-backup` роль
`storage.uploader`; в «Настройки → Жизненный цикл» правило включено, префикс `daily/`, 30 дней;
`key_id` и `secret` сохранены. (Правила применяются раз в сутки, удаление идёт с задержкой в несколько часов.)

> Дополнительно (по желанию): шифрование бакета ключом KMS — «Настройки → Шифрование». Тогда
> сервисному аккаунту нужна ещё роль `kms.keys.encrypterDecrypter` на этот ключ. KMS тарифицируется отдельно.

## Шаг 7. Первый деплой

### 7.1. Начальная миграция

В продакшене схема базы создаётся **только миграциями** Payload (в dev — автоматически, push-режимом).
Перед первым деплоем в репозитории должна быть папка `src/migrations`. Проверка:

```bash
cd ~/Desktop/qmmq
ls src/migrations
```

Если папки нет — создайте начальную миграцию (локальная база не нужна) и закоммитьте:

```bash
pnpm payload migrate:create initial
git add src/migrations
git commit -m "Миграции: начальная схема базы"
```

### 7.2. Запуск

```bash
bash scripts/deploy.sh --no-check
```

Первый запуск отправит код на сервер, создаст `/opt/qmmq/deploy/.env` со сгенерированными
`PAYLOAD_SECRET`, `POSTGRES_PASSWORD`, `DATABASE_URL` и остановится с сообщением
«Первый запуск…». Заполните остальное:

```bash
source ~/.qmmq-cloud
echo "BACKUP_S3_BUCKET=$BUCKET"
ssh -t qmmq 'nano /opt/qmmq/deploy/.env'
```

В редакторе укажите:
- `ACME_EMAIL=` — почта администратора;
- `BACKUP_S3_BUCKET=` — имя бакета (выведено командой выше);
- `BACKUP_S3_ACCESS_KEY_ID=` и `BACKUP_S3_SECRET_ACCESS_KEY=` — `key_id` и `secret` из шага 6.

Сохранить — `Ctrl+O`, `Enter`; выйти — `Ctrl+X`. Затем сохраните **весь файл** в менеджер паролей:

```bash
ssh qmmq 'cat /opt/qmmq/deploy/.env'
```

Повторный запуск — сборка образа на сервере (первый раз 10–20 минут на 2 vCPU), миграции, запуск:

```bash
bash scripts/deploy.sh --no-check
```

Когда DNS из шага 4 уже обновился, запускайте без `--no-check` — скрипт сам проверит все домены.

**Готово, если:** в конце `OK Релиз … работает` и `Готово: …`, а

```bash
ssh qmmq 'cd /opt/qmmq/deploy && docker compose ps'
```

показывает `app` и `db` в состоянии `healthy`, `caddy` — `Up`. Сертификаты (после обновления DNS):

```bash
ssh qmmq 'cd /opt/qmmq/deploy && docker compose logs caddy' | grep -i "certificate obtained"
```

— по строке на `qmmq.kz`, `www.qmmq.kz`, `contest.qmmq.kz`.

### 7.3. Начальное наполнение (по желанию)

В репозитории есть сид `pnpm seed`: создаёт мероприятие и лендинг `contest-2026`, повторный запуск
ничего не дублирует. Запуск на сервере:

```bash
ssh qmmq 'cd /opt/qmmq/deploy && docker compose --profile tools run --rm migrate pnpm seed'
```

## Шаг 8. Первый администратор

Пока в базе нет пользователей, `/admin` показывает форму «создать первого пользователя» — **любому**,
кто её откроет. Поэтому создайте администратора сразу после первого деплоя. Надёжнее — через
SSH-туннель (работает, даже если DNS ещё не обновился):

```bash
ssh -N -L 3001:127.0.0.1:3000 qmmq
```

Откройте в браузере http://localhost:3001/admin, заполните форму (почта, длинный пароль из менеджера
паролей; если есть поле роли — `admin`), войдите. Затем в терминале остановите туннель: `Ctrl+C`.

Если DNS уже работает, то же самое можно сделать на https://qmmq.kz/admin.
Остальных сотрудников добавляйте в админке: «Пользователи» → «Создать» (роли `editor`, `manager`).

**Готово, если:** https://qmmq.kz/admin (или туннель) открывает страницу входа, а не форму создания
первого пользователя, и вы можете войти.

## Шаг 9. Проверка

```bash
curl -sI https://contest.qmmq.kz/ | head -n 1
curl -sI https://qmmq.kz/ | grep -iE '^(HTTP|location)'
curl -sI 'https://qmmq.kz/?utm_source=test' | grep -i '^location'
curl -sI https://www.qmmq.kz/ | grep -iE '^(HTTP|location)'
curl -sI http://qmmq.kz/admin | grep -iE '^(HTTP|location)'
curl -sI https://qmmq.kz/admin | head -n 1
curl -s https://qmmq.kz/api/users/me
```

| Проверка | Ожидается |
|---|---|
| `https://contest.qmmq.kz/` | `HTTP/2 200` (пока лендинг не заполнен — может быть 404, это не ошибка инфраструктуры) |
| `https://qmmq.kz/` | `HTTP/2 302`, `location: https://contest.qmmq.kz/` |
| `https://qmmq.kz/?utm_source=test` | `location: https://contest.qmmq.kz/?utm_source=test` |
| `https://www.qmmq.kz/` | `HTTP/2 301`, `location: https://qmmq.kz/` |
| `http://qmmq.kz/admin` | `HTTP/1.1 308`, `location: https://qmmq.kz/admin` |
| `https://qmmq.kz/admin` | `HTTP/2 200` или `302/307` (переход на страницу входа) |
| `https://qmmq.kz/api/users/me` | JSON с `"user":null` |

Сертификаты всех трёх доменов:

```bash
for h in qmmq.kz www.qmmq.kz contest.qmmq.kz; do echo "== $h"; echo | openssl s_client -connect $h:443 -servername $h 2>/dev/null | openssl x509 -noout -issuer -enddate; done
```

Закрытые порты (обе команды должны завершиться ошибкой/таймаутом):

```bash
source ~/.qmmq-cloud
nc -vz -w 5 $VM_IP 5432
nc -vz -w 5 $VM_IP 3000
```

Медиафайлы: в админке «Медиа» загрузите картинку, откройте её — должны появиться уменьшенные копии
(`thumb`, `card`, …). Перезапустите приложение и убедитесь, что файл на месте:

```bash
ssh qmmq 'cd /opt/qmmq/deploy && docker compose restart app'
```

**Готово, если:** все строки таблицы совпали, у сертификатов издатель Let's Encrypt (или ZeroSSL)
и срок ~90 дней, порты 5432 и 3000 недоступны, картинка открывается после перезапуска.
Автоматически почти всё это проверяет `bash scripts/deploy.sh` после каждого деплоя.

## Шаг 10. Бэкапы и проверка восстановления

### 10.1. Первый бэкап вручную

```bash
ssh qmmq 'bash /opt/qmmq/scripts/backup.sh'
ssh qmmq 'bash /opt/qmmq/scripts/restore.sh list'
```

Бэкап — это папка `daily/ГГГГ-ММ-ДД_ЧЧММСС/` в бакете: `db.dump` (pg_dump), `media.tar.gz`
(том медиафайлов), `manifest.txt` (релиз, размеры, число строк в таблицах), `SHA256SUMS`.
После выгрузки скрипт сверяет копию в бакете с локальной.

**Готово, если:** в конце `Выгружено и сверено` и `Бэкап … готов`, а `restore.sh list` показывает папку.

### 10.2. Расписание

Таймер `qmmq-backup.timer` ставится автоматически при деплое: ежедневно в 03:00 по Алматы;
если сервер был выключен в это время — бэкап выполнится сразу после включения.

```bash
ssh qmmq 'systemctl list-timers qmmq-backup.timer --no-pager'
ssh qmmq 'systemd-analyze calendar "*-*-* 03:00:00 Asia/Almaty"'
```

**Готово, если:** в `NEXT` — ближайшие 03:00 (`+05`). На следующий день проверьте журнал:

```bash
ssh qmmq 'journalctl -u qmmq-backup.service --since yesterday --no-pager | tail -n 20'
```

Чтобы узнавать о пропущенном бэкапе без ручных проверок, заведите бесплатную проверку на
healthchecks.io (период 1 день) и впишите её URL в `BACKUP_PING_URL` в `deploy/.env` — сервис
пришлёт письмо, если бэкап не отметился.

### 10.3. Проверка восстановления на чистой базе

Бэкап, который ни разу не восстанавливали, бэкапом не считается. Проверка **не трогает прод**:

```bash
ssh qmmq 'bash /opt/qmmq/scripts/restore.sh verify latest'
```

Что делает скрипт: скачивает последнюю копию из бакета и сверяет контрольные суммы → запускает
отдельный временный контейнер PostgreSQL 17 без сети (чистая пустая база) → `pg_restore` с
остановкой на первой ошибке → сравнивает список таблиц и число строк с живой базой → распаковывает
архив медиа во временную папку и сверяет число файлов с манифестом → удаляет временную базу и файлы.

**Готово, если:** в конце `ПРОВЕРКА ВОССТАНОВЛЕНИЯ ПРОЙДЕНА`. Таблица «в копии / сейчас» может
немного расходиться — после бэкапа в базу продолжают писать.

Повторяйте проверку **раз в месяц** и после крупных изменений схемы; дату и результат записывайте
(например, в задаче или таблице команды).

### 10.4. Полное восстановление (авария)

На том же сервере — заменить базу и медиафайлы копией (перед этим скрипт сам делает локальную
страховочную копию текущего состояния, затем применяет миграции текущего релиза):

```bash
ssh qmmq 'bash /opt/qmmq/scripts/restore.sh list'
ssh qmmq 'bash /opt/qmmq/scripts/restore.sh apply ИМЯ_ПАПКИ --yes'
```

На новом сервере (ВМ потеряна):
1. Шаги 2–5 (IP можно оставить прежним — тогда DNS менять не нужно).
2. Скопируйте содержимое `deploy/.env` из менеджера паролей в буфер обмена и выполните:
   ```bash
   pbpaste | ssh qmmq 'umask 077; cat > /opt/qmmq/deploy/.env'
   ```
3. `bash scripts/deploy.sh` — поднимет приложение с пустой базой.
4. `ssh qmmq 'bash /opt/qmmq/scripts/restore.sh apply latest --yes'`.
5. Проверка — шаг 9.

## Шаг 11. Обычный деплой и миграции

```bash
cd ~/Desktop/qmmq
git status
bash scripts/deploy.sh
```

Скрипт деплоит **последний коммит** (незакоммиченные правки не попадают на сервер — скрипт
предупредит). Что происходит:

1. `git archive` коммита → по SSH в `/var/lib/qmmq/releases/<коммит>`.
2. На сервере собираются образы `qmmq-app:<коммит>` и `qmmq-migrate:<коммит>` — **сайт в это время
   работает на старой версии**. Повторные сборки быстрее: зависимости кешируются, пока не менялся
   `pnpm-lock.yaml`.
3. Дамп базы в `/var/backups/qmmq/predeploy` (хранятся 5 последних).
4. Миграции (`payload migrate`). При ошибке деплой останавливается, старая версия продолжает работать.
5. Переключение: код → `/opt/qmmq`, перезапуск контейнера `app`. Caddy держит входящие запросы до
   30 секунд, пока новая версия стартует, — посетители видят задержку в несколько секунд, а не ошибку.
6. `caddy reload` (если менялся Caddyfile), проверка ответа приложения. Если новая версия не
   поднялась — **автоматический возврат** предыдущей.
7. С Mac — проверка всех доменов и редиректов.

Флаги: `--no-check` — без внешней проверки; `--pull` — обновить базовые образы Node
(делайте раз в месяц ради обновлений безопасности); `bash scripts/deploy.sh КОММИТ` — задеплоить
конкретный коммит.

### Миграции

В dev Payload сам подгоняет локальную базу под код (push). В продакшене — только миграции:

- **Когда создавать:** после любого изменения схемы — коллекции, глобальные настройки, поля
  (добавили/удалили/переименовали поле, сменили тип, варианты `select`, `localized`, `required`,
  связи, черновики/версии), задачи очереди, плагины. Сомневаетесь — создайте: если изменений нет,
  Payload так и скажет.
- **Как:**
  ```bash
  pnpm payload migrate:create КОРОТКОЕ_ИМЯ
  ```
  В `src/migrations` появятся `<дата>_КОРОТКОЕ_ИМЯ.ts` (SQL `up`/`down`) и `.json` (снимок схемы),
  обновится `index.ts`. Просмотрите SQL — особенно `DROP` (Payload может спросить, переименовано
  поле или удалено: ответ «удалено» стирает данные). Закоммитьте миграцию **вместе** с изменением кода.
- **Применение:** автоматически при `bash scripts/deploy.sh` (шаг 4 выше), до переключения версии.
- **Состояние на сервере:**
  ```bash
  ssh qmmq 'cd /opt/qmmq/deploy && docker compose --profile tools run --rm migrate pnpm payload migrate:status'
  ```
- **Нельзя:** править уже задеплоенные миграции; запускать в продакшене `migrate:fresh`,
  `migrate:reset`, `migrate:refresh` (стирают данные); запускать `pnpm payload migrate` на локальной
  dev-базе (она в push-режиме — Payload предупредит о потере данных).
- **Забыли миграцию:** в логах приложения ошибки вида `column "…" does not exist` /
  `relation "…" does not exist`. Создайте миграцию, закоммитьте, задеплойте.

## Шаг 12. Откат

### Быстрый откат (без пересборки, ~30 секунд)

На сервере хранятся образы и исходники трёх последних релизов:

```bash
ssh qmmq 'bash /opt/qmmq/scripts/release.sh list'
ssh qmmq 'bash /opt/qmmq/scripts/release.sh rollback'
```

`rollback` без аргумента возвращает предыдущий релиз; конкретный — `release.sh rollback КОММИТ`
(первые 12 символов из `list`).

### Если в отменяемом релизе были миграции

Откат кода **не** откатывает схему базы. Варианты:
1. Миграция только добавляла поля/таблицы — обычно достаточно отката кода, схему можно оставить.
2. Откатить схему: **до** `rollback`, пока активна новая версия:
   ```bash
   ssh qmmq 'cd /opt/qmmq/deploy && docker compose --profile tools run --rm migrate pnpm payload migrate:down'
   ssh qmmq 'bash /opt/qmmq/scripts/release.sh rollback'
   ```
   `migrate:down` отменяет последний пакет миграций (те, что применил последний деплой).
3. Вернуть базу из дампа, сделанного перед миграцией (**данные, записанные после деплоя, пропадут** —
   например, новые заявки; сначала выгрузите их из админки):
   ```bash
   ssh qmmq 'ls -1t /var/backups/qmmq/predeploy/'
   ssh qmmq 'bash /opt/qmmq/scripts/release.sh rollback'
   ssh qmmq 'bash /opt/qmmq/scripts/restore.sh apply /var/backups/qmmq/predeploy/ИМЯ_ФАЙЛА.dump --yes'
   ```

### Откат на старый коммит

Если нужного релиза уже нет на сервере — задеплойте старый коммит заново (с пересборкой):

```bash
git log --oneline -n 20
bash scripts/deploy.sh КОММИТ
```

## Эксплуатация

### Состояние сервера

```bash
ssh qmmq 'bash /opt/qmmq/scripts/status.sh'
```

Контейнеры, активный релиз, свободное место, размер базы и медиа, память, когда был и будет
бэкап, нужна ли перезагрузка.

### Логи

```bash
ssh qmmq 'cd /opt/qmmq/deploy && docker compose logs --tail=200 app'
ssh qmmq 'cd /opt/qmmq/deploy && docker compose logs --tail=200 -f app'
ssh qmmq 'cd /opt/qmmq/deploy && docker compose logs --tail=100 caddy'
ssh qmmq 'cd /opt/qmmq/deploy && docker compose logs --tail=100 db'
ssh qmmq 'journalctl -u qmmq-backup.service -n 50 --no-pager'
ssh qmmq 'cat /var/lib/qmmq/releases.log'
```

`-f` — следить в реальном времени (выход — `Ctrl+C`). Логи контейнеров ротируются автоматически
(по 20 МБ × 5 файлов на контейнер), системный журнал ограничен 500 МБ.

### Перезапуск

```bash
ssh qmmq 'cd /opt/qmmq/deploy && docker compose restart app'
ssh qmmq 'cd /opt/qmmq/deploy && docker compose up -d'
ssh qmmq 'sudo reboot'
```

`restart app` — только приложение; `up -d` — применить изменения `deploy/.env` (пересоздаст
затронутые контейнеры); после `reboot` все контейнеры поднимаются сами.

Изменить настройку: `ssh -t qmmq 'nano /opt/qmmq/deploy/.env'`, затем `up -d` (см. выше) и
обновите копию файла в менеджере паролей. Новую переменную приложения нужно также добавить в
`deploy/docker-compose.yml` (блок `x-app-env`) и `deploy/.env.example`.

### Место на диске

```bash
ssh qmmq 'df -h / && docker system df'
ssh qmmq 'docker builder prune -f && docker image prune -f'
```

Старые образы, исходники релизов и кеш сборки чистятся при каждом деплое автоматически.
**Никогда не запускайте** `docker volume prune`, `docker system prune --volumes` и
`docker compose down -v` — они удаляют тома с базой и медиафайлами.

Если диск всё же заканчивается — увеличьте его в консоли (Compute Cloud → Диски → `qmmq-boot` →
«Изменить», только в бо́льшую сторону) и перезагрузите ВМ: Ubuntu сама расширит раздел.

### Обновления

- **Система:** обновления безопасности ставятся автоматически; при обновлении ядра ВМ
  перезагружается в 04:30 (простой ~1 минута). Журнал: `ssh qmmq 'tail -n 30 /var/log/unattended-upgrades/unattended-upgrades.log'`.
- **Docker** (раз в месяц, контейнеры перезапустятся):
  ```bash
  ssh qmmq 'sudo apt-get update && sudo apt-get install --only-upgrade -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin'
  ```
- **PostgreSQL 17.x и Caddy** (минорные версии, раз в месяц):
  ```bash
  ssh qmmq 'bash /opt/qmmq/scripts/backup.sh --local && cd /opt/qmmq/deploy && docker compose pull db caddy && docker compose up -d db caddy'
  ```
- **Node.js** (базовый образ приложения): `bash scripts/deploy.sh --pull`.
- **Переход на PostgreSQL 18+** — не сменой тега, а через дамп и восстановление (отдельная задача).

### Смена IP администратора

Если SSH перестал подключаться (`Connection timed out`) — скорее всего, сменился ваш IP. `yc`
работает через интернет и SSH не требует:

```bash
NEW_IP=$(curl -4 -s https://ifconfig.me)
yc vpc security-group get qmmq-sg
```

Найдите в выводе `id` правила с `description: ssh-admin` и замените его:

```bash
yc vpc security-group update-rules qmmq-sg --delete-rule-id ID_ПРАВИЛА \
  --add-rule "description=ssh-admin,direction=ingress,port=22,protocol=tcp,v4-cidrs=[$NEW_IP/32]"
```

То же можно сделать в консоли: Virtual Private Cloud → Группы безопасности → `qmmq-sg`.

### Когда появится основной сайт

Удалите в `deploy/caddy/Caddyfile` строку `redir / https://{$LANDING_HOST}{uri} 302`, закоммитьте
и выполните `bash scripts/deploy.sh` — Caddy подхватит изменение без простоя.

### Снимки диска (по желанию)

Для быстрого восстановления всей ВМ можно включить расписание снимков диска `qmmq-boot`
(Compute Cloud → Снимки дисков → Расписания, например раз в неделю, хранить 2). Снимок
тарифицируется по занятому объёму (≈ 0,036 ₸ за ГБ·ч, ≈ 260 ₸ в месяц за 10 ГБ). Бэкапы в
Object Storage это не заменяет.

## Неполадки

| Симптом | Что делать |
|---|---|
| Сертификат не выпускается (в логах caddy `challenge failed`, браузер — ошибка TLS) | Проверьте DNS (`dig +short A …` = IP сервера, нет чужих AAAA), открыт ли 80 в `qmmq-sg`, CAA. Caddy повторяет попытки сам; после исправления подождите 5–10 минут или `docker compose restart caddy`. |
| Сборка падает с `JavaScript heap out of memory` или идёт дольше 30 минут | Увеличьте память ВМ до 8 ГБ (простой ~2 минуты): `yc compute instance stop qmmq-prod && yc compute instance update qmmq-prod --memory 8 && yc compute instance start qmmq-prod`, затем в `deploy/.env` — `NODE_BUILD_HEAP_MB=6144`. |
| Сборка падает на `pnpm install --frozen-lockfile` | `pnpm-lock.yaml` не соответствует `package.json`: выполните локально `pnpm install`, закоммитьте lock-файл. |
| Сборка падает на этапе генерации страниц с ошибкой подключения к базе | При сборке базы нет: страница, которая читает Payload, должна рендериться динамически (например, `export const dynamic = 'force-dynamic'` или через `headers()`/`connection()`). |
| `Миграции не применились` | Смотрите вывод выше: прод продолжает работать на старой версии. Исправьте миграцию новым коммитом. Если база изменилась частично — `restore.sh apply` с дампом из `/var/backups/qmmq/predeploy`. |
| Сайт отвечает 502 | Приложение не запущено: `docker compose ps`, `docker compose logs --tail=200 app`. |
| В логах `column/relation … does not exist` | Не создана миграция — см. [Миграции](#миграции). |
| Картинки не уменьшаются, в логах ошибка `sharp` | Сообщите разработчику: в `next.config.ts` нужно добавить `outputFileTracingIncludes` для `sharp` и `@img/*`. |
| `deploy.sh`: `Нет SSH-доступа` | Сменился IP — см. [Смена IP администратора](#смена-ip-администратора). |
| Бэкап упал (`journalctl -u qmmq-backup.service`) | Чаще всего — ключи или имя бакета в `deploy/.env`, либо роль `storage.uploader` не назначена на бакет. Запустите вручную `bash /opt/qmmq/scripts/backup.sh` и читайте сообщение. |

## Источники

Проверено 29.10.2026:

- Регионы, консоль и эндпоинты Казахстана: https://yandex.cloud/ru-kz/docs/overview/concepts/region
- Эндпоинты API (`api.yandexcloud.kz`): https://yandex.cloud/ru-kz/docs/api-design-guide/concepts/endpoints
- Профиль CLI для Казахстана (`--region=kz`, зона `kz1-a`): https://yandex.cloud/ru-kz/docs/cli/operations/profile/profile-create
- Установка CLI: https://yandex.cloud/ru-kz/docs/cli/quickstart
- Платформы ВМ в Казахстане: https://yandex.cloud/ru-kz/docs/compute/concepts/vm-platforms
- Образ Ubuntu 24.04 LTS: https://yandex.cloud/ru-kz/marketplace/products/yc/ubuntu-24-04-lts
- Создание ВМ и параметры `yc compute instance create`: https://yandex.cloud/ru-kz/docs/compute/operations/vm-create/create-linux-vm
- Группы безопасности (CLI): https://yandex.cloud/ru-kz/docs/vpc/operations/security-group-create
- Object Storage, AWS CLI для Казахстана (эндпоинт, регион `kz1`): https://yandex.cloud/ru-kz/docs/storage/tools/aws-cli
- Роли Object Storage: https://yandex.cloud/ru-kz/docs/storage/security
- Права на бакет: https://yandex.cloud/ru-kz/docs/storage/operations/buckets/iam-access
- Жизненный цикл бакета: https://yandex.cloud/ru-kz/docs/storage/operations/buckets/lifecycles
- Цены: Compute https://yandex.cloud/ru-kz/docs/compute/pricing, VPC https://yandex.cloud/ru-kz/docs/vpc/pricing,
  Object Storage https://yandex.cloud/ru-kz/docs/storage/pricing, калькулятор https://yandex.cloud/ru-kz/prices
