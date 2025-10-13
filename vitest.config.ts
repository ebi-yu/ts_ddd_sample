import { defineConfig } from 'vitest/config';

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
      '@': new URL('./', import.meta.url).pathname,
    },
  },
});
