import { DocumentIntegrityMetadata } from '../../../types';

export interface StorageProvider {
  /**
   * Upload a file and return the storage path or download URL, plus metadata
   */
  uploadDocument(
    file: File | Blob, 
    path: string, 
    metadata: DocumentIntegrityMetadata
  ): Promise<string>;

  /**
   * Get the download URL for a stored document
   */
  getDownloadUrl(path: string): Promise<string>;

  /**
   * Delete a document from storage
   */
  deleteDocument(path: string): Promise<void>;
}
