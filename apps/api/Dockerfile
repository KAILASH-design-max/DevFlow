# ===================================================
# Stage 1: Base image with pnpm & dependencies
# ===================================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl wget
RUN npm install -g pnpm@9.15.9
WORKDIR /app

# ===================================================
# Stage 2: Dependencies & Builder
# ===================================================
FROM base AS builder
WORKDIR /app

# Copy monorepo configuration files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/tsconfig ./packages/tsconfig
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Install dependencies across packages
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
WORKDIR /app/packages/database
RUN npx prisma generate

# Build shared packages and API
WORKDIR /app
RUN pnpm --filter @devflow/shared run build || true
RUN pnpm --filter @devflow/api run build

# ===================================================
# Stage 3: Production Runner
# ===================================================
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl wget
RUN npm install -g pnpm@9.15.9

ENV NODE_ENV=production
ENV PORT=4000
ENV UPLOAD_DIR=uploads

# Create non-root system group and user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 devflow

# Copy built workspace and node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh

# Setup uploads directory with write permissions
RUN mkdir -p /app/apps/api/uploads && \
    chmod +x /app/apps/api/docker-entrypoint.sh && \
    chown -R devflow:nodejs /app

USER devflow

WORKDIR /app/apps/api

EXPOSE 4000

# Health check against API health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
