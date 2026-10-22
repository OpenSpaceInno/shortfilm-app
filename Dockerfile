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
