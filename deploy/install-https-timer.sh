#!/usr/bin/env bash

set -euo pipefail

APP_ROOT="/var/www/nexorapro"
SOURCE_DIR="$APP_ROOT/current/deploy"
HELPER_PATH="/usr/local/sbin/nexorapro-enable-https"
SHARE_DIR="/usr/local/share/nexorapro"
SERVICE_PATH="/etc/systemd/system/nexorapro-https.service"
TIMER_PATH="/etc/systemd/system/nexorapro-https.timer"

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "Run this installer as root." >&2
  exit 1
fi

for source_path in "$SOURCE_DIR/enable-https.sh" "$SOURCE_DIR/nginx.conf.example"; do
  if [ ! -f "$source_path" ]; then
    echo "Required release file is missing: $source_path" >&2
    exit 1
  fi
done

# The timer must never execute a mutable deploy-owned script as root. Copy the
# reviewed release files into root-owned paths before creating the unit.
install -d -m 755 -o root -g root "$SHARE_DIR"
install -m 700 -o root -g root "$SOURCE_DIR/enable-https.sh" "$HELPER_PATH"
install -m 644 -o root -g root "$SOURCE_DIR/nginx.conf.example" "$SHARE_DIR/nginx.conf"

cat >"$SERVICE_PATH" <<EOF
[Unit]
Description=Enable nexorapro.uz HTTPS when public DNS is ready
After=network-online.target nginx.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=$HELPER_PATH
User=root
Group=root
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=false
EOF

cat >"$TIMER_PATH" <<'EOF'
[Unit]
Description=Retry nexorapro.uz HTTPS provisioning

[Timer]
OnBootSec=2min
OnUnitActiveSec=15min
RandomizedDelaySec=30s
Persistent=true
Unit=nexorapro-https.service

[Install]
WantedBy=timers.target
EOF

chmod 644 "$SERVICE_PATH" "$TIMER_PATH"
systemctl daemon-reload
systemctl enable --now nexorapro-https.timer
systemctl start nexorapro-https.service

echo "HTTPS watcher installed. It will retry every 15 minutes until successful."
systemctl --no-pager list-timers nexorapro-https.timer
