# Multi-stage Dockerfile for Next.js @concord/web
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/schema/package.json ./packages/schema/
COPY packages/core/package.json ./packages/core/
COPY apps/web/package.json ./apps/web/

RUN npm ci

COPY packages/schema ./packages/schema
COPY packages/core ./packages/core
COPY apps/web ./apps/web
COPY tsconfig.json ./

# Build dependencies & Next.js web application
RUN npm run build --workspace=packages/schema
RUN npm run build --workspace=packages/core
RUN npm run build --workspace=apps/web

# Production Runner Image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/schema/dist ./packages/schema/dist
COPY --from=builder /app/packages/schema/package.json ./packages/schema/package.json
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=apps/web"]
