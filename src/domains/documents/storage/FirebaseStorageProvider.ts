import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../../firebase';
import { StorageProvider } from './StorageProvider';
import { DocumentIntegrityMetadata } from '../../../types';

export class FirebaseStorageProvider implements StorageProvider {
  async uploadDocument(
    file: File | Blob, 
    path: string, 
    metadata: DocumentIntegrityMetadata
  ): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, {
      contentType: metadata.mimeType,
      customMetadata: {
        checksum: metadata.checksum,
        sizeBytes: metadata.sizeBytes.toString(),
        uploadTimestamp: metadata.uploadTimestamp.toString(),
        storageVersion: metadata.storageVersion.toString(),
      }
    });
    
    // Return the storage path, since getDownloadURL can be fetched when needed
    // or we can just return the gs:// path or path itself.
    return path;
  }

  async getDownloadUrl(path: string): Promise<string> {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  }

  async deleteDocument(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }
}
