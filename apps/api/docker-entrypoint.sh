#!/bin/sh
set -e

echo "🚀 [DevFlow API] Starting container entrypoint..."

# If DATABASE_URL is set, run database migrations / push
if [ -n "$DATABASE_URL" ]; then
  echo "📦 [DevFlow API] Applying database migrations / push..."
  cd /app/packages/database
  npx prisma db push --skip-generate || echo "⚠️ [DevFlow API] Prisma db push warning, continuing..."
  
  # Check if seed should run (optional DEMO_SEED=true)
  if [ "$DEMO_SEED" = "true" ]; then
    echo "🌱 [DevFlow API] Seeding database demo data..."
    npx tsx prisma/seed.ts || echo "⚠️ [DevFlow API] Seed warning, continuing..."
  fi
  cd /app/apps/api
fi

echo "✨ [DevFlow API] Starting Express API Server on port ${PORT:-4000}..."
exec "$@"
