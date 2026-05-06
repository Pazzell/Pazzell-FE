#!/bin/bash

# Tex Recruiter Deployment Script
# Usage: ./scripts/deploy.sh [platform]
# Platforms: vercel, docker, railway

set -e

PLATFORM=${1:-vercel}
PROJECT_NAME="tex-recruiter"

echo "🚀 Deploying $PROJECT_NAME to $PLATFORM..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Please copy .env.example to .env.local and configure it."
    exit 1
fi

# Run build test
echo "🔧 Testing build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

case $PLATFORM in
    "vercel")
        echo "📦 Deploying to Vercel..."
        
        # Check if vercel is installed
        if ! command -v vercel &> /dev/null; then
            echo "Installing Vercel CLI..."
            npm install -g vercel
        fi
        
        # Deploy to Vercel
        vercel --prod
        ;;
        
    "docker")
        echo "🐳 Building Docker image..."
        
        # Build Docker image
        docker build -t $PROJECT_NAME .
        
        echo "✅ Docker image built successfully!"
        echo "🏃 To run locally: docker run -p 3000:3000 --env-file .env.local $PROJECT_NAME"
        ;;
        
    "railway")
        echo "🚂 Deploying to Railway..."
        
        # Check if railway is installed
        if ! command -v railway &> /dev/null; then
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        
        # Deploy to Railway
        railway up
        ;;
        
    *)
        echo "❌ Unknown platform: $PLATFORM"
        echo "Available platforms: vercel, docker, railway"
        exit 1
        ;;
esac

echo "🎉 Deployment process completed!"