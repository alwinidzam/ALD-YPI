import { InstitutionType } from '../../../types';
import { Attendance, AttendanceLog, AttendanceSource, AttendanceStatus } from '../types';
import { AttendanceRepository } from '../repositories/AttendanceRepository';
import { AttendanceTransactionService } from './AttendanceTransactionService';
import { StaffRepository } from '../repositories/StaffRepository';
import { BarcodeRepository } from '../repositories/BarcodeRepository';
import { AttendanceValidator } from '../validators/AttendanceValidator';
import { AttendanceLogValidator } from '../validators/AttendanceLogValidator';
import { AttendancePolicy } from '../policies/AttendancePolicy';
import { AttendanceStateMachine } from '../state/AttendanceStateMachine';
import { AttendanceUtils } from '../utils/AttendanceUtils';
import { ATTENDANCE_CONSTANTS } from '../constants';
import { 
  AttendanceCheckedInEvent, 
  AttendanceCheckedOutEvent, 
  AttendanceMarkedManualEvent,
  AttendanceEvent
} from '../events/AttendanceEvents';

// An event bus or dispatcher could be injected here in a real system.
// For now, we'll just log or return the events.

export class AttendanceService {
  constructor(
    private attendanceRepo: AttendanceRepository,
    private transactionService: AttendanceTransactionService,
    private staffRepo: StaffRepository,
    private barcodeRepo: BarcodeRepository,
    private eventDispatcher: (event: AttendanceEvent) => void = () => {} // Default no-op
  ) {}

