import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('./', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    include: ['modules/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
    reporters: ['default', 'html'],
    outputFile: '.test/index.html',
  },
  resolve: {
    alias: {
      '@': rootDir,
      '@shared': fileURLToPath(new URL('./modules/shared', import.meta.url)),
    },
  },
});
