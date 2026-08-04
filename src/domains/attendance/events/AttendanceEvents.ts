import { AttendanceSource, ValidationResult } from '../types';

export interface BaseAttendanceEvent {
  eventId: string;
  timestamp: Date;
  staffId: string;
}

export interface AttendanceCheckedInEvent extends BaseAttendanceEvent {
  type: 'ATTENDANCE_CHECKED_IN';
  attendanceId: string;
  source: AttendanceSource;
}

export interface AttendanceCheckedOutEvent extends BaseAttendanceEvent {
  type: 'ATTENDANCE_CHECKED_OUT';
  attendanceId: string;
  durationMs: number;
}

export interface AttendanceMarkedManualEvent extends BaseAttendanceEvent {
  type: 'ATTENDANCE_MARKED_MANUAL';
  attendanceId: string;
  reason: string;
  approvedBy: string;
}

export interface AttendanceRejectedEvent extends BaseAttendanceEvent {
  type: 'ATTENDANCE_REJECTED';
  reason: ValidationResult;
  barcodeId?: string;
}

export type AttendanceEvent = 
  | AttendanceCheckedInEvent 
  | AttendanceCheckedOutEvent 
  | AttendanceMarkedManualEvent 
  | AttendanceRejectedEvent;
