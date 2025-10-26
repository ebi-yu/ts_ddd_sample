import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('./', import.meta.url));

// smallテスト用の設定
// E2Eテストの起動フローはtests/e2e/prepare-e2e.shとpackage.jsonのtest:e2e:*を参照
export default defineConfig({
  test: {
    globals: true,
    include: ['modules/**/*.test.ts', 'tests/e2e/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
    reporters: ['default', 'html'],
    outputFile: '.test-small/index.html',
  },
  resolve: {
    alias: {
      '@': rootDir,
      '@shared': fileURLToPath(new URL('./modules/shared', import.meta.url)),
    },
  },
});
