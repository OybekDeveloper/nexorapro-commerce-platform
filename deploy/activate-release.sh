#!/usr/bin/env bash

set -euo pipefail

APP_ROOT="/var/www/nexorapro"
RELEASES_DIR="$APP_ROOT/releases"
SHARED_DIR="$APP_ROOT/shared"
CURRENT_LINK="$APP_ROOT/current"
HEALTH_URL="http://127.0.0.1:3000/api/health"
RELEASE_ID="${1:-}"

if [[ ! "$RELEASE_ID" =~ ^[0-9]+-[0-9]+-[0-9a-f]{40}$ ]]; then
  echo "Invalid release id." >&2
  exit 1
fi

ARCHIVE_PATH="/tmp/nexorapro-${RELEASE_ID}.tgz"
ENV_UPLOAD_PATH="/tmp/nexorapro-${RELEASE_ID}.env"
SCRIPT_PATH="/tmp/nexorapro-${RELEASE_ID}.sh"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"
PREVIOUS_RELEASE=""

cleanup_uploads() {
  rm -f "$ARCHIVE_PATH" "$ENV_UPLOAD_PATH" "$SCRIPT_PATH"
}

trap cleanup_uploads EXIT

for command_name in node pm2 tar curl; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required server command is missing: $command_name" >&2
    exit 1
  fi
done

if [ ! -f "$ARCHIVE_PATH" ] || [ ! -f "$ENV_UPLOAD_PATH" ]; then
  echo "The uploaded release or environment file is missing." >&2
  exit 1
fi

if ! grep -Eq '^NEXORAPRO_DB_PATH=/var/www/nexorapro/shared/data/nexora\.db$' "$ENV_UPLOAD_PATH"; then
  echo "PRODUCTION_ENV_FILE must use the persistent shared database path." >&2
  exit 1
fi

mkdir -p "$RELEASES_DIR" "$SHARED_DIR/data"

if [ -L "$CURRENT_LINK" ]; then
  PREVIOUS_RELEASE="$(readlink -f "$CURRENT_LINK")"
fi

if [ -e "$RELEASE_DIR" ]; then
  echo "Release directory already exists: $RELEASE_DIR" >&2
  exit 1
fi

mkdir "$RELEASE_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$RELEASE_DIR"
install -m 600 "$ENV_UPLOAD_PATH" "$SHARED_DIR/.env.production"
ln -s "$SHARED_DIR/.env.production" "$RELEASE_DIR/.env.production"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

start_current_release() {
  cd "$CURRENT_LINK"
  pm2 startOrReload deploy/ecosystem.config.cjs --update-env
}

rollback() {
  if [ -n "$PREVIOUS_RELEASE" ] && [ -d "$PREVIOUS_RELEASE" ]; then
    echo "Health check failed; restoring previous release." >&2
    ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
    start_current_release
  fi
}

if ! start_current_release; then
  rollback
  exit 1
fi

healthy=false
for _attempt in $(seq 1 20); do
  if curl --fail --silent --show-error "$HEALTH_URL" >/dev/null; then
    healthy=true
    break
  fi
  sleep 3
done

if [ "$healthy" != true ]; then
  rollback
  exit 1
fi

pm2 save

# Keep the current release and the four most recent older releases.
while IFS= read -r old_release; do
  [ -n "$old_release" ] || continue
  if [ "$(readlink -f "$old_release")" = "$(readlink -f "$CURRENT_LINK")" ]; then
    continue
  fi
  case "$old_release" in
    "$RELEASES_DIR"/*) rm -rf -- "$old_release" ;;
    *) echo "Refusing to remove unexpected path: $old_release" >&2 ;;
  esac
done < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -rn \
  | tail -n +6 \
  | cut -d' ' -f2-)

echo "Release $RELEASE_ID is healthy and active."
