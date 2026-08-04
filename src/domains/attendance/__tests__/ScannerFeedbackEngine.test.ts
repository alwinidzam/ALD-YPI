import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScannerFeedbackEngine } from '../scanner/services/ScannerFeedbackEngine';

describe('ScannerFeedbackEngine', () => {
  let engine: ScannerFeedbackEngine;
  let mockContext: any;
  let mockOscillator: any;
  let mockGain: any;

  beforeEach(() => {
    // Setup AudioContext Mocks
    mockOscillator = {
      type: '',
      frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };

    mockContext = {
      currentTime: 100,
      state: 'running',
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
    };

    // Override global object for browser tests
    vi.stubGlobal('AudioContext', class {
      constructor() {
        return mockContext;
      }
    });
    
    engine = new ScannerFeedbackEngine(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should play success sound using two oscillators', () => {
    engine.playSuccess();
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(2);
    expect(mockContext.createGain).toHaveBeenCalledTimes(2);
    expect(mockOscillator.start).toHaveBeenCalledTimes(2);
    expect(mockOscillator.stop).toHaveBeenCalledTimes(2);
  });

  it('should play error sound using one sawtooth oscillator', () => {
    engine.playError();
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockOscillator.type).toBe('sawtooth');
    expect(mockOscillator.start).toHaveBeenCalledTimes(1);
  });

  it('should play warning sound using one triangle oscillator', () => {
    engine.playWarning();
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockOscillator.type).toBe('triangle');
    expect(mockOscillator.start).toHaveBeenCalledTimes(1);
  });

  it('should not play sound if disabled', () => {
    engine.setSoundEnabled(false);
    engine.playSuccess();
    engine.playError();
    engine.playWarning();
    expect(mockContext.createOscillator).not.toHaveBeenCalled();
  });

  it('should resume audio context if suspended', () => {
    mockContext.state = 'suspended';
    engine.playSuccess();
    expect(mockContext.resume).toHaveBeenCalled();
  });
});
