# Open Event Orchestrator - Development Commands
# Usage: just <command>
# Run `just` or `just --list` to see all available commands.

# Default: show available commands
default:
    @just --list --unsorted

# =============================================================================
# 🚀 Getting Started
# =============================================================================

# First-time setup: install deps, start services, seed database, launch dev server
setup: install up wait-for-pb seed dev

# Start everything (services + dev server)
start: up dev

# Stop everything
stop:
    docker compose down

# =============================================================================
# 🐳 Docker Services
# =============================================================================

# Start PocketBase + Mailpit
up:
    docker compose up -d

# Start with Stripe CLI (for payment webhooks)
up-stripe:
    docker compose --profile stripe up -d

# Stop all services
down:
    docker compose down

# Restart PocketBase (applies migrations)
restart-pb:
    docker restart oeo-pocketbase

# View PocketBase logs
logs-pb:
    docker logs oeo-pocketbase --tail 50 -f

# View Mailpit logs
logs-mail:
    docker logs oeo-mailpit --tail 50 -f

# Show PocketBase superuser install link
pb-install-link:
    @docker logs oeo-pocketbase 2>&1 | grep "pbinstal" | tail -1 | sed 's/0.0.0.0/localhost/'

# Create a PocketBase superuser (required for OAuth2 config)
pb-superuser email password:
    docker exec oeo-pocketbase /usr/local/bin/pocketbase superuser create {{email}} {{password}}

# =============================================================================
# 💻 Development
# =============================================================================

# Install dependencies
install:
    pnpm install

# Start dev server
dev:
    pnpm dev

# Build for production
build:
    pnpm build

# Preview production build
preview:
    pnpm preview

# =============================================================================
# 🧪 Testing
# =============================================================================

# Run all unit tests
test:
    pnpm test

# Run tests in watch mode
test-watch:
    pnpm test:watch

# Run tests with coverage
test-coverage:
    pnpm test:coverage

# Run E2E tests
test-e2e:
    pnpm test:e2e

# Run E2E tests with UI
test-e2e-ui:
    pnpm test:e2e:ui

# =============================================================================
# 🔍 Code Quality
# =============================================================================

# Run linter
lint:
    pnpm lint

# Run linter with auto-fix
lint-fix:
    pnpm lint:fix

# Format code
format:
    pnpm format

# Type check
check:
    pnpm check

# Run all quality checks (lint + test + check)
qa: lint test check

# =============================================================================
# 🗄️ Database
# =============================================================================

# Seed the database with sample data
seed:
    pnpm seed

# Reset test data and re-seed
reset-data:
    pnpm reset-test-data

# Reset PocketBase completely (⚠️ deletes all data)
reset-pb:
    docker compose down
    docker run --rm -v {{justfile_directory()}}/pb_data:/pb_data alpine sh -c "rm -rf /pb_data/*.db /pb_data/*.db-shm /pb_data/*.db-wal /pb_data/storage"
    docker compose up -d
    @echo "PocketBase reset. Run 'just seed' to re-seed data."
    @echo "Open the install link below to create a superuser:"
    @sleep 3
    @just pb-install-link

# Wait for PocketBase to be ready
wait-for-pb:
    @echo "Waiting for PocketBase..."
    @until curl -s http://localhost:8090/api/health > /dev/null 2>&1; do sleep 1; done
    @echo "PocketBase is ready!"

# =============================================================================
# 📧 Email
# =============================================================================

# Open Mailpit web UI
mailpit:
    @echo "Opening Mailpit at http://localhost:8025"
    @xdg-open http://localhost:8025 2>/dev/null || open http://localhost:8025 2>/dev/null || echo "Open http://localhost:8025 in your browser"

# Send a test email via Mailpit
test-email to="test@example.com":
    @node -e "require('nodemailer').createTransport({host:'localhost',port:1025}).sendMail({from:'test@oeo.local',to:'{{to}}',subject:'Test from OEO',text:'It works!'}).then(()=>console.log('✅ Email sent to {{to}}')).catch(e=>console.error('❌',e.message))"

# =============================================================================
# 🔧 Utilities
# =============================================================================

# Open PocketBase admin dashboard
pb-admin:
    @echo "Opening PocketBase admin at http://localhost:8090/_/"
    @xdg-open http://localhost:8090/_/ 2>/dev/null || open http://localhost:8090/_/ 2>/dev/null || echo "Open http://localhost:8090/_/ in your browser"

# Open the app
open:
    @echo "Opening app at http://localhost:5173"
    @xdg-open http://localhost:5173 2>/dev/null || open http://localhost:5173 2>/dev/null || echo "Open http://localhost:5173 in your browser"

# Show service status
status:
    @echo "=== Docker Services ==="
    @docker ps --filter "name=oeo-" --format "table {{{{.Names}}\t{{{{.Status}}\t{{{{.Ports}}" 2>/dev/null || echo "Docker not running"
    @echo ""
    @echo "=== Endpoints ==="
    @echo "App:        http://localhost:5173"
    @echo "PocketBase: http://localhost:8090"
    @echo "PB Admin:   http://localhost:8090/_/"
    @echo "Mailpit:    http://localhost:8025"

# Copy .env.example to .env if it doesn't exist
init-env:
    @if [ ! -f .env ]; then cp .env.example .env && echo "✅ .env created from .env.example"; else echo "ℹ️  .env already exists"; fi

# Clean build artifacts
clean:
    rm -rf .svelte-kit build node_modules/.vite
    @echo "✅ Build artifacts cleaned"
