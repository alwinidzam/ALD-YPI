import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ViewerStrategyFactory } from '../ViewerStrategyFactory';
import { DocumentStorageService } from '../../storage/DocumentStorageService';
import { MigrationService } from '../../storage/MigrationService';
import { DocumentMetadata } from '../../../../types';
import * as ViewerConfig from '../ViewerConfig';

vi.mock('../../storage/DocumentStorageService');
vi.mock('../../storage/MigrationService');

describe('ViewerStrategyFactory', () => {
  let factory: ViewerStrategyFactory;
  let mockStorageService: any;
  let mockMigrationService: any;

  beforeEach(() => {
    mockStorageService = {} as any;
    mockMigrationService = {} as any;
    factory = new ViewerStrategyFactory(mockStorageService, mockMigrationService);
    
    // Mock standard environment
    vi.spyOn(ViewerConfig, 'getDeviceCapabilities').mockReturnValue({
      isMobile: false,
      memory: 8,
      cores: 8
    });
    
    // Setup navigator mock
    Object.defineProperty(global, 'navigator', {
      value: { pdfViewerEnabled: true },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return DriveLinkViewerStrategy for DRIVE_LINK source', () => {
    const doc = { id: '1', title: 'Test', sourceType: 'DRIVE_LINK', migrationState: 'STORAGE' } as unknown as DocumentMetadata;
    const strategy = factory.determineStrategy(doc);
    expect(strategy.constructor.name).toBe('DriveLinkViewerStrategy');
  });

  it('should return LegacyChunkStrategy if migrationState is not STORAGE', () => {
    const doc = { id: '1', title: 'Test', migrationState: 'LEGACY' } as unknown as DocumentMetadata;
    const strategy = factory.determineStrategy(doc);
    expect(strategy.constructor.name).toBe('LegacyChunkStrategy');
  });

  it('should return NativeViewerStrategy if desktop and native supported', () => {
    const doc = { id: '1', title: 'Test', migrationState: 'STORAGE' } as unknown as DocumentMetadata;
    const strategy = factory.determineStrategy(doc);
    expect(strategy.constructor.name).toBe('NativeViewerStrategy');
  });

  it('should return VirtualizedPdfJsStrategy if file size exceeds threshold', () => {
    Object.defineProperty(global, 'navigator', { value: { pdfViewerEnabled: false }, configurable: true });
    
    const doc = { 
      id: '1', 
      title: 'Test', 
      migrationState: 'STORAGE',
      integrity: { sizeBytes: 30 * 1024 * 1024, hash: '' }
    } as unknown as DocumentMetadata;
    const strategy = factory.determineStrategy(doc);
    expect(strategy.constructor.name).toBe('VirtualizedPdfJsStrategy');
  });

  it('should return StreamingPdfJsStrategy for default cases', () => {
    Object.defineProperty(global, 'navigator', { value: { pdfViewerEnabled: false }, configurable: true });
    
    const doc = { 
      id: '1', 
      title: 'Test', 
      migrationState: 'STORAGE',
      integrity: { sizeBytes: 5 * 1024 * 1024, hash: '' }
    } as unknown as DocumentMetadata;
    const strategy = factory.determineStrategy(doc);
    expect(strategy.constructor.name).toBe('StreamingPdfJsStrategy');
  });
});
