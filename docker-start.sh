#!/bin/bash
set -e

echo "🚀 Gas Mobil Docker Setup"
echo "=========================="

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env not found. Creating from .env.example..."
  cp .env.example .env
  echo "📝 Please edit .env and set JWT_SECRET and REFRESH_SECRET before running again."
  echo "   Generate secrets with: node apps/api/scripts/generate-secrets.js"
  exit 1
fi

# Check if secrets are set
if grep -q "your_jwt_secret_key_change_in_production" .env || grep -q "your_refresh_secret_key_change_in_production" .env; then
  echo "⚠️  Please set JWT_SECRET and REFRESH_SECRET in .env first."
  echo "   Generate secrets with: node apps/api/scripts/generate-secrets.js"
  exit 1
fi

echo "📦 Building and starting containers..."
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose up --build -d

echo ""
echo "✅ Containers started!"
echo "   API:       http://localhost:5000"
echo "   MySQL:     localhost:3306"
echo "   Redis:     localhost:6379"
echo ""
echo "📋 View logs: docker-compose logs -f api"
echo "🛑 Stop:      docker-compose down"
