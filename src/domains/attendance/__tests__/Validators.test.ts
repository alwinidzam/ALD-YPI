// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { StaffValidator } from '../validators/StaffValidator';
import { BarcodeValidator } from '../validators/BarcodeValidator';
import { AttendanceValidator } from '../validators/AttendanceValidator';
import { AttendanceLogValidator } from '../validators/AttendanceLogValidator';
import { ValidationFailedError } from '../errors';

describe('Validators', () => {
  describe('StaffValidator', () => {
    it('should validate valid staff for create', () => {
      expect(() => StaffValidator.validateForCreate({
        fullName: 'John Doe',
        institutions: ['YPI'], primaryInstitution: 'YPI',
        role: 'TEACHER',
        position: 'Guru',
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        schemaVersion: 1,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'op-1',
        updatedBy: 'op-1',
      })).not.toThrow();
    });

    it('should throw if fields are missing', () => {
      expect(() => StaffValidator.validateForCreate({
        fullName: '',
        primaryInstitution: '',
        role: '',
        position: '',
        employmentType: '',
        employmentStatus: 'ACTIVE',
        schemaVersion: 1,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: '',
        updatedBy: 'op-1',
      } as any)).toThrow(ValidationFailedError);
    });

    it('should validate valid staff for update', () => {
      expect(() => StaffValidator.validateForUpdate({
        fullName: 'Jane Doe',
        position: 'Kepsek',
      })).not.toThrow();
    });

    it('should throw if update name or position is empty string', () => {
      expect(() => StaffValidator.validateForUpdate({ fullName: '   ' })).toThrow(ValidationFailedError);
      expect(() => StaffValidator.validateForUpdate({ position: '   ' })).toThrow(ValidationFailedError);
    });

    it('should throw if trying to update isDeleted directly', () => {
      expect(() => StaffValidator.validateForUpdate({
        isDeleted: true,
      })).toThrow(ValidationFailedError);
    });
  });

  describe('BarcodeValidator', () => {
    it('should validate valid barcode for create', () => {
      expect(() => BarcodeValidator.validateForCreate({
        token: 'TOKEN-123',
        staffId: 'staff-1',
        status: 'ACTIVE',
        printCount: 0,
        schemaVersion: 1,
        issuedAt: new Date(),
        issuedBy: 'op-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'op-1',
        updatedBy: 'op-1',
      })).not.toThrow();
    });

    it('should throw if token or other fields missing', () => {
      expect(() => BarcodeValidator.validateForCreate({
        token: '',
        staffId: '',
        status: '' as any,
        printCount: 0,
        schemaVersion: 1,
        issuedAt: new Date(),
        issuedBy: 'op-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: '',
        updatedBy: 'op-1',
      })).toThrow(ValidationFailedError);
    });
  });

  describe('AttendanceValidator', () => {
    it('should validate valid attendance for create', () => {
      expect(() => AttendanceValidator.validateForCreate({
        staffId: 's1',
        barcodeId: 'b1',
        institutions: ['YPI'], primaryInstitution: 'YPI',
        institutionNameSnapshot: 'Inst 1',
        date: '2023-10-10',
        status: 'CHECKED_IN',
        source: 'CAMERA',
        schemaVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'op',
        updatedBy: 'op',
      })).not.toThrow();
    });

    it('should throw if fields missing', () => {
      expect(() => AttendanceValidator.validateForCreate({} as any)).toThrow(ValidationFailedError);
    });

    it('should throw if manual attendance misses reason or approvedBy', () => {
      expect(() => AttendanceValidator.validateForCreate({
        staffId: 's1',
        barcodeId: 'b1',
        institutions: ['YPI'], primaryInstitution: 'YPI',
        institutionNameSnapshot: 'Inst 1',
        date: '2023-10-10',
        status: 'MANUAL',
        source: 'MANUAL',
        schemaVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'op',
        updatedBy: 'op',
      })).toThrow(ValidationFailedError);
    });

    it('should throw if update to manual misses fields', () => {
      expect(() => AttendanceValidator.validateForUpdate({
        status: 'MANUAL',
        manualReason: '',
      })).toThrow(ValidationFailedError);
      
      expect(() => AttendanceValidator.validateForUpdate({
        status: 'MANUAL',
        manualReason: 'valid',
        manualApprovedBy: '',
      })).toThrow(ValidationFailedError);
    });
  });

  describe('AttendanceLogValidator', () => {
    it('should validate valid log for create', () => {
      expect(() => AttendanceLogValidator.validateForCreate({
        action: 'ATTENDANCE_CHECK_IN',
        operatorId: 'op1',
        operatorNameSnapshot: 'Op 1',
        validationResult: 'VALID',
        timestamp: new Date(),
        schemaVersion: 1,
      })).not.toThrow();
    });

    it('should throw if fields missing', () => {
      expect(() => AttendanceLogValidator.validateForCreate({} as any)).toThrow(ValidationFailedError);
    });

    it('should throw if validation is INVALID but no reason', () => {
      expect(() => AttendanceLogValidator.validateForCreate({
        action: 'ATTENDANCE_CHECK_IN',
        operatorId: 'op1',
        operatorNameSnapshot: 'Op 1',
        validationResult: 'INVALID_TOKEN',
        timestamp: new Date(),
        schemaVersion: 1,
      })).toThrow(ValidationFailedError);
    });
  });
});
