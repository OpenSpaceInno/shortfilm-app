# ==============================================================================
# ShortReel Frontend — Production Multi-Stage Dockerfile
# Stage 1: Build & Bundle Vite / TanStack Router SPA
# Stage 2: Serve static bundle via high-performance Nginx Alpine
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# Build Vite SPA and run postbuild script
RUN npm run build

# ------------------------------------------------------------------------------
# Production Nginx Server Stage
# ------------------------------------------------------------------------------
FROM nginx:alpine AS runner

# Remove default nginx assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled production bundle from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
