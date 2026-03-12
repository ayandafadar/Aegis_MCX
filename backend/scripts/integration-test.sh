#!/bin/bash
set -e

echo "🧪 Running integration tests for Aegis-MCX..."

API_URL="${API_URL:-http://localhost:3000}"

# Test health endpoint
echo "Testing /health endpoint..."
curl --fail --silent "$API_URL/health" | jq -e '.status == "ok"' > /dev/null
echo "✅ Health check passed"

# Test dashboard endpoint
echo "Testing /api/dashboard endpoint..."
curl --fail --silent "$API_URL/api/dashboard" | jq -e '.dailyMargins | length > 0' > /dev/null
echo "✅ Dashboard endpoint passed"

# Test market endpoints
echo "Testing /api/market/daily-margins endpoint..."
curl --fail --silent "$API_URL/api/market/daily-margins" | jq -e '.items | length > 0' > /dev/null
echo "✅ Daily margins endpoint passed"

echo "Testing /api/market/watch endpoint..."
curl --fail --silent "$API_URL/api/market/watch" | jq -e '.items | length > 0' > /dev/null
echo "✅ Market watch endpoint passed"

# Test accessibility endpoints
echo "Testing /api/accessibility/reports endpoint..."
curl --fail --silent "$API_URL/api/accessibility/reports" | jq -e '.items | type == "array"' > /dev/null
echo "✅ Accessibility reports endpoint passed"

# Test monitoring endpoints
echo "Testing /api/monitoring/alerts endpoint..."
curl --fail --silent "$API_URL/api/monitoring/alerts" | jq -e '.items | type == "array"' > /dev/null
echo "✅ Monitoring alerts endpoint passed"

# Test correlation endpoint
echo "Testing /api/correlation/latest endpoint..."
curl --fail --silent "$API_URL/api/correlation/latest" | jq -e 'has("topPriorityAlert")' > /dev/null
echo "✅ Correlation endpoint passed"

echo ""
echo "🎉 All integration tests passed!"
