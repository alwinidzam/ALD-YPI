import { DocumentMetadata } from '../../../types';
import { ViewerStrategy } from './ViewerStrategy';
import { DocumentStorageService } from '../storage/DocumentStorageService';
import { MigrationService } from '../storage/MigrationService';
import { NativeViewerStrategy } from './NativeViewerStrategy';
import { StreamingPdfJsStrategy } from './StreamingPdfJsStrategy';
import { VirtualizedPdfJsStrategy } from './VirtualizedPdfJsStrategy';
import { LegacyChunkStrategy } from './LegacyChunkStrategy';
import { DriveLinkViewerStrategy } from './DriveLinkViewerStrategy';
import { PDF_VIEWER_CONFIG, getDeviceCapabilities } from './ViewerConfig';

export class ViewerStrategyFactory {
  constructor(
    private storageService: DocumentStorageService,
    private migrationService: MigrationService
  ) {}

  private logStrategy(strategyName: string, reason: string, document: DocumentMetadata) {
    const device = getDeviceCapabilities();
    console.info('[ViewerStrategyFactory] Selected Strategy:', strategyName, {
      reason,
      documentId: document.id,
      fileSize: document.integrity?.sizeBytes,
      migrationState: document.migrationState,
      device: {
        isMobile: device.isMobile,
        memory: device.memory,
        cores: device.cores,
        nativeSupport: typeof navigator !== 'undefined' && navigator.pdfViewerEnabled
      }
    });
  }

  public determineStrategy(document: DocumentMetadata): ViewerStrategy {
    const device = getDeviceCapabilities();
    const nativeSupported = typeof navigator !== 'undefined' && navigator.pdfViewerEnabled;

    if (document.sourceType === 'DRIVE_LINK') {
       this.logStrategy('DriveLinkViewerStrategy', 'Source is Google Drive link', document);
       return new DriveLinkViewerStrategy();
    }

    // Legacy Chunk Logic
    if (document.migrationState !== 'STORAGE') {
      this.logStrategy('LegacyChunkStrategy', 'Document is not yet migrated to Storage', document);
      return new LegacyChunkStrategy(this.storageService, this.migrationService);
    }

    // New Storage Logic
    // Native viewer is often best on Desktop if supported
    if (nativeSupported && !device.isMobile && PDF_VIEWER_CONFIG.nativeViewerEnabled) {
      this.logStrategy('NativeViewerStrategy', 'Desktop browser with native PDF support', document);
      return new NativeViewerStrategy(this.storageService);
    }
    
    // Determine if virtualized is needed based on capability and size
    const sizeBytes = document.integrity?.sizeBytes || 0;
    const isLargeFile = sizeBytes > PDF_VIEWER_CONFIG.virtualizationThresholdBytes;
    const isLowMemory = device.memory <= 4;
    
    if (isLargeFile || (isLowMemory && sizeBytes > 10 * 1024 * 1024)) {
      this.logStrategy('VirtualizedPdfJsStrategy', isLargeFile ? 'File exceeds size threshold' : 'Low memory device with medium file', document);
      return new VirtualizedPdfJsStrategy(this.storageService);
    }

    // Default for Mobile or unsupported browsers
    this.logStrategy('StreamingPdfJsStrategy', 'Default PDF.js streaming strategy', document);
    return new StreamingPdfJsStrategy(this.storageService);
  }
}
