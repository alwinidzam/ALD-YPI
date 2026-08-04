

import { setLogLevel } from 'firebase/firestore';
// setLogLevel('error');
import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, setDoc, deleteDoc, getDocs, getDoc, writeBatch, query, where, runTransaction } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { User, DocumentMetadata, Announcement, AuditLog, TeacherStaff, UserRole, InstitutionType, Report } from './types';

const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  measurementId: firebaseConfig.measurementId
});

let dbInstance: any;

try {
  dbInstance = firebaseConfig.firestoreDatabaseId
    ? initializeFirestore(app, { localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) }, firebaseConfig.firestoreDatabaseId)
    : initializeFirestore(app, { localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) });
} catch (error) {
  console.warn("Failed to initialize Firestore with persistent cache (likely due to iframe/sandbox constraints). Falling back to standard getFirestore:", error);
  dbInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = dbInstance;

/* 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
*/

export const auth = getAuth(app);
export const storage = getStorage(app);

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
export const teachersCol = collection(db, 'teachers_staff');
export const reportsCol = collection(db, 'reports');

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
      
      // Save each chunk in batches of 10 to avoid 10 MiB batch limit
      const CHUNKS_PER_BATCH = 10;
      for (let batchStart = 0; batchStart < totalChunks; batchStart += CHUNKS_PER_BATCH) {
        const batch = writeBatch(db);
        const batchEnd = Math.min(batchStart + CHUNKS_PER_BATCH, totalChunks);
        for (let i = batchStart; i < batchEnd; i++) {
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

// Helper to automatically clear audit logs older than 90 days
export async function dbCleanOldAuditLogs(): Promise<number> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const thresholdStr = ninetyDaysAgo.toISOString();
    
    const q = query(logsCol, where('timestamp', '<', thresholdStr));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 0;
    }
    
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    return snapshot.size;
  } catch (err) {
    // Silently handle error or report warning to maintain app stability
    console.warn('Auto-clean old audit logs skipped:', err instanceof Error ? err.message : String(err));
    return 0;
  }
}

// Helper to save a Teacher/Staff profile
export async function dbSaveTeacherStaff(teacher: TeacherStaff): Promise<void> {
  try {
    await setDoc(doc(db, 'teachers_staff', teacher.id), teacher);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `teachers_staff/${teacher.id}`);
  }
}

// Helper to delete a Teacher/Staff profile
export async function dbDeleteTeacherStaff(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'teachers_staff', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `teachers_staff/${id}`);
  }
}

// Helper to save a report, chunking large attachment fileData if needed
export async function dbSaveReport(report: Report): Promise<void> {
  const reportToSave = { ...report };
  
  try {
    // If report has attachment and fileData is larger than 600 KB, chunk it
    if (reportToSave.attachment?.fileData && reportToSave.attachment.fileData.length > 600000) {
      const fileData = reportToSave.attachment.fileData;
      
      // Clear main document to keep it small
      reportToSave.attachment = {
        ...reportToSave.attachment,
        fileData: 'CHUNKS_EXIST'
      };
      
      const chunkSize = 600000;
      const totalChunks = Math.ceil(fileData.length / chunkSize);
      
      // Save chunks in batches of 10 to avoid 10 MiB batch limit
      const CHUNKS_PER_BATCH = 10;
      for (let batchStart = 0; batchStart < totalChunks; batchStart += CHUNKS_PER_BATCH) {
        const batch = writeBatch(db);
        const batchEnd = Math.min(batchStart + CHUNKS_PER_BATCH, totalChunks);
        for (let i = batchStart; i < batchEnd; i++) {
          const chunkStr = fileData.substring(i * chunkSize, (i + 1) * chunkSize);
          const chunkId = `${report.id}_chunk_${i}`;
          const chunkRef = doc(db, 'reportChunks', chunkId);
          batch.set(chunkRef, {
            id: chunkId,
            reportId: report.id,
            chunkIndex: i,
            totalChunks,
            chunkData: chunkStr
          });
        }
        await batch.commit();
      }
    }
    
    await setDoc(doc(db, 'reports', report.id), reportToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `reports/${report.id}`);
  }
}

// Helper to retrieve the complete report attachment data by combining chunks
export async function dbGetReportAttachmentData(reportId: string): Promise<string> {
  try {
    const chunksCol = collection(db, 'reportChunks');
    const q = query(chunksCol, where('reportId', '==', reportId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return '';
    }
    
    const chunks = snapshot.docs.map(d => d.data() as { chunkIndex: number, chunkData: string });
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    
    return chunks.map(c => c.chunkData).join('');
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `reportChunks`);
    return '';
  }
}

// Helper to delete a report and its associated chunks
export async function dbDeleteReport(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'reports', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `reports/${id}`);
  }
  
  // Clean up chunks
  try {
    const chunksCol = collection(db, 'reportChunks');
    const q = query(chunksCol, where('reportId', '==', id));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `reportChunks`);
  }
}

