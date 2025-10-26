#!/usr/bin/env bash
set -euo pipefail

SERVER_URL="http://localhost:5000/"
SERVER_TIMEOUT_SEC="120"
export E2E=1

echo "🚀 Starting application via 'pnpm dev' in background..."
(
  # JetBrains/VSCode can inject NODE_OPTIONS=--inspect when running tests.
  # That breaks our background services because they try to attach a debugger.
  unset NODE_OPTIONS
  pnpm start:all
) &

sleep 5
echo "🧪 Running Vitest E2E suite..."

set +e
pnpm vitest --run tests/e2e/*.ts --outputFile ".test-e2e/index.html"
TEST_EXIT=$?
set -e

if [[ $TEST_EXIT -ne 0 ]]; then
  echo "❌ Vitest E2E suite failed (exit code $TEST_EXIT)"
  exit "$TEST_EXIT"
fi

echo "✅ Vitest E2E suite passed."

if [[ "${E2E_SKIP_HTML_SERVE:-0}" != "1" ]]; then
  echo "🌐 Serving Vitest report from .test-e2e (Ctrl+C to stop)..."
  npx serve .test-e2e
fi
