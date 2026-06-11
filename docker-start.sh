#!/bin/bash

set -e

echo "🐳 Starting Gas Mobil with Docker Compose..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker."
    exit 1
fi

echo "✅ Docker version: $(docker --version)"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker Compose version: $(docker-compose --version)"

# Start services
echo "\n🚀 Starting services..."
docker-compose up -d

echo "✅ Services started!"
echo "\n📊 Check service status:"
echo "   MongoDB: mongodb://localhost:27017"
echo "   API: http://localhost:5000"
echo "   Redis: localhost:6379"
echo "\n📋 View logs:"
echo "   docker-compose logs -f"
echo "\n🛑 Stop services:"
echo "   docker-compose down"
