import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirestoreAttendanceQueryService } from '../../services/FirestoreAttendanceQueryService';

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
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    Timestamp
  };
});

vi.mock('../../../firebase', () => ({ db: {} }));

import { onSnapshot } from 'firebase/firestore';

describe('FirestoreAttendanceQueryService', () => {
  let service: FirestoreAttendanceQueryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FirestoreAttendanceQueryService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should observe today attendances and call callback with mapped data', () => {
    const mockUnsubscribe = vi.fn();
    (onSnapshot as any).mockImplementation((q: any, cb: any, errCb: any) => {
      // Simulate successful snapshot
      const mockSnapshot = {
        docs: [
          { id: 'a1', data: () => ({ staffId: 's1', status: 'CHECKED_IN', timestamp: { toDate: () => new Date() } }) }
        ]
      };
      cb(mockSnapshot);
      return mockUnsubscribe;
    });

    const callback = vi.fn();
    const unsub = service.observeTodayAttendances('2023-01-01', callback);

    expect(unsub).toBe(mockUnsubscribe);
    expect(callback).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'a1' })
    ]));
  });

  it('should handle errors gracefully in onSnapshot', () => {
    const mockUnsubscribe = vi.fn();
    (onSnapshot as any).mockImplementation((q: any, cb: any, errCb: any) => {
      // Simulate error
      errCb(new Error('Test error'));
      return mockUnsubscribe;
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const callback = vi.fn();
    
    const unsub = service.observeTodayAttendances('2023-01-01', callback);

    expect(unsub).toBe(mockUnsubscribe);
    expect(consoleSpy).toHaveBeenCalledWith('Error observing attendances:', expect.any(Error));
    expect(callback).toHaveBeenCalledWith([]);
  });
});
