import { Attendance } from '../types';

export interface AttendanceQueryOptions {
  staffId?: string;
  institutionId?: string;
  date?: string;
  dateStart?: string;
  dateEnd?: string;
  limit?: number;
}

export interface AttendanceRepository {
  findById(id: string): Promise<Attendance | null>;
  findAll(options?: AttendanceQueryOptions): Promise<Attendance[]>;
  findByStaffAndDate(staffId: string, date: string): Promise<Attendance | null>;
}
