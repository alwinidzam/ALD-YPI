import { ATTENDANCE_CONSTANTS } from '../constants';
import { Staff, Barcode } from '../types';
import { DuplicateAttendanceError, InactiveStaffError, ManualApprovalRequiredError, UnknownBarcodeError } from '../errors';

export class AttendancePolicy {
  static validateDuplicateScan(lastScanTime: Date | null, currentTime: Date, staffId: string, date: string): void {
    if (!lastScanTime) return;
    const diff = currentTime.getTime() - lastScanTime.getTime();
    if (diff < ATTENDANCE_CONSTANTS.DUPLICATE_SCAN_TIMEOUT_MS) {
      throw new DuplicateAttendanceError(staffId, date);
    }
  }

  static validateStaffActive(staff: Staff): void {
    if (staff.isDeleted || staff.employmentStatus !== 'ACTIVE') {
      throw new InactiveStaffError(staff.id);
    }
  }

  static validateBarcodeActive(barcode: Barcode | null, token: string = 'MISSING'): void {
    if (!barcode) {
      throw new UnknownBarcodeError(token);
    }
    if (barcode.status !== 'ACTIVE') {
      throw new UnknownBarcodeError(barcode.token);
    }
  }

  static validateManualApproval(reason?: string, approvedBy?: string): void {
    if (!reason || reason.trim() === '' || !approvedBy || approvedBy.trim() === '') {
      throw new ManualApprovalRequiredError();
    }
  }
}