  async processScan(
    barcodeToken: string, 
    source: AttendanceSource, 
    operatorId: string, 
    operatorNameSnapshot: string
  ): Promise<Attendance> {
    const timestamp = new Date();
    
    try {
      let barcode = await this.barcodeRepo.findByToken(barcodeToken);
      let staff: any = null;

      if (!barcode) {
        // Fallback: check if the input token is a direct staff ID
        const allStaff = await this.staffRepo.findAll();
        staff = allStaff.find(s => s.barcodeToken === barcodeToken || s.id === barcodeToken);
        if (staff) {
          barcode = await this.barcodeRepo.findActiveByStaffId(staff.id);
          if (!barcode) {
            // Auto-provision an active barcode if none exists for this staff member
            const generatedToken = `ALD-${staff.primaryInstitution}-${staff.id.substring(0, 6).toUpperCase()}`;
            barcode = await this.barcodeRepo.createInitialForStaff({
              schemaVersion: 1,
              token: generatedToken,
              staffId: staff.id,
              status: 'ACTIVE',
              printCount: 0,
              createdBy: operatorId,
              updatedBy: operatorId,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        } else {
          AttendancePolicy.validateBarcodeActive(null, barcodeToken);
        }
      } else {
        staff = await this.staffRepo.findById(barcode.staffId);
      }

      if (!staff) throw new Error(`Staff not found for barcode ${barcodeToken}`);
      AttendancePolicy.validateStaffActive(staff);

      const dateStr = AttendanceUtils.getWIBDateString(timestamp);
      const existingAttendance = await this.attendanceRepo.findByStaffAndDate(staff.id, dateStr);

      const toStatus: AttendanceStatus = existingAttendance ? 'CHECKED_OUT' : 'CHECKED_IN';
      
      AttendanceStateMachine.validateTransition(
        existingAttendance ? existingAttendance.status : null, 
        toStatus
      );

      if (existingAttendance && existingAttendance.checkIn) {
        AttendancePolicy.validateDuplicateScan(
          existingAttendance.checkIn, 
          timestamp, 
          staff.id, 
          dateStr
        );
      }
      
      if (toStatus === 'CHECKED_IN') {
        return await this.executeCheckIn(
          staff.id, barcode!.id, staff.primaryInstitution, staff.institutions, staff.fullName, dateStr, timestamp, source, operatorId, operatorNameSnapshot
        );
      } else {
        return await this.executeCheckOut(
          existingAttendance!, timestamp, source, operatorId, operatorNameSnapshot
        );
      }
      
    } catch (error: any) {
      await this.logFailure(
        error.message, 
        'ATTENDANCE_CHECK_IN', 
        operatorId, 
        operatorNameSnapshot, 
        timestamp
      );
      throw error;
    }
  }

  private async executeCheckIn(
    staffId: string, 
    barcodeId: string, 
    primaryInstitution: InstitutionType,
    institutions: InstitutionType[],
    institutionNameSnapshot: string,
    dateStr: string, 
    timestamp: Date, 
    source: AttendanceSource,
    operatorId: string,
    operatorNameSnapshot: string
  ): Promise<Attendance> {
    const attendanceId = AttendanceUtils.generateAttendanceId(staffId, dateStr);
    
    const attendance: Omit<Attendance, 'id'> = {
      schemaVersion: ATTENDANCE_CONSTANTS.SCHEMA_VERSION_ATTENDANCE,
      staffId,
      barcodeId,
      primaryInstitution,
      institutions,
      institutionNameSnapshot,
      date: dateStr,
      checkIn: timestamp,
      status: 'CHECKED_IN',
      source,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: operatorId,
      updatedBy: operatorId,
    };
    
    AttendanceValidator.validateForCreate(attendance);

    const log: Omit<AttendanceLog, 'id'> = {
      schemaVersion: ATTENDANCE_CONSTANTS.SCHEMA_VERSION_ATTENDANCE_LOG,
      staffId,
      barcodeId,
      action: 'ATTENDANCE_CHECK_IN',
      timestamp,
      operatorId,
      operatorNameSnapshot,
      validationResult: 'VALID',
    };
    
    AttendanceLogValidator.validateForCreate(log);

    const result = await this.transactionService.executeCheckIn(attendance, log, attendanceId);
    
    this.eventDispatcher({
      eventId: AttendanceUtils.generateEventId(),
      type: 'ATTENDANCE_CHECKED_IN',
      timestamp,
      staffId,
      attendanceId,
      source
    } as AttendanceCheckedInEvent);

    return result.attendance;
  }

  private async executeCheckOut(
    existingAttendance: Attendance,
    timestamp: Date, 
    source: AttendanceSource,
    operatorId: string,
    operatorNameSnapshot: string
  ): Promise<Attendance> {
    const update: Partial<Omit<Attendance, 'id'>> = {
      checkOut: timestamp,
      status: 'CHECKED_OUT',
      updatedBy: operatorId,
    };
    
    AttendanceValidator.validateForUpdate(update);

    const log: Omit<AttendanceLog, 'id'> = {
      schemaVersion: ATTENDANCE_CONSTANTS.SCHEMA_VERSION_ATTENDANCE_LOG,
      staffId: existingAttendance.staffId,
      barcodeId: existingAttendance.barcodeId,
      action: 'ATTENDANCE_CHECK_OUT',
      timestamp,
      operatorId,
      operatorNameSnapshot,
      validationResult: 'VALID',
    };
    
    AttendanceLogValidator.validateForCreate(log);

    await this.transactionService.executeCheckOut(existingAttendance.id, update, log);
    
    const duration = existingAttendance.checkIn ? 
      AttendanceUtils.calculateDurationMs(existingAttendance.checkIn, timestamp) : 0;
    
    this.eventDispatcher({
      eventId: AttendanceUtils.generateEventId(),
      type: 'ATTENDANCE_CHECKED_OUT',
      timestamp,
      staffId: existingAttendance.staffId,
      attendanceId: existingAttendance.id,
      durationMs: duration
    } as AttendanceCheckedOutEvent);

    return { ...existingAttendance, ...update, updatedAt: timestamp };
  }

  async processManualAttendance(
    staffId: string, 
    dateStr: string, 
    checkIn: Date | null,
    checkOut: Date | null,
    reason: string,
    operatorId: string, 
    operatorNameSnapshot: string
  ): Promise<Attendance> {
    const timestamp = new Date();
    
    const staff = await this.staffRepo.findById(staffId);
    if (!staff) throw new Error('Staff not found');
    AttendancePolicy.validateStaffActive(staff);
    AttendancePolicy.validateManualApproval(reason, operatorId);
    
    const barcodeId = staff.barcodeToken || 'MANUAL_NO_BARCODE';

    const existingAttendance = await this.attendanceRepo.findByStaffAndDate(staffId, dateStr);

    if (existingAttendance) {
      AttendanceStateMachine.validateTransition(existingAttendance.status, 'MANUAL');
      
      const update: Partial<Omit<Attendance, 'id'>> = {
        checkIn: checkIn !== null ? checkIn : existingAttendance.checkIn,
        checkOut: checkOut !== null ? checkOut : existingAttendance.checkOut,
        status: 'MANUAL',
        manualReason: reason,
        manualApprovedBy: operatorId,
        manualApprovedAt: timestamp,
        updatedBy: operatorId,
      };

      AttendanceValidator.validateForUpdate(update);

      const log: Omit<AttendanceLog, 'id'> = {
        schemaVersion: ATTENDANCE_CONSTANTS.SCHEMA_VERSION_ATTENDANCE_LOG,
        staffId,
        barcodeId: existingAttendance.barcodeId,
        action: 'ATTENDANCE_MANUAL',
        timestamp,
        operatorId,
        operatorNameSnapshot,
        validationResult: 'VALID',
      };
      AttendanceLogValidator.validateForCreate(log);
      
      await this.transactionService.executeManualUpdate(existingAttendance.id, update, log);
      
      this.eventDispatcher({
        eventId: AttendanceUtils.generateEventId(),
        type: 'ATTENDANCE_MARKED_MANUAL',
        timestamp,
        staffId,
        attendanceId: existingAttendance.id,
        reason,
        approvedBy: operatorId
      } as AttendanceMarkedManualEvent);

      return { ...existingAttendance, ...update, updatedAt: timestamp };
    } else {
      AttendanceStateMachine.validateTransition(null, 'MANUAL');
      
      const attendanceId = AttendanceUtils.generateAttendanceId(staffId, dateStr);
      
      const attendance: Omit<Attendance, 'id'> = {
        schemaVersion: ATTENDANCE_CONSTANTS.SCHEMA_VERSION_ATTENDANCE,
        staffId,
        barcodeId,
        primaryInstitution: staff.primaryInstitution,
        institutions: staff.institutions,
        institutionNameSnapshot: staff.fullName, 
        date: dateStr,
        checkIn: checkIn,
        checkOut: checkOut,
        status: 'MANUAL',
        source: 'MANUAL',
        manualReason: reason,
        manualApprovedBy: operatorId,
        manualApprovedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: operatorId,
        updatedBy: operatorId,
      };
      
      AttendanceValidator.validateForCreate(attendance);

      const log: Omit<AttendanceLog, 'id'> = {
        schemaVersion: ATTENDANCE_CONSTANTS.SCHEMA_VERSION_ATTENDANCE_LOG,
        staffId,
        barcodeId,
        action: 'ATTENDANCE_MANUAL',
        timestamp,
        operatorId,
        operatorNameSnapshot,
        validationResult: 'VALID',
      };
      AttendanceLogValidator.validateForCreate(log);

      const result = await this.transactionService.executeManual(attendance, log, attendanceId);
      
      this.eventDispatcher({
        eventId: AttendanceUtils.generateEventId(),
        type: 'ATTENDANCE_MARKED_MANUAL',
        timestamp,
        staffId,
        attendanceId,
        reason,
        approvedBy: operatorId
      } as AttendanceMarkedManualEvent);

      return result.attendance;
    }
  }

  private async logFailure(
    reason: string, 
    action: 'ATTENDANCE_CHECK_IN' | 'ATTENDANCE_CHECK_OUT', 
    operatorId: string, 
    operatorNameSnapshot: string, 
    timestamp: Date
  ) {
    const log: Omit<AttendanceLog, 'id'> = {
      schemaVersion: ATTENDANCE_CONSTANTS.SCHEMA_VERSION_ATTENDANCE_LOG,
      action,
      timestamp,
      operatorId,
      operatorNameSnapshot,
      validationResult: 'INVALID_TOKEN', // Default fallback, should map accurately
      failureReason: reason
    };
    
    AttendanceLogValidator.validateForCreate(log);
    await this.transactionService.executeFailedLog(log);
  }
}
