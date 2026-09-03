# ====================================================================
# LedgerSync Production Multi-Stage Dockerfile
# Optimized for minimal container footprint, security, & layer caching
# ====================================================================

# Stage 1: Build Phase
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./
RUN npm ci

# Copy source code and build production assets
COPY . .
RUN npm run build

# Stage 2: Runtime Production Image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Create and switch to non-root system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy production runtime dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled bundles from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public 2>/dev/null || true

# Assign ownership to appuser
USER appuser

# Expose mandatory container ingress port
EXPOSE 3000

# Healthcheck command for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/healthz || exit 1

# Production entrypoint
CMD ["node", "dist/server.cjs"]
