#!/usr/bin/env bash
# Разовая подготовка ВМ Ubuntu 24.04 под qmmq.kz. Запуск с Mac (см. docs/DEPLOY.md, шаг 5):
#   scp scripts/server-setup.sh qmmq:/tmp/ && ssh qmmq 'sudo bash /tmp/server-setup.sh'
# Повторный запуск безопасен.
#
# Что делает: часовой пояс Алматы; обновления системы и автоматические обновления
# безопасности; Docker Engine + Compose из официального репозитория Docker; swap;
# ufw (22, 80, 443); SSH только по ключу; папки /opt/qmmq, /var/lib/qmmq, /var/backups/qmmq;
# rclone для бэкапов; ограничения размера логов.
set -euo pipefail

DEPLOY_USER=${DEPLOY_USER:-deploy}
SWAP_SIZE=${SWAP_SIZE:-4G}

say() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die() { printf '\033[1;31mERR %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Запускайте через sudo"
. /etc/os-release
[ "${ID:-}" = ubuntu ] || die "Скрипт рассчитан на Ubuntu (найдено: ${ID:-?})"
id "$DEPLOY_USER" >/dev/null 2>&1 || die "Нет пользователя $DEPLOY_USER (создаётся cloud-init при создании ВМ)"
[ -s "/home/$DEPLOY_USER/.ssh/authorized_keys" ] \
  || die "У $DEPLOY_USER нет SSH-ключа — отключать пароли опасно, остановлено"

export DEBIAN_FRONTEND=noninteractive
APT_OPTS=(-y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold)

say "Часовой пояс Asia/Almaty"
timedatectl set-timezone Asia/Almaty

say "Обновление системы"
apt-get update
apt-get "${APT_OPTS[@]}" upgrade
apt-get "${APT_OPTS[@]}" install ca-certificates curl gnupg ufw unattended-upgrades rsync rclone

say "Docker Engine и Compose (download.docker.com)"
if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME:-$VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get "${APT_OPTS[@]}" install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
mkdir -p /etc/docker
if [ ! -f /etc/docker/daemon.json ]; then
  cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "20m", "max-file": "5" }
}
EOF
  systemctl restart docker
fi
systemctl enable --now docker
usermod -aG docker "$DEPLOY_USER"

say "Swap $SWAP_SIZE (нужен для сборки Next.js)"
if ! swapon --show=NAME --noheadings | grep -qx /swapfile; then
  [ -f /swapfile ] || fallocate -l "$SWAP_SIZE" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
cat > /etc/sysctl.d/99-qmmq.conf <<'EOF'
vm.swappiness=10
EOF
sysctl -q --system

say "Файрвол ufw: 22 (с ограничением частоты), 80, 443"
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw limit 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw allow 443/udp >/dev/null
ufw --force enable

say "SSH: только ключи, без входа root и паролей"
# Файл с префиксом 00- читается раньше 50-cloud-init.conf: в sshd побеждает первое значение.
cat > /etc/ssh/sshd_config.d/00-qmmq-hardening.conf <<EOF
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
AllowUsers $DEPLOY_USER
EOF
sshd -t
systemctl reload ssh 2>/dev/null || systemctl restart ssh

say "Автоматические обновления безопасности (перезагрузка при необходимости — в 04:30)"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
cat > /etc/apt/apt.conf.d/52qmmq-unattended-upgrades <<'EOF'
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:30";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF
systemctl enable --now unattended-upgrades >/dev/null

say "Размер системного журнала"
mkdir -p /etc/systemd/journald.conf.d
cat > /etc/systemd/journald.conf.d/qmmq.conf <<'EOF'
[Journal]
SystemMaxUse=500M
EOF
systemctl restart systemd-journald

say "Папки приложения"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0755 /opt/qmmq /opt/qmmq/deploy
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0750 /var/lib/qmmq /var/lib/qmmq/releases /var/backups/qmmq

say "Готово"
echo "Docker:  $(docker --version)"
echo "Compose: $(docker compose version)"
echo "Swap:    $(swapon --show=NAME,SIZE --noheadings | tr -s ' ')"
echo "Время:   $(date)"
ufw status | sed 's/^/  /'
echo
echo "Переподключитесь по SSH, чтобы пользователь $DEPLOY_USER получил доступ к docker."
