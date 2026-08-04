import { collection, doc, getDoc, getDocs, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Attendance } from '../types';
import { AttendanceRepository, AttendanceQueryOptions } from './AttendanceRepository';
import { AttendanceMapper } from '../mappers/AttendanceMapper';
import { AttendanceDTO } from '../dto/AttendanceDTO';

const COLLECTION_NAME = 'attendance';

export class FirestoreAttendanceRepository implements AttendanceRepository {
  async findById(id: string): Promise<Attendance | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return AttendanceMapper.toDomain(snap.id, snap.data() as AttendanceDTO);
  }

  async findByStaffAndDate(staffId: string, date: string): Promise<Attendance | null> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('staffId', '==', staffId),
      where('date', '==', date)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return AttendanceMapper.toDomain(snap.docs[0].id, snap.docs[0].data() as AttendanceDTO);
  }

  async findAll(options?: AttendanceQueryOptions): Promise<Attendance[]> {
    let q = query(collection(db, COLLECTION_NAME));

    if (options) {
      if (options.staffId) {
        q = query(q, where('staffId', '==', options.staffId));
      }
      if (options.institutionId) {
        q = query(q, where('institutionId', '==', options.institutionId));
      }
      if (options.date) {
        q = query(q, where('date', '==', options.date));
      }
      if (options.dateStart) {
        q = query(q, where('date', '>=', options.dateStart));
      }
      if (options.dateEnd) {
        q = query(q, where('date', '<=', options.dateEnd));
      }
      
      // Order by date desc if searching by staff or institution
      if (options.staffId || options.institutionId) {
        // requires composite indexes!
        // q = query(q, orderBy('date', 'desc'));
      }

      if (options.limit) {
        q = query(q, firestoreLimit(options.limit));
      }
    }

    const snap = await getDocs(q);
    return snap.docs.map(doc => AttendanceMapper.toDomain(doc.id, doc.data() as AttendanceDTO));
  }
}
