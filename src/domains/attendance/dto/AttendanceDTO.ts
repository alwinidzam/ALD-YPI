import { InstitutionType } from '../../../types';
import { AttendanceStatus, AttendanceSource } from '../types';

export interface AttendanceDTO {
  schemaVersion: number;
  staffId: string;
  barcodeId: string;
  
  institutions: InstitutionType[];
  primaryInstitution: InstitutionType;
  institutionNameSnapshot: string;
  
  date: string;
  checkIn: any | null;
  checkOut: any | null;
  
  status: AttendanceStatus;
  source: AttendanceSource;
  
  manualReason?: string | null;
  manualApprovedBy?: string | null;
  manualApprovedAt?: any | null;
  
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  updatedBy: string;
}
