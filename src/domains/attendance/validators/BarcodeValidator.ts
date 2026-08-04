import { Barcode } from '../types';
import { ValidationFailedError } from '../errors';

export class BarcodeValidator {
  static validateForCreate(barcode: Omit<Barcode, 'id'>): void {
    const errors: string[] = [];

    if (!barcode.token || barcode.token.trim().length === 0) {
      errors.push('Barcode token is required.');
    }

    if (!barcode.staffId) {
      errors.push('Staff ID is required.');
    }

    if (!barcode.status) {
      errors.push('Status is required.');
    }

    if (!barcode.createdBy) {
      errors.push('CreatedBy is required for audit logs.');
    }

    if (errors.length > 0) {
      throw new ValidationFailedError(errors);
    }
  }
}
