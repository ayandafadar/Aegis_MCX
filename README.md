# Aegis-MCX

Aegis-MCX is a DevOps demonstration project that combines a prebuilt **Flutter Web MCX dashboard** with a **Node.js API**, a **worker-based alert correlation engine**, and **Lighthouse accessibility checks in CI**.

The goal is to show how accessibility regressions and production monitoring alerts can be correlated into a single, user-impact-focused signal instead of generating disconnected alert noise.

## What’s Included

### MCX web experience
- Prebuilt Flutter Web frontend served by the API from [`frontend/`](./frontend)
- Daily margin data for ALUMINI, COPPER, CRUDEOIL, GOLD, SILVER, LEAD, NATURALGAS, NICKEL, and ZINC
- Market watch data with FUTCOM-style expiry spreads

### Accessibility and monitoring pipeline
- Seeded Lighthouse-style accessibility reports stored as JSON
- Seeded Prometheus-style monitoring alerts stored as JSON
- Shared TypeScript correlation engine that scores impact and emits prioritized alerts
- Worker process that periodically fetches reports and alerts, recomputes correlation, and sends a heartbeat back to the API

### Delivery and verification
- Docker setup for the API and worker
- GitHub Actions workflow that type-checks the backend and runs a Lighthouse accessibility audit against the served app

## Architecture

```text
frontend/                Prebuilt Flutter Web bundle
backend/apps/api         API + static frontend hosting + JSON storage
backend/apps/worker      Polling worker that recomputes correlation
backend/packages/correlation
                         Shared domain models, margin logic, and prioritization rules
backend/storage/seed     Versioned demo JSON inputs
backend/storage/runtime  Runtime JSON state written by the API
```

## Core Flow

1. Accessibility reports are stored as JSON.
2. Monitoring alerts are stored as JSON.
3. The API exposes dashboard, market, accessibility, monitoring, and correlation endpoints.
4. The worker polls the API, correlates active alerts against open accessibility issues, and posts back a fresh prioritized snapshot.
5. `/api/correlation/latest` returns the single highest-priority alert plus the full prioritized list.

## Margin Logic

```text
Total = Initial + ELM + Tender + Delivery
      + Add L/S + Spec L/S + Daily Vol + Annual Vol

Difference = Total - Previous Day Total
```

This logic is implemented in the shared correlation package and applied by the API when returning daily margin snapshots.

## Local Run

### Prerequisites
- Node.js 20+
- npm

### Start the API

```bash
cd backend
npm ci
npm run start
```

Open [http://localhost:3000](http://localhost:3000) for the frontend and [http://localhost:3000/api/dashboard](http://localhost:3000/api/dashboard) for the full JSON dashboard.

### Visual demo pages for presentation

For a polished walkthrough (instead of raw JSON), open:

- `http://localhost:3000/demo`
- `http://localhost:3000/demo/dashboard`
- `http://localhost:3000/demo/health`
- `http://localhost:3000/demo/correlation`
- `http://localhost:3000/demo/monitoring`
- `http://localhost:3000/demo/accessibility`
- `http://localhost:3000/demo/devops`

These pages render the same API data as visual cards, structured summaries, and raw payload blocks to simplify stakeholder demos.

### One-command developer mode (recommended)

From the repository root:

```bash
npm --prefix backend ci
npm run dev
```

This starts both services together:
- API (Express + static frontend hosting)
- Worker (polling correlation engine)

The root `npm run dev` delegates to `backend` and runs both processes with hot reload.

### Start the worker

In a second terminal:

```bash
cd backend
npm run worker
```

The worker polls every 15 seconds by default and updates `/health` with its latest heartbeat.

### Development mode

If you want hot reload instead of the plain runtime command:

```bash
cd backend/apps/api && npm run dev
cd backend/apps/worker && npm run dev
```

## Docker

From [`backend/`](./backend):

```bash
docker compose up --build
```

Services:
- API: `http://localhost:3000`
- Worker: internal poller targeting `http://api:3000`

Runtime data is persisted under `backend/storage/runtime`.

## Useful Endpoints

- `GET /health`
- `GET /api/dashboard`
- `GET /api/market/daily-margins`
- `GET /api/market/watch`
- `GET /api/accessibility/reports`
- `GET /api/accessibility/issues`
- `POST /api/accessibility/reports`
- `GET /api/monitoring/alerts`
- `POST /api/monitoring/alerts`
- `GET /api/correlation/latest`
- `GET /api/correlation/snapshots`
- `POST /api/correlation/recompute`
- `POST /api/demo/reseed`

## Seed Data and Runtime State

- Seed data lives in `backend/storage/seed`.
- Runtime JSON files are written into `backend/storage/runtime`.
- `POST /api/demo/reseed` resets runtime files from the seed set and rebuilds the bootstrap correlation snapshot.

## CI / Accessibility

GitHub Actions runs:
- backend dependency install
- TypeScript type-checks across all workspaces
- API startup
- visual demo page render checks
- Correlation recompute
- Lighthouse accessibility audit against the served frontend

The Lighthouse configuration lives in [`.github/lighthouserc.json`](./.github/lighthouserc.json).

## Current Demo Outcome

With the seeded data, the platform demonstrates:
- active MCX market data endpoints
- open accessibility findings on daily margin and market watch journeys
- active production-style alerts
- a prioritized correlated alert with reduced alert noise
