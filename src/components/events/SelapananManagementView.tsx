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
  RefreshCw,
  Info,
  Paperclip,
  Check,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import autoTable from 'jspdf-autotable';
import { User, UserRole, DocumentMetadata } from '../../types';

export interface CommitteeMemberItem {
  id: string;
  roleTitle: string; // e.g. Ketua Panitia, Sekretaris, Bendahara, Sie Acara
  memberName: string;
  contact?: string;
  institution?: string;
}

export interface SelapananCommitteeStructure {
  id: string;
  eventName: string; // e.g. "Selapanan Ahad Kliwon - Agustus 2026"
  dateCreated: string;
  status: 'ACTIVE' | 'ARCHIVED';
  members: CommitteeMemberItem[];
}

export interface InvitationNotice {
  id: string;
  type: 'MEETING' | 'MAIN_EVENT';
  title: string;
  date: string;
  time: string;
  location: string;
  agenda: string;
  status: 'PUBLISHED' | 'DRAFT';
  attachmentName?: string;
  attachmentData?: string; // Base64
}

export interface RundownItem {
  id: string;
  timeRange: string;
  activityTitle: string;
  description: string;
  picName: string;
}

export interface FinancialEntry {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  date: string;
  receiptName?: string;
}

interface SelapananManagementViewProps {
  currentUser: User;
  onBack: () => void;
  onLogAction: (action: string, details: string) => void;
}

