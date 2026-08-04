// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirestoreStaffRepository } from '../../repositories/FirestoreStaffRepository';

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
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    Timestamp
  };
});

// Mock db
vi.mock('../../../firebase', () => ({
  db: {}
}));

import { doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

describe('FirestoreStaffRepository', () => {
  let repo: FirestoreStaffRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new FirestoreStaffRepository();
  });

  it('should findById and return mapped Staff', async () => {
    const mockSnap = {
      exists: () => true,
      id: 'staff1',
      data: () => ({
        fullName: 'John',
        createdAt: { toDate: () => new Date('2023-01-01') },
        updatedAt: { toDate: () => new Date('2023-01-01') },
      })
    };
    (getDoc as any).mockResolvedValue(mockSnap);

    const staff = await repo.findById('staff1');
    expect(staff).toBeDefined();
    expect(staff?.id).toBe('staff1');
    expect(staff?.fullName).toBe('John');
  });

  it('should return null if findById not exists', async () => {
    const mockSnap = { exists: () => false };
    (getDoc as any).mockResolvedValue(mockSnap);

    const staff = await repo.findById('staff1');
    expect(staff).toBeNull();
  });

  it('should findAll with query options', async () => {
    const mockDocs = [
      { id: 's1', data: () => ({ fullName: 'John', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) },
      { id: 's2', data: () => ({ fullName: 'Jane', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) }
    ];
    (getDocs as any).mockResolvedValue({ docs: mockDocs });

    const results = await repo.findAll({ institutionId: 'YPI', status: 'ACTIVE', isDeleted: false });
    expect(results).toHaveLength(2);
    expect(getDocs).toHaveBeenCalled();
  });

  it('should create staff', async () => {
    (doc as any).mockReturnValue({ id: 'new-id' });
    (setDoc as any).mockResolvedValue(undefined);

    const staff = await repo.create({
      fullName: 'John',
      institutionId: 'YPI',
      role: 'TEACHER',
      position: 'Guru',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      schemaVersion: 1,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'op',
      updatedBy: 'op'
    });

    expect(setDoc).toHaveBeenCalled();
    expect(staff.id).toBe('new-id');
    expect(staff.fullName).toBe('John');
  });

  it('should update staff', async () => {
    (updateDoc as any).mockResolvedValue(undefined);

    await repo.update('s1', { fullName: 'Jane', activeBarcodeId: null });
    expect(updateDoc).toHaveBeenCalled();
  });

  it('should soft delete staff', async () => {
    (updateDoc as any).mockResolvedValue(undefined);

    await repo.softDelete('s1', 'op');
    expect(updateDoc).toHaveBeenCalled();
  });
});
