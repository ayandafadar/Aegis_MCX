FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/correlation/package.json packages/correlation/package.json

RUN npm ci

COPY tsconfig.base.json tsconfig.base.json
COPY tsconfig.json tsconfig.json
COPY apps apps
COPY packages packages

EXPOSE 3000

CMD ["npm", "--prefix", "apps/api", "run", "start"]