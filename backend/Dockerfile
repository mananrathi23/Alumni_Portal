# ── Stage 1: Build deps ────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copy manifests first for layer caching
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --omit=dev

# ── Stage 2: Production image ──────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Install curl for Docker HEALTHCHECK
RUN apk add --no-cache curl

# Run as a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy production deps from the build stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY --chown=appuser:appgroup . .

# Expose the API port
EXPOSE 4000

# ── Health check ───────────────────────────────────────────────────────────────
# Docker will probe this every 30s; 3 consecutive failures mark the container unhealthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -sf http://localhost:4000/api/v1/health || exit 1

# Start the server
CMD ["node", "server.js"]
