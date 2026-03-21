#!/bin/bash
set -e

echo "🔍 Running pre-deployment checks for Aegis-MCX..."
echo ""

ERRORS=0

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Docker is installed: $(docker --version)"
fi

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
  echo "❌ Docker Compose is not installed"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Docker Compose is installed"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "⚠️  Node.js is not installed (required for local development)"
else
  NODE_VERSION=$(node --version)
  echo "✅ Node.js is installed: $NODE_VERSION"

  # Check if version is 20+
  MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$MAJOR_VERSION" -lt 20 ]; then
    echo "⚠️  Node.js version should be 20 or higher"
  fi
fi

# Check npm
if ! command -v npm &> /dev/null; then
  echo "⚠️  npm is not installed (required for local development)"
else
  echo "✅ npm is installed: $(npm --version)"
fi

# Check kubectl (optional)
if command -v kubectl &> /dev/null; then
  echo "✅ kubectl is installed: $(kubectl version --client --short 2>/dev/null || echo 'version check skipped')"
else
  echo "ℹ️  kubectl is not installed (optional, needed for K8s deployment)"
fi

# Check Helm (optional)
if command -v helm &> /dev/null; then
  echo "✅ Helm is installed: $(helm version --short)"
else
  echo "ℹ️  Helm is not installed (optional, needed for Helm deployment)"
fi

# Check Terraform (optional)
if command -v terraform &> /dev/null; then
  echo "✅ Terraform is installed: $(terraform version -json | grep -o '"terraform_version":"[^"]*' | cut -d'"' -f4)"
else
  echo "ℹ️  Terraform is not installed (optional, needed for IaC deployment)"
fi

# Check required directories
echo ""
echo "Checking project structure..."

if [ ! -d "backend" ]; then
  echo "❌ backend/ directory not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ backend/ directory exists"
fi

if [ ! -d "frontend" ]; then
  echo "❌ frontend/ directory not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ frontend/ directory exists"
fi

if [ ! -f "backend/package.json" ]; then
  echo "❌ backend/package.json not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ backend/package.json exists"
fi

# Check Docker files
if [ ! -f "backend/apps/api/Dockerfile" ]; then
  echo "❌ API Dockerfile not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ API Dockerfile exists"
fi

if [ ! -f "backend/apps/worker/Dockerfile" ]; then
  echo "❌ Worker Dockerfile not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Worker Dockerfile exists"
fi

# Check port availability
echo ""
echo "Checking port availability..."

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  Port 3000 is already in use"
  echo "   Process: $(lsof -Pi :3000 -sTCP:LISTEN | tail -n 1)"
else
  echo "✅ Port 3000 is available"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "🎉 All critical checks passed! Ready for deployment."
  exit 0
else
  echo "❌ Found $ERRORS critical error(s). Please fix before deploying."
  exit 1
fi
