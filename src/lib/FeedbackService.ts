import { hapticService, HapticType } from '../services/HapticService';

export type FeedbackType = 'success' | 'warning' | 'error' | 'info' | 'complete' | 'scanSuccess' | 'scanFailure' | 'notification' | 'click';

class FeedbackService {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private volume: number = 0.3; // Default 30% volume
  private lastAudioPlayTime: number = 0;
  private readonly THROTTLE_MS = 150;

  constructor() {
    this.soundEnabled = true;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  private canPlaySound(): boolean {
    if (!this.soundEnabled) return false;
    const now = Date.now();
    if (now - this.lastAudioPlayTime < this.THROTTLE_MS) return false;
    this.lastAudioPlayTime = now;
    return true;
  }

  public vibrate(type: FeedbackType | HapticType) {
    hapticService.trigger(type as HapticType);
  }

  public playSound(type: FeedbackType) {
    if (!this.canPlaySound()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const vol = this.volume;

      switch (type) {
        case 'scanSuccess':
        case 'success':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now); // A5
          osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6 High chime
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
          break;

        case 'scanFailure':
        case 'error':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.linearRampToValueAtTime(140, now + 0.25);
          gain.gain.setValueAtTime(vol * 0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
          break;

        case 'warning':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(523.25, now + 0.1);
          gain.gain.setValueAtTime(vol * 0.7, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.22);
          break;

        case 'notification':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
          gain.gain.setValueAtTime(vol * 0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          break;

        case 'click':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1000, now);
          gain.gain.setValueAtTime(vol * 0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          osc.start(now);
          osc.stop(now + 0.03);
          break;

        case 'info':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now);
          gain.gain.setValueAtTime(vol * 0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
          break;

        case 'complete':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now);
          gain.gain.setValueAtTime(vol * 0.6, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1046.5, now + 0.08); // C6
          gain2.gain.setValueAtTime(vol * 0.7, now + 0.08);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

          osc2.connect(gain2);
          gain2.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.08);
          osc2.start(now + 0.08);
          osc2.stop(now + 0.25);
          break;
      }
    } catch (e) {
      // Swallowed silently
    }
  }

  public notify(type: FeedbackType) {
    this.vibrate(type);
    this.playSound(type);
  }
}

export const feedbackService = new FeedbackService();
