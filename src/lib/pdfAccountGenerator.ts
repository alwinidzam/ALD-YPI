import autoTable from 'jspdf-autotable';
import { User, UserRole, InstitutionType } from '../types';

function hashPassword(password: string): string {
  return btoa('ald_salt_' + password);
}

export interface RawTeacherStaffInput {
  no: number;
  name: string;
  role: UserRole;
  institutionLabel: string;
}

export const RAW_PDF_TEACHER_STAFF_DATA: RawTeacherStaffInput[] = [];

export interface GeneratedAccountInfo {
  no: number;
  fullName: string;
  institutionLabel: string;
  role: UserRole;
  username: string;
  defaultPassword: string;
  userObj: User;
}

export function generateSanitizedUsername(fullName: string, index: number): string {
  // Strip titles like S.Pd, M.Pd, Drs, H, KH, SE, etc.
  let cleaned = fullName
    .replace(/^(Drs\.|KH\.|Ust\.|H\.|M\.|A\.)\s*/gi, '')
    .replace(/,\s*(S\.Pd\.I|S\.Pd|S\.Sos|M\.Pd\.I|M\.Pd|S\.Ag|S\.S|S\.Or|SE\.\*|SE|AH|AUD).*$/gi, '')
    .replace(/\s*(S\.Pd|M\.Pd|S\.Sos|S\.Or|S\.S|AUD).*$/gi, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

  if (cleaned.length < 3) {
    cleaned = 'user_' + cleaned + index;
  }
  return cleaned;
}

export const GENERATED_TEACHER_STAFF_ACCOUNTS: GeneratedAccountInfo[] = RAW_PDF_TEACHER_STAFF_DATA.map((item) => {
  const role: UserRole = item.role;
  const username = generateSanitizedUsername(item.name, item.no);
  const defaultPassword = `YpiPass${item.no.toString().padStart(2, '0')}!`;

  const userObj: User = {
    id: `u-gen-${item.no}-${username}`,
    username,
    name: item.name,
    role,
    status: 'ACTIVE',
    passwordHash: hashPassword(defaultPassword),
    lastLogin: undefined,
    contact: '-'
  };

  return {
    no: item.no,
    fullName: item.name,
    institutionLabel: item.institutionLabel,
    role,
    username,
    defaultPassword,
    userObj
  };
});

export async function generateUsersPdf(usersList: User[]) {
  const [{ default: jsPDF }] = await Promise.all([
    import('jspdf')
  ]);
  // @ts-ignore
  await import('jspdf-autotable');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Green header branding bar
  doc.setFillColor(2, 44, 22); // #022c16
  doc.rect(0, 0, 210, 28, 'F');

  // Gold accent line
  doc.setFillColor(255, 179, 0); // #ffb300
  doc.rect(0, 28, 210, 2, 'F');

  // Title text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('YAYASAN PENDIDIKAN ISLAM RAUDHOTUT THOLIBIN', 14, 13);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 245, 235);
  doc.text('Daftar Akun Pengguna Resmi Sistem Arsip Digital', 14, 20);

  // Metadata block
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 38);
  doc.text(`Total Akun: ${usersList.length} Pengguna`, 140, 38);

  const tableData = usersList.map((user, idx) => [
    (idx + 1).toString(),
    user.name,
    user.username,
    user.role,
    user.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif',
    user.contact || '-'
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['No', 'Nama Lengkap', 'Username', 'Peran (Role)', 'Status', 'Kontak']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [2, 44, 22],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 35, fontStyle: 'bold' },
      3: { cellWidth: 35 },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 30 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 44, left: 14, right: 14, bottom: 20 }
  });

  // Footer Note
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Catatan: Harap simpan dokumen ini secara rahasia.',
      14,
      288
    );
    doc.text(`Halaman ${i} dari ${pageCount}`, 180, 288);
  }

  doc.save('Daftar_Akun_Pengguna_YPI_Raudhotut_Tholibin.pdf');
}
