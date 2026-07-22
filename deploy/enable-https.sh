#!/usr/bin/env bash

set -euo pipefail

DOMAIN="nexorapro.uz"
WWW_DOMAIN="www.nexorapro.uz"
APP_ROOT="/var/www/nexorapro"
NGINX_SOURCE="/usr/local/share/nexorapro/nginx.conf"
NGINX_SITE="/etc/nginx/sites-available/nexorapro"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
TIMER_NAME="nexorapro-https.timer"

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "HTTPS helper must run as root." >&2
  exit 1
fi

for command_name in certbot curl getent nginx systemctl; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required HTTPS command is missing: $command_name" >&2
    exit 1
  fi
done

finish_timer() {
  systemctl disable "$TIMER_NAME" >/dev/null 2>&1 || true
  systemctl stop "$TIMER_NAME" --no-block >/dev/null 2>&1 || true
}

if [ -s "$CERT_PATH" ]; then
  echo "A certificate already exists for $DOMAIN."
  systemctl enable --now certbot.timer
  finish_timer
  exit 0
fi

server_ip="$(ip -4 route get 1.1.1.1 | awk '{ for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit } }')"
root_ip="$(getent ahostsv4 "$DOMAIN" | awk 'NR == 1 { print $1 }')"
www_ip="$(getent ahostsv4 "$WWW_DOMAIN" | awk 'NR == 1 { print $1 }')"

if [ -z "$server_ip" ] || [ "$root_ip" != "$server_ip" ] || [ "$www_ip" != "$server_ip" ]; then
  echo "DNS is not ready: server=${server_ip:-unknown}, root=${root_ip:-missing}, www=${www_ip:-missing}."
  exit 0
fi

admin_email="$(sed -n 's/^ADMIN_EMAIL=//p' "$APP_ROOT/shared/.env.production" | head -n 1)"
if [ -z "$admin_email" ]; then
  echo "ADMIN_EMAIL is missing from the production environment file." >&2
  exit 1
fi

install -m 644 "$NGINX_SOURCE" "$NGINX_SITE"
ln -sfn "$NGINX_SITE" /etc/nginx/sites-enabled/nexorapro
nginx -t
systemctl reload nginx

certbot --nginx --non-interactive --agree-tos --redirect \
  --email "$admin_email" \
  -d "$DOMAIN" \
  -d "$WWW_DOMAIN"

nginx -t
systemctl reload nginx
systemctl enable --now certbot.timer

curl --fail --silent --show-error \
  --resolve "$DOMAIN:443:127.0.0.1" \
  "https://$DOMAIN/api/health" >/dev/null

finish_timer
echo "HTTPS is healthy for $DOMAIN and $WWW_DOMAIN."
