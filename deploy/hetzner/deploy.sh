#!/usr/bin/env bash
# Deploys the committed HEAD of this repo to Håndfri's Hetzner server as the
# compose project "den-sidste-skrue" and restarts it.
#
#   DSS_HOST=root@91.98.223.238 deploy/hetzner/deploy.sh
#
# Everything lands in /opt/den-sidste-skrue; the other projects on the box
# are never touched. The site's domain is routed by the Caddyfile in
# telefonist's repo (deploy/hetzner/Caddyfile).
set -euo pipefail

host="${DSS_HOST:?sæt DSS_HOST=root@<serverens ip>}"
repo="$(cd "$(dirname "$0")/../.." && pwd)"

if [ -n "$(git -C "$repo" status --porcelain)" ]; then
  echo "Der er ændringer, som ikke er committet. Commit dem først." >&2
  exit 1
fi

# Exported from the commit, never copied from the working tree, so quote
# requests and Kasper's photos on this machine stay here.
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
git -C "$repo" archive HEAD | tar -x -C "$stage"

ssh "$host" 'mkdir -p /opt/den-sidste-skrue'
rsync -az --delete "$stage/" "$host:/opt/den-sidste-skrue/"

ssh "$host" 'cd /opt/den-sidste-skrue/deploy/hetzner \
  && docker compose up -d --build --wait --wait-timeout 300 \
  && install -m 644 rebuild.cron /etc/cron.d/den-sidste-skrue \
  && docker compose ps'

echo "Kører nu den-sidste-skrue $(git -C "$repo" rev-parse --short HEAD)."
