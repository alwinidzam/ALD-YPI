import { InstitutionType } from '../../types';

// ==========================================
// ENUMS
// ==========================================

export type AttendanceStatus =
  | 'READY'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'COMPLETED'
  | 'INCOMPLETE'
  | 'INVALID'
  | 'DUPLICATE'
  | 'MANUAL'
  | 'CANCELLED';

export type BarcodeStatus =
  | 'ACTIVE'
  | 'LOST'
  | 'REGENERATED'
  | 'DISABLED'
  | 'EXPIRED';

export type StaffStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED';

export type AttendanceAction =
  | 'ATTENDANCE_CHECK_IN'
  | 'ATTENDANCE_CHECK_OUT'
  | 'ATTENDANCE_MANUAL'
  | 'ATTENDANCE_CANCEL'
  | 'BARCODE_REGENERATE'
  | 'BARCODE_PRINT';

export type ValidationResult =
  | 'VALID'
  | 'INVALID_TOKEN'
  | 'DUPLICATE'
  | 'EXPIRED'
  | 'UNAUTHORIZED';

export type AttendanceSource =
  | 'CAMERA'
  | 'USB_SCANNER'
  | 'MANUAL';

export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'HONORARY';

export type StaffRole =
  | 'TEACHER'
  | 'ADMIN'
  | 'OPERATOR'
  | 'SECURITY'
  | 'CLEANING'
  | 'TREASURER'
  | 'PRINCIPAL'
  | 'OTHER';

// ==========================================
// SHARED INTERFACES
// ==========================================

// We use string or any here for Timestamps to keep domain types independent of Firestore SDK.
// In practice, these will be populated with Firebase Timestamp objects in the backend
// and converted to strings/Dates in the frontend.
export interface AuditableDocument {
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  updatedBy: string;
}

export interface SoftDeletable {
  isDeleted: boolean;
  deletedAt?: any;
  deletedBy?: string;
}

// ==========================================
// DOMAIN MODELS
// ==========================================

export interface Staff extends AuditableDocument, SoftDeletable {
  id: string; // Document ID
  schemaVersion: number;

  // Employment Info
  fullName: string;
  title?: string;
  institutions: InstitutionType[];
  primaryInstitution: InstitutionType; // The institution this staff belongs to
  employmentType: EmploymentType;
  role: StaffRole;
  position: string;

  // State
  employmentStatus: StaffStatus;
  accountStatus: 'ACTIVE' | 'NO_ACCOUNT' | 'SUSPENDED';

  // Relationship
  barcodeToken: string;
  profilePhoto?: string; // Reference to the barcodes collection
}

export interface Barcode extends AuditableDocument {
  id: string; // Document ID
  schemaVersion: number;

  // Core Data
  token: string; // The physical generated string
  staffId: string; // Reference to staff collection

  // Lifecycle
  status: BarcodeStatus;

  // Operational Metadata
  issuedAt?: any;
  issuedBy?: string;
  printedAt?: any;
  lastPrintedAt?: any;
  printCount: number;

  // History Chain
  invalidatedAt?: any;
  replacedByBarcodeId?: string;
  previousBarcodeId?: string;
}

export interface Attendance extends AuditableDocument {
  id: string; // Document ID (usually composite or auto-id depending on query needs)
  schemaVersion: number;

  // Relationships
  staffId: string;
  barcodeId: string;

  // Snapshots
  institutions: InstitutionType[];
  primaryInstitution: InstitutionType;
  institutionNameSnapshot: string;

  // Timeline Data
  date: string; // YYYY-MM-DD for fast querying
  checkIn?: any; // Timestamp
  checkOut?: any; // Timestamp

  // State Machine
  status: AttendanceStatus;
  source: AttendanceSource;

  // Manual Attendance Metadata
  manualReason?: string;
  manualApprovedBy?: string;
  manualApprovedAt?: any;
}

export interface AttendanceLog {
  id: string; // Document ID
  schemaVersion: number;

  // Relationships
  attendanceId?: string; // Reference to Attendance document (optional if scan failed before creating attendance)
  staffId?: string;
  barcodeId?: string;

  // Action
  action: AttendanceAction;
  timestamp: any; // Timestamp
  operatorId: string;
  operatorNameSnapshot: string;

  // Technical Metadata (Optional)
  validationResult: ValidationResult;
  failureReason?: string;
  deviceType?: string; // e.g. "Desktop", "Mobile"
  scannerType?: string; // "USB", "Camera"
  browser?: string;
  applicationVersion?: string;
  processingLatencyMs?: number;
}
