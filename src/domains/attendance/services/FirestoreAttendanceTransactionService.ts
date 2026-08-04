import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Attendance, AttendanceLog } from '../types';
import { AttendanceTransactionService } from './AttendanceTransactionService';
import { AttendanceMapper } from '../mappers/AttendanceMapper';
import { AttendanceLogMapper } from '../mappers/AttendanceLogMapper';

const ATTENDANCE_COLLECTION = 'attendance';
const LOG_COLLECTION = 'attendance_logs';

export class FirestoreAttendanceTransactionService implements AttendanceTransactionService {
  
  async executeCheckIn(
    attendance: Omit<Attendance, 'id'>, 
    log: Omit<AttendanceLog, 'id'>,
    attendanceId: string
  ): Promise<{ attendance: Attendance, log: AttendanceLog }> {
    const attendanceRef = doc(db, ATTENDANCE_COLLECTION, attendanceId);
    const logRef = doc(collection(db, LOG_COLLECTION));

    await runTransaction(db, async (tx) => {
      // In a more complex setup, we might re-read the staff and barcode here to ensure they haven't been deleted 
      // strictly during this millisecond. For now, we trust the policies checked by the service beforehand, 
      // or we can add reads here if necessary. The architecture prompt focuses on transaction boundaries for attendance.
      
      const snap = await tx.get(attendanceRef);
      if (snap.exists()) {
        throw new Error(`Attendance record ${attendanceId} already exists for this date.`);
      }

      const attWithTimestamps = {
        ...attendance,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const logWithTimestamps = {
        ...log,
        attendanceId,
      };

      tx.set(attendanceRef, AttendanceMapper.toDTO(attWithTimestamps));
      tx.set(logRef, AttendanceLogMapper.toDTO(logWithTimestamps));
    });

    return {
      attendance: { ...attendance, id: attendanceId, createdAt: new Date(), updatedAt: new Date() },
      log: { ...log, id: logRef.id, attendanceId }
    };
  }

  async executeCheckOut(
    attendanceId: string, 
    attendanceUpdate: Partial<Omit<Attendance, 'id'>>, 
    log: Omit<AttendanceLog, 'id'>
  ): Promise<{ log: AttendanceLog }> {
    const attendanceRef = doc(db, ATTENDANCE_COLLECTION, attendanceId);
    const logRef = doc(collection(db, LOG_COLLECTION));

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(attendanceRef);
      if (!snap.exists()) {
        throw new Error(`Attendance record ${attendanceId} not found.`);
      }

      const updateData = {
        ...attendanceUpdate,
        updatedAt: serverTimestamp()
      };
      
      const logWithTimestamps = {
        ...log,
        attendanceId,
      };

      tx.update(attendanceRef, updateData);
      tx.set(logRef, AttendanceLogMapper.toDTO(logWithTimestamps));
    });

    return {
      log: { ...log, id: logRef.id, attendanceId }
    };
  }
  
  async executeManual(
    attendance: Omit<Attendance, 'id'>, 
    log: Omit<AttendanceLog, 'id'>,
    attendanceId: string
  ): Promise<{ attendance: Attendance, log: AttendanceLog }> {
    return this.executeCheckIn(attendance, log, attendanceId);
  }
  
  async executeManualUpdate(
    attendanceId: string, 
    attendanceUpdate: Partial<Omit<Attendance, 'id'>>, 
    log: Omit<AttendanceLog, 'id'>
  ): Promise<{ log: AttendanceLog }> {
    return this.executeCheckOut(attendanceId, attendanceUpdate, log);
  }
  
  async executeFailedLog(
    log: Omit<AttendanceLog, 'id'>
  ): Promise<{ log: AttendanceLog }> {
    // This doesn't strictly need a transaction since it's a single document insert,
    // but we use one for consistency if needed, or just standard addDoc.
    const logRef = doc(collection(db, LOG_COLLECTION));
    await runTransaction(db, async (tx) => {
      tx.set(logRef, AttendanceLogMapper.toDTO(log));
    });
    return {
      log: { ...log, id: logRef.id }
    };
  }
}
