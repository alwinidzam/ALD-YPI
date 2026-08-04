import { Barcode, BarcodeStatus } from '../types';

export interface BarcodeRepository {
  findById(id: string): Promise<Barcode | null>;
  findByToken(token: string): Promise<Barcode | null>;
  findActiveByStaffId(staffId: string): Promise<Barcode | null>;
  
  // Transactional operations
  createInitialForStaff(barcode: Omit<Barcode, 'id'>): Promise<Barcode>;
  
  regenerate(
    oldBarcodeId: string, 
    newBarcode: Omit<Barcode, 'id'>, 
    operatorId: string
  ): Promise<Barcode>;

  updatePrintMetadata(id: string, operatorId: string): Promise<void>;
  updateStatus(id: string, status: BarcodeStatus, operatorId: string): Promise<void>;
}
