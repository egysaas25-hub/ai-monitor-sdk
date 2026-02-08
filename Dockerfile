# ============================================================
# Multi-stage Dockerfile for @aker/ai-monitor-sdk
# ============================================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace manifests first (for caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ai-monitor-core/package.json packages/ai-monitor-core/
COPY packages/ai-monitor-notifiers/package.json packages/ai-monitor-notifiers/
COPY packages/ai-monitor-instrumentation/package.json packages/ai-monitor-instrumentation/
COPY examples/standalone-service/package.json examples/standalone-service/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY . .

# Build all packages
RUN pnpm run build

# --- Stage 2: Runtime ---
FROM node:20-alpine AS runtime

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy only built packages + production deps
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/ai-monitor-core/package.json /app/packages/ai-monitor-core/dist/ packages/ai-monitor-core/
COPY --from=builder /app/packages/ai-monitor-notifiers/package.json /app/packages/ai-monitor-notifiers/dist/ packages/ai-monitor-notifiers/
COPY --from=builder /app/packages/ai-monitor-instrumentation/package.json /app/packages/ai-monitor-instrumentation/dist/ packages/ai-monitor-instrumentation/
COPY --from=builder /app/examples/standalone-service/ examples/standalone-service/

# Install production deps only
RUN pnpm install --prod --frozen-lockfile

# Create log directory
RUN mkdir -p /app/logs

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD wget --quiet --tries=1 --spider http://localhost:3333/health || exit 1

CMD ["node", "examples/standalone-service/dist/index.js"]
