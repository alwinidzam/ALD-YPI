// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendanceService } from '../services/AttendanceService';
import { AttendanceRepository } from '../repositories/AttendanceRepository';
import { AttendanceTransactionService } from '../services/AttendanceTransactionService';
import { StaffRepository } from '../repositories/StaffRepository';
import { BarcodeRepository } from '../repositories/BarcodeRepository';
import { Staff, Barcode, Attendance } from '../types';
import { UnknownBarcodeError, DuplicateAttendanceError } from '../errors';

describe('AttendanceService', () => {
  let mockAttendanceRepo: AttendanceRepository;
  let mockTransactionService: AttendanceTransactionService;
  let mockStaffRepo: StaffRepository;
  let mockBarcodeRepo: BarcodeRepository;
  let eventDispatcher: ReturnType<typeof vi.fn>;
  
  let service: AttendanceService;

  const validStaff: Staff = {
    id: 'staff-1',
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
    createdBy: 'op',
    updatedBy: 'op',
  };

  const validBarcode: Barcode = {
    id: 'bc-1',
    token: 'TOKEN-123',
    staffId: 'staff-1',
    status: 'ACTIVE',
    printCount: 0,
    issuedAt: new Date(),
    issuedBy: 'op',
    schemaVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'op',
    updatedBy: 'op',
  };

  const validAttendance: Attendance = {
    id: 'staff-1_2023-10-10',
    staffId: 'staff-1',
    barcodeId: 'bc-1',
    institutionId: 'YPI',
    institutionNameSnapshot: 'John Doe',
    date: '2023-10-10',
    status: 'CHECKED_IN',
    source: 'CAMERA',
    checkIn: new Date(),
        staff: validStaff,
    schemaVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'op',
    updatedBy: 'op',
  };

  beforeEach(() => {
    mockAttendanceRepo = {
      findById: vi.fn(),
      findByStaffAndDate: vi.fn(),
    } as any;
    
    mockTransactionService = {
      executeCheckIn: vi.fn(),
      executeCheckOut: vi.fn(),
      executeManual: vi.fn(),
      executeManualUpdate: vi.fn(),
      executeFailedLog: vi.fn(),
    };

    mockStaffRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };

    mockBarcodeRepo = {
      findByToken: vi.fn(),
      findById: vi.fn(),
      findByToken: vi.fn(),
      findActiveByStaffId: vi.fn(),
      createInitialForStaff: vi.fn(),
      regenerate: vi.fn(),
      updateStatus: vi.fn(),
      updatePrintMetadata: vi.fn(),
    };

    eventDispatcher = vi.fn() as unknown as ReturnType<typeof vi.fn>;
    
    service = new AttendanceService(
      mockAttendanceRepo,
      mockTransactionService,
      mockStaffRepo,
      mockBarcodeRepo,
      eventDispatcher as any
    );
  });

  describe('processScan', () => {
    it('should process check-in if no attendance exists today', async () => {
      vi.mocked(mockBarcodeRepo.findByToken).mockResolvedValue(validBarcode);
      vi.mocked(mockStaffRepo.findById).mockResolvedValue(validStaff);
      vi.mocked(mockBarcodeRepo.findByToken).mockResolvedValue(validBarcode);
      vi.mocked(mockAttendanceRepo.findByStaffAndDate).mockResolvedValue(undefined);
      
      vi.mocked(mockTransactionService.executeCheckIn).mockResolvedValue({ attendance: validAttendance, log: {} as any });

      const result = await service.processScan('TOKEN-123', 'CAMERA', 'op-1', 'Operator 1');
      
      expect(result).toEqual(validAttendance);
      expect(mockTransactionService.executeCheckIn).toHaveBeenCalled();
      expect(eventDispatcher).toHaveBeenCalledWith(expect.objectContaining({ type: 'ATTENDANCE_CHECKED_IN' }));
    });

    it('should process check-out if checked in already', async () => {
      vi.mocked(mockBarcodeRepo.findByToken).mockResolvedValue(validBarcode);
      vi.mocked(mockStaffRepo.findById).mockResolvedValue(validStaff);
      vi.mocked(mockAttendanceRepo.findByStaffAndDate).mockResolvedValue({
        ...validAttendance, 
        checkIn: new Date(Date.now() - 1000 * 60 * 60) // 1 hr ago
      });
      
      await service.processScan('TOKEN-123', 'CAMERA', 'op-1', 'Operator 1');
      
      expect(mockTransactionService.executeCheckOut).toHaveBeenCalled();
      expect(eventDispatcher).toHaveBeenCalledWith(expect.objectContaining({ type: 'ATTENDANCE_CHECKED_OUT' }));
    });

    it('should throw UnknownBarcodeError if barcode not found and log failure', async () => {
      vi.mocked(mockBarcodeRepo.findByToken).mockResolvedValue(null);
      vi.mocked(mockStaffRepo.findAll).mockResolvedValue([]);
      
      await expect(service.processScan('INVALID', 'CAMERA', 'op-1', 'Operator 1'))
        .rejects.toThrow(UnknownBarcodeError);
        
      expect(mockTransactionService.executeFailedLog).toHaveBeenCalled();
    });
    
    it('should throw DuplicateAttendanceError if scanned too soon', async () => {
      vi.mocked(mockBarcodeRepo.findByToken).mockResolvedValue(validBarcode);
      vi.mocked(mockStaffRepo.findById).mockResolvedValue(validStaff);
      vi.mocked(mockAttendanceRepo.findByStaffAndDate).mockResolvedValue({
        ...validAttendance, 
        checkIn: new Date(),
        staff: validStaff // just checked in
      });
      
      await expect(service.processScan('TOKEN-123', 'CAMERA', 'op-1', 'Operator 1'))
        .rejects.toThrow(DuplicateAttendanceError);
    });
  });

  describe('processManualAttendance', () => {
    it('should create new manual attendance if none exists', async () => {
      vi.mocked(mockStaffRepo.findById).mockResolvedValue(validStaff);
      vi.mocked(mockAttendanceRepo.findByStaffAndDate).mockResolvedValue(null);
      vi.mocked(mockTransactionService.executeManual).mockResolvedValue({ attendance: { ...validAttendance, status: 'MANUAL' }, log: {} as any });
      
      await service.processManualAttendance('staff-1', '2023-10-10', new Date(), null, 'Forgot card', 'op-1', 'Operator 1');
      
      expect(mockTransactionService.executeManual).toHaveBeenCalled();
      expect(eventDispatcher).toHaveBeenCalledWith(expect.objectContaining({ type: 'ATTENDANCE_MARKED_MANUAL' }));
    });
    
    it('should update existing attendance manually', async () => {
      vi.mocked(mockStaffRepo.findById).mockResolvedValue(validStaff);
      vi.mocked(mockAttendanceRepo.findByStaffAndDate).mockResolvedValue(validAttendance);
      
      await service.processManualAttendance('staff-1', '2023-10-10', null, new Date(), 'System error', 'op-1', 'Operator 1');
      
      expect(mockTransactionService.executeManualUpdate).toHaveBeenCalled();
    });
  });
});
