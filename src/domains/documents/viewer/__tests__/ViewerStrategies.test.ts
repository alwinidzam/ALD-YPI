import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativeViewerStrategy } from '../NativeViewerStrategy';
import { DriveLinkViewerStrategy } from '../DriveLinkViewerStrategy';
import { LegacyChunkStrategy } from '../LegacyChunkStrategy';
import { DocumentStorageService } from '../../storage/DocumentStorageService';
import { MigrationService } from '../../storage/MigrationService';
import { DocumentMetadata } from '../../../../types';

vi.mock('../../../../firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));
import { getDoc } from 'firebase/firestore';

describe('Viewer Strategies', () => {
  let mockStorageService: any;
  let mockMigrationService: any;
  let containerElement: HTMLElement;
  let mockContext: any;

  beforeEach(() => {
    mockStorageService = {
      getDocumentUrl: vi.fn(),
    } as any;
    mockMigrationService = {} as any;
    containerElement = document.createElement('div');
    
    mockContext = {
      containerElement,
      document: { id: '1', title: 'Test' } as unknown as DocumentMetadata,
      onLoadProgress: vi.fn(),
      onPageChange: vi.fn(),
      onNumPagesLoaded: vi.fn(),
      onError: vi.fn(),
    };
    
    vi.clearAllMocks();
  });

  describe('NativeViewerStrategy', () => {
    it('should render iframe with document url', async () => {
      const strategy = new NativeViewerStrategy(mockStorageService);
      mockStorageService.getDocumentUrl.mockResolvedValue('https://example.com/test.pdf');
      
      await strategy.render(mockContext);
      
      const iframe = containerElement.querySelector('iframe');
      expect(iframe).not.toBeNull();
      expect(iframe?.src).toBe('https://example.com/test.pdf');
      
      // trigger onload
      iframe?.onload?.(new Event('load'));
      
      expect(mockContext.onLoadProgress).toHaveBeenCalledWith(100);
      expect(mockContext.onNumPagesLoaded).toHaveBeenCalledWith(1);
    });

    it('should cleanup iframe on destroy', async () => {
      const strategy = new NativeViewerStrategy(mockStorageService);
      mockStorageService.getDocumentUrl.mockResolvedValue('https://example.com/test.pdf');
      
      await strategy.render(mockContext);
      strategy.destroy();
      
      expect(containerElement.innerHTML).toBe('');
    });
  });

  describe('DriveLinkViewerStrategy', () => {
    it('should parse drive link and render preview iframe', async () => {
      mockContext.document = { driveUrl: 'https://drive.google.com/file/d/1234567890/view' } as DocumentMetadata;
      const strategy = new DriveLinkViewerStrategy();
      
      await strategy.render(mockContext);
      
      const iframe = containerElement.querySelector('iframe');
      expect(iframe).not.toBeNull();
      expect(iframe?.src).toContain('preview');
    });

    it('should fallback to original URL if unparseable', async () => {
      mockContext.document = { driveUrl: 'https://example.com/not-drive' } as DocumentMetadata;
      const strategy = new DriveLinkViewerStrategy();
      
      await strategy.render(mockContext);
      
      const iframe = containerElement.querySelector('iframe');
      expect(iframe).not.toBeNull();
      expect(iframe?.src).toContain('https://example.com/not-drive');
    });
  });

  describe('LegacyChunkStrategy', () => {
    it('should load legacy data and render iframe', async () => {
      mockContext.document = { id: '1', fileData: 'base64data' } as DocumentMetadata;
      const strategy = new LegacyChunkStrategy(mockStorageService, mockMigrationService);
      
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ fileData: 'base64data' })
      });

      await strategy.render(mockContext);
      
      const iframe = containerElement.querySelector('iframe');
      expect(iframe).not.toBeNull();
      expect(iframe?.src).toContain('data:application/pdf;base64,base64data');
    });

    it('should throw error if fileData is missing', async () => {
      mockContext.document = { id: '1' } as DocumentMetadata;
      const strategy = new LegacyChunkStrategy(mockStorageService, mockMigrationService);
      
      (getDoc as any).mockResolvedValue({
        exists: () => false,
      });

      await strategy.render(mockContext);
      
      expect(mockContext.onError).toHaveBeenCalled();
    });
  });
});
