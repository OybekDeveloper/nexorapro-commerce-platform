#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
access_file="$repo_root/.server-access"

if [ ! -f "$access_file" ]; then
  echo ".server-access was not found at $access_file" >&2
  exit 1
fi

get_value() {
  awk -v wanted="$1" '
    index($0, wanted "=") == 1 {
      value = substr($0, length(wanted) + 2)
      gsub(/^"|"$/, "", value)
      print value
      exit
    }
  ' "$access_file"
}

host="$(get_value VPS_HOST)"
port="$(get_value VPS_PORT)"
user="$(get_value VPS_USER)"
private_key_path="$(get_value SSH_PRIVATE_KEY_PATH)"
public_key_path="${private_key_path}.pub"

if [ -z "$host" ] || [ -z "$port" ] || [ -z "$user" ]; then
  echo "VPS_HOST, VPS_PORT, and VPS_USER must be set in .server-access." >&2
  exit 1
fi

if [ ! -f "$public_key_path" ]; then
  echo "Public key was not found at $public_key_path" >&2
  exit 1
fi

if ! command -v ssh-copy-id >/dev/null 2>&1; then
  echo "ssh-copy-id is not installed." >&2
  exit 1
fi

echo "Eskiz VPS passwordini quyidagi prompt ichida bir marta kiriting."
exec ssh-copy-id -i "$public_key_path" -p "$port" "$user@$host"
