import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/domains/attendance/**/*.ts', 'src/domains/attendance/**/*.tsx', 'src/domains/documents/**/*.ts', 'src/domains/documents/**/*.tsx', 'src/components/**/*.tsx'],
    },
  },
});
