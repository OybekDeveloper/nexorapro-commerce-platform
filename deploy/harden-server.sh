#!/usr/bin/env bash

set -euo pipefail

APP_ROOT="/var/www/nexorapro"
DEPLOY_USER="deploy"
NGINX_SOURCE="$APP_ROOT/current/deploy/nginx.conf.example"
NGINX_SITE="/etc/nginx/sites-available/nexorapro"
NGINX_ENABLED="/etc/nginx/sites-enabled/nexorapro"
SSH_HARDENING="/etc/ssh/sshd_config.d/99-nexorapro-hardening.conf"
DOMAIN="nexorapro.uz"
WWW_DOMAIN="www.nexorapro.uz"
ENABLE_HTTPS=false

usage() {
  cat <<'EOF'
Usage: sudo bash deploy/harden-server.sh [--with-https]

Without flags the script hardens SSH/firewall, installs required recovery tools,
and activates the production Nginx configuration. Add --with-https only after
public DNS resolves nexorapro.uz to this VPS.
EOF
}

case "${1:-}" in
  "") ;;
  --with-https) ENABLE_HTTPS=true ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "Run this script as root (sudo bash ...)." >&2
  exit 1
fi

for required_path in "$NGINX_SOURCE" "$APP_ROOT/shared/.env.production"; do
  if [ ! -f "$required_path" ]; then
    echo "Required production file is missing: $required_path" >&2
    exit 1
  fi
done

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  echo "Deployment user does not exist: $DEPLOY_USER" >&2
  exit 1
fi

deploy_home="$(getent passwd "$DEPLOY_USER" | cut -d: -f6)"
authorized_keys="$deploy_home/.ssh/authorized_keys"
if [ ! -s "$authorized_keys" ]; then
  echo "Refusing to disable password login: $authorized_keys is empty." >&2
  exit 1
fi

for command_name in apt-get nginx sshd systemctl; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required server command is missing: $command_name" >&2
    exit 1
  fi
done

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y sqlite3 ufw fail2ban certbot python3-certbot-nginx

install -m 644 "$NGINX_SOURCE" "$NGINX_SITE"
ln -sfn "$NGINX_SITE" "$NGINX_ENABLED"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

install -d -m 755 /etc/ssh/sshd_config.d
cat >"$SSH_HARDENING" <<'EOF'
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PermitRootLogin no
MaxAuthTries 3
LoginGraceTime 30
X11Forwarding no
AllowUsers deploy
EOF

sshd -t
systemctl reload ssh

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

systemctl enable --now fail2ban
if command -v fail2ban-client >/dev/null 2>&1; then
  fail2ban-client unban --all >/dev/null 2>&1 || true
fi

install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
  "$APP_ROOT/shared/data/migration-backups" \
  "$APP_ROOT/shared/uploads/products"
chmod 600 "$APP_ROOT/shared/.env.production"
find "$APP_ROOT/shared/data" -maxdepth 1 -type f \
  \( -name '*.db' -o -name '*.db-shm' -o -name '*.db-wal' \) \
  -exec chmod 600 {} +

if [ "$ENABLE_HTTPS" = true ]; then
  resolved_ip="$(getent ahostsv4 "$DOMAIN" | awk 'NR == 1 { print $1 }')"
  server_ip="$(ip -4 route get 1.1.1.1 | awk '{ for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit } }')"

  if [ -z "$resolved_ip" ] || [ -z "$server_ip" ] || [ "$resolved_ip" != "$server_ip" ]; then
    echo "HTTPS skipped: $DOMAIN resolves to '${resolved_ip:-nothing}', server IP is '${server_ip:-unknown}'." >&2
    echo "Wait for DNS propagation, then rerun with --with-https." >&2
    exit 3
  fi

  admin_email="$(sed -n 's/^ADMIN_EMAIL=//p' "$APP_ROOT/shared/.env.production" | head -n 1)"
  if [ -z "$admin_email" ]; then
    echo "ADMIN_EMAIL is missing from the production environment file." >&2
    exit 1
  fi

  certbot --nginx --non-interactive --agree-tos --redirect \
    --email "$admin_email" \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN"
  nginx -t
  systemctl reload nginx
fi

echo "Server hardening completed."
sshd -T | grep -E '^(passwordauthentication|kbdinteractiveauthentication|permitrootlogin|pubkeyauthentication|maxauthtries|allowusers) '
ufw status verbose
systemctl --no-pager --full status nginx fail2ban | sed -n '1,24p'
