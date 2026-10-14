
.PHONY: help config up down stop restart ps logs \
        build-up gateway parts-service warehouse-service employee-service \
        logs-postgres logs-mongodb logs-mariadb logs-parts logs-warehouse logs-employees

.DEFAULT_GOAL := help

COMPOSE := docker compose

help: ## Show available commands
	@echo "SpareParts Manager - Development commands"
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  make %-20s %s\n", $$1, $$2}'

config: ## Validate Docker Compose configuration
	$(COMPOSE) config

up: ## Start all containers
	$(COMPOSE) up -d

build-up: ## Build and start all containers
	$(COMPOSE) up -d --build

down: ## Remove containers without deleting volumes
	$(COMPOSE) down

stop: ## Stop containers without removing them
	$(COMPOSE) stop

restart: ## Restart containers
	$(COMPOSE) restart

ps: ## Show container status
	$(COMPOSE) ps

logs: ## Follow logs from all containers
	$(COMPOSE) logs -f

gateway: ## Build and start API Gateway and its dependencies
	$(COMPOSE) up -d --build gateway

parts-service: ## Build and start Parts Service and its dependencies
	$(COMPOSE) up -d --build parts-service

warehouse-service: ## Build and start Warehouse Service and its dependencies
	$(COMPOSE) up -d --build warehouse-service

employee-service: ## Build and start Employee Service and its dependencies
	$(COMPOSE) up -d --build employee-service

logs-postgres: ## Follow PostgreSQL logs
	$(COMPOSE) logs -f postgres

logs-mongodb: ## Follow MongoDB logs
	$(COMPOSE) logs -f mongodb

logs-mariadb: ## Follow MariaDB logs
	$(COMPOSE) logs -f mariadb

logs-parts: ## Follow Parts Service logs
	$(COMPOSE) logs -f parts-service

logs-warehouse: ## Follow Warehouse Service logs
	$(COMPOSE) logs -f warehouse-service

logs-employees: ## Follow Employee Service logs
	$(COMPOSE) logs -f employee-service