export function SelapananManagementView({ currentUser, onBack, onLogAction }: SelapananManagementViewProps) {
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_SELAPANAN' || currentUser.username === 'adminselapanan';
  const [activeTab, setActiveTab] = useState<'PANITIA' | 'UNDANGAN' | 'RUNDOWN' | 'KEUANGAN' | 'LPJ'>('PANITIA');

  // Committee State
  const [committees, setCommittees] = useState<SelapananCommitteeStructure[]>(() => {
    const saved = localStorage.getItem('ald_selapanan_committees');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'comm-1',
        eventName: 'Selapanan Ahad Kliwon - Agustus 2026',
        dateCreated: new Date().toISOString(),
        status: 'ACTIVE',
        members: [
          { id: 'm-1', roleTitle: 'Penanggung Jawab', memberName: 'KH. Syarifuddin, S.Pd.I', contact: '08123456789' },
          { id: 'm-2', roleTitle: 'Ketua Panitia', memberName: 'Ahmad Muthohar, M.Pd.I', contact: '08123456780' },
          { id: 'm-3', roleTitle: 'Sekretaris', memberName: 'Khaerotul izah, S.Sos', contact: '08123456781' },
          { id: 'm-4', roleTitle: 'Bendahara', memberName: 'Rini Windarsih, SE.', contact: '08123456782' },
          { id: 'm-5', roleTitle: 'Sie Acara & Khidmah', memberName: 'Suwarso, S.Ag', contact: '08123456783' }
        ]
      }
    ];
  });

  // Active committee
  const activeCommittee = committees.find((c) => c.status === 'ACTIVE') || committees[0];

  // Invitations State
  const [invitations, setInvitations] = useState<InvitationNotice[]>(() => {
    const saved = localStorage.getItem('ald_selapanan_invitations');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'inv-1',
        type: 'MEETING',
        title: 'Musyawarah Pembentukan Panitia & Persiapan Selapanan Ahad Kliwon',
        date: '2026-07-28',
        time: '19:30 WIB',
        location: 'Aula Lt. 2 Kantor YPI',
        agenda: 'Pembentukan struktur panitia, ploting anggaran, dan kepanitiaan konsumsi.',
        status: 'PUBLISHED',
        attachmentName: 'Surat_Undangan_Rapat_Selapanan.pdf'
      },
      {
        id: 'inv-2',
        type: 'MAIN_EVENT',
        title: 'Undangan Resmi Pengajian Selapanan Ahad Kliwon Bulan Agustus 2026',
        date: '2026-08-09',
        time: '08:00 WIB - Selesai',
        location: 'Masjid Jami\' YPI Raudhotut Tholibin',
        agenda: 'Istighosah, Sholawat Simtudduror, Mauidhoh Hasanah, & Ramah Tamah.',
        status: 'PUBLISHED',
        attachmentName: 'Undangan_Resmi_Selapanan_Agustus.pdf'
      }
    ];
  });

  // Rundowns State
  const [rundowns, setRundowns] = useState<RundownItem[]>(() => {
    const saved = localStorage.getItem('ald_selapanan_rundown');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: 'r-1', timeRange: '08:00 - 08:30 WIB', activityTitle: 'Pembukaan & Fatihah Khusushon', description: 'Pembacaan ummul qur\'an lil muassis yayasan.', picName: 'Ust. Kurdi' },
      { id: 'r-2', timeRange: '08:30 - 09:30 WIB', activityTitle: 'Istighosah & Dzikir Jama\'i', description: 'Istighosah keselamatan santri & jam\'iyyah.', picName: 'KH. Fahat Muzani' },
      { id: 'r-3', timeRange: '09:30 - 10:30 WIB', activityTitle: 'Gema Sholawat Simtudduror', description: 'Pembacaan maulid oleh tim rebana santri.', picName: 'Tim Hadroh Santri' },
      { id: 'r-4', timeRange: '10:30 - 11:30 WIB', activityTitle: 'Mauidhoh Hasanah & Kajian Kitab', description: 'Pengajian kitab Ihya\' Ulumiddin.', picName: 'Pengasuh Utama YPI' },
      { id: 'r-5', timeRange: '11:30 - Selesai', activityTitle: 'Doa Penutup & Musafahah', description: 'Makan bersama nampan & ramah tamah.', picName: 'Sie Konsumsi' }
    ];
  });

  // Financial Entries State
  const [financials, setFinancials] = useState<FinancialEntry[]>(() => {
    const saved = localStorage.getItem('ald_selapanan_financials');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: 'f-1', type: 'INCOME', description: 'Kas Rutin Pengajian Selapanan', amount: 5000000, date: '2026-08-01' },
      { id: 'f-2', type: 'INCOME', description: 'Donasi Infaq Hamba Allah', amount: 2500000, date: '2026-08-05' },
      { id: 'f-3', type: 'EXPENSE', description: 'Belanja Konsumsi & Snack Jamaah', amount: 3200000, date: '2026-08-08' },
      { id: 'f-4', type: 'EXPENSE', description: 'Kebersihan & Sound System', amount: 800000, date: '2026-08-09' }
    ];
  });

  // Save changes to localStorage
  useEffect(() => { localStorage.setItem('ald_selapanan_committees', JSON.stringify(committees)); }, [committees]);
  useEffect(() => { localStorage.setItem('ald_selapanan_invitations', JSON.stringify(invitations)); }, [invitations]);
  useEffect(() => { localStorage.setItem('ald_selapanan_rundown', JSON.stringify(rundowns)); }, [rundowns]);
  useEffect(() => { localStorage.setItem('ald_selapanan_financials', JSON.stringify(financials)); }, [financials]);

  // Modal / Form states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberContact, setNewMemberContact] = useState('');

  const [showInvModal, setShowInvModal] = useState(false);
  const [invType, setInvType] = useState<'MEETING' | 'MAIN_EVENT'>('MEETING');
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

  // --- ACTIONS ---
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim() || !newMemberName.trim()) return;

    const newMember: CommitteeMemberItem = {
      id: 'm-' + Date.now(),
      roleTitle: newRoleTitle.trim(),
      memberName: newMemberName.trim(),
      contact: newMemberContact.trim()
    };

    setCommittees((prev) =>
      prev.map((c) =>
        c.status === 'ACTIVE'
          ? { ...c, members: [...c.members, newMember] }
          : c
      )
    );

    setNewRoleTitle('');
    setNewMemberName('');
    setNewMemberContact('');
    setShowMemberModal(false);
    onLogAction('SELAPANAN_UPDATE', `Menambah anggota panitia Selapanan: ${newMemberName}`);
  };

  const handleDeleteMember = (memberId: string) => {
    setCommittees((prev) =>
      prev.map((c) =>
        c.status === 'ACTIVE'
          ? { ...c, members: c.members.filter((m) => m.id !== memberId) }
          : c
      )
    );
  };

  const handleArchiveAndNewCommittee = () => {
    const name = prompt('Masukkan Nama/Periode Selapanan Baru (misal: "Selapanan September 2026"):');
    if (!name) return;

    setCommittees((prev) => [
      {
        id: 'comm-' + Date.now(),
        eventName: name,
        dateCreated: new Date().toISOString(),
        status: 'ACTIVE',
        members: activeCommittee ? [...activeCommittee.members] : []
      },
      ...prev.map((c) => ({ ...c, status: 'ARCHIVED' as const }))
    ]);

    onLogAction('SELAPANAN_ARCHIVE', `Mengarsip kepanitiaan lama & membuka struktur panitia baru: ${name}`);
  };

  const handleAddInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invTitle.trim() || !invDate.trim()) return;

    const newInv: InvitationNotice = {
      id: 'inv-' + Date.now(),
      type: invType,
      title: invTitle.trim(),
      date: invDate,
      time: invTime || '08:00 WIB',
      location: invLocation || 'Kompleks YPI Pusat',
      agenda: invAgenda,
      status: 'PUBLISHED'
    };

    setInvitations([newInv, ...invitations]);
    setInvTitle('');
    setInvAgenda('');
    setShowInvModal(false);
    onLogAction('SELAPANAN_INVITATION_CREATE', `Membuat undangan Selapanan: ${invTitle}`);
  };

  const handleAddRundown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rdTitle.trim() || !rdTime.trim()) return;

    const newRd: RundownItem = {
      id: 'rd-' + Date.now(),
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

  const handleDeleteRundown = (id: string) => {
    setRundowns(rundowns.filter((r) => r.id !== id));
  };

  const handleAddFinancial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finDesc.trim() || finAmount <= 0) return;

    const newFin: FinancialEntry = {
      id: 'fin-' + Date.now(),
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

  const handleDeleteFinancial = (id: string) => {
    setFinancials(financials.filter((f) => f.id !== id));
  };

  // Financial Calculations
  const totalIncome = financials.filter((f) => f.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
  const totalExpense = financials.filter((f) => f.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
  const balance = totalIncome - totalExpense;

  // --- LPJ AUTO COMPILATION & PDF EXPORT ---
  const handleExportLPJPdf = async () => {
    const doc = new (await import('jspdf')).default({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Green banner header
    doc.setFillColor(2, 44, 22);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setFillColor(255, 179, 0);
    doc.rect(0, 32, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('LAPORAN PERTANGGUNGJAWABAN (LPJ) RESMI', 14, 14);
    doc.setFontSize(11);
    doc.text(`AGENDA SELAPANAN - YAYASAN PENDIDIKAN ISLAM RAUDHOTUT THOLIBIN`, 14, 22);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 230, 210);
    doc.text(`Periode Acara: ${activeCommittee?.eventName || 'Selapanan Bulanan'}`, 14, 28);
    doc.text(`Tanggal Kompilasi: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, 28);

    let currentY = 40;

    // 1. STRUKTUR PANITIA TABLE
    doc.setTextColor(2, 44, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. STRUKTUR PANITIA PELAKSANA SELAPANAN', 14, currentY);
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
      headStyles: { fillColor: [2, 44, 22], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 2. RUNDOWN ACARA TABLE
    doc.setTextColor(2, 44, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. SUSUNAN ACARA & RUNDOWN PELAKSANAAN', 14, currentY);
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
      headStyles: { fillColor: [2, 44, 22], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 3. FINANCIAL SUMMARY TABLE
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(2, 44, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. LAPORAN KEUANGAN & ANGGARAN', 14, currentY);
    currentY += 4;

    const finData = financials.map((f, idx) => [
      (idx + 1).toString(),
      f.date,
      f.description,
      f.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      `Rp ${f.amount.toLocaleString('id-ID')}`
    ]);

    // Add total row
    finData.push([
      '',
      '',
      'TOTAL SALDO AKHIR',
      balance >= 0 ? 'Surplus' : 'Defisit',
      `Rp ${balance.toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tanggal', 'Keterangan Transaksi', 'Kategori', 'Jumlah (Rp)']],
      body: finData,
      theme: 'grid',
      headStyles: { fillColor: [2, 44, 22], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      columnStyles: { 4: { fontStyle: 'bold', halign: 'right' } }
    });

    currentY = (doc as any).lastAutoTable.finalY + 14;

    // Signatures
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);

    doc.text('Ketua Panitia Selapanan,', 20, currentY);
    doc.text('Sekretaris,', 140, currentY);

    currentY += 22;
    doc.text(activeCommittee?.members.find((m) => m.roleTitle.includes('Ketua'))?.memberName || '( ................................... )', 20, currentY);
    doc.text(activeCommittee?.members.find((m) => m.roleTitle.includes('Sekretaris'))?.memberName || '( ................................... )', 140, currentY);

    doc.save(`LPJ_Selapanan_${(activeCommittee?.eventName || 'Resmi').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    onLogAction('SELAPANAN_LPJ_EXPORT', 'Mengunduh Dokumen LPJ Selapanan versi PDF lengkap.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#022c16] via-[#011f0f] to-[#01140a] rounded-xl p-6 sm:p-8 text-white relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl soft-bg/10 hover:soft-bg/20 text-emerald-100 text-xs font-bold transition-all cursor-pointer backdrop-blur-md"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ffb300]/20 border border-[#ffb300]/30 text-[#ffc107] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Agenda Rutin Bulanan
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Pusat Pengelolaan Selapanan
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 font-medium max-w-2xl leading-relaxed">
              Manajemen struktur panitia, surat undangan musyawarah/acara, rundown kegiatan, rekapitulasi keuangan, hingga kompilasi LPJ otomatis.
            </p>
          </div>

          <div className="soft-bg/10 backdrop-blur-md border border-white/15 rounded-xl p-4 shrink-0 flex flex-col justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 mb-1">Administrator Penanggung Jawab</div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#ffb300]" />
              <span className="font-semibold text-sm text-white">@adminselapanan</span>
            </div>
            <span className="text-[10px] text-emerald-300/80 mt-1">Status: {isAdmin ? 'Akses Penuh (Admin)' : 'Mode Lihat'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 soft-card p-4 scrollbar-none">
        <button
          onClick={() => setActiveTab('PANITIA')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'PANITIA' ? 'bg-[#022c16] text-white' : 'text-slate-600 hover:bg-emerald-50'
          }`}
        >
          <Users className="w-4 h-4" /> Struktur Panitia ({activeCommittee?.members.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('UNDANGAN')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'UNDANGAN' ? 'bg-[#022c16] text-white' : 'text-slate-600 hover:bg-emerald-50'
          }`}
        >
          <FileText className="w-4 h-4" /> Undangan Rapat & Acara ({invitations.length})
        </button>
        <button
          onClick={() => setActiveTab('RUNDOWN')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'RUNDOWN' ? 'bg-[#022c16] text-white' : 'text-slate-600 hover:bg-emerald-50'
          }`}
        >
          <Clock className="w-4 h-4" /> Rundown Kegiatan ({rundowns.length})
        </button>
        <button
          onClick={() => setActiveTab('KEUANGAN')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'KEUANGAN' ? 'bg-[#022c16] text-white' : 'text-slate-600 hover:bg-emerald-50'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Laporan Keuangan
        </button>
        <button
          onClick={() => setActiveTab('LPJ')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'LPJ' ? 'bg-amber-600 text-white' : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <Award className="w-4 h-4 text-[#ffb300]" /> Kompilasi LPJ & Ekspor PDF
        </button>
      </div>

      {/* TAB 1: STRUKTUR PANITIA */}
      {activeTab === 'PANITIA' && (
        <div className="space-y-6">
          <div className="soft-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                  {activeCommittee?.eventName}
                </span>
                <h3 className="text-lg font-serif font-bold text-slate-800 mt-2">Susunan Kepanitiaan Aktif</h3>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleArchiveAndNewCommittee}
                    className="soft-button-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" /> Arsip & Buat Baru
                  </button>
                  <button
                    onClick={() => setShowMemberModal(true)}
                    className="px-4 py-2 bg-[#022c16] hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> Tambah Anggota Panitia
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCommittee?.members.map((m) => (
                <div key={m.id} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-2 relative group hover:border-emerald-300 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                      {m.roleTitle}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Hapus Anggota"
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

      {/* TAB 2: UNDANGAN RAPAT & ACARA */}
      {activeTab === 'UNDANGAN' && (
        <div className="space-y-6">
          <div className="soft-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-800">Daftar Undangan & Pengumuman</h3>
                <p className="text-xs text-slate-500">Kelola surat undangan rapat musyawarah dan undangan acara utama Selapanan.</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowInvModal(true)}
                  className="px-4 py-2 bg-[#022c16] hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
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
                      inv.type === 'MEETING' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {inv.type === 'MEETING' ? 'Undangan Rapat' : 'Undangan Acara Utama'}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{inv.date} • {inv.time}</span>
                  </div>

                  <h4 className="text-base font-semibold text-slate-800">{inv.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{inv.agenda}</p>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-200/40">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-700" /> {inv.location}</span>
                    {inv.attachmentName && (
                      <span className="flex items-center gap-1 text-emerald-800 font-bold"><Paperclip className="w-3.5 h-3.5" /> {inv.attachmentName}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RUNDOWN ACARA */}
      {activeTab === 'RUNDOWN' && (
        <div className="space-y-6">
          <div className="soft-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-800">Rundown & Susunan Acara Selapanan</h3>
                <p className="text-xs text-slate-500">Atur urutan susunan kegiatan, jadwal jam, serta penanggung jawab (PIC).</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowRundownModal(true)}
                  className="px-4 py-2 bg-[#022c16] hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tambah Sesi Acara
                </button>
              )}
            </div>

            <div className="relative border-l-2 border-emerald-200 ml-4 pl-6 space-y-6">
              {rundowns.map((r) => (
                <div key={r.id} className="relative bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-1">
                  <div className="absolute -left-[33px] top-4 w-3.5 h-3.5 rounded-full bg-[#022c16] border-4 border-white" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">{r.timeRange}</span>
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

      {/* TAB 4: LAPORAN KEUANGAN */}
      {activeTab === 'KEUANGAN' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">Total Pemasukan</span>
              <p className="text-xl font-semibold text-emerald-900">Rp {totalIncome.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">Total Pengeluaran</span>
              <p className="text-xl font-semibold text-amber-900">Rp {totalExpense.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-slate-900 text-white rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Saldo / Surplus</span>
              <p className="text-xl font-semibold text-white">Rp {balance.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className="soft-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-800">Rincian Transaksi Keuangan</h3>
                <p className="text-xs text-slate-500">Pencatatan kas masuk, donasi infaq, serta belanja kebutuhan operasional.</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowFinModal(true)}
                  className="px-4 py-2 bg-[#022c16] hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
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

      {/* TAB 5: KOMPILASI LPJ & EKSPOR PDF */}
      {activeTab === 'LPJ' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-transparent border border-amber-500/30 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 text-xs font-semibold">
                  <Award className="w-4 h-4 text-amber-700" /> Otomatis Terkompilasi
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">
                  Laporan Pertanggungjawaban (LPJ) Selapanan
                </h2>
                <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
                  Sistem mengompilasi seluruh data Struktur Panitia, Surat Undangan, Rundown Acara, serta Laporan Keuangan ke dalam 1 berkas dokumen LPJ yang rapi & siap cetak.
                </p>
              </div>

              <button
                onClick={handleExportLPJPdf}
                className="px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4" /> Unduh Dokumen LPJ (PDF)
              </button>
            </div>

            {/* Checklist items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-amber-200/60">
              <div className="flex items-center gap-3 soft-card p-3.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-slate-800">Struktur Kepanitiaan</span>
                  <span className="block text-[10px] text-slate-500">{activeCommittee?.members.length} Anggota Terdaftar</span>
                </div>
              </div>

              <div className="flex items-center gap-3 soft-card p-3.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-slate-800">Surat & Undangan</span>
                  <span className="block text-[10px] text-slate-500">{invitations.length} Berkas Diterbitkan</span>
                </div>
              </div>

              <div className="flex items-center gap-3 soft-card p-3.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-slate-800">Rundown & Jadwal</span>
                  <span className="block text-[10px] text-slate-500">{rundowns.length} Sesi Terjadwal</span>
                </div>
              </div>

              <div className="flex items-center gap-3 soft-card p-3.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-slate-800">Laporan Keuangan</span>
                  <span className="block text-[10px] text-slate-500">Saldo Akhir: Rp {balance.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="soft-card p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-base text-slate-800">Tambah Anggota Panitia</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Jabatan / Sie *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Ketua, Bendahara, Sie Konsumsi..."
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
                  placeholder="Masukkan nama..."
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">No. Kontak (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="08..."
                  value={newMemberContact}
                  onChange={(e) => setNewMemberContact(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 py-2 bg-slate-100 text-xs font-bold rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-[#022c16] text-white text-xs font-bold rounded-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invitation Modal */}
      {showInvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="soft-card p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-base text-slate-800">Buat Undangan Baru</h3>
            <form onSubmit={handleAddInvitation} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Jenis Undangan</label>
                <select
                  value={invType}
                  onChange={(e) => setInvType(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                >
                  <option value="MEETING">Undangan Rapat Musyawarah</option>
                  <option value="MAIN_EVENT">Undangan Acara Utama Selapanan</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Judul Undangan *</label>
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
                    placeholder="08:00 WIB"
                    value={invTime}
                    onChange={(e) => setInvTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Agenda & Deskripsi</label>
                <textarea
                  rows={3}
                  value={invAgenda}
                  onChange={(e) => setInvAgenda(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowInvModal(false)} className="flex-1 py-2 bg-slate-100 text-xs font-bold rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-[#022c16] text-white text-xs font-bold rounded-xl">Terbitkan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rundown Modal */}
      {showRundownModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="soft-card p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-base text-slate-800">Tambah Rundown Sesi</h3>
            <form onSubmit={handleAddRundown} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Jam / Durasi *</label>
                <input
                  type="text"
                  required
                  placeholder="08:00 - 08:30 WIB"
                  value={rdTime}
                  onChange={(e) => setRdTime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={rdTitle}
                  onChange={(e) => setRdTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Keterangan Singkat</label>
                <input
                  type="text"
                  value={rdDesc}
                  onChange={(e) => setRdDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">PIC Penanggung Jawab</label>
                <input
                  type="text"
                  value={rdPic}
                  onChange={(e) => setRdPic(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowRundownModal(false)} className="flex-1 py-2 bg-slate-100 text-xs font-bold rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-[#022c16] text-white text-xs font-bold rounded-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Financial Modal */}
      {showFinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="soft-card p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-base text-slate-800">Catat Transaksi Keuangan</h3>
            <form onSubmit={handleAddFinancial} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Jenis Transaksi</label>
                <select
                  value={finType}
                  onChange={(e) => setFinType(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                >
                  <option value="INCOME">Pemasukan (Kas / Donasi)</option>
                  <option value="EXPENSE">Pengeluaran (Belanja / Operasional)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Keterangan Transaksi *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Infaq Hamba Allah, Belanja Konsumsi..."
                  value={finDesc}
                  onChange={(e) => setFinDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Jumlah Nominal (Rp) *</label>
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
                <button type="submit" className="flex-1 py-2 bg-[#022c16] text-white text-xs font-bold rounded-xl">Simpan Transaksi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
