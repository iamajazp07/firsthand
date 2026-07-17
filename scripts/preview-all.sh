#!/usr/bin/env bash
# Build and serve the ENTIRE Vivahale network locally — the vivahale.com brand
# portal plus every content vertical — so the whole multi-vertical site can be
# clicked through before any DNS or Vercel deployment exists.
#
#   bash scripts/preview-all.sh          # build all six modes, then serve them
#   bash scripts/preview-all.sh --serve  # skip builds, serve existing .next-*
#
# Ports: portal 3000 · health 3001 · money 3002 · tech 3003 · education 3004 ·
# travel 3005. The portal build gets NEXT_PUBLIC_LOCAL_VERTICAL_PORTS so its
# vertical cards link across these local ports instead of the production
# subdomains. Each mode builds into its own dist dir (.next-<mode>, see
# NEXT_DIST_DIR in next.config.ts) so the builds don't clobber each other.
# Stop everything with Ctrl-C (or: pkill -f "next start").
#
# NOTE: written for the stock macOS bash 3.2 — no associative arrays.
set -euo pipefail
cd "$(dirname "$0")/.."

MODES="portal health money tech education travel"
PORTS_MAP="health=3001,money=3002,tech=3003,education=3004,travel=3005"

port_for() {
  case "$1" in
    portal) echo 3000 ;;
    health) echo 3001 ;;
    money) echo 3002 ;;
    tech) echo 3003 ;;
    education) echo 3004 ;;
    travel) echo 3005 ;;
    *) echo "unknown mode: $1" >&2; exit 1 ;;
  esac
}

if [ "${1:-}" != "--serve" ]; then
  for m in $MODES; do
    echo "── building $m (.next-$m)"
    NEXT_PUBLIC_VERTICAL="$m" \
      NEXT_DIST_DIR=".next-$m" \
      NEXT_PUBLIC_LOCAL_VERTICAL_PORTS="$PORTS_MAP" \
      npm run build
  done
fi

for m in $MODES; do
  p="$(port_for "$m")"
  echo "── serving $m → http://localhost:$p"
  NEXT_PUBLIC_VERTICAL="$m" NEXT_DIST_DIR=".next-$m" \
    npm run start -- -p "$p" &
done

echo
echo "Vivahale network is up:"
echo "  portal     http://localhost:3000"
echo "  health     http://localhost:3001"
echo "  money      http://localhost:3002"
echo "  tech       http://localhost:3003"
echo "  education  http://localhost:3004"
echo "  travel     http://localhost:3005"
echo "Ctrl-C to stop all."
wait
