#!/bin/bash
set -e

echo "🚀 Starting Aegis-MCX health check..."

API_URL="${API_URL:-http://localhost:3000}"
MAX_RETRIES="${MAX_RETRIES:-30}"
RETRY_DELAY="${RETRY_DELAY:-2}"

for i in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $i/$MAX_RETRIES: Checking $API_URL/health"

  if curl --fail --silent --max-time 5 "$API_URL/health" > /dev/null 2>&1; then
    echo "✅ API is healthy!"
    exit 0
  fi

  if [ $i -lt $MAX_RETRIES ]; then
    echo "⏳ API not ready, waiting ${RETRY_DELAY}s..."
    sleep $RETRY_DELAY
  fi
done

echo "❌ API health check failed after $MAX_RETRIES attempts"
exit 1
