import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MigrationService } from '../MigrationService';
import { DocumentStorageService } from '../DocumentStorageService';
import { DocumentMetadata } from '../../../../types';

vi.mock('../../../../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}));

import { updateDoc, getDocs } from 'firebase/firestore';

describe('MigrationService', () => {
  let migrationService: MigrationService;
  let mockStorageService: any;

  beforeEach(() => {
    mockStorageService = {
      uploadDocument: vi.fn(),
      getDocumentUrl: vi.fn(),
      deleteDocument: vi.fn(),
      migrateLegacyDocument: vi.fn(),
    } as any;
    
    migrationService = new MigrationService(mockStorageService);
    
    vi.clearAllMocks();
  });

  it('should not migrate if migrationState is already STORAGE', async () => {
    const metadata = { id: '1', migrationState: 'STORAGE' } as unknown as DocumentMetadata;
    await migrationService.migrateDocument(metadata);
    
    expect(mockStorageService.migrateLegacyDocument).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('should set state to MIGRATING and call storageService.migrateLegacyDocument', async () => {
    const metadata = { id: '1', migrationState: 'LEGACY' } as unknown as DocumentMetadata;
    mockStorageService.migrateLegacyDocument.mockResolvedValue({ ...metadata, migrationState: 'STORAGE' });
    
    await migrationService.migrateDocument(metadata);
    
    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc).toHaveBeenCalledWith(undefined, { migrationState: 'MIGRATING' });
    expect(mockStorageService.migrateLegacyDocument).toHaveBeenCalledWith(metadata);
  });

  it('should handle migration failure and set state to FAILED_MIGRATION', async () => {
    const metadata = { id: '1', migrationState: 'LEGACY' } as unknown as DocumentMetadata;
    mockStorageService.migrateLegacyDocument.mockRejectedValue(new Error('Migration failed'));
    
    await migrationService.migrateDocument(metadata);
    
    expect(updateDoc).toHaveBeenCalledTimes(2);
    expect(updateDoc).toHaveBeenNthCalledWith(1, undefined, { migrationState: 'MIGRATING' });
    expect(updateDoc).toHaveBeenNthCalledWith(2, undefined, { migrationState: 'FAILED_MIGRATION' });
  });

  it('should run batch migration for LEGACY and FAILED_MIGRATION documents', async () => {
    (getDocs as any).mockResolvedValue({
      forEach: (callback: any) => {
        callback({ id: '1', data: () => ({ migrationState: 'LEGACY' }) });
      }
    });

    await migrationService.runBatchMigration(5);
    
    // updateDoc should be called for state MIGRATING
    expect(updateDoc).toHaveBeenCalled();
    expect(mockStorageService.migrateLegacyDocument).toHaveBeenCalled();
  });
});
