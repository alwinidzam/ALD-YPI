import { AttendanceAction, ValidationResult } from '../types';

export interface AttendanceLogDTO {
  schemaVersion: number;
  
  attendanceId: string | null;
  staffId: string | null;
  barcodeId: string | null;
  
  action: AttendanceAction;
  timestamp: any;
  operatorId: string;
  operatorNameSnapshot: string;
  
  validationResult: ValidationResult;
  failureReason?: string | null;
  deviceType?: string | null;
  scannerType?: string | null;
  browser?: string | null;
  applicationVersion?: string | null;
  processingLatencyMs?: number | null;
}
