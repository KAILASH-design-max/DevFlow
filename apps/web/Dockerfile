# ===================================================
# Stage 1: Base image with pnpm
# ===================================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat wget
RUN npm install -g pnpm@9.15.0
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
COPY apps/web ./apps/web

# Install dependencies across packages
RUN pnpm install --frozen-lockfile

# Generate Prisma Client for types
WORKDIR /app/packages/database
RUN npx prisma generate

# Build Next.js with standalone output
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV OUTPUT_STANDALONE=true
RUN pnpm --filter @devflow/web run build

# ===================================================
# Stage 3: Production Standalone Runner
# ===================================================
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root system group and user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets if directory exists
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy standalone output and static files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "apps/web/server.js"]
