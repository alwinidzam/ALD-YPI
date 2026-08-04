import { describe, it, expect } from 'vitest';
import { ScannerInputNormalizer } from '../../scanner/utils/ScannerInputNormalizer';
import { ATTENDANCE_CONSTANTS } from '../../constants';

describe('ScannerInputNormalizer', () => {
  describe('normalize', () => {
    it('should strip control characters and whitespace, and uppercase the string', () => {
      const raw = ' \x00 YPI-1234 \r\n ';
      const normalized = ScannerInputNormalizer.normalize(raw);
      expect(normalized).toBe('YPI-1234');
    });

    it('should return empty string if input is falsy', () => {
      expect(ScannerInputNormalizer.normalize('')).toBe('');
    });
  });

  describe('isValidTokenFormat', () => {
    it('should reject falsy tokens', () => {
      expect(ScannerInputNormalizer.isValidTokenFormat('')).toBe(false);
    });

    it('should reject tokens shorter than 5 characters', () => {
      expect(ScannerInputNormalizer.isValidTokenFormat('1234')).toBe(false);
    });

    it('should accept tokens with valid prefix', () => {
      expect(ScannerInputNormalizer.isValidTokenFormat(ATTENDANCE_CONSTANTS.BARCODE_PREFIX + '123')).toBe(true);
    });

    it('should accept alphanumeric tokens', () => {
      expect(ScannerInputNormalizer.isValidTokenFormat('ABCDE')).toBe(true);
      expect(ScannerInputNormalizer.isValidTokenFormat('12345')).toBe(true);
      expect(ScannerInputNormalizer.isValidTokenFormat('VALID-123')).toBe(true);
    });

    it('should reject invalid string tokens if not starting with prefix', () => {
      expect(ScannerInputNormalizer.isValidTokenFormat('ABCDE!')).toBe(false);
    });
  });
});
