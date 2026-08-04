import { InstitutionType } from '../../../types';
import { EmploymentType, StaffRole, StaffStatus } from '../types';

export interface StaffDTO {
  schemaVersion: number;
  fullName: string;
  title?: string;
  institutions: InstitutionType[];
  primaryInstitution: InstitutionType;
  employmentType: EmploymentType;
  role: StaffRole;
  position: string;
  employmentStatus: StaffStatus;
  accountStatus: 'ACTIVE' | 'NO_ACCOUNT' | 'SUSPENDED';
  barcodeToken: string;
  profilePhoto?: string;
  
  // Auditable
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
  createdBy: string;
  updatedBy: string;

  // Soft Deletable
  isDeleted: boolean;
  deletedAt: any | null;
  deletedBy: string | null;
}
