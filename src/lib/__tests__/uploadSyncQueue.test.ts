import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enqueueDocumentUpload, getUploadQueue, saveUploadQueue, processUploadQueue } from '../uploadSyncQueue';
import { User, DocumentMetadata } from '../../types';

vi.mock('../../firebase', () => ({
  dbSaveDocument: vi.fn().mockResolvedValue(true)
}));

describe('uploadSyncQueue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('enqueueDocumentUpload adds item to queue', () => {
    const user: User = { id: '1', name: 'Test', username: 'test', role: 'SUPER_ADMIN', status: 'ACTIVE', passwordHash: 'hash' };
    const docMeta = { id: '1', title: 'Test' } as unknown as DocumentMetadata;
    
    enqueueDocumentUpload(docMeta, 'data:image/png;base64,...', user);
    
    const queue = getUploadQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe('DOCUMENT');
    expect(queue[0].user.id).toBe('1');
  });
});
