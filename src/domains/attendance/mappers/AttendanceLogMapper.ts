import { AttendanceLog } from '../types';
import { AttendanceLogDTO } from '../dto/AttendanceLogDTO';
import { Timestamp } from 'firebase/firestore';

export class AttendanceLogMapper {
  static toDomain(id: string, dto: AttendanceLogDTO): AttendanceLog {
    return {
      id,
      schemaVersion: dto.schemaVersion,
      attendanceId: dto.attendanceId || undefined,
      staffId: dto.staffId || undefined,
      barcodeId: dto.barcodeId || undefined,
      
      action: dto.action,
      timestamp: dto.timestamp && typeof dto.timestamp.toDate === "function" ? dto.timestamp.toDate() : dto.timestamp,
      operatorId: dto.operatorId,
      operatorNameSnapshot: dto.operatorNameSnapshot,
      
      validationResult: dto.validationResult,
      failureReason: dto.failureReason || undefined,
      deviceType: dto.deviceType || undefined,
      scannerType: dto.scannerType || undefined,
      browser: dto.browser || undefined,
      applicationVersion: dto.applicationVersion || undefined,
      processingLatencyMs: dto.processingLatencyMs || undefined,
    };
  }

  static toDTO(domain: Omit<AttendanceLog, 'id'>): AttendanceLogDTO {
    return {
      schemaVersion: domain.schemaVersion,
      attendanceId: domain.attendanceId || null,
      staffId: domain.staffId || null,
      barcodeId: domain.barcodeId || null,
      
      action: domain.action,
      timestamp: domain.timestamp,
      operatorId: domain.operatorId,
      operatorNameSnapshot: domain.operatorNameSnapshot,
      
      validationResult: domain.validationResult,
      failureReason: domain.failureReason || null,
      deviceType: domain.deviceType || null,
      scannerType: domain.scannerType || null,
      browser: domain.browser || null,
      applicationVersion: domain.applicationVersion || null,
      processingLatencyMs: domain.processingLatencyMs || null,
    };
  }
}
