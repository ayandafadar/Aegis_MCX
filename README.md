# Aegis-MCX

[![CI](https://github.com/herr-rishab/Aegis_MCX/workflows/ci/badge.svg)](https://github.com/herr-rishab/Aegis_MCX/actions)
[![Security Scan](https://github.com/herr-rishab/Aegis_MCX/workflows/security-scan/badge.svg)](https://github.com/herr-rishab/Aegis_MCX/actions)
[![Docker Publish](https://github.com/herr-rishab/Aegis_MCX/workflows/docker-publish/badge.svg)](https://github.com/herr-rishab/Aegis_MCX/actions)

Aegis-MCX is a full-stack monitoring and analytics platform for MCX-style commodity workflows. It combines a TypeScript API, a background correlation worker, a shared correlation engine package, and a React dashboard, with Docker-based deployment and GitHub Actions automation.

## Overview

The platform is built to demonstrate production-oriented engineering practices:

- Service decomposition (API + worker + shared package)
- Typed domain models and deterministic correlation logic
- Runtime JSON persistence with seed bootstrap
- Health checks, metrics, and worker heartbeat reporting
- Containerized deployment and CI/CD pipelines

## Core Capabilities

- Market data endpoints for daily margins and market watch snapshots
- Accessibility report ingestion and issue normalization
- Monitoring alert ingestion with severity/status validation
- Correlation engine that ranks alerts using accessibility impact
- Snapshot persistence and historical retrieval
- Built-in API-served dashboard endpoint for quick operational visibility
- React dashboard application for correlation and analytics visualization

## Repository Layout

```text
.
|- backend/
|  |- apps/
|  |  |- api/                 # Express API service
|  |  |- worker/              # Polling worker and snapshot generator
|  |- packages/
|  |  |- correlation/         # Shared domain types and correlation engine
|  |- storage/
|  |  |- seed/                # Seed JSON datasets
|  |  |- runtime/             # Runtime JSON state
|  |- docker-compose.yml      # API + worker composition
|  |- scripts/                # Backup, restore, health check, integration test
|- correlation-dashboard/     # React + Vite frontend
|- DEPLOYMENT.md
|- README.md
```

## Technology Stack

- Backend: Node.js, TypeScript, Express, CORS, Prometheus client
- Worker: Node.js, TypeScript, retry-capable polling loop
- Shared package: TypeScript correlation logic and domain contracts
- Frontend: React 18, Vite, Tailwind CSS, Recharts
- Scraping: Puppeteer-based MCX polling
- DevOps: Docker, Docker Compose, GitHub Actions

## Architecture

1. API serves market/accessibility/monitoring/correlation endpoints and writes runtime JSON state.
2. Worker periodically reads active alerts + accessibility issues, computes correlation, and posts snapshots.
3. Correlation package provides typed models and ranking logic used by API and worker.
4. Frontend consumes API endpoints for dashboard visualization.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Docker 20.10+ and Docker Compose 2+ (optional, for containerized run)

### Local Development

Install dependencies:

```bash
npm ci
npm --prefix backend ci
npm --prefix correlation-dashboard ci
```

Start backend (API + worker) and frontend together:

```bash
npm run dev
```

Default local endpoints:

- API: http://localhost:3000
- Health: http://localhost:3000/health
- Metrics: http://localhost:3000/metrics
- Frontend: http://localhost:5173

### Docker Compose

```bash
cd backend
docker compose up --build
```

This starts:

- `aegis-api` on port 3000
- `aegis-worker` (depends on healthy API)

## Environment Variables

### API Service

- `PORT` (default: `3000`)
- `NODE_ENV` (for example: `development`, `production`)
- `CORS_ORIGIN` (optional CORS origin control)

### Worker Service

- `API_BASE_URL` (default in Compose: `http://api:3000`)
- `POLL_INTERVAL_MS` (default: `15000`)
- `MAX_RETRIES` (default documented in deployment guide)
- `RETRY_DELAY_MS` (default documented in deployment guide)

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment setup.

## API Surface

### System and Observability

- `GET /health`
- `GET /metrics`
- `GET /api/dashboard`

### Market Data

- `GET /api/market/daily-margins`
- `GET /api/market/watch`
- `GET /api/mcx/live`

### Accessibility

- `GET /api/accessibility/reports`
- `GET /api/accessibility/issues`
- `POST /api/accessibility/reports`

### Monitoring

- `GET /api/monitoring/alerts`
- `POST /api/monitoring/alerts`

### Correlation

- `GET /api/correlation/snapshots`
- `GET /api/correlation/latest`
- `POST /api/correlation/recompute`
- `POST /api/correlation/snapshots`

### Worker and Demo Controls

- `POST /api/worker/heartbeat`
- `POST /api/demo/reseed`
- `GET /dashboard`

## Project Scripts

### Root

- `npm run dev` - start backend and frontend concurrently
- `npm run start` - start backend API
- `npm run worker` - start backend worker
- `npm run typecheck` - run backend workspace type checks
- `npm run docker:build` - build backend compose images
- `npm run docker:up` - start backend compose stack
- `npm run docker:down` - stop backend compose stack
- `npm run docker:logs` - stream backend compose logs

### Backend utility scripts

Located in `backend/scripts`:

- `wait-for-health.sh`
- `integration-test.sh`
- `backup.sh`
- `restore-backup.sh`
- `pre-deploy-check.sh`

## CI/CD Workflows

Configured in `.github/workflows`:

- `ci.yml` - type checking, API startup checks, integration tests, Docker build validation
- `security-scan.yml` - dependency and container security scanning
- `docker-publish.yml` - publish API/worker images
- `release.yml` - tag-driven release automation

## Data Storage Model

Runtime data is file-based JSON storage under `backend/storage/runtime`, seeded from `backend/storage/seed`. Main persisted artifacts include:

- daily margins
- market watch entries
- accessibility reports
- monitoring alerts
- correlation snapshots
- worker state

This makes local demos and deterministic integration scenarios straightforward.

## Testing and Quality

- TypeScript strict typing across backend services
- Integration test script for endpoint and flow validation
- Health checks and worker heartbeat state tracking
- Prometheus-compatible metrics for API and correlation operations

## Security Notes

- Dependency and container scanning are automated in GitHub Actions.
- In production, secure ingestion endpoints with authentication and request controls.
- Rotate secrets regularly and keep credentials in repository secrets only.

## Documentation

- Deployment and operations: [DEPLOYMENT.md](DEPLOYMENT.md)
- Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Code of conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## License

MIT License. See [LICENSE](LICENSE).
