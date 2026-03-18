# Aegis-MCX Deployment Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (for local development)
- Kubernetes 1.24+ (for K8s deployment)
- kubectl configured (for K8s deployment)

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

### 3. Docker with Monitoring

```bash
cd backend
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up --build
```

### 4. Kubernetes

```bash
kubectl apply -f k8s/
kubectl rollout status deployment/aegis-api
kubectl rollout status deployment/aegis-worker
```

## Health Checks

Verify deployment:

```bash
# Local/Docker
curl http://localhost:3000/health

# Kubernetes
kubectl port-forward service/aegis-api 3000:3000
curl http://localhost:3000/health
```

## Integration Tests

Run comprehensive endpoint tests:

```bash
cd backend
./scripts/integration-test.sh
```

## Monitoring

Access Prometheus metrics:
- Local: `http://localhost:9090`
- K8s: `kubectl port-forward service/prometheus 9090:9090`

## Troubleshooting

### API not starting
- Check logs: `docker compose logs api`
- Verify port 3000 is available
- Check storage permissions

### Worker connection issues
- Verify API is healthy
- Check `API_BASE_URL` configuration
- Review worker logs for retry attempts

### Kubernetes pod failures
- Check pod logs: `kubectl logs <pod-name>`
- Verify PVC is bound: `kubectl get pvc`
- Check resource limits
