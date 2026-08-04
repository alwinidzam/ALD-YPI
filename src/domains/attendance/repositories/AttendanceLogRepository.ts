import { AttendanceLog } from '../types';

export interface AttendanceLogQueryOptions {
  attendanceId?: string;
  staffId?: string;
  barcodeId?: string;
  limit?: number;
}

export interface AttendanceLogRepository {
  findById(id: string): Promise<AttendanceLog | null>;
  findAll(options?: AttendanceLogQueryOptions): Promise<AttendanceLog[]>;
}
