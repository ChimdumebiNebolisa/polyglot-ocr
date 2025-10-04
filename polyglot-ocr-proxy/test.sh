#!/usr/bin/env bash
set -euo pipefail

URL="https://polyglot-ocr-proxy.polyglotocr2025.workers.dev"

echo "🔍 Health check..."
curl -s "$URL/" | jq .

echo -e "\n🎤 STT test..."
if [ -f "sample.wav" ]; then
  curl -s "$URL/stt" \
    -X POST \
    -H "Content-Type: audio/wav" \
    --data-binary @sample.wav | jq .
else
  echo "⚠️ sample.wav not found, skipping STT test."
fi
