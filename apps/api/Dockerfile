# Multi-stage Dockerfile for @concord/api
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package.json package-lock.json ./
COPY packages/schema/package.json ./packages/schema/
COPY packages/core/package.json ./packages/core/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy source files
COPY packages/schema ./packages/schema
COPY packages/core ./packages/core
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Build packages and API
RUN npm run build --workspace=packages/schema
RUN npm run build --workspace=packages/core
RUN npm run build --workspace=apps/api

# Production Runner Image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/schema/dist ./packages/schema/dist
COPY --from=builder /app/packages/schema/package.json ./packages/schema/package.json
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
