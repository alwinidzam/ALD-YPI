import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../../../firebase'; 
import { Barcode, BarcodeStatus } from '../types';
import { BarcodeRepository } from './BarcodeRepository';
import { BarcodeMapper } from '../mappers/BarcodeMapper';
import { BarcodeDTO } from '../dto/BarcodeDTO';

const COLLECTION_NAME = 'barcodes';
const STAFF_COLLECTION_NAME = 'staff';

export class FirestoreBarcodeRepository implements BarcodeRepository {
  async findById(id: string): Promise<Barcode | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return BarcodeMapper.toDomain(snap.id, snap.data() as BarcodeDTO);
  }

  async findByToken(token: string): Promise<Barcode | null> {
    const q = query(collection(db, COLLECTION_NAME), where('token', '==', token));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return BarcodeMapper.toDomain(snap.docs[0].id, snap.docs[0].data() as BarcodeDTO);
  }

  async findActiveByStaffId(staffId: string): Promise<Barcode | null> {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('staffId', '==', staffId), 
      where('status', '==', 'ACTIVE')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return BarcodeMapper.toDomain(snap.docs[0].id, snap.docs[0].data() as BarcodeDTO);
  }

  async createInitialForStaff(barcode: Omit<Barcode, 'id'>): Promise<Barcode> {
    const newBarcodeRef = doc(collection(db, COLLECTION_NAME));
    const staffRef = doc(db, STAFF_COLLECTION_NAME, barcode.staffId);
    
    await runTransaction(db, async (tx) => {
      const staffSnap = await tx.get(staffRef);
      if (!staffSnap.exists()) {
        throw new Error(`Staff with ID ${barcode.staffId} not found.`);
      }
      
      const barcodeWithTimestamps = {
        ...barcode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const dto = BarcodeMapper.toDTO(barcodeWithTimestamps);
      
      tx.set(newBarcodeRef, dto);
      tx.update(staffRef, { 
        activeBarcodeId: newBarcodeRef.id,
        updatedAt: serverTimestamp(),
        updatedBy: barcode.createdBy
      });
    });

    return {
      ...barcode,
      id: newBarcodeRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async regenerate(
    oldBarcodeId: string, 
    newBarcode: Omit<Barcode, 'id'>, 
    operatorId: string
  ): Promise<Barcode> {
    const oldBarcodeRef = doc(db, COLLECTION_NAME, oldBarcodeId);
    const newBarcodeRef = doc(collection(db, COLLECTION_NAME));
    const staffRef = doc(db, STAFF_COLLECTION_NAME, newBarcode.staffId);

    await runTransaction(db, async (tx) => {
      const oldSnap = await tx.get(oldBarcodeRef);
      const staffSnap = await tx.get(staffRef);

      if (!oldSnap.exists()) throw new Error("Old barcode not found.");
      if (!staffSnap.exists()) throw new Error("Staff not found.");

      const oldData = oldSnap.data() as BarcodeDTO;
      if (oldData.status !== 'ACTIVE') {
        throw new Error("Old barcode is not active and cannot be regenerated.");
      }

      // Update old barcode
      tx.update(oldBarcodeRef, {
        status: 'REGENERATED',
        invalidatedAt: serverTimestamp(),
        replacedByBarcodeId: newBarcodeRef.id,
        updatedAt: serverTimestamp(),
        updatedBy: operatorId
      });

      // Create new barcode
      const newBarcodeWithTimestamps = {
        ...newBarcode,
        previousBarcodeId: oldBarcodeId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const newDto = BarcodeMapper.toDTO(newBarcodeWithTimestamps);
      tx.set(newBarcodeRef, newDto);

      // Update staff
      tx.update(staffRef, {
        activeBarcodeId: newBarcodeRef.id,
        updatedAt: serverTimestamp(),
        updatedBy: operatorId
      });
    });

    return {
      ...newBarcode,
      id: newBarcodeRef.id,
      previousBarcodeId: oldBarcodeId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updatePrintMetadata(id: string, operatorId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists()) throw new Error(`Barcode with ID ${id} not found.`);
      
      const data = snap.data() as BarcodeDTO;
      const newPrintCount = (data.printCount || 0) + 1;
      
      tx.update(docRef, {
        printCount: newPrintCount,
        lastPrintedAt: serverTimestamp(),
        printedAt: data.printedAt ? data.printedAt : serverTimestamp(), // Set initial print if first time
        updatedAt: serverTimestamp(),
        updatedBy: operatorId
      });
    });
  }

  async updateStatus(id: string, status: BarcodeStatus, operatorId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: operatorId
    };

    if (status === 'DISABLED' || status === 'EXPIRED' || status === 'LOST') {
      updateData.invalidatedAt = serverTimestamp();
    }

    await updateDoc(docRef, updateData);
  }
}
