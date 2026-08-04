import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentStorageService } from '../DocumentStorageService';
import { StorageProvider } from '../StorageProvider';
import { DocumentMetadata } from '../../../../types';

// Mock Firebase
vi.mock('../../../../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
}));

import { doc, updateDoc, getDoc } from 'firebase/firestore';

describe('DocumentStorageService', () => {
  let storageService: DocumentStorageService;
  let mockProvider: any;

  beforeEach(() => {
    mockProvider = {
      uploadDocument: vi.fn(),
      getDownloadUrl: vi.fn(),
      deleteDocument: vi.fn(),
    };
    storageService = new DocumentStorageService(mockProvider);
    
    vi.clearAllMocks();
  });

  it('should get document URL from provider if storagePath exists', async () => {
    const metadata = { id: '1', migrationState: 'STORAGE', storagePath: 'documents/1.pdf' } as unknown as DocumentMetadata;
    mockProvider.getDownloadUrl.mockResolvedValue('https://example.com/1.pdf');
    
    const url = await storageService.getDocumentUrl(metadata);
    
    expect(url).toBe('https://example.com/1.pdf');
    expect(mockProvider.getDownloadUrl).toHaveBeenCalledWith('documents/1.pdf');
  });

  it('should throw error when getting URL if storagePath is missing', async () => {
    const metadata = { id: '1' } as unknown as DocumentMetadata;
    
    const url = await storageService.getDocumentUrl(metadata);
    expect(url).toBeNull();
  });

  it('should migrate legacy document correctly', async () => {
    const metadata = { 
      id: 'doc1', 
      institution: 'YPI',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQK', 
      migrationState: 'LEGACY' 
    } as unknown as DocumentMetadata;
    
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ fileData: 'data:application/pdf;base64,JVBERi0xLjQK' })
    });
    
    mockProvider.uploadDocument.mockResolvedValue('documents/YPI/doc1.pdf');
    mockProvider.getDownloadUrl.mockResolvedValue('https://example.com/migrated.pdf');
    
    const result = await storageService.migrateLegacyDocument(metadata);
    
    expect(mockProvider.uploadDocument).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();
    expect(result.migrationState).toBe('STORAGE');
    expect(result.storagePath).toBe('documents/YPI/doc1.pdf');
    expect(result.fileData).toBe('');
  });
});
