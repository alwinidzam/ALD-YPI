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
  | 'ADMIN_SELAPANAN';

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
  fileData?: string; // Base64 data URI of the PDF file
}

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  targetRole: 'ALL' | UserRole;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED';
  createdBy: string;
  createdByUsername?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
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
  | 'ANNOUNCEMENT_DELETE';

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
