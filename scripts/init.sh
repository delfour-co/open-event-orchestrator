#!/bin/bash
#
# Initialize PocketBase with superuser
#
# Usage: ./scripts/init.sh [--seed]
#
# This script:
# 1. Waits for PocketBase to be ready
# 2. Creates the superuser account
# 3. Optionally runs the seed script (with --seed flag)
#

set -e

POCKETBASE_URL="${PUBLIC_POCKETBASE_URL:-http://localhost:8090}"
PB_ADMIN_EMAIL="${PB_ADMIN_EMAIL:-admin@pocketbase.local}"
PB_ADMIN_PASSWORD="${PB_ADMIN_PASSWORD:-adminpassword123}"
CONTAINER_NAME="${POCKETBASE_CONTAINER:-oeo-pocketbase}"
MAX_WAIT_SECONDS=30
RUN_SEED=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --seed)
      RUN_SEED=true
      shift
      ;;
  esac
done

echo "🚀 Initializing Open Event Orchestrator..."
echo ""

# Clean up stale setup token from previous runs
rm -f "$(dirname "$0")/../.setup-token.json"

# Function to check if PocketBase is ready
check_pocketbase() {
  curl -s "${POCKETBASE_URL}/api/health" > /dev/null 2>&1
}

# Wait for PocketBase to be ready
echo "⏳ Waiting for PocketBase to be ready..."
waited=0
while ! check_pocketbase; do
  if [ $waited -ge $MAX_WAIT_SECONDS ]; then
    echo "❌ Timeout waiting for PocketBase at ${POCKETBASE_URL}"
    echo "   Make sure PocketBase is running: docker compose up -d"
    exit 1
  fi
  sleep 1
  waited=$((waited + 1))
  echo -n "."
done
echo ""
echo "✅ PocketBase is ready!"
echo ""

# Create superuser
echo "👤 Creating PocketBase superuser..."
if docker exec "$CONTAINER_NAME" /usr/local/bin/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir /pb_data 2>/dev/null; then
  echo "✅ Superuser created: $PB_ADMIN_EMAIL"
else
  echo "⚠️  Could not create superuser via docker exec."
  echo "   You may need to create it manually at: ${POCKETBASE_URL}/_/"
fi
echo ""

# Optionally run seed script
if [ "$RUN_SEED" = true ]; then
  echo "🌱 Running seed script..."
  pnpm seed
  echo ""
  echo "📋 Test accounts created:"
  echo "   - admin@example.com / admin123 (organizer)"
  echo "   - speaker@example.com / speaker123 (speaker)"
  echo "   - reviewer@example.com / reviewer123 (reviewer)"
  echo ""
fi

echo "🎉 Initialization complete!"
echo ""
echo "📋 Quick reference:"
echo "   PocketBase Admin: ${POCKETBASE_URL}/_/"
echo "   Superuser: $PB_ADMIN_EMAIL / $PB_ADMIN_PASSWORD"
echo ""
if [ "$RUN_SEED" = false ]; then
  echo "💡 To populate test data, run: pnpm db:init --seed"
  echo "   Or manually: pnpm seed"
fi
