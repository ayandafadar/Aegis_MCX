# Aegis-MCX

[![CI](https://github.com/herr-rishab/Aegis_MCX/workflows/ci/badge.svg)](https://github.com/herr-rishab/Aegis_MCX/actions)
[![Security Scan](https://github.com/herr-rishab/Aegis_MCX/workflows/security-scan/badge.svg)](https://github.com/herr-rishab/Aegis_MCX/actions)
[![Docker Publish](https://github.com/herr-rishab/Aegis_MCX/workflows/docker-publish/badge.svg)](https://github.com/herr-rishab/Aegis_MCX/actions)

Aegis-MCX is a comprehensive DevOps demonstration project showcasing modern cloud-native practices, combining a **Flutter Web MCX dashboard** with a **Node.js API**, **worker-based alert correlation engine**, and **complete CI/CD pipeline**.

## 🚀 Features

- **Multi-service Architecture**: API server, background worker, and Flutter frontend
- **Container Orchestration**: Docker Compose and Kubernetes support
- **Infrastructure as Code**: Terraform for AWS and Helm charts for K8s
- **CI/CD Pipeline**: Automated testing, security scanning, and Docker publishing
- **Monitoring Stack**: Prometheus integration for metrics collection
- **Accessibility Testing**: Lighthouse CI integration
- **Production Ready**: Health checks, retry logic, and graceful degradation

## 📋 Quick Start

### Local Development
```bash
npm --prefix backend ci
npm run dev
```

### Docker
```bash
cd backend
docker compose up --build
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

### Helm
```bash
helm install aegis-mcx ./helm/aegis-mcx
```

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Comprehensive deployment instructions
- [Architecture Overview](#architecture) - System design and components
- [API Documentation](#useful-endpoints) - Available endpoints

## 🏗️ Infrastructure

- **Docker**: Multi-stage builds with health checks
- **Kubernetes**: Deployments with autoscaling and persistent storage
- **Terraform**: AWS ECS infrastructure provisioning
- **Helm**: Parameterized K8s deployments

## 🔒 Security

- Automated dependency scanning with npm audit
- Container vulnerability scanning with Trivy
- Weekly security scans via GitHub Actions
- Environment variable management with .env files

## 📊 Monitoring

- Prometheus metrics collection
- CloudWatch logging (AWS)
- Worker health tracking with heartbeat mechanism
- Consecutive failure detection and alerting

## 🧪 Testing

- Integration tests for all API endpoints
- Lighthouse accessibility audits
- TypeScript type checking
- Automated CI pipeline validation

---

For detailed setup instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).
