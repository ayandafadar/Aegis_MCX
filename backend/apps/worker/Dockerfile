FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/apps/api/package.json apps/api/package.json
COPY backend/apps/worker/package.json apps/worker/package.json
COPY backend/packages/correlation/package.json packages/correlation/package.json

RUN npm ci

COPY backend/tsconfig.base.json tsconfig.base.json
COPY backend/tsconfig.json tsconfig.json
COPY backend/apps apps
COPY backend/packages packages
COPY backend/storage storage

CMD ["npm", "--prefix", "apps/worker", "run", "start"]
