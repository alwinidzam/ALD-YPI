import { DocumentMetadata, DocumentIntegrityMetadata, DocumentMigrationState } from '../../../types';
import { StorageProvider } from './StorageProvider';
import { db, OperationType } from '../../../firebase';
import { doc, updateDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';

export class DocumentStorageService {
  private storageProvider: StorageProvider;
  private currentStorageVersion = 1;

  constructor(storageProvider: StorageProvider) {
    this.storageProvider = storageProvider;
  }

  /**
   * Helper to compute SHA-256 checksum of an ArrayBuffer
   */
  public async computeChecksum(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Helper to convert Base64 Data URI to Blob
   */
  public base64ToBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  /**
   * Uploads a new document to storage
   */
  public async uploadDocument(
    documentId: string, 
    institution: string, 
    file: File | Blob
  ): Promise<{ path: string, integrity: DocumentIntegrityMetadata }> {
    const buffer = await file.arrayBuffer();
    const checksum = await this.computeChecksum(buffer);
    
    const integrity: DocumentIntegrityMetadata = {
      checksum,
      sizeBytes: file.size,
      mimeType: file.type || 'application/pdf',
      uploadTimestamp: Date.now(),
      storageVersion: this.currentStorageVersion
    };

    const path = `documents/${institution}/${documentId}.pdf`;
    await this.storageProvider.uploadDocument(file, path, integrity);
    
    return { path, integrity };
  }

  /**
   * Retrieves the URL for downloading/viewing a stored document
   */
  public async getDocumentUrl(metadata: DocumentMetadata): Promise<string | null> {
    if (metadata.migrationState === 'STORAGE' && metadata.storagePath) {
      return this.storageProvider.getDownloadUrl(metadata.storagePath);
    }
    return null;
  }

  /**
   * Clean up document from storage and delete its legacy chunks if any exist.
   * NOTE: This doesn't delete the main metadata doc.
   */
  public async deleteDocumentStorage(metadata: DocumentMetadata): Promise<void> {
    if (metadata.storagePath) {
      try {
        await this.storageProvider.deleteDocument(metadata.storagePath);
      } catch (err) {
        console.warn('Failed to delete from storage, might not exist.', err);
      }
    }
    
    // Also delete any legacy chunks
    try {
      const chunksCol = collection(db, 'documentChunks');
      const q = query(chunksCol, where('docId', '==', metadata.id));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    } catch (err) {
      console.error('Failed to delete legacy chunks', err);
    }
  }

  /**
   * Fetches legacy file data from chunks or metadata inline
   */
  public async getLegacyDocumentData(metadata: DocumentMetadata): Promise<string> {
    if (metadata.fileData && metadata.fileData !== 'CHUNKS_EXIST') {
      return metadata.fileData;
    }
    
    const chunksCol = collection(db, 'documentChunks');
    const q = query(chunksCol, where('docId', '==', metadata.id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return '';
    }
    
    const chunks = snapshot.docs.map(d => d.data() as { chunkIndex: number, chunkData: string });
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    return chunks.map(c => c.chunkData).join('');
  }

  /**
   * Incremental migration for a single legacy document to V2 Storage.
   */
  public async migrateLegacyDocument(metadata: DocumentMetadata): Promise<DocumentMetadata> {
    // 1. Mark as migrating
    await this.updateMigrationState(metadata.id, 'MIGRATING');
    
    try {
      const startTime = performance.now();
      
      // 2. Fetch legacy data
      const base64Data = await this.getLegacyDocumentData(metadata);
      if (!base64Data) {
        throw new Error('Could not retrieve legacy document data.');
      }
      
      // 3. Convert to blob
      const blob = this.base64ToBlob(base64Data);
      
      // 4. Upload to storage
      const { path, integrity } = await this.uploadDocument(metadata.id, metadata.institution, blob);
      
      // 5. Update Firestore metadata (set to STORAGE state, remove fileData to save space)
      const updatedMetadata: Partial<DocumentMetadata> = {
        migrationState: 'STORAGE',
        storagePath: path,
        integrity,
        fileData: '' // Clear out the legacy data to save DB space (but we don't delete chunks until fully verified/needed)
      };
      
      await updateDoc(doc(db, 'documents', metadata.id), updatedMetadata);
      
      const duration = performance.now() - startTime;
      console.log(`[Migration] Successfully migrated document ${metadata.id} in ${duration.toFixed(2)}ms. Size: ${integrity.sizeBytes} bytes.`);
      
      return { ...metadata, ...updatedMetadata } as DocumentMetadata;
      
    } catch (error) {
      console.error(`[Migration] Failed to migrate document ${metadata.id}:`, error);
      await this.updateMigrationState(metadata.id, 'FAILED');
      throw error;
    }
  }

  private async updateMigrationState(documentId: string, state: DocumentMigrationState): Promise<void> {
    await updateDoc(doc(db, 'documents', documentId), { migrationState: state });
  }
}
