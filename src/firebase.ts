import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, setDoc, deleteDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { User, DocumentMetadata, Announcement, AuditLog } from './types';

const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  measurementId: firebaseConfig.measurementId
});

export const db = firebaseConfig.firestoreDatabaseId
  ? initializeFirestore(app, { localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) }, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, { localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) });

/* 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
*/

export const auth = getAuth(app);

// Error handling types and helper as specified in the firebase-integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Collection References
export const usersCol = collection(db, 'users');
export const docsCol = collection(db, 'documents');
export const annsCol = collection(db, 'announcements');
export const logsCol = collection(db, 'audit_logs');

// Helper to save a user
export async function dbSaveUser(user: User): Promise<void> {
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
  }
}

// Helper to delete a user
export async function dbDeleteUser(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
  }
}

// Helper to save a document, chunking large fileData to bypass Firestore 1MB limits
export async function dbSaveDocument(document: DocumentMetadata): Promise<void> {
  const docToSave = { ...document };
  
  try {
    // If fileData is larger than 600 KB (approx 600,000 characters), chunk it
    if (docToSave.fileData && docToSave.fileData.length > 600000) {
      const fileData = docToSave.fileData;
      
      // Clear fileData on main document to keep it small in documents list
      docToSave.fileData = 'CHUNKS_EXIST';
      
      const chunkSize = 600000;
      const totalChunks = Math.ceil(fileData.length / chunkSize);
      
      // Save each chunk
      const batch = writeBatch(db);
      for (let i = 0; i < totalChunks; i++) {
        const chunkStr = fileData.substring(i * chunkSize, (i + 1) * chunkSize);
        const chunkId = `${document.id}_chunk_${i}`;
        const chunkRef = doc(db, 'documentChunks', chunkId);
        batch.set(chunkRef, {
          id: chunkId,
          docId: document.id,
          chunkIndex: i,
          totalChunks,
          chunkData: chunkStr
        });
      }
      await batch.commit();
    }
    
    await setDoc(doc(db, 'documents', document.id), docToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `documents/${document.id}`);
  }
}

// Helper to delete a document and all its associated chunks
export async function dbDeleteDocument(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'documents', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `documents/${id}`);
  }
  
  // Clean up chunks
  try {
    const chunksCol = collection(db, 'documentChunks');
    const q = query(chunksCol, where('docId', '==', id));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `documentChunks`);
  }
}

// Helper to retrieve the complete fileData by combining chunks if needed
export async function dbGetDocumentData(docId: string): Promise<string> {
  try {
    const chunksCol = collection(db, 'documentChunks');
    const q = query(chunksCol, where('docId', '==', docId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return '';
    }
    
    // Map and sort chunks in memory
    const chunks = snapshot.docs.map(d => d.data() as { chunkIndex: number, chunkData: string });
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    
    // Combine
    return chunks.map(c => c.chunkData).join('');
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `documentChunks`);
    return '';
  }
}

// Helper to save an announcement
export async function dbSaveAnnouncement(ann: Announcement): Promise<void> {
  try {
    await setDoc(doc(db, 'announcements', ann.id), ann);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `announcements/${ann.id}`);
  }
}

// Helper to delete an announcement
export async function dbDeleteAnnouncement(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
  }
}

// Helper to add an audit log
export async function dbAddAuditLog(log: AuditLog): Promise<void> {
  try {
    await setDoc(doc(db, 'audit_logs', log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `audit_logs/${log.id}`);
  }
}

// Helper to clear all audit logs
export async function dbClearAuditLogs(): Promise<void> {
  try {
    const snapshot = await getDocs(logsCol);
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `audit_logs`);
  }
}
