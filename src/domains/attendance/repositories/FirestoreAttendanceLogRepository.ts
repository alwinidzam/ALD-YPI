import { collection, doc, getDoc, getDocs, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../../../firebase';
import { AttendanceLog } from '../types';
import { AttendanceLogRepository, AttendanceLogQueryOptions } from './AttendanceLogRepository';
import { AttendanceLogMapper } from '../mappers/AttendanceLogMapper';
import { AttendanceLogDTO } from '../dto/AttendanceLogDTO';

const COLLECTION_NAME = 'attendance_logs';

export class FirestoreAttendanceLogRepository implements AttendanceLogRepository {
  async findById(id: string): Promise<AttendanceLog | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return AttendanceLogMapper.toDomain(snap.id, snap.data() as AttendanceLogDTO);
  }

  async findAll(options?: AttendanceLogQueryOptions): Promise<AttendanceLog[]> {
    let q = query(collection(db, COLLECTION_NAME));

    if (options) {
      if (options.attendanceId) {
        q = query(q, where('attendanceId', '==', options.attendanceId));
      }
      if (options.staffId) {
        q = query(q, where('staffId', '==', options.staffId));
      }
      if (options.barcodeId) {
        q = query(q, where('barcodeId', '==', options.barcodeId));
      }
      
      q = query(q, orderBy('timestamp', 'desc'));

      if (options.limit) {
        q = query(q, firestoreLimit(options.limit));
      }
    }

    const snap = await getDocs(q);
    return snap.docs.map(doc => AttendanceLogMapper.toDomain(doc.id, doc.data() as AttendanceLogDTO));
  }
}
