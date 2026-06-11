#!/bin/bash
set -e

echo "🚀 Gas Mobil Setup Script"
echo "========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "\n📦 Installing dependencies..."
npm install

# Setup backend environment
echo "\n⚙️  Setting up backend environment..."
if [ ! -f apps/api/.env ]; then
    cp apps/api/.env.example apps/api/.env
    echo "✅ Created apps/api/.env from .env.example"
    echo "⚠️  Please update apps/api/.env with your credentials"
else
    echo "✅ apps/api/.env already exists"
fi

# Setup mobile environment
echo "\n⚙️  Setting up mobile environment..."
if [ ! -f apps/mobile/.env ]; then
    cp apps/mobile/.env.example apps/mobile/.env
    echo "✅ Created apps/mobile/.env from .env.example"
    echo "⚠️  Please update apps/mobile/.env with your credentials"
else
    echo "✅ apps/mobile/.env already exists"
fi

echo "\n✅ Setup complete!"
echo "\n📖 Next steps:"
echo "   1. Update environment variables in apps/api/.env and apps/mobile/.env"
echo "   2. Run 'npm run dev' to start both servers"
echo "   3. Or run 'npm run dev:api' and 'npm run dev:mobile' separately"
echo "\n🎉 Happy coding!"
