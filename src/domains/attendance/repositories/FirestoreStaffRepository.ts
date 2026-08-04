import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase'; // Main firebase instance
import { Staff, StaffStatus } from '../types';
import { StaffRepository, StaffQueryOptions } from './StaffRepository';
import { StaffMapper } from '../mappers/StaffMapper';
import { StaffDTO } from '../dto/StaffDTO';
import { ATTENDANCE_CONSTANTS } from '../constants';

const COLLECTION_NAME = 'staff';

export class FirestoreStaffRepository implements StaffRepository {
  
  async findById(id: string): Promise<Staff | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    
    return StaffMapper.toDomain(snap.id, snap.data() as StaffDTO);
  }

  async findAll(options?: StaffQueryOptions): Promise<Staff[]> {
    let q = query(collection(db, COLLECTION_NAME));

    if (options) {
      if (options.institutionId) {
        q = query(q, where('institutions', 'array-contains', options.institutionId));
      }
      if (options.employmentStatus) {
        q = query(q, where('employmentStatus', '==', options.employmentStatus));
      }
      if (options.isDeleted !== undefined) {
        q = query(q, where('isDeleted', '==', options.isDeleted));
      }
      // Note: We might need a composite index for this in firestore depending on combinations
    }

    const snap = await getDocs(q);
    return snap.docs.map(doc => StaffMapper.toDomain(doc.id, doc.data() as StaffDTO));
  }

  async create(staff: Omit<Staff, 'id'>): Promise<Staff> {
    const docRef = doc(collection(db, COLLECTION_NAME)); // Auto-generated ID
    
    // Convert Dates to Firestore Timestamps for the DTO
    const staffWithTimestamps = {
      ...staff,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const dto = StaffMapper.toDTO(staffWithTimestamps);
    await setDoc(docRef, dto);

    // Fetch back to get the actual server timestamps if needed, or just return merged
    // For now we return the merged object with the new ID
    return {
      ...staff,
      id: docRef.id,
      createdAt: new Date(), // Approximate until fetched again
      updatedAt: new Date(),
    };
  }

  async update(id: string, staffUpdate: Partial<Omit<Staff, 'id'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    const updateData: Record<string, any> = {
      ...staffUpdate,
      updatedAt: serverTimestamp()
    };
    
    // Explicitly handle undefined to null conversions for DTO if needed
    if (staffUpdate.barcodeToken === null as any) {
      updateData.barcodeToken = null;
    }

    await updateDoc(docRef, updateData);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy,
      employmentStatus: 'INACTIVE', // Automatically set to INACTIVE when deleted
      updatedAt: serverTimestamp(),
      updatedBy: deletedBy
    });
  }
}
