// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { AttendancePolicy } from '../policies/AttendancePolicy';
import { ATTENDANCE_CONSTANTS } from '../constants';
import { DuplicateAttendanceError, InactiveStaffError, UnknownBarcodeError, ManualApprovalRequiredError } from '../errors';
import { Staff, Barcode } from '../types';

describe('AttendancePolicy', () => {
  describe('validateDuplicateScan', () => {
    it('should pass if lastScanTime is null', () => {
      expect(() => AttendancePolicy.validateDuplicateScan(null, new Date(), 'S1', '2023-10-10')).not.toThrow();
    });

    it('should throw DuplicateAttendanceError if scan is too soon', () => {
      const now = new Date();
      const last = new Date(now.getTime() - ATTENDANCE_CONSTANTS.DUPLICATE_SCAN_TIMEOUT_MS + 100);
      expect(() => AttendancePolicy.validateDuplicateScan(last, now, 'S1', '2023-10-10')).toThrow(DuplicateAttendanceError);
    });

    it('should pass if scan is after timeout', () => {
      const now = new Date();
      const last = new Date(now.getTime() - ATTENDANCE_CONSTANTS.DUPLICATE_SCAN_TIMEOUT_MS - 100);
      expect(() => AttendancePolicy.validateDuplicateScan(last, now, 'S1', '2023-10-10')).not.toThrow();
    });
  });

  describe('validateStaffActive', () => {
    it('should pass for active staff', () => {
      const staff = { id: 'S1', employmentStatus: 'ACTIVE', isDeleted: false } as Staff;
      expect(() => AttendancePolicy.validateStaffActive(staff)).not.toThrow();
    });

    it('should throw InactiveStaffError if deleted', () => {
      const staff = { id: 'S1', employmentStatus: 'ACTIVE', isDeleted: true } as Staff;
      expect(() => AttendancePolicy.validateStaffActive(staff)).toThrow(InactiveStaffError);
    });

    it('should throw InactiveStaffError if suspended', () => {
      const staff = { id: 'S1', employmentStatus: 'SUSPENDED', isDeleted: false } as Staff;
      expect(() => AttendancePolicy.validateStaffActive(staff)).toThrow(InactiveStaffError);
    });
  });

  describe('validateBarcodeActive', () => {
    it('should pass for active barcode', () => {
      const barcode = { token: 'T1', status: 'ACTIVE' } as Barcode;
      expect(() => AttendancePolicy.validateBarcodeActive(barcode)).not.toThrow();
    });

    it('should throw UnknownBarcodeError if barcode is null', () => {
      expect(() => AttendancePolicy.validateBarcodeActive(null)).toThrow(UnknownBarcodeError);
    });

    it('should throw UnknownBarcodeError if barcode is not active', () => {
      const barcode = { token: 'T1', status: 'DISABLED' } as any;
      expect(() => AttendancePolicy.validateBarcodeActive(barcode)).toThrow(UnknownBarcodeError);
    });
  });

  describe('validateManualApproval', () => {
    it('should pass with valid reason and operator', () => {
      expect(() => AttendancePolicy.validateManualApproval('Forgot card', 'OP1')).not.toThrow();
    });

    it('should throw ManualApprovalRequiredError if reason missing', () => {
      expect(() => AttendancePolicy.validateManualApproval('', 'OP1')).toThrow(ManualApprovalRequiredError);
      expect(() => AttendancePolicy.validateManualApproval(undefined, 'OP1')).toThrow(ManualApprovalRequiredError);
    });

    it('should throw ManualApprovalRequiredError if operator missing', () => {
      expect(() => AttendancePolicy.validateManualApproval('Forgot card', '')).toThrow(ManualApprovalRequiredError);
      expect(() => AttendancePolicy.validateManualApproval('Forgot card', undefined)).toThrow(ManualApprovalRequiredError);
    });
  });
});
