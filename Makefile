.PHONY: help install dev start test clean docker-build docker-up docker-down k8s-deploy k8s-delete backup restore check

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	cd backend && npm ci

dev: ## Start development servers (API + Worker)
	npm run dev

start: ## Start API server only
	cd backend && npm run start

worker: ## Start worker only
	cd backend && npm run worker

test: ## Run integration tests
	cd backend && ./scripts/integration-test.sh

typecheck: ## Run TypeScript type checking
	cd backend && npm run typecheck

check: ## Run pre-deployment checks
	./backend/scripts/pre-deploy-check.sh

clean: ## Clean node_modules and build artifacts
	rm -rf backend/node_modules
	rm -rf backend/apps/*/node_modules
	rm -rf backend/packages/*/node_modules
	rm -rf backend/storage/runtime/*.json

docker-build: ## Build Docker images
	cd backend && docker compose build

docker-up: ## Start Docker containers
	cd backend && docker compose up -d

docker-down: ## Stop Docker containers
	cd backend && docker compose down

docker-logs: ## Show Docker logs
	cd backend && docker compose logs -f

docker-monitoring: ## Start with monitoring stack
	cd backend && docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

k8s-deploy: ## Deploy to Kubernetes
	kubectl apply -f k8s/

k8s-delete: ## Delete Kubernetes resources
	kubectl delete -f k8s/

k8s-status: ## Check Kubernetes deployment status
	kubectl get pods,services,pvc

helm-install: ## Install with Helm
	helm install aegis-mcx ./helm/aegis-mcx

helm-upgrade: ## Upgrade Helm release
	helm upgrade aegis-mcx ./helm/aegis-mcx

helm-uninstall: ## Uninstall Helm release
	helm uninstall aegis-mcx

backup: ## Create backup of runtime data
	cd backend && ./scripts/backup.sh

restore: ## Restore from backup (usage: make restore BACKUP=path/to/backup.tar.gz)
	cd backend && ./scripts/restore-backup.sh $(BACKUP)

terraform-init: ## Initialize Terraform
	cd terraform && terraform init

terraform-plan: ## Plan Terraform changes
	cd terraform && terraform plan

terraform-apply: ## Apply Terraform changes
	cd terraform && terraform apply

terraform-destroy: ## Destroy Terraform resources
	cd terraform && terraform destroy
