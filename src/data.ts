/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, DocumentMetadata, Announcement, AuditLog, UserRole, CategoryType, InstitutionType } from './types';
import { GENERATED_TEACHER_STAFF_ACCOUNTS } from './lib/pdfAccountGenerator';

// Simple password hashing simulation (Base64 + salt)
export function hashPassword(password: string): string {
  return btoa('ald_salt_' + password);
}

// Initial Users
export const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    username: 'admin',
    name: 'Muhammad Alwi Nidzam',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    passwordHash: hashPassword('Atmin0405'),
    lastLogin: '2026-07-01T09:15:30Z',
    contact: '081122334455'
  },
  {
    id: 'u-viewer',
    username: 'viewer',
    name: 'Akun Viewer Yayasan',
    role: 'VIEWER',
    status: 'ACTIVE',
    passwordHash: hashPassword('Atmin0405'),
    lastLogin: '2026-07-01T09:15:30Z',
    contact: '081122334400'
  },
  {
    id: 'u-adminsma',
    username: 'adminsma',
    name: 'Admin SMA Raudhotut',
    role: 'ADMIN_SMA',
    status: 'ACTIVE',
    passwordHash: hashPassword('Atmin0405'),
    lastLogin: '2026-07-01T09:15:30Z',
    contact: '081122334411'
  },
  {
    id: 'u-adminmts',
    username: 'adminmts',
    name: 'Admin MTs Raudhotut',
    role: 'ADMIN_MTS',
    status: 'ACTIVE',
    passwordHash: hashPassword('Atmin0405'),
    lastLogin: '2026-07-01T09:15:30Z',
    contact: '081122334422'
  },
  {
    id: 'u-adminmadin',
    username: 'adminmadin',
    name: 'Admin Madin Raudhotut',
    role: 'ADMIN_MADIN',
    status: 'ACTIVE',
    passwordHash: hashPassword('Atmin0405'),
    lastLogin: '2026-07-01T09:15:30Z',
    contact: '081122334433'
  },
  {
    id: 'u-admintk',
    username: 'admintk',
    name: 'Admin TK Raudhotut',
    role: 'ADMIN_TK',
    status: 'ACTIVE',
    passwordHash: hashPassword('Atmin0405'),
    lastLogin: '2026-07-01T09:15:30Z',
    contact: '081122334444'
  },
  {
    id: 'u-adminpesantren',
    username: 'adminpesantren',
    name: 'Admin Pesantren',
    role: 'ADMIN_PESANTREN',
    status: 'ACTIVE',
    passwordHash: hashPassword('Atmin0405'),
    lastLogin: '2026-07-01T09:15:30Z',
    contact: '081122334466'
  },
  {
    id: 'u-adminselapanan',
    username: 'adminselapanan',
    name: 'Admin Selapanan',
    role: 'ADMIN_SELAPANAN',
    status: 'ACTIVE',
    passwordHash: hashPassword('Atmin0405'),
    lastLogin: '2026-07-01T09:15:30Z',
    contact: '081122334477'
  },
  {
    id: 'u-guru',
    username: 'guru',
    name: 'Ahmad Muzakki, S.Pd.',
    role: 'GURU',
    status: 'ACTIVE',
    passwordHash: hashPassword('Atmin0405'),
    lastLogin: '2026-07-01T09:15:30Z',
    contact: '081234567890'
  },
  {
    id: 'u-staff',
    username: 'staff',
    name: 'Siti Aminah, A.Md.',
    role: 'STAFF',
    status: 'ACTIVE',
    passwordHash: hashPassword('Atmin0405'),
    lastLogin: '2026-07-01T09:15:30Z',
    contact: '081234567891'
  }
];

// Initial Documents
export const INITIAL_DOCUMENTS: DocumentMetadata[] = [];

// Initial Announcements
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

// Initial Audit Logs
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

// Helper to check if a user role matches the administrative target
export function getRoleInstitution(role: UserRole): InstitutionType | null {
  if (role === 'ADMIN_SMA' || role === 'GURU_SMA' || role === 'KEPALA_SMA') return 'SMA';
  if (role === 'ADMIN_MTS' || role === 'GURU_MTS' || role === 'KEPALA_MTS') return 'MTS';
  if (role === 'ADMIN_MADIN' || role === 'GURU_MADIN' || role === 'KEPALA_MADIN') return 'MADIN';
  if (role === 'ADMIN_TK' || role === 'GURU_TK' || role === 'KEPALA_TK') return 'TK';
  if (role === 'ADMIN_PESANTREN' || role === 'GURU_PESANTREN' || role === 'KEPALA_PESANTREN') return 'PESANTREN';
  return null;
}

export function isKepalaSekolah(role: UserRole): boolean {
  return (
    role === 'KEPALA_SMA' ||
    role === 'KEPALA_MTS' ||
    role === 'KEPALA_TK' ||
    role === 'KEPALA_MADIN' ||
    role === 'KEPALA_PESANTREN'
  );
}

// Name generator
export function generateFileName(category: CategoryType, institution: InstitutionType, month: string, year: string): string {
  return `${category.toUpperCase()}_${institution.toUpperCase()}_${month.toUpperCase()}_${year}.pdf`;
}

// LocalStorage Database Engine
export class ALDDatabase {
  static get<T>(key: string, defaultValue: T): T {
    try {
      if (!localStorage.getItem('ald_db_clean_v5')) {
        localStorage.removeItem('ald_users');
        localStorage.removeItem('ald_documents');
        localStorage.removeItem('ald_announcements');
        localStorage.removeItem('ald_audit_logs');
        localStorage.removeItem('ald_favorites');
        localStorage.removeItem('ald_current_session');
        localStorage.setItem('ald_db_clean_v5', 'true');
      }
      const data = localStorage.getItem('ald_' + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  static set(key: string, value: any): void {
    try {
      localStorage.setItem('ald_' + key, JSON.stringify(value));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  }

  static getUsers(): User[] {
    return this.get<User[]>('users', INITIAL_USERS);
  }

  static saveUsers(users: User[]): void {
    this.set('users', users);
  }

  static getDocuments(): DocumentMetadata[] {
    return this.get<DocumentMetadata[]>('documents', INITIAL_DOCUMENTS);
  }

  static saveDocuments(docs: DocumentMetadata[]): void {
    this.set('documents', docs);
  }

  static getAnnouncements(): Announcement[] {
    return this.get<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
  }

  static saveAnnouncements(anns: Announcement[]): void {
    this.set('announcements', anns);
  }

  static getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
  }

  static saveAuditLogs(logs: AuditLog[]): void {
    this.set('audit_logs', logs);
  }

  static addAuditLog(username: string, name: string, role: UserRole, action: AuditLog['action'], details: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      username,
      name,
      role,
      action,
      details,
      ipAddress: '127.0.0.1' // Simulated local IP
    };
    logs.unshift(newLog);
    this.saveAuditLogs(logs);
  }
}
export function compressBase64Image(base64Str: string, maxWidth = 180, maxHeight = 180, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image/')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
}
