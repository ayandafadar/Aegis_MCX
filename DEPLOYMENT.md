# Aegis-MCX Deployment Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (for local development)

## Environment Configuration

### API Service

Copy `.env.example` and configure:

```bash
cd backend/apps/api
cp .env.example .env
```

Key variables:
- `PORT`: API server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `CORS_ORIGIN`: CORS allowed origins

### Worker Service

```bash
cd backend/apps/worker
cp .env.example .env
```

Key variables:
- `API_BASE_URL`: API endpoint URL
- `POLL_INTERVAL_MS`: Polling frequency (default: 15000)
- `MAX_RETRIES`: Retry attempts for failed requests (default: 3)
- `RETRY_DELAY_MS`: Delay between retries (default: 5000)

## Deployment Options

### 1. Local Development

```bash
npm --prefix backend ci
npm run dev
```

### 2. Docker Compose

```bash
cd backend
docker compose up --build
```





## Health Checks

Verify deployment:

```bash
curl http://localhost:3000/health
```

## Integration Tests

Run comprehensive endpoint tests:

```bash
cd backend
./scripts/integration-test.sh
```



## Troubleshooting

### API not starting
- Check logs: `docker compose logs api`
- Verify port 3000 is available
- Check storage permissions

### Worker connection issues
- Verify API is healthy
- Check `API_BASE_URL` configuration
- Review worker logs for retry attempts

