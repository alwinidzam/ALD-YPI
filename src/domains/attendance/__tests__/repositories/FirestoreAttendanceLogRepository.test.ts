import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirestoreAttendanceLogRepository } from '../../repositories/FirestoreAttendanceLogRepository';

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
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    Timestamp
  };
});

vi.mock('../../../firebase', () => ({ db: {} }));

import { getDoc, getDocs, setDoc } from 'firebase/firestore';

describe('FirestoreAttendanceLogRepository', () => {
  let repo: FirestoreAttendanceLogRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new FirestoreAttendanceLogRepository();
  });

  it('should findById', async () => {
    const mockSnap = {
      exists: () => true,
      id: 'l1',
      data: () => ({ attendanceId: 'a1', action: 'CHECKED_IN', timestamp: { toDate: () => new Date() } })
    };
    (getDoc as any).mockResolvedValue(mockSnap);

    const result = await repo.findById('l1');
    expect(result?.id).toBe('l1');
  });

  it('should findAll', async () => {
    const mockDocs = [
      { id: 'l1', data: () => ({ attendanceId: 'a1', action: 'CHECKED_IN', timestamp: { toDate: () => new Date() } }) }
    ];
    (getDocs as any).mockResolvedValue({ docs: mockDocs });

    const results = await repo.findAll({ attendanceId: 'a1' });
    expect(results).toHaveLength(1);
  });
});
