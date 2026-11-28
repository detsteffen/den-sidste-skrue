#!/usr/bin/env bash
# Rebuilds the site on the server when the Instagram feed holds other posts
# than at the last rebuild. Run by cron (rebuild.cron); each check reads the
# Behold feed once and a rebuild once more, against its 1,200 views a month.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
state=/var/lib/den-sidste-skrue/instagram-posts
mkdir -p "$(dirname "$state")"

feed="$(python3 -c 'import json, sys
print(json.load(open(sys.argv[1]))["instagram"]["feed"])' \
  "$here/../../src/data/site.json")"
[ -n "$feed" ] || exit 0

posts="$(curl -fsS --max-time 30 "$feed" | python3 -c 'import json, sys
print(" ".join(post["id"] for post in json.load(sys.stdin)["posts"]))')"
[ "$posts" != "$(cat "$state" 2>/dev/null)" ] || exit 0

echo "Nye opslag: $posts"
cd "$here"
BUILD_DATE="$(date +%s)" docker compose up -d --build --wait --wait-timeout 300
echo "$posts" > "$state"
