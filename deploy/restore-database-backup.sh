#!/usr/bin/env bash

set -euo pipefail

APP_ROOT="/var/www/nexorapro"
DATABASE_PATH="$APP_ROOT/shared/data/nexora.db"
BACKUP_ROOT="$APP_ROOT/shared/data/migration-backups"
BACKUP_PATH="${1:-}"

if [ -z "$BACKUP_PATH" ]; then
  echo "Usage: $0 /var/www/nexorapro/shared/data/migration-backups/<backup>.db" >&2
  exit 1
fi

if ! BACKUP_PATH="$(realpath -e -- "$BACKUP_PATH")"; then
  echo "Backup path cannot be resolved." >&2
  exit 1
fi

case "$BACKUP_PATH" in
  "$BACKUP_ROOT"/*.db) ;;
  *) echo "Backup must be a .db file inside $BACKUP_ROOT" >&2; exit 1 ;;
esac

if [ ! -f "$BACKUP_PATH" ]; then
  echo "Backup not found: $BACKUP_PATH" >&2
  exit 1
fi

sqlite3 "$BACKUP_PATH" "PRAGMA integrity_check;" | grep -qx 'ok' || {
  echo "Backup integrity check failed." >&2
  exit 1
}

RECOVERY_PATH="$BACKUP_ROOT/pre-restore-$(date -u +%Y%m%dT%H%M%SZ).db"
recover_on_error() {
  local exit_code=$?
  trap - ERR
  if [ -f "$RECOVERY_PATH" ]; then
    echo "Restore failed; putting the pre-restore database back." >&2
    install -m 600 "$RECOVERY_PATH" "$DATABASE_PATH"
    rm -f -- "${DATABASE_PATH}-wal" "${DATABASE_PATH}-shm"
  fi
  pm2 startOrReload "$APP_ROOT/current/deploy/ecosystem.config.cjs" --update-env || true
  exit "$exit_code"
}

trap recover_on_error ERR
pm2 stop nexorapro-commerce
if [ -f "$DATABASE_PATH" ]; then
  sqlite3 "$DATABASE_PATH" ".backup '$RECOVERY_PATH'"
  chmod 600 "$RECOVERY_PATH"
fi
install -m 600 "$BACKUP_PATH" "$DATABASE_PATH"
rm -f -- "${DATABASE_PATH}-wal" "${DATABASE_PATH}-shm"
pm2 startOrReload "$APP_ROOT/current/deploy/ecosystem.config.cjs" --update-env
healthy=false
for _attempt in $(seq 1 20); do
  if curl --fail --silent --show-error http://127.0.0.1:3000/api/health >/dev/null; then
    healthy=true
    break
  fi
  sleep 3
done
[ "$healthy" = true ]
pm2 save
trap - ERR
echo "Database restored. Pre-restore recovery copy: $RECOVERY_PATH"
