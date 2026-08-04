/**
 * Upload Background Sync Queue Manager
 * Stores offline document uploads in localStorage and automatically retries/flushes
 * when network connection is restored or periodically.
 */

import { dbSaveDocument } from '../firebase';
import { DocumentMetadata, User } from '../types';

export interface QueuedUploadItem {
  id: string;
  type: 'DOCUMENT';
  docMeta: DocumentMetadata;
  fileDataUrl: string; // Base64 PDF / image content
  user: User;
  createdAt: string;
  attempts: number;
  lastError?: string;
  status: 'PENDING' | 'UPLOADING' | 'FAILED' | 'SUCCESS';
}

const QUEUE_STORAGE_KEY = 'ald_background_upload_queue';

export function getUploadQueue(): QueuedUploadItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUploadQueue(queue: QueuedUploadItem[]) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('ald_upload_queue_updated'));
  } catch (err: any) {
    console.error('Gagal menyimpan antrean upload:', err);
    if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      throw new Error('Penyimpanan lokal penuh. Harap unggah saat online atau kosongkan cache.');
    }
    throw new Error('Gagal menyimpan ke antrean offline.');
  }
}

export function enqueueDocumentUpload(
  docMeta: DocumentMetadata,
  fileDataUrl: string,
  user: User
): QueuedUploadItem {
  const queue = getUploadQueue();
  const newItem: QueuedUploadItem = {
    id: 'queue_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    type: 'DOCUMENT',
    docMeta: {
      ...docMeta,
      fileData: fileDataUrl
    },
    fileDataUrl,
    user,
    createdAt: new Date().toISOString(),
    attempts: 0,
    status: 'PENDING',
  };

  queue.push(newItem);
  saveUploadQueue(queue);
  
  // Try processing immediately if online
  if (navigator.onLine) {
    processUploadQueue();
  }

  return newItem;
}

let isProcessing = false;

export async function processUploadQueue(): Promise<{ successCount: number; failCount: number }> {
  if (isProcessing) return { successCount: 0, failCount: 0 };
  if (!navigator.onLine) return { successCount: 0, failCount: 0 };

  isProcessing = true;
  const queue = getUploadQueue();
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    if (item.status === 'SUCCESS') continue;

    item.status = 'UPLOADING';
    item.attempts += 1;
    saveUploadQueue(queue);

    try {
      if (item.type === 'DOCUMENT') {
        await dbSaveDocument({
          ...item.docMeta,
          fileData: item.docMeta.fileData || item.fileDataUrl,
        });
      }
      item.status = 'SUCCESS';
      successCount++;
    } catch (err: any) {
      console.warn(`Gagal mengunggah item antrean ${item.id}:`, err);
      item.status = 'FAILED';
      item.lastError = err?.message || 'Gagal terhubung ke server';
      failCount++;
    }

    saveUploadQueue(queue);
  }

  // Clean up completed items
  const filteredQueue = queue.filter(
    (item) => item.status !== 'SUCCESS'
  );
  saveUploadQueue(filteredQueue);

  isProcessing = false;
  return { successCount, failCount };
}

export function removeQueueItem(id: string) {
  const queue = getUploadQueue().filter((item) => item.id !== id);
  saveUploadQueue(queue);
}

export function clearCompletedQueue() {
  const queue = getUploadQueue().filter((item) => item.status !== 'SUCCESS');
  saveUploadQueue(queue);
}

// Auto-register network sync listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Koneksi kembali online, memproses antrean unggah latar belakang...');
    processUploadQueue();
  });

  // Background timer retry every 20 seconds
  setInterval(() => {
    if (navigator.onLine) {
      const pending = getUploadQueue().filter((q) => q.status === 'PENDING' || q.status === 'FAILED');
      if (pending.length > 0) {
        processUploadQueue();
      }
    }
  }, 20000);
}
