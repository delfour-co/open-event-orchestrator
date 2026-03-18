#!/bin/sh
# =============================================================================
# Open Event Orchestrator - Docker Entrypoint
# =============================================================================
# In demo mode (DEMO_MODE=true), waits for PocketBase to be ready and creates
# a superuser account before starting the application.
# =============================================================================

set -e

# ---------------------------------------------------------------------------
# Demo mode: auto-create PocketBase superuser
# ---------------------------------------------------------------------------
if [ "$DEMO_MODE" = "true" ]; then
  PB_URL="${PUBLIC_POCKETBASE_URL:-http://localhost:8090}"
  ADMIN_EMAIL="${PB_ADMIN_EMAIL:-admin@demo.local}"
  ADMIN_PASSWORD="${PB_ADMIN_PASSWORD:-admin123456}"

  echo "[demo] Demo mode enabled. Waiting for PocketBase at $PB_URL ..."

  # Wait for PocketBase to be ready (max 60 seconds)
  ATTEMPTS=0
  MAX_ATTEMPTS=30
  until wget -q --spider "$PB_URL/api/health" 2>/dev/null; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
      echo "[demo] ERROR: PocketBase not ready after ${MAX_ATTEMPTS} attempts. Starting without superuser."
      break
    fi
    echo "[demo] PocketBase not ready yet (attempt $ATTEMPTS/$MAX_ATTEMPTS)..."
    sleep 2
  done

  if [ "$ATTEMPTS" -lt "$MAX_ATTEMPTS" ]; then
    echo "[demo] PocketBase is ready. Creating superuser..."

    # Create superuser via PocketBase API
    RESPONSE=$(wget -q -O - --post-data "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
      --header="Content-Type: application/json" \
      "$PB_URL/api/admins" 2>&1) || true

    if echo "$RESPONSE" | grep -q '"id"'; then
      echo "[demo] Superuser created successfully ($ADMIN_EMAIL)."
    elif echo "$RESPONSE" | grep -q 'already exists'; then
      echo "[demo] Superuser already exists ($ADMIN_EMAIL). Skipping."
    else
      echo "[demo] Superuser creation response: $RESPONSE"
      echo "[demo] Superuser may already exist or API may have changed. Continuing..."
    fi
  fi
fi

# ---------------------------------------------------------------------------
# Start the application
# ---------------------------------------------------------------------------
exec node build
