# ==============================================================================
# ShortReel Backend — Production Multi-Stage Dockerfile
# Stage 1: Build & Compile TypeScript to CommonJS dist
# Stage 2: Hardened Alpine Runtime with unprivileged user (node:1000)
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY drizzle.config.ts ./
COPY src/ ./src/
COPY scripts/ ./scripts/

RUN npm run build

# ------------------------------------------------------------------------------
# Production Runtime Stage
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Security: Install curl for Docker health check
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/migrations ./dist/src/database/migrations
COPY --from=builder /app/drizzle.config.js ./drizzle.config.js 2>/dev/null || true
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Ensure execution permissions for entrypoint and set ownership to node
RUN chmod +x ./docker-entrypoint.sh && chown -R node:node /app

# Run as non-root user for container security
USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health/live || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
