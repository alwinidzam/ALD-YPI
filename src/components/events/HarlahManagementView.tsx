import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  UserPlus,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  CheckCircle2,
  DollarSign,
  Send,
  ArrowLeft,
  Sparkles,
  Archive,
  Copy,
  Info,
  Paperclip,
  Check,
  Award,
  ShieldCheck,
  Building2
} from 'lucide-react';
import autoTable from 'jspdf-autotable';
import { User, UserRole } from '../../types';

export interface HarlahCommitteeMember {
  id: string;
  roleTitle: string;
  memberName: string;
  contact?: string;
  institution?: string;
}

export interface HarlahYearStructure {
  id: string;
  yearNumber: string; // e.g. "Harlah Ke-42 Yayasan (Tahun 2026)"
  status: 'ACTIVE' | 'ARCHIVED';
  members: HarlahCommitteeMember[];
}

export interface HarlahNotice {
  id: string;
  type: 'MEETING' | 'HARLAH_EVENT';
  title: string;
  date: string;
  time: string;
  location: string;
  agenda: string;
  attachmentName?: string;
}

export interface HarlahRundown {
  id: string;
  timeRange: string;
  activityTitle: string;
  description: string;
  picName: string;
}

export interface HarlahFinancial {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  date: string;
}

interface HarlahManagementViewProps {
  currentUser: User;
  onBack: () => void;
  onLogAction: (action: string, details: string) => void;
}

