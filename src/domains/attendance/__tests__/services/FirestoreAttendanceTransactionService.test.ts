import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirestoreAttendanceTransactionService } from '../../services/FirestoreAttendanceTransactionService';

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
    setLogLevel: vi.fn(),
    persistentLocalCache: vi.fn(),
    persistentMultipleTabManager: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    Timestamp,
    // removed initializeFirestore here
  };
});

vi.mock('../../../firebase', () => ({ db: {} }));

import { runTransaction, doc } from 'firebase/firestore';

describe('FirestoreAttendanceTransactionService', () => {
  let service: FirestoreAttendanceTransactionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FirestoreAttendanceTransactionService();
    
    // We mock doc() to return something with an id
    (doc as any).mockReturnValue({ id: 'mock-id' });
  });

  it('should execute CheckIn transaction successfully', async () => {
    (runTransaction as any).mockImplementation(async (db: any, txCb: any) => {
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: () => false }), // Not exists
        set: vi.fn(),
        update: vi.fn(),
      };
      await txCb(tx);
    });

    const att: any = { staffId: 's1', status: 'CHECKED_IN', timestamp: new Date() };
    const log: any = { action: 'CHECKED_IN', timestamp: new Date() };

    const result = await service.executeCheckIn(att, log, 'att1');
    expect(result.attendance.id).toBe('att1');
    expect(result.log.id).toBe('mock-id');
  });

  it('should fail CheckIn if record already exists', async () => {
    (runTransaction as any).mockImplementation(async (db: any, txCb: any) => {
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: () => true }), // exists!
        set: vi.fn(),
      };
      await txCb(tx);
    });

    const att: any = {};
    const log: any = {};

    await expect(service.executeCheckIn(att, log, 'att1')).rejects.toThrow('already exists for this date');
  });

  it('should execute CheckOut transaction successfully', async () => {
    (runTransaction as any).mockImplementation(async (db: any, txCb: any) => {
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: () => true }), // exists!
        set: vi.fn(),
        update: vi.fn(),
      };
      await txCb(tx);
    });

    const attUpdate: any = { status: 'CHECKED_OUT' };
    const log: any = { action: 'CHECKED_OUT', timestamp: new Date() };

    const result = await service.executeCheckOut('att1', attUpdate, log);
    expect(result.log.id).toBe('mock-id');
  });

  it('should fail CheckOut if record does not exist', async () => {
    (runTransaction as any).mockImplementation(async (db: any, txCb: any) => {
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: () => false }), // Not exists!
      };
      await txCb(tx);
    });

    await expect(service.executeCheckOut('att1', {}, {} as any)).rejects.toThrow('not found');
  });

  it('should execute executeManual as checkin', async () => {
    vi.spyOn(service, 'executeCheckIn').mockResolvedValue({ attendance: {} as any, log: {} as any });
    await service.executeManual({} as any, {} as any, 'att1');
    expect(service.executeCheckIn).toHaveBeenCalled();
  });

  it('should execute executeManualUpdate as checkout', async () => {
    vi.spyOn(service, 'executeCheckOut').mockResolvedValue({ log: {} as any });
    await service.executeManualUpdate('att1', {} as any, {} as any);
    expect(service.executeCheckOut).toHaveBeenCalled();
  });

  it('should execute FailedLog transaction', async () => {
    (runTransaction as any).mockImplementation(async (db: any, txCb: any) => {
      const tx = { set: vi.fn() };
      await txCb(tx);
    });

    const result = await service.executeFailedLog({} as any);
    expect(result.log.id).toBe('mock-id');
  });
});
