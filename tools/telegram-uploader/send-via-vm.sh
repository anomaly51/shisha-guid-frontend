#!/usr/bin/env bash
set -euo pipefail

VM_HOST="${VM_HOST:-192.168.1.200}"
VM_USER="${VM_USER:-nekoneki}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_proxmox-vm}"
LOCAL_SOURCE="${LOCAL_SOURCE:-/Users/nekoneki/Desktop/map23-prod}"
REMOTE_ROOT="${REMOTE_ROOT:-/home/nekoneki/telegram-uploader}"
TARGET="${TELEGRAM_TARGET:-photochi43322}"

SSH=(ssh -i "$SSH_KEY" "$VM_USER@$VM_HOST")
RSYNC=(rsync -az --progress --partial -e "ssh -i $SSH_KEY")

cd "$(dirname "$0")"

"${SSH[@]}" "mkdir -p '$REMOTE_ROOT/app' '$REMOTE_ROOT/data' '$REMOTE_ROOT/input'"
rsync -az --delete --exclude data --exclude .env ./ "$VM_USER@$VM_HOST:$REMOTE_ROOT/app/" -e "ssh -i $SSH_KEY"

file_list="$(mktemp "${TMPDIR:-/tmp}/telegram-uploader-list.XXXXXX")"
current_file_list="$(mktemp "${TMPDIR:-/tmp}/telegram-uploader-current.XXXXXX")"
trap 'rm -f "$file_list" "$current_file_list"' EXIT

find "$LOCAL_SOURCE" -maxdepth 1 -type f \( \
  -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.heic' \
\) -print0 \
  | xargs -0 -n1 basename \
  | sort -f > "$file_list"

rsync -az "$file_list" \
  "$VM_USER@$VM_HOST:$REMOTE_ROOT/data/file-list.txt" \
  -e "ssh -i $SSH_KEY"

total="$(wc -l < "$file_list" | tr -d ' ')"
index=0

while IFS= read -r name; do
  index=$((index + 1))
  [[ -n "$name" ]] || continue

  echo "[$index/$total] staging $name"
  printf '%s\n' "$name" > "$current_file_list"
  "${SSH[@]}" "rm -rf '$REMOTE_ROOT/input' && mkdir -p '$REMOTE_ROOT/input'"
  "${RSYNC[@]}" "$LOCAL_SOURCE/$name" "$VM_USER@$VM_HOST:$REMOTE_ROOT/input/$name"
  rsync -az "$current_file_list" \
    "$VM_USER@$VM_HOST:$REMOTE_ROOT/data/current-file-list.txt" \
    -e "ssh -i $SSH_KEY"

  echo "[$index/$total] uploading $name"
  "${SSH[@]}" "cd '$REMOTE_ROOT/app' && docker compose -f docker-compose.telegram.yml run --rm \
    -v '$REMOTE_ROOT/input:/input:ro' \
    -v '$REMOTE_ROOT/data:/data' \
    telegram-uploader send-list --target '$TARGET' --file-list /data/current-file-list.txt --limit 1"
done < "$file_list"
