import { Attendance } from '../types';
import { ValidationFailedError } from '../errors';

export class AttendanceValidator {
  static validateForCreate(attendance: Omit<Attendance, 'id'>): void {
    const errors: string[] = [];

    if (!attendance.staffId) errors.push('Staff ID is required.');
    if (!attendance.barcodeId) errors.push('Barcode ID is required.');
    if (!attendance.institutions || attendance.institutions.length === 0) errors.push('Institutions are required.');
    if (!attendance.primaryInstitution) errors.push('Primary Institution is required.');
    if (!attendance.date) errors.push('Date is required.');
    if (!attendance.status) errors.push('Status is required.');
    if (!attendance.source) errors.push('Source is required.');
    
    if (attendance.status === 'MANUAL') {
      if (!attendance.manualReason) errors.push('Manual reason is required for manual attendance.');
      if (!attendance.manualApprovedBy) errors.push('Manual approvedBy is required for manual attendance.');
    }

    if (errors.length > 0) {
      throw new ValidationFailedError(errors);
    }
  }

  static validateForUpdate(update: Partial<Omit<Attendance, 'id'>>): void {
    const errors: string[] = [];

    if (update.status === 'MANUAL') {
      if (update.manualReason === undefined || update.manualReason.trim() === '') {
        errors.push('Manual reason is required when transitioning to manual.');
      }
      if (!update.manualApprovedBy) {
        errors.push('Manual approvedBy is required when transitioning to manual.');
      }
    }

    if (errors.length > 0) {
      throw new ValidationFailedError(errors);
    }
  }
}
