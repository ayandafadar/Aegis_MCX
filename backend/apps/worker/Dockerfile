FROM node:20-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/apps/api/package.json apps/api/package.json
COPY backend/apps/worker/package.json apps/worker/package.json
COPY backend/packages/correlation/package.json packages/correlation/package.json

RUN npm ci --only=production

COPY backend/tsconfig.base.json tsconfig.base.json
COPY backend/tsconfig.json tsconfig.json
COPY backend/apps apps
COPY backend/packages packages

FROM node:20-alpine

WORKDIR /app/backend

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/apps ./apps
COPY --from=builder /app/backend/packages ./packages
COPY --from=builder /app/backend/tsconfig*.json ./

COPY backend/storage storage

CMD ["npm", "--prefix", "apps/worker", "run", "start"]
