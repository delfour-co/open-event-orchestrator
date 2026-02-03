#!/bin/bash
#
# Initialize PocketBase with superuser and seed data
#
# Usage: ./scripts/init.sh
#
# This script:
# 1. Waits for PocketBase to be ready
# 2. Creates the superuser account
# 3. Runs the seed script to populate data
#

set -e

POCKETBASE_URL="${PUBLIC_POCKETBASE_URL:-http://localhost:8090}"
PB_ADMIN_EMAIL="${PB_ADMIN_EMAIL:-admin@pocketbase.local}"
PB_ADMIN_PASSWORD="${PB_ADMIN_PASSWORD:-adminpassword123}"
CONTAINER_NAME="${POCKETBASE_CONTAINER:-oeo-pocketbase}"
MAX_WAIT_SECONDS=30

echo "🚀 Initializing Open Event Orchestrator..."
echo ""

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

# Run seed script
echo "🌱 Running seed script..."
pnpm seed

echo ""
echo "🎉 Initialization complete!"
echo ""
echo "📋 Quick reference:"
echo "   PocketBase Admin: ${POCKETBASE_URL}/_/"
echo "   Superuser: $PB_ADMIN_EMAIL / $PB_ADMIN_PASSWORD"
echo ""
echo "   Test accounts:"
echo "   - admin@example.com / admin123 (organizer)"
echo "   - speaker@example.com / speaker123 (speaker)"
echo "   - reviewer@example.com / reviewer123 (reviewer)"
