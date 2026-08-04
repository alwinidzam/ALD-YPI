import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Attendance } from '../types';
import { AttendanceMapper } from '../mappers/AttendanceMapper';
import { AttendanceDTO } from '../dto/AttendanceDTO';

export class FirestoreAttendanceQueryService {
  /**
   * Observes real-time attendance data for a specific date.
   * Useful for dashboard live updates.
   * @param dateStr ISO date string (YYYY-MM-DD)
   * @param callback Function called with updated attendances
   * @returns Unsubscribe function
   */
  observeTodayAttendances(dateStr: string, callback: (attendances: Attendance[]) => void): () => void {
    const q = query(
      collection(db, 'attendance'),
      where('date', '==', dateStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attendances = snapshot.docs.map(doc => 
        AttendanceMapper.toDomain(doc.id, doc.data() as AttendanceDTO)
      );
      callback(attendances);
    }, (error) => {
      console.error('Error observing attendances:', error);
      callback([]); // Handle error by returning empty or previous state, but we'll just log it for now
    });

    return unsubscribe;
  }
}
