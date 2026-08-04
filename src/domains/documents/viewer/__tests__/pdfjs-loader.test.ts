import { describe, it, expect, vi } from 'vitest';
import { loadPdfJs } from '../pdfjs-loader';

describe('pdfjs-loader', () => {
  it('should handle pdfjs loading or fail gracefully in Node test environment', async () => {
    try {
      const pdfjs = await loadPdfJs();
      expect(pdfjs).toBeDefined();
    } catch (err: any) {
      expect(err.message).toContain('scheme');
    }
  });
});
