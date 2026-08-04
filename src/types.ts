/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'VIEWER'
  | 'ADMIN_SMA'
  | 'ADMIN_MTS'
  | 'ADMIN_MADIN'
  | 'ADMIN_TK'
  | 'ADMIN_PESANTREN'
  | 'ADMIN_SELAPANAN'
  | 'KEPALA_SMA'
  | 'KEPALA_MTS'
  | 'KEPALA_TK'
  | 'KEPALA_MADIN'
  | 'KEPALA_PESANTREN'
  | 'GURU'
  | 'GURU_SMA'
  | 'GURU_MTS'
  | 'GURU_TK'
  | 'GURU_MADIN'
  | 'GURU_PESANTREN'
  | 'STAFF';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
  passwordHash: string; // Simulated hash
  contact?: string; // Kontak info
  photoURL?: string; // Base64 profile photo URL or Preset ID
  dailyUploadCount?: number;
  dailyDownloadCount?: number;
  lastActionResetDate?: string; // YYYY-MM-DD
}

export type CategoryType = 'KEUANGAN' | 'KEGIATAN' | 'SURAT' | 'DOKUMEN' | 'LAINNYA' | 'SELAPANAN';

export type InstitutionType = 'YPI' | 'SMA' | 'MTS' | 'MADIN' | 'TK' | 'PESANTREN';

export type DocumentMigrationState = 'LEGACY' | 'MIGRATING' | 'STORAGE' | 'FAILED';

export interface DocumentIntegrityMetadata {
  checksum: string; // e.g. SHA-256
  sizeBytes: number;
  mimeType: string;
  uploadTimestamp: number;
  storageVersion: number;
}

export interface DocumentMetadata {
  id: string;
  fileName: string;
  category: CategoryType;
  institution: InstitutionType;
  year: string;
  month: string;
  description: string;
  fileSize: string; // e.g., "1.4 MB"
  uploadDate: string;
  uploader: string; // Name of the user who uploaded
  downloadCount: number;
  fileData?: string; // Base64 data URI of the PDF file (Legacy)
  chunks?: number; // Legacy support for chunked documents
  visibility?: 'PUBLIC' | 'PRIVATE';
  sourceType?: 'FILE' | 'DRIVE_LINK'; // default to 'FILE' if not present
  driveUrl?: string; // Original share link
  driveFileId?: string; // Extracted file ID
  
  // Storage V2 Properties
  migrationState?: DocumentMigrationState;
  storagePath?: string; // e.g. documents/{institution}/{id}.pdf
  integrity?: DocumentIntegrityMetadata;
}

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type AnnouncementVisibility = 'PUBLIC' | 'PRIVATE';

export interface AnnouncementAttachment {
  name: string;
  type: 'pdf' | 'jpg' | 'png';
  fileSize?: string;
  fileData?: string; // Base64 encoding
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  targetRole: 'ALL' | UserRole;
  visibility: AnnouncementVisibility;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED';
  createdBy: string;
  createdByUsername?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  attachment?: AnnouncementAttachment;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'UPLOAD'
  | 'DELETE'
  | 'DOWNLOAD'
  | 'SEARCH'
  | 'VIEW_PDF'
  | 'CREATE_USER'
  | 'EDIT_USER'
  | 'RESET_PASSWORD'
  | 'EDIT_PROFILE'
  | 'ANNOUNCEMENT_CREATE'
  | 'ANNOUNCEMENT_UPDATE'
  | 'ANNOUNCEMENT_DELETE'
  | 'REPORT_CREATE'
  | 'REPORT_STATUS_UPDATE'
  | 'REPORT_ASSIGNEE_UPDATE'
  | 'REPORT_COMMENT_ADD'
  | 'REPORT_CLOSE';

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  name: string;
  role: UserRole;
  action: AuditAction;
  details: string;
  ipAddress: string;
}

export interface Teacher {
  id: string;
  name: string;
  nip?: string;
  role: string;
  subject?: string;
  contact?: string;
}

export interface TeacherStaff {
  id: string;
  name: string;
  nip?: string;
  role: string;
  subject?: string;
  institution: InstitutionType;
  contact?: string;
  status: 'ACTIVE' | 'INACTIVE';
  barcode: string;
  photoURL?: string;
  createdAt?: string;
}

export interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  contact?: string;
}

export interface ClassDetail {
  id: string;
  className: string;
  studentCount: number;
  waliKelas?: string;
  parentCount?: number;
}

export interface InstitutionProfile {
  id: string; // e.g. 'sma', 'mts', etc.
  name: string;
  type: InstitutionType;
  leader: string;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  teachersList: Teacher[];
  committeeList: CommitteeMember[];
  classList: ClassDetail[];
  updatedAt?: string;
  updatedBy?: string;
}

// --- REPORTING CENTER TYPES ---

export type ReportType = 'WHISTLEBLOWING' | 'COMPLAINT' | 'SUGGESTION';

export type ReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'IN_PROGRESS'
  | 'NEED_INFO'
  | 'RESOLVED'
  | 'REJECTED';

export interface ReportAttachment {
  name: string;
  type: string; // e.g. "application/pdf", "image/jpeg", etc.
  fileSize: string; // e.g. "1.2 MB"
  fileData: string; // Base64 data URL
}

export interface ReportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderRole: UserRole;
  content: string;
  timestamp: string; // ISO string
}

export interface Report {
  id: string; // unique tracking code like ALD-REP-XXXX
  trackingCode: string; // same as id
  type: ReportType;
  title: string;
  description: string;
  category: string; // category chosen under the service
  status: ReportStatus;
  identityOption: 'PROTECTED' | 'OPEN';
  reporterId: string;
  reporterName: string;
  reporterUsername: string;
  reporterRole: UserRole;
  reporterContact?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  attachment?: ReportAttachment;
  conversation: ReportMessage[];
  internalNotes?: string;
}

