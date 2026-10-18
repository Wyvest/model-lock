#!/bin/sh
# Installs policy/managed-settings.json as Claude Code managed settings (macOS, Linux).
# Run with sudo. Keys already in an existing managed-settings.json are kept.
set -eu

src="$(cd "$(dirname "$0")" && pwd)/policy/managed-settings.json"
case "$(uname -s)" in
  Darwin) dir="/Library/Application Support/ClaudeCode" ;;
  *) dir="/etc/claude-code" ;;
esac
dst="$dir/managed-settings.json"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo sh \"$0\"" >&2
  exit 1
fi

mkdir -p "$dir"
if [ -f "$dst" ]; then
  cp "$dst" "$dst.bak"
  if command -v jq >/dev/null 2>&1; then
    jq -s '.[0] * .[1]' "$dst.bak" "$src" > "$dst"
  else
    echo "jq not found: replacing $dst (old copy in $dst.bak)" >&2
    cp "$src" "$dst"
  fi
else
  cp "$src" "$dst"
fi
chmod 644 "$dst"
echo "Installed $dst. Restart Claude Code to apply."
