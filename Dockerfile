# ==============================================================================
# ShortReel Frontend — Production Multi-Stage Dockerfile
# Stage 1: Build & Bundle TanStack Start / Nitro SSR Server
# Stage 2: Run production Node.js SSR Server
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# Build arguments for Vite compilation
ARG VITE_API_URL=""
ARG VITE_APP_TITLE="ShortReel"
ARG VITE_AUTH0_DOMAIN=""
ARG VITE_AUTH0_CLIENT_ID=""
ARG VITE_AUTH0_AUDIENCE=""

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE
ENV NITRO_PRESET=node-server

# Build TanStack Start SSR output (.output)
RUN npm run build

# ------------------------------------------------------------------------------
# Production Node.js Server Stage
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV HOST=0.0.0.0
ENV PORT=80

# Copy the standalone Nitro server output
COPY --from=builder /app/.output ./.output

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["node", ".output/server/index.mjs"]
