import { Attendance, AttendanceLog } from '../types';

export interface AttendanceTransactionService {
  executeCheckIn(
    attendance: Omit<Attendance, 'id'>, 
    log: Omit<AttendanceLog, 'id'>,
    attendanceId: string
  ): Promise<{ attendance: Attendance, log: AttendanceLog }>;

  executeCheckOut(
    attendanceId: string, 
    attendanceUpdate: Partial<Omit<Attendance, 'id'>>, 
    log: Omit<AttendanceLog, 'id'>
  ): Promise<{ log: AttendanceLog }>;
  
  executeManual(
    attendance: Omit<Attendance, 'id'>, 
    log: Omit<AttendanceLog, 'id'>,
    attendanceId: string
  ): Promise<{ attendance: Attendance, log: AttendanceLog }>;
  
  executeManualUpdate(
    attendanceId: string, 
    attendanceUpdate: Partial<Omit<Attendance, 'id'>>, 
    log: Omit<AttendanceLog, 'id'>
  ): Promise<{ log: AttendanceLog }>;
  
  executeFailedLog(
    log: Omit<AttendanceLog, 'id'>
  ): Promise<{ log: AttendanceLog }>;
}
