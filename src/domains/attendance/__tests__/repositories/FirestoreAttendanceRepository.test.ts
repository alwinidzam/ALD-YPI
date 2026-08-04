import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirestoreAttendanceRepository } from '../../repositories/FirestoreAttendanceRepository';
import { AttendanceMapper } from '../../mappers/AttendanceMapper';

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
    orderBy: vi.fn(),
    limit: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    Timestamp
  };
});

vi.mock('../../../firebase', () => ({ db: {} }));

import { getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

describe('FirestoreAttendanceRepository', () => {
  let repo: FirestoreAttendanceRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new FirestoreAttendanceRepository();
  });

  it('should findById', async () => {
    const mockSnap = {
      exists: () => true,
      id: 'a1',
      data: () => ({ staffId: 's1', status: 'CHECKED_IN', timestamp: { toDate: () => new Date() } })
    };
    (getDoc as any).mockResolvedValue(mockSnap);

    const result = await repo.findById('a1');
    expect(result?.id).toBe('a1');
  });

  it('should findByStaffAndDate', async () => {
    const mockDocs = [
      { id: 'a1', data: () => ({ staffId: 's1', status: 'CHECKED_IN', timestamp: { toDate: () => new Date() } }) }
    ];
    (getDocs as any).mockResolvedValue({ empty: false, docs: mockDocs });

    const result = await repo.findByStaffAndDate('s1', '2023-01-01');
    expect(result?.id).toBe('a1');
  });

  it('should findByDateRange', async () => {
    const mockDocs = [
      { id: 'a1', data: () => ({ staffId: 's1', status: 'CHECKED_IN', timestamp: { toDate: () => new Date() } }) }
    ];
    (getDocs as any).mockResolvedValue({ docs: mockDocs });

    const results = await repo.findAll({ dateStart: '2023-01-01', dateEnd: '2023-12-31' });
    expect(results).toHaveLength(1);
  });
});
