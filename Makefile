.PHONY: help config up down stop restart ps logs logs-postgres logs-mongodb logs-mariadb db-check clean

.DEFAULT_GOAL := help

COMPOSE := docker compose

help: ## Show available commands
	@echo "SpareParts Manager - Development commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  make %-18s %s\n", $$1, $$2}'

config: ## Validate Docker Compose configuration
	$(COMPOSE) config

up: ## Start all database containers
	$(COMPOSE) up -d

down: ## Stop and remove containers (preserve volumes)
	$(COMPOSE) down

stop: ## Stop containers without removing them
	$(COMPOSE) stop

restart: ## Restart all containers
	$(COMPOSE) restart

ps: ## Show container status
	$(COMPOSE) ps

logs: ## Follow logs from all containers
	$(COMPOSE) logs -f

logs-postgres: ## Show PostgreSQL logs
	$(COMPOSE) logs -f postgres

logs-mongodb: ## Show MongoDB logs
	$(COMPOSE) logs -f mongodb

logs-mariadb: ## Show MariaDB logs
	$(COMPOSE) logs -f mariadb

db-check: ## Check database container health
	$(COMPOSE) ps

clean: ## Remove containers and networks without deleting volumes
	$(COMPOSE) down