.PHONY: help install dev start test clean docker-build docker-up docker-down backup restore check

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





backup: ## Create backup of runtime data
	cd backend && ./scripts/backup.sh

restore: ## Restore from backup (usage: make restore BACKUP=path/to/backup.tar.gz)
	cd backend && ./scripts/restore-backup.sh $(BACKUP)

