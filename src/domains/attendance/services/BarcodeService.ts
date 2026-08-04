import { Barcode } from '../types';
import { BarcodeRepository } from '../repositories/BarcodeRepository';
import { BarcodeValidator } from '../validators/BarcodeValidator';
import { ATTENDANCE_CONSTANTS } from '../constants';

export class BarcodeService {
  constructor(private barcodeRepository: BarcodeRepository) {}

  private generateSecureToken(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid visually similar characters
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    let randomPart = '';
    for (let i = 0; i < bytes.length; i++) {
      randomPart += alphabet[bytes[i] % alphabet.length];
    }
    return `${ATTENDANCE_CONSTANTS.BARCODE_PREFIX}-${randomPart}`;
  }

  private async generateUniqueToken(): Promise<string> {
    for (let i = 0; i < ATTENDANCE_CONSTANTS.MAX_BARCODE_REGENERATION_ATTEMPTS; i++) {
      const token = this.generateSecureToken();
      const existing = await this.barcodeRepository.findByToken(token);
      if (!existing) {
        return token;
      }
    }
    throw new Error('Failed to generate a unique barcode token after maximum attempts. Please try again.');
  }

  async getBarcodeById(id: string): Promise<Barcode | null> {
    return this.barcodeRepository.findById(id);
  }

  async getBarcodeByToken(token: string): Promise<Barcode | null> {
    return this.barcodeRepository.findByToken(token);
  }

  async getActiveBarcodeForStaff(staffId: string): Promise<Barcode | null> {
    return this.barcodeRepository.findActiveByStaffId(staffId);
  }

  async generateForStaff(staffId: string, operatorId: string): Promise<Barcode> {
    const existingActive = await this.barcodeRepository.findActiveByStaffId(staffId);
    if (existingActive) {
      throw new Error(`Staff ${staffId} already has an active barcode.`);
    }

    const token = await this.generateUniqueToken();

    const newBarcode: Omit<Barcode, 'id'> = {
      schemaVersion: ATTENDANCE_CONSTANTS.SCHEMA_VERSION_BARCODE,
      token,
      staffId,
      status: 'ACTIVE',
      
      issuedAt: new Date(),
      issuedBy: operatorId,
      printCount: 0,
      
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorId,
      updatedBy: operatorId,
    };

    BarcodeValidator.validateForCreate(newBarcode);

    return this.barcodeRepository.createInitialForStaff(newBarcode);
  }

  async regenerateForStaff(staffId: string, operatorId: string): Promise<Barcode> {
    const oldBarcode = await this.barcodeRepository.findActiveByStaffId(staffId);
    if (!oldBarcode) {
      throw new Error(`Staff ${staffId} does not have an active barcode to regenerate. Use generateForStaff instead.`);
    }

    const token = await this.generateUniqueToken();

    const newBarcode: Omit<Barcode, 'id'> = {
      schemaVersion: ATTENDANCE_CONSTANTS.SCHEMA_VERSION_BARCODE,
      token,
      staffId,
      status: 'ACTIVE',
      
      issuedAt: new Date(),
      issuedBy: operatorId,
      printCount: 0,
      
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorId,
      updatedBy: operatorId,
    };

    BarcodeValidator.validateForCreate(newBarcode);

    return this.barcodeRepository.regenerate(oldBarcode.id, newBarcode, operatorId);
  }

  async invalidateBarcode(barcodeId: string, operatorId: string, reason: 'LOST' | 'DISABLED' | 'EXPIRED' = 'DISABLED'): Promise<void> {
    const barcode = await this.barcodeRepository.findById(barcodeId);
    if (!barcode) {
      throw new Error(`Barcode with ID ${barcodeId} not found.`);
    }
    
    if (barcode.status !== 'ACTIVE') {
      throw new Error(`Barcode is already in status: ${barcode.status}`);
    }

    await this.barcodeRepository.updateStatus(barcodeId, reason, operatorId);
  }

  async recordPrint(barcodeId: string, operatorId: string): Promise<void> {
    await this.barcodeRepository.updatePrintMetadata(barcodeId, operatorId);
  }
}
