#!/bin/sh
# Script para resolver migrações falhadas no Railway

echo "🔧 Fixing failed migrations in Railway..."

# Step 1: Mark failed migration as rolled back
echo "📝 Marking failed migration as rolled back..."
npx prisma migrate resolve --rolled-back "20251125200000_populate_legacy_user_data"

if [ $? -ne 0 ]; then
  echo "❌ Failed to resolve migration"
  exit 1
fi

echo "✅ Migration resolved successfully"

# Step 2: Run migrations again
echo "📦 Running migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "❌ Migrations failed"
  exit 1
fi

echo "✅ All migrations completed successfully"
