import { BoundingBox } from './DetectionOverlay';

export interface RawDetection {
  rawValue: string;
  format: string;
  boundingBox?: BoundingBox;
  engine: 'BarcodeDetector' | 'ZXing';
}

export class DetectionConfidence {
  /**
   * Evaluates raw detection and returns confidence score (0 - 100)
   */
  static evaluate(detection: RawDetection, consecutiveMatchCount: number): number {
    let score = 50;

    // Engine reliability base score
    if (detection.engine === 'BarcodeDetector') {
      score += 35; // Native hardware accelerated
    } else {
      score += 25; // ZXing software fallback
    }

    // Format reliability bonus
    const knownFormats = ['qr_code', 'QR_CODE', 'code_128', 'CODE_128', 'ean_13', 'EAN_13'];
    if (knownFormats.includes(detection.format)) {
      score += 10;
    }

    // Value structure sanity
    const val = detection.rawValue.trim();
    if (val.length >= 3 && val.length <= 128) {
      score += 10;
    }

    // Consecutive match bonus (+15 per match up to +30)
    score += Math.min(consecutiveMatchCount * 15, 30);

    return Math.min(Math.max(score, 0), 100);
  }
}
