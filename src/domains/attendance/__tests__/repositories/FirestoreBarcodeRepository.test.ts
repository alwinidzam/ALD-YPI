import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirestoreBarcodeRepository } from '../../repositories/FirestoreBarcodeRepository';

// Mock Firebase
vi.mock('firebase/firestore', () => {
  class Timestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    toDate() { return new Date(this.seconds * 1000); }
    static now() { return new Timestamp(Date.now() / 1000, 0); }
    static fromDate(d: Date) { return new Timestamp(d.getTime() / 1000, 0); }
  }
  return {
    getFirestore: vi.fn(), initializeFirestore: vi.fn(),
    persistentLocalCache: vi.fn(),
    persistentMultipleTabManager: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(() => ({ id: 'mock-id' })),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    runTransaction: vi.fn().mockImplementation(async (db, cb) => {
      const tx = { get: vi.fn().mockResolvedValue({ exists: () => true }), set: vi.fn(), update: vi.fn() };
      return cb(tx);
    }),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    Timestamp
  };
});

vi.mock('../../../firebase', () => ({ db: {} }));

import { getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

describe('FirestoreBarcodeRepository', () => {
  let repo: FirestoreBarcodeRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new FirestoreBarcodeRepository();
  });

  it('should findById', async () => {
    const mockSnap = {
      exists: () => true,
      id: 'b1',
      data: () => ({ token: 'BC-123', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() }, issuedAt: { toDate: () => new Date() } })
    };
    (getDoc as any).mockResolvedValue(mockSnap);

    const result = await repo.findById('b1');
    expect(result?.id).toBe('b1');
  });

  it('should findByToken', async () => {
    const mockDocs = [
      { id: 'b1', data: () => ({ token: 'BC-123', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() }, issuedAt: { toDate: () => new Date() } }) }
    ];
    (getDocs as any).mockResolvedValue({ empty: false, docs: mockDocs });

    const result = await repo.findByToken('BC-123');
    expect(result?.id).toBe('b1');
  });

  it('should findActiveByStaff', async () => {
    const mockDocs = [
      { id: 'b1', data: () => ({ token: 'BC-123', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() }, issuedAt: { toDate: () => new Date() } }) }
    ];
    (getDocs as any).mockResolvedValue({ empty: false, docs: mockDocs });

    const result = await repo.findActiveByStaffId('staff1');
    expect(result?.id).toBe('b1');
  });

  it('should create barcode', async () => {
    const { runTransaction } = await import('firebase/firestore');

    const result = await repo.createInitialForStaff({
      token: 'BC-123',
      staffId: 'staff1',
      status: 'ACTIVE',
      printCount: 0,
      schemaVersion: 1,
      issuedAt: new Date(),
      issuedBy: 'op',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'op',
      updatedBy: 'op'
    });

    expect(runTransaction).toHaveBeenCalled();
    expect(result.id).toBeDefined();
  });

  it('should update barcode', async () => {
    (updateDoc as any).mockResolvedValue(undefined);

    await repo.updateStatus('b1', 'DISABLED', 'op1');
    expect(updateDoc).toHaveBeenCalled();
  });
});
