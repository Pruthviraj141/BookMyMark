#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================="
echo "  BookMyMark — Launching Firefox Extension"
echo "=========================================="

echo "1. Building latest Firefox extension..."
npm run build:firefox

echo "2. Launching Firefox with BookMyMark preloaded..."
npx web-ext run --source-dir .output/firefox-mv2 --target firefox-desktop
