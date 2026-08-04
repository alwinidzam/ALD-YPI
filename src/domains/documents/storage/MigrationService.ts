import { DocumentMetadata } from '../../../types';
import { DocumentStorageService } from './DocumentStorageService';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export class MigrationService {
  constructor(private storageService: DocumentStorageService) {}

  /**
   * Orchestrates the background migration of legacy documents to the new storage system.
   */
  async migrateDocument(metadata: DocumentMetadata): Promise<void> {
    try {
      // 1. Verify precondition
      if (metadata.migrationState === 'STORAGE') return;

      // Update state to migrating to prevent concurrent migrations
      await updateDoc(doc(db, 'documents', metadata.id), {
        migrationState: 'MIGRATING'
      });

      // 2. Trigger migration via DocumentStorageService
      await this.storageService.migrateLegacyDocument(metadata);
      
      // 3. Log success metrics
      console.info(`[MigrationService] Migration successful for document ${metadata.id}`);
    } catch (error) {
      // 4. Handle failure, update state, schedule retry
      console.error(`[MigrationService] Migration failed for document ${metadata.id}`, error);
      try {
        await updateDoc(doc(db, 'documents', metadata.id), {
          migrationState: 'FAILED_MIGRATION'
        });
      } catch (updateErr) {
        console.error('Failed to update migration state to FAILED', updateErr);
      }
    }
  }

  /**
   * Batch migrate all documents in LEGACY or FAILED_MIGRATION state.
   */
  async runBatchMigration(batchSize = 10): Promise<void> {
    try {
      console.info(`[MigrationService] Starting batch migration...`);
      const documentsRef = collection(db, 'documents');
      
      // Query for LEGACY
      const legacyQuery = query(documentsRef, where('migrationState', '==', 'LEGACY'));
      const legacySnapshot = await getDocs(legacyQuery);
      
      // Query for FAILED
      const failedQuery = query(documentsRef, where('migrationState', '==', 'FAILED_MIGRATION'));
      const failedSnapshot = await getDocs(failedQuery);
      
      const docsToMigrate: DocumentMetadata[] = [];
      
      legacySnapshot.forEach(docSnap => {
        docsToMigrate.push({ id: docSnap.id, ...docSnap.data() } as DocumentMetadata);
      });
      
      failedSnapshot.forEach(docSnap => {
        docsToMigrate.push({ id: docSnap.id, ...docSnap.data() } as DocumentMetadata);
      });

      // Sort by some criteria if needed, take first batchSize
      const batch = docsToMigrate.slice(0, batchSize);
      
      if (batch.length === 0) {
        console.info(`[MigrationService] No documents require migration.`);
        return;
      }
      
      console.info(`[MigrationService] Processing batch of ${batch.length} documents.`);
      
      // Process sequentially to avoid overwhelming memory/network
      for (const metadata of batch) {
        await this.migrateDocument(metadata);
      }
      
      console.info(`[MigrationService] Batch migration complete.`);
      
    } catch (error) {
      console.error('[MigrationService] Batch migration process failed', error);
    }
  }
}
