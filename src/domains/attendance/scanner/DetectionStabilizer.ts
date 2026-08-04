import { BoundingBox } from './DetectionOverlay';
import { RawDetection, DetectionConfidence } from './DetectionConfidence';

export interface StabilizedDetection extends RawDetection {
  confidence: number;
  consecutiveMatches: number;
  stabilizedBoundingBox?: BoundingBox;
}

export class DetectionStabilizer {
  private lastToken: string | null = null;
  private consecutiveMatches: number = 0;
  private lastEmitTime: number = 0;
  private cooldownMs: number;
  private currentBoundingBox: BoundingBox | null = null;

  constructor(cooldownMs: number = 1500) {
    this.cooldownMs = cooldownMs;
  }

  process(raw: RawDetection | null): {
    shouldTrigger: boolean;
    stabilized: StabilizedDetection | null;
  } {
    const now = Date.now();

    if (!raw || !raw.rawValue) {
      // Decay consecutive matches if missing frame
      this.consecutiveMatches = Math.max(0, this.consecutiveMatches - 1);
      if (this.consecutiveMatches === 0) {
        this.lastToken = null;
        this.currentBoundingBox = null;
      }
      return { shouldTrigger: false, stabilized: null };
    }

    const token = raw.rawValue.trim();

    if (token === this.lastToken) {
      this.consecutiveMatches++;
    } else {
      this.lastToken = token;
      this.consecutiveMatches = 1;
      this.currentBoundingBox = raw.boundingBox || null;
    }

    // Interpolate bounding box smoothly using EMA (Exponential Moving Average)
    if (raw.boundingBox) {
      if (!this.currentBoundingBox) {
        this.currentBoundingBox = { ...raw.boundingBox };
      } else {
        const alpha = 0.6; // Interpolation factor
        this.currentBoundingBox = {
          x: this.currentBoundingBox.x * (1 - alpha) + raw.boundingBox.x * alpha,
          y: this.currentBoundingBox.y * (1 - alpha) + raw.boundingBox.y * alpha,
          width: this.currentBoundingBox.width * (1 - alpha) + raw.boundingBox.width * alpha,
          height: this.currentBoundingBox.height * (1 - alpha) + raw.boundingBox.height * alpha,
          cornerPoints: raw.boundingBox.cornerPoints || this.currentBoundingBox.cornerPoints
        };
      }
    }

    const confidence = DetectionConfidence.evaluate(raw, this.consecutiveMatches);

    const stabilized: StabilizedDetection = {
      ...raw,
      confidence,
      consecutiveMatches: this.consecutiveMatches,
      stabilizedBoundingBox: this.currentBoundingBox || raw.boundingBox
    };

    // Check trigger conditions: confidence >= 70 or 1+ consecutive match
    const isConfidenceMet = confidence >= 65;
    const isCooldownPassed = (now - this.lastEmitTime) >= this.cooldownMs;

    let shouldTrigger = false;
    if (isConfidenceMet && isCooldownPassed) {
      this.lastEmitTime = now;
      shouldTrigger = true;
    }

    return { shouldTrigger, stabilized };
  }

  resetCooldown(): void {
    this.lastEmitTime = 0;
  }

  reset(): void {
    this.lastToken = null;
    this.consecutiveMatches = 0;
    this.lastEmitTime = 0;
    this.currentBoundingBox = null;
  }
}
