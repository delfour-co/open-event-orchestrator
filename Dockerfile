# =============================================================================
# Open Event Orchestrator - Frontend Docker Image
# =============================================================================
# This image contains only the SvelteKit frontend application.
# You need to provide your own PocketBase instance.
#
# Build:
#   docker build -t oeo-frontend .
#
# Run:
#   docker run -d -p 3000:3000 \
#     -e PUBLIC_POCKETBASE_URL=http://your-pocketbase:8090 \
#     oeo-frontend
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Install dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Build application
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 3: Production image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built application
COPY --from=builder /app/build ./build

# Create non-root user
RUN addgroup -g 1001 app && adduser -D -u 1001 -G app app
RUN chown -R app:app /app
USER app

# =============================================================================
# Environment Variables
# =============================================================================
# Required:
#   PUBLIC_POCKETBASE_URL - URL of your PocketBase instance (e.g., http://pocketbase:8090)
#
# Optional (can be configured via Admin UI instead):
#   STRIPE_SECRET_KEY         - Stripe secret key (sk_test_... or sk_live_...)
#   STRIPE_WEBHOOK_SECRET     - Stripe webhook signing secret (whsec_...)
#   PUBLIC_STRIPE_PUBLISHABLE_KEY - Stripe publishable key (pk_test_... or pk_live_...)
#
# Note: SMTP, Discord, and Slack settings are configured via the Admin UI
# and stored in the PocketBase database.
# =============================================================================

ENV NODE_ENV=production
ENV PORT=3000

# Default PocketBase URL (override at runtime)
ENV PUBLIC_POCKETBASE_URL=http://localhost:8090

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000 || exit 1

# Run the application
CMD ["node", "build"]
