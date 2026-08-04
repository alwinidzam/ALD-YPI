import { ATTENDANCE_CONSTANTS } from '../../constants';

export class ScannerInputNormalizer {
  /**
   * Normalizes raw token string received from USB or Camera hardware scanners.
   * Removes control characters (0x00 - 0x1F, 0x7F), trims space, converts to uppercase.
   */
  static normalize(rawInput: string): string {
    if (!rawInput) return '';

    // Strip ASCII control characters and carriage return / line feeds
    let clean = rawInput.replace(/[\x00-\x1F\x7F]/g, '');

    // Trim whitespace
    clean = clean.trim();

    // Uppercase token
    clean = clean.toUpperCase();

    return clean;
  }

  /**
   * Validates if a normalized token conforms to basic barcode prefix and length rules.
   */
  static isValidTokenFormat(normalizedToken: string): boolean {
    if (!normalizedToken) return false;
    
    // Check minimum length
    if (normalizedToken.length < 5) return false;

    // Must start with barcode prefix or be valid string
    if (!normalizedToken.startsWith(ATTENDANCE_CONSTANTS.BARCODE_PREFIX)) {
      // Allow valid alphanumeric barcode string
      const alphanumericRegex = /^[A-Z0-9_-]+$/;
      return alphanumericRegex.test(normalizedToken);
    }

    return true;
  }
}
