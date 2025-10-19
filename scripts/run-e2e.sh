#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=${DOTENV_CONFIG_PATH:-.env}
SERVICE_BOOT_WAIT=${SERVICE_BOOT_WAIT:-5}
E2E_REPORT_DIR=${E2E_REPORT_DIR:-.test-e2e}
E2E_PREVIEW_PORT=${E2E_PREVIEW_PORT:-4174}

ensure_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command '$1' not found. Please install it and retry." >&2
    exit 1
  fi
}

ensure_command docker
ensure_command pnpm

echo "🚀 Starting E2E environment (Postgres / Redis / Kafka)..."
docker compose up -d

echo "⏳ Waiting for services to stabilise..."
sleep "$SERVICE_BOOT_WAIT"

echo "🗄️  Running Prisma migrations..."
DOTENV_CONFIG_PATH="$ENV_FILE" pnpm prisma migrate deploy

echo "🚀 Launching API server, dispatcher, and subscriber..."
DOTENV_CONFIG_PATH="$ENV_FILE" pnpm dev >/tmp/e2e-services.log 2>&1 &
SERVICES_PID=$!

echo "⏳ Waiting for application services to stabilise..."
sleep "$SERVICE_BOOT_WAIT"

echo "🧪 Running HTTP-based E2E scenario..."
mkdir -p "$E2E_REPORT_DIR"
set +e
E2E=1 DOTENV_CONFIG_PATH="$ENV_FILE" pnpm vitest --run tests/e2e/*.ts \
  --reporter=default --reporter=html --outputFile "$E2E_REPORT_DIR/index.html"
TEST_EXIT_CODE=$?
set -e

echo "🔎 Previewing E2E report on http://localhost:$E2E_PREVIEW_PORT"
npx vite preview --outDir "$E2E_REPORT_DIR" --port "$E2E_PREVIEW_PORT"

exit "$TEST_EXIT_CODE"