export function HarlahManagementView({ currentUser, onBack, onLogAction }: HarlahManagementViewProps) {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.username === 'admin';
  const [activeTab, setActiveTab] = useState<'PANITIA' | 'UNDANGAN' | 'RUNDOWN' | 'KEUANGAN' | 'LPJ'>('PANITIA');

  // Committee structures yearly
  const [committees, setCommittees] = useState<HarlahYearStructure[]>(() => {
    const saved = localStorage.getItem('ald_harlah_committees');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'harlah-42',
        yearNumber: 'Harlah Ke-42 Yayasan (Tahun 2026)',
        status: 'ACTIVE',
        members: [
          { id: 'hm-1', roleTitle: 'Pelindung & Penasehat', memberName: 'Drs. KH. Mas\'ad Masyhur', contact: '0811223344' },
          { id: 'hm-2', roleTitle: 'Ketua Umum Harlah', memberName: 'Muhammad Alwi Nidzam', contact: '0811223345' },
          { id: 'hm-3', roleTitle: 'Sekretaris Umum', memberName: 'Ahmad Muthohar, M.Pd.I', contact: '0811223346' },
          { id: 'hm-4', roleTitle: 'Bendahara Harlah', memberName: 'Rini Windarsih, SE.', contact: '0811223347' },
          { id: 'hm-5', roleTitle: 'Sie Acara & Simaan Qur\'an', memberName: 'KH. Akhrowi, S.Pd.I', contact: '0811223348' }
        ]
      },
      {
        id: 'harlah-41',
        yearNumber: 'Harlah Ke-41 Yayasan (Tahun 2025)',
        status: 'ARCHIVED',
        members: [
          { id: 'hm-old-1', roleTitle: 'Ketua Umum Harlah', memberName: 'KH. Syarifuddin, S.Pd.I', contact: '0811223300' }
        ]
      }
    ];
  });

  const activeCommittee = committees.find((c) => c.status === 'ACTIVE') || committees[0];

  // Invitations State
  const [invitations, setInvitations] = useState<HarlahNotice[]>(() => {
    const saved = localStorage.getItem('ald_harlah_invitations');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'hinv-1',
        type: 'MEETING',
        title: 'Undangan Rapat Pembentukan Panitia Harlah Ke-42 YPI Raudhotut Tholibin',
        date: '2026-11-15',
        time: '19:30 WIB',
        location: 'Aula Utama Serbaguna YPI',
        agenda: 'Pembentukan panitia harlah, perancangan tema, dan penentuan tanggal acara.',
        attachmentName: 'SK_Pembentukan_Panitia_Harlah_42.pdf'
      },
      {
        id: 'hinv-2',
        type: 'HARLAH_EVENT',
        title: 'Undangan Puncak Peringatan Harlah Ke-42 & Khotmil Qur\'an Bil Ghoib',
        date: '2027-02-15',
        time: '07:30 WIB - Selesai',
        location: 'Kompleks Masjid Jami\' & Lapangan Utama YPI',
        agenda: 'Khotmil Quran 30 juz, Ziarah Muassis, Temu Alumni, & Pengajian Akbar.',
        attachmentName: 'Brosur_Resmi_Harlah_42.pdf'
      }
    ];
  });

  // Rundown State
  const [rundowns, setRundowns] = useState<HarlahRundown[]>(() => {
    const saved = localStorage.getItem('ald_harlah_rundown');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: 'hrd-1', timeRange: '07:30 - 10:00 WIB', activityTitle: 'Khotmil Qur\'an Bil Ghoib 30 Juz', description: 'Simaan Al-Qur\'an oleh alumni huffadz.', picName: 'Ust. Akhrowi' },
      { id: 'hrd-2', timeRange: '10:00 - 11:30 WIB', activityTitle: 'Ziarah Makam Muassis Yayasan', description: 'Tahlil jamai di maqbaroh pendiri.', picName: 'KH. Fahat Muzani' },
      { id: 'hrd-3', timeRange: '13:00 - 15:30 WIB', activityTitle: 'Temu Alumni Akbar & Sarasehan', description: 'Silaturahmi alumni & kemandirian YPI.', picName: 'Ketua Alumni' },
      { id: 'hrd-4', timeRange: '19:30 - Selesai', activityTitle: 'Pengajian Akbar & Sholawat Kolosal', description: 'Ceramah agama & sholawat bersama.', picName: 'Sie Acara' }
    ];
  });

  // Financials State
  const [financials, setFinancials] = useState<HarlahFinancial[]>(() => {
    const saved = localStorage.getItem('ald_harlah_financials');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: 'hfin-1', type: 'INCOME', description: 'Subsidi Kas Pusat Yayasan', amount: 15000000, date: '2026-12-01' },
      { id: 'hfin-2', type: 'INCOME', description: 'Sponsorship & Donasi Alumni', amount: 12500000, date: '2027-01-10' },
      { id: 'hfin-3', type: 'EXPENSE', description: 'Panggung Utama, Sound System & Lighting', amount: 9500000, date: '2027-02-12' },
      { id: 'hfin-4', type: 'EXPENSE', description: 'Konsumsi Tamu VVIP & Undangan', amount: 6800000, date: '2027-02-14' }
    ];
  });

  // Save to localStorage
  useEffect(() => { localStorage.setItem('ald_harlah_committees', JSON.stringify(committees)); }, [committees]);
  useEffect(() => { localStorage.setItem('ald_harlah_invitations', JSON.stringify(invitations)); }, [invitations]);
  useEffect(() => { localStorage.setItem('ald_harlah_rundown', JSON.stringify(rundowns)); }, [rundowns]);
  useEffect(() => { localStorage.setItem('ald_harlah_financials', JSON.stringify(financials)); }, [financials]);

  // Modal states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberContact, setNewMemberContact] = useState('');

  const [showInvModal, setShowInvModal] = useState(false);
  const [invType, setInvType] = useState<'MEETING' | 'HARLAH_EVENT'>('MEETING');
  const [invTitle, setInvTitle] = useState('');
  const [invDate, setInvDate] = useState('');
  const [invTime, setInvTime] = useState('');
  const [invLocation, setInvLocation] = useState('');
  const [invAgenda, setInvAgenda] = useState('');

  const [showRundownModal, setShowRundownModal] = useState(false);
  const [rdTime, setRdTime] = useState('');
  const [rdTitle, setRdTitle] = useState('');
  const [rdDesc, setRdDesc] = useState('');
  const [rdPic, setRdPic] = useState('');

  const [showFinModal, setShowFinModal] = useState(false);
  const [finType, setFinType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [finDesc, setFinDesc] = useState('');
  const [finAmount, setFinAmount] = useState<number>(0);
  const [finDate, setFinDate] = useState(new Date().toISOString().split('T')[0]);

  // Actions
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim() || !newMemberName.trim()) return;

    const newMem: HarlahCommitteeMember = {
      id: 'hm-' + Date.now(),
      roleTitle: newRoleTitle.trim(),
      memberName: newMemberName.trim(),
      contact: newMemberContact.trim()
    };

    setCommittees((prev) =>
      prev.map((c) => (c.status === 'ACTIVE' ? { ...c, members: [...c.members, newMem] } : c))
    );

    setNewRoleTitle('');
    setNewMemberName('');
    setNewMemberContact('');
    setShowMemberModal(false);
    onLogAction('HARLAH_COMMITTEE_UPDATE', `Menambah panitia Harlah: ${newMemberName}`);
  };

  const handleDeleteMember = (id: string) => {
    setCommittees((prev) =>
      prev.map((c) => (c.status === 'ACTIVE' ? { ...c, members: c.members.filter((m) => m.id !== id) } : c))
    );
  };

  const handleDuplicatePreviousRundown = () => {
    if (confirm('Apakah Anda yakin ingin menduplikasi susunan rundown acara dari periode Harlah sebelumnya?')) {
      const duplicated: HarlahRundown[] = [
        { id: 'hrd-dup-1', timeRange: '07:30 - 10:00 WIB', activityTitle: 'Khotmil Qur\'an Bil Ghoib 30 Juz', description: 'Simaan Al-Qur\'an oleh alumni huffadz.', picName: 'Ust. Akhrowi' },
        { id: 'hrd-dup-2', timeRange: '10:00 - 11:30 WIB', activityTitle: 'Ziarah Makam Muassis Yayasan', description: 'Tahlil jamai di maqbaroh pendiri.', picName: 'KH. Fahat Muzani' },
        { id: 'hrd-dup-3', timeRange: '13:00 - 15:30 WIB', activityTitle: 'Temu Alumni Akbar & Sarasehan', description: 'Silaturahmi alumni & kemandirian YPI.', picName: 'Ketua Alumni' },
        { id: 'hrd-dup-4', timeRange: '19:30 - Selesai', activityTitle: 'Pengajian Akbar & Sholawat Kolosal', description: 'Ceramah agama & sholawat bersama.', picName: 'Sie Acara' }
      ];
      setRundowns(duplicated);
      onLogAction('HARLAH_RUNDOWN_DUPLICATE', 'Menduplikasi rundown Harlah tahun sebelumnya.');
    }
  };

  const handleArchiveAndNewYear = () => {
    const yearStr = prompt('Masukkan Periode Harlah Baru (misal: "Harlah Ke-43 Yayasan - Tahun 2027"):');
    if (!yearStr) return;

    setCommittees((prev) => [
      {
        id: 'harlah-' + Date.now(),
        yearNumber: yearStr,
        status: 'ACTIVE',
        members: activeCommittee ? [...activeCommittee.members] : []
      },
      ...prev.map((c) => ({ ...c, status: 'ARCHIVED' as const }))
    ]);

    onLogAction('HARLAH_ARCHIVE', `Mengarsip Harlah lama & membuka periode baru: ${yearStr}`);
  };

  const handleAddInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invTitle.trim() || !invDate.trim()) return;

    const newInv: HarlahNotice = {
      id: 'hinv-' + Date.now(),
      type: invType,
      title: invTitle.trim(),
      date: invDate,
      time: invTime || '08:00 WIB',
      location: invLocation || 'Kompleks Yayasan Pusat',
      agenda: invAgenda
    };

    setInvitations([newInv, ...invitations]);
    setInvTitle('');
    setInvAgenda('');
    setShowInvModal(false);
  };

  const handleAddRundown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rdTitle.trim() || !rdTime.trim()) return;

    const newRd: HarlahRundown = {
      id: 'hrd-' + Date.now(),
      timeRange: rdTime,
      activityTitle: rdTitle,
      description: rdDesc,
      picName: rdPic || 'Panitia'
    };

    setRundowns([...rundowns, newRd]);
    setRdTime('');
    setRdTitle('');
    setRdDesc('');
    setRdPic('');
    setShowRundownModal(false);
  };

  const handleAddFinancial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finDesc.trim() || finAmount <= 0) return;

    const newFin: HarlahFinancial = {
      id: 'hfin-' + Date.now(),
      type: finType,
      description: finDesc.trim(),
      amount: finAmount,
      date: finDate
    };

    setFinancials([newFin, ...financials]);
    setFinDesc('');
    setFinAmount(0);
    setShowFinModal(false);
  };

  // Financial Summary
  const totalIncome = financials.filter((f) => f.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
  const totalExpense = financials.filter((f) => f.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
  const balance = totalIncome - totalExpense;

  // LPJ PDF Export
  const handleExportLPJPdf = async () => {
    const doc = new (await import('jspdf')).default({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Amber header banner
    doc.setFillColor(180, 83, 9);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setFillColor(255, 179, 0);
    doc.rect(0, 32, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('LAPORAN PERTANGGUNGJAWABAN (LPJ) HARLAH YAYASAN', 14, 14);
    doc.setFontSize(11);
    doc.text(`YAYASAN PENDIDIKAN ISLAM RAUDHOTUT THOLIBIN`, 14, 22);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(254, 243, 199);
    doc.text(`Periode Acara: ${activeCommittee?.yearNumber || 'Harlah Tahunan'}`, 14, 28);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, 28);

    let currentY = 40;

    // 1. STRUKTUR PANITIA
    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. STRUKTUR PANITIA HARLAH YAYASAN', 14, currentY);
    currentY += 4;

    const commData = (activeCommittee?.members || []).map((m, idx) => [
      (idx + 1).toString(),
      m.roleTitle,
      m.memberName,
      m.contact || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Jabatan / Sie', 'Nama Pengurus / Panitia', 'Kontak']],
      body: commData,
      theme: 'grid',
      headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 2. RUNDOWN ACARA
    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. SUSUNAN ACARA & RUNDOWN KHALAYAK', 14, currentY);
    currentY += 4;

    const rdData = rundowns.map((r, idx) => [
      (idx + 1).toString(),
      r.timeRange,
      r.activityTitle,
      r.description,
      r.picName
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Waktu (WIB)', 'Nama Kegiatan', 'Keterangan', 'PIC']],
      body: rdData,
      theme: 'grid',
      headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 3. FINANCIAL SUMMARY
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. REKAPITULASI LAPORAN KEUANGAN HARLAH', 14, currentY);
    currentY += 4;

    const finData = financials.map((f, idx) => [
      (idx + 1).toString(),
      f.date,
      f.description,
      f.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      `Rp ${f.amount.toLocaleString('id-ID')}`
    ]);

    finData.push([
      '',
      '',
      'TOTAL SALDO AKHIR HARLAH',
      balance >= 0 ? 'Surplus' : 'Defisit',
      `Rp ${balance.toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tanggal', 'Keterangan Transaksi', 'Kategori', 'Jumlah (Rp)']],
      body: finData,
      theme: 'grid',
      headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      columnStyles: { 4: { fontStyle: 'bold', halign: 'right' } }
    });

    currentY = (doc as any).lastAutoTable.finalY + 14;

    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);

    doc.text('Ketua Panitia Harlah,', 20, currentY);
    doc.text('Ketua Umum YPI,', 140, currentY);

    currentY += 22;
    doc.text(activeCommittee?.members.find((m) => m.roleTitle.includes('Ketua'))?.memberName || '( ................................... )', 20, currentY);
    doc.text('Drs. KH. Mas\'ad Masyhur', 140, currentY);

    doc.save(`LPJ_Harlah_${(activeCommittee?.yearNumber || 'Resmi').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    onLogAction('HARLAH_LPJ_EXPORT', 'Mengunduh Dokumen LPJ Harlah Tahunan versi PDF lengkap.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-amber-800 rounded-xl p-6 sm:p-8 text-white relative overflow-hidden border border-amber-700/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl soft-bg/10 hover:soft-bg/20 text-amber-100 text-xs font-bold transition-all cursor-pointer backdrop-blur-md"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full soft-bg/20 border border-white/20 text-white text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#ffb300]" /> Peringatan Tahunan Yayasan
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Pusat Pengelolaan Harlah Tahunan
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/80 font-medium max-w-2xl leading-relaxed">
              Manajemen struktur panitia tahunan, surat undangan rapat & peringatan harlah, rundown khotmil quran & pengajian, laporan keuangan, serta kompilasi LPJ otomatis.
            </p>
          </div>

          <div className="soft-bg/10 backdrop-blur-md border border-white/15 rounded-xl p-4 shrink-0 flex flex-col justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-200 mb-1">Administrator Utama</div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#ffb300]" />
              <span className="font-semibold text-sm text-white">@superadmin</span>
            </div>
            <span className="text-[10px] text-amber-200/80 mt-1">Status: {isSuperAdmin ? 'Akses Penuh (Super Admin)' : 'Mode Lihat'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 soft-card p-4 scrollbar-none">
        <button
          onClick={() => setActiveTab('PANITIA')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'PANITIA' ? 'bg-amber-800 text-white' : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          <Users className="w-4 h-4" /> Panitia Harlah ({activeCommittee?.members.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('UNDANGAN')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'UNDANGAN' ? 'bg-amber-800 text-white' : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          <FileText className="w-4 h-4" /> Undangan & Brosur ({invitations.length})
        </button>
        <button
          onClick={() => setActiveTab('RUNDOWN')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'RUNDOWN' ? 'bg-amber-800 text-white' : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-4 h-4" /> Rundown Acara ({rundowns.length})
        </button>
        <button
          onClick={() => setActiveTab('KEUANGAN')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'KEUANGAN' ? 'bg-amber-800 text-white' : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Laporan Keuangan
        </button>
        <button
          onClick={() => setActiveTab('LPJ')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'LPJ' ? 'bg-emerald-800 text-white' : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          <Award className="w-4 h-4 text-[#ffb300]" /> Kompilasi LPJ & Ekspor PDF
        </button>
      </div>

      {/* TAB 1: PANITIA */}
      {activeTab === 'PANITIA' && (
        <div className="space-y-6">
          <div className="soft-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                  {activeCommittee?.yearNumber}
                </span>
                <h3 className="text-lg font-serif font-bold text-slate-800 mt-2">Struktur Panitia Harlah Tahunan</h3>
              </div>

              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleArchiveAndNewYear}
                    className="soft-button-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" /> Arsip & Buka Periode Baru
                  </button>
                  <button
                    onClick={() => setShowMemberModal(true)}
                    className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> Tambah Panitia
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCommittee?.members.map((m) => (
                <div key={m.id} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-2 relative group hover:border-amber-300 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded-md">
                      {m.roleTitle}
                    </span>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Hapus Panitia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800">{m.memberName}</h4>
                  <p className="text-xs text-slate-500 font-medium">{m.contact || 'Kontak tidak dicantumkan'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNDANGAN */}
      {activeTab === 'UNDANGAN' && (
        <div className="space-y-6">
          <div className="soft-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-800">Daftar Undangan & Brosur Harlah</h3>
                <p className="text-xs text-slate-500">Kelola pengumuman rapat musyawarah harlah dan brosur resmi acara puncak.</p>
              </div>
              {isSuperAdmin && (
                <button
                  onClick={() => setShowInvModal(true)}
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Buat Undangan Baru
                </button>
              )}
            </div>

            <div className="space-y-4">
              {invitations.map((inv) => (
                <div key={inv.id} className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                      inv.type === 'MEETING' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.type === 'MEETING' ? 'Undangan Rapat' : 'Undangan Puncak Harlah'}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{inv.date} • {inv.time}</span>
                  </div>

                  <h4 className="text-base font-semibold text-slate-800">{inv.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{inv.agenda}</p>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-200/40">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-700" /> {inv.location}</span>
                    {inv.attachmentName && (
                      <span className="flex items-center gap-1 text-amber-800 font-bold"><Paperclip className="w-3.5 h-3.5" /> {inv.attachmentName}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RUNDOWN */}
      {activeTab === 'RUNDOWN' && (
        <div className="space-y-6">
          <div className="soft-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-800">Rundown Peringatan Harlah Tahunan</h3>
                <p className="text-xs text-slate-500">Susunan khotmil quran, ziarah muassis, temu alumni, hingga pengajian akbar.</p>
              </div>

              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDuplicatePreviousRundown}
                    className="soft-button-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplikasi Rundown Tahun Lalu
                  </button>
                  <button
                    onClick={() => setShowRundownModal(true)}
                    className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Tambah Sesi
                  </button>
                </div>
              )}
            </div>

            <div className="relative border-l-2 border-amber-300 ml-4 pl-6 space-y-6">
              {rundowns.map((r) => (
                <div key={r.id} className="relative bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-1">
                  <div className="absolute -left-[33px] top-4 w-3.5 h-3.5 rounded-full bg-amber-700 border-4 border-white" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">{r.timeRange}</span>
                    <span className="text-[10px] font-bold text-slate-500 soft-bg px-2 py-0.5 rounded-md border border-slate-200">PIC: {r.picName}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800">{r.activityTitle}</h4>
                  <p className="text-xs text-slate-600 font-medium">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KEUANGAN */}
      {activeTab === 'KEUANGAN' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">Total Pemasukan Harlah</span>
              <p className="text-xl font-semibold text-emerald-900">Rp {totalIncome.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">Total Pengeluaran Harlah</span>
              <p className="text-xl font-semibold text-amber-900">Rp {totalExpense.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-slate-900 text-white rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Saldo / Surplus</span>
              <p className="text-xl font-semibold text-white">Rp {balance.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className="soft-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-800">Laporan Keuangan Harlah</h3>
                <p className="text-xs text-slate-500">Pencatatan subsidi yayasan, sponsorship alumni, panggung, dan operasional.</p>
              </div>
              {isSuperAdmin && (
                <button
                  onClick={() => setShowFinModal(true)}
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Catat Transaksi
                </button>
              )}
            </div>

            <div className="space-y-3">
              {financials.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      f.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {f.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                    <h4 className="font-semibold text-sm text-slate-800 mt-1">{f.description}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{f.date}</p>
                  </div>
                  <span className={`font-bold text-sm ${f.type === 'INCOME' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {f.type === 'INCOME' ? '+' : '-'} Rp {f.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LPJ PDF */}
      {activeTab === 'LPJ' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 text-xs font-semibold">
                  <Award className="w-4 h-4 text-amber-700" /> Dokumen LPJ Resmi
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">
                  Laporan Pertanggungjawaban (LPJ) Harlah Tahunan
                </h2>
                <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
                  Kompilasi lengkap dari Struktur Panitia Harlah, Surat Undangan, Brosur, Rundown Simaan & Pengajian Akbar, serta Laporan Keuangan ke dalam format PDF resmi.
                </p>
              </div>

              <button
                onClick={handleExportLPJPdf}
                className="px-6 py-3.5 bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4" /> Unduh LPJ Harlah (PDF)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-amber-200/60">
              <div className="flex items-center gap-3 soft-card p-3.5">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-slate-800">Panitia Harlah</span>
                  <span className="block text-[10px] text-slate-500">{activeCommittee?.members.length} Anggota Terdaftar</span>
                </div>
              </div>

              <div className="flex items-center gap-3 soft-card p-3.5">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-slate-800">Surat & Brosur</span>
                  <span className="block text-[10px] text-slate-500">{invitations.length} Dokumen Penerbitan</span>
                </div>
              </div>

              <div className="flex items-center gap-3 soft-card p-3.5">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-slate-800">Rundown Kegiatan</span>
                  <span className="block text-[10px] text-slate-500">{rundowns.length} Sesi Utama Harlah</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="soft-card p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-base text-slate-800">Tambah Panitia Harlah</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Jabatan / Sie *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Ketua, Bendahara, Sie Acara..."
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Kontak (WA)</label>
                <input
                  type="text"
                  value={newMemberContact}
                  onChange={(e) => setNewMemberContact(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 py-2 bg-slate-100 text-xs font-bold rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-amber-800 text-white text-xs font-bold rounded-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="soft-card p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-base text-slate-800">Buat Undangan / Brosur Harlah</h3>
            <form onSubmit={handleAddInvitation} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Jenis Undangan</label>
                <select
                  value={invType}
                  onChange={(e) => setInvType(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                >
                  <option value="MEETING">Undangan Rapat Panitia Harlah</option>
                  <option value="HARLAH_EVENT">Undangan Puncak Peringatan Harlah</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Judul *</label>
                <input
                  type="text"
                  required
                  value={invTitle}
                  onChange={(e) => setInvTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Waktu</label>
                  <input
                    type="text"
                    placeholder="07:30 WIB"
                    value={invTime}
                    onChange={(e) => setInvTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Agenda & Catatan</label>
                <textarea
                  rows={3}
                  value={invAgenda}
                  onChange={(e) => setInvAgenda(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowInvModal(false)} className="flex-1 py-2 bg-slate-100 text-xs font-bold rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-amber-800 text-white text-xs font-bold rounded-xl">Terbitkan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRundownModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="soft-card p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-base text-slate-800">Tambah Rundown Harlah</h3>
            <form onSubmit={handleAddRundown} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Jam / Waktu *</label>
                <input
                  type="text"
                  required
                  placeholder="07:30 - 10:00 WIB"
                  value={rdTime}
                  onChange={(e) => setRdTime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Sesi *</label>
                <input
                  type="text"
                  required
                  value={rdTitle}
                  onChange={(e) => setRdTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Keterangan</label>
                <input
                  type="text"
                  value={rdDesc}
                  onChange={(e) => setRdDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">PIC</label>
                <input
                  type="text"
                  value={rdPic}
                  onChange={(e) => setRdPic(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowRundownModal(false)} className="flex-1 py-2 bg-slate-100 text-xs font-bold rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-amber-800 text-white text-xs font-bold rounded-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="soft-card p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-base text-slate-800">Catat Transaksi Keuangan Harlah</h3>
            <form onSubmit={handleAddFinancial} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Jenis Transaksi</label>
                <select
                  value={finType}
                  onChange={(e) => setFinType(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                >
                  <option value="INCOME">Pemasukan (Subsidi / Sponsor / Alumni)</option>
                  <option value="EXPENSE">Pengeluaran (Panggung / Konsumsi / Sound)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Keterangan *</label>
                <input
                  type="text"
                  required
                  value={finDesc}
                  onChange={(e) => setFinDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nominal (Rp) *</label>
                <input
                  type="number"
                  required
                  value={finAmount || ''}
                  onChange={(e) => setFinAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowFinModal(false)} className="flex-1 py-2 bg-slate-100 text-xs font-bold rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-amber-800 text-white text-xs font-bold rounded-xl">Simpan Transaksi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
