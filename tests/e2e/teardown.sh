#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE_ARGS=(-f docker-compose.yml -f docker-compose.e2e.yml)

echo "🧹 Stopping E2E infrastructure..."
docker compose "${COMPOSE_FILE_ARGS[@]}" down -v

echo "🔪 Killing local dev processes..."
pkill -f "pnpm dev" || true
pkill -f "pnpm dev:api" || true
pkill -f "pnpm outbox" || true
pkill -f "pnpm subscribe" || true
pkill -f "pnpm vitest" || true
pkill -f "npx serve" || true

echo "✅ E2E environment cleaned up."
