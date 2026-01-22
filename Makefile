.PHONY: dev build test clean help

# Colors
GREEN := \033[0;32m
NC := \033[0m

help: ## Show this help
	@echo "FinLapor - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# Development
dev: ## Start all services for development
	docker-compose up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:8080"
	@echo "MinIO:    http://localhost:9001"

dev-frontend: ## Start frontend only (without Docker)
	cd frontend && npm run dev

dev-backend: ## Start backend only (without Docker)
	cd backend && go run cmd/server/main.go

stop: ## Stop all services
	docker-compose down
	@echo "$(GREEN)All services stopped$(NC)"

logs: ## Show logs
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

# Build
build: ## Build all Docker images
	docker-compose build

build-frontend: ## Build frontend
	cd frontend && npm run build

build-backend: ## Build backend
	cd backend && go build -o bin/server cmd/server/main.go

# Database
migrate-up: ## Run database migrations
	cd backend && go run cmd/migrate/main.go up

migrate-down: ## Rollback database migrations
	cd backend && go run cmd/migrate/main.go down

seed: ## Seed database with sample data
	docker exec -i finlapor-postgres psql -U postgres -d finlapor < database/seeds/seed.sql

# Testing
test: ## Run all tests
	cd frontend && npm test
	cd backend && go test ./...

test-frontend: ## Run frontend tests
	cd frontend && npm test

test-backend: ## Run backend tests
	cd backend && go test ./...

# Installation
install: ## Install all dependencies
	cd frontend && npm install
	cd backend && go mod download
	@echo "$(GREEN)Dependencies installed!$(NC)"

# Cleanup
clean: ## Clean up Docker resources
	docker-compose down -v
	rm -rf frontend/.next frontend/out
	rm -rf backend/bin
	@echo "$(GREEN)Cleanup complete$(NC)"

# Deployment
deploy-frontend: ## Deploy frontend to CloudFlare Pages
	cd frontend && npm run build
	@echo "$(GREEN)Build complete! Push to GitHub to trigger CloudFlare deployment$(NC)"

deploy-lambda: ## Deploy Lambda function
	cd ai-service && serverless deploy
	@echo "$(GREEN)Lambda deployed!$(NC)"
