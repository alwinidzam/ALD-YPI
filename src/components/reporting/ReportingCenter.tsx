import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ClipboardList,
  MessageSquare,
  Search,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  UploadCloud,
  File,
  X,
  Paperclip,
  Send,
  Loader2,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Eye,
  Trash2,
  Lock,
  CornerDownRight,
  ArrowLeft,
  Settings,
  Bell,
  BellRing,
  CheckCheck,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Report, ReportType, ReportStatus, ReportAttachment, ReportMessage, User, UserRole } from '../../types';
import { dbSaveReport, dbGetReportAttachmentData, dbDeleteReport, reportsCol, logsCol } from '../../firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export interface ReportNotification {
  id: string;
  reportId: string;
  reportTitle: string;
  type: 'STATUS_CHANGE' | 'CHAT_REPLY';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface ReportingCenterProps {
  currentUser: User;
  onLogAction: (action: any, details: string) => Promise<void>;
  users: User[];
}

export default function ReportingCenter({ currentUser, onLogAction, users }: ReportingCenterProps) {
  // Real-time Notification State
  const [notifications, setNotifications] = useState<ReportNotification[]>(() => {
    try {
      const stored = localStorage.getItem(`report_notifications_${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [toasts, setToasts] = useState<ReportNotification[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem(`report_notif_sound_${currentUser.id}`) !== 'false';
    } catch {
      return true;
    }
  });
  const prevReportsRef = useRef<Report[]>([]);

  // Persist sound settings
  useEffect(() => {
    try {
      localStorage.setItem(`report_notif_sound_${currentUser.id}`, String(isSoundEnabled));
    } catch (e) {
      console.error(e);
    }
  }, [isSoundEnabled, currentUser.id]);

  // Persist notification list
  useEffect(() => {
    try {
      localStorage.setItem(`report_notifications_${currentUser.id}`, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications, currentUser.id]);

  // Navigation states
  // 'SERVICES' | 'SUBMIT_FORM' | 'TRACK_SEARCH' | 'REPORT_DETAIL' | 'ADMIN_DASHBOARD'
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'SUBMIT_FORM' | 'TRACK_SEARCH' | 'REPORT_DETAIL' | 'ADMIN_DASHBOARD'>(() => {
    return (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_SMA') ? 'ADMIN_DASHBOARD' : 'SERVICES';
  });

  // Data state
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [fullAttachmentData, setFullAttachmentData] = useState<string | null>(null);
  const [loadingAttachment, setLoadingAttachment] = useState(false);

  // Submission Form State
  const [formService, setFormService] = useState<ReportType>('WHISTLEBLOWING');
  const [formCategory, setFormCategory] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIdentity, setFormIdentity] = useState<'PROTECTED' | 'OPEN'>('PROTECTED');
  const [formAttachment, setFormAttachment] = useState<ReportAttachment | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tracking Search State
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [trackingError, setTrackingError] = useState('');

  // Conversation/Chat state
  const [messageInput, setMessageInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Admin control state
  const [adminInternalNotes, setAdminInternalNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);

  // Filter States (For lists and Admin dashboard)
  const [adminFilterType, setAdminFilterType] = useState<string>('ALL');
  const [adminFilterStatus, setAdminFilterStatus] = useState<string>('ALL');
  const [adminSearchCode, setAdminSearchCode] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get status label in Indonesian
  const getStatusLabel = (status: ReportStatus): string => {
    const labels: Record<ReportStatus, string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Terkirim',
      UNDER_VERIFICATION: 'Verifikasi',
      IN_PROGRESS: 'Diproses',
      NEED_INFO: 'Butuh Info',
      RESOLVED: 'Selesai',
      REJECTED: 'Ditolak'
    };
    return labels[status] || status;
  };

  // Sound & Notification Trigger
  const addNotification = (notif: ReportNotification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });
    setToasts((prev) => [...prev, notif]);

    if (isSoundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        // AudioContext might be blocked, ignore
      }
    }
  };

  const addNotificationRef = useRef(addNotification);
  useEffect(() => {
    addNotificationRef.current = addNotification;
  });

  // Categories definition
  const serviceCategories: Record<ReportType, string[]> = {
    WHISTLEBLOWING: [
      'Penyalahgunaan Wewenang',
      'Penyalahgunaan Keuangan',
      'Kecurangan / Fraud',
      'Pelanggaran Etika',
      'Penyalahgunaan Aset Yayasan',
      'Pemalsuan Dokumen',
      'Pelanggaran Berat'
    ],
    COMPLAINT: [
      'Fasilitas Rusak',
      'Layanan Administrasi',
      'Masalah Internet / WiFi',
      'Kondisi Kelas',
      'Kebersihan Lingkungan',
      'Kerusakan Peralatan'
    ],
    SUGGESTION: [
      'Program Sekolah Baru',
      'Peningkatan Fasilitas',
      'Inisiasi Digital / IT',
      'Pengembangan Perpustakaan',
      'Lingkungan Sekolah'
    ]
  };

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_SMA';

  // Subscriptions to Firestore reports
  useEffect(() => {
    const q = (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_SMA')
      ? reportsCol
      : query(reportsCol, where('reporterId', '==', currentUser.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsList: Report[] = [];
      snapshot.forEach((docSnap) => {
        reportsList.push({ id: docSnap.id, ...docSnap.data() } as Report);
      });
      // Sort reports by updatedAt desc
      reportsList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      // Compare to trigger notifications
      if (prevReportsRef.current && prevReportsRef.current.length > 0) {
        reportsList.forEach((newReport) => {
          const oldReport = prevReportsRef.current.find(r => r.id === newReport.id);
          if (oldReport) {
            // 1. Status updated (for reporters)
            if (!isAdmin && oldReport.status !== newReport.status) {
              const statusLabel = getStatusLabel(newReport.status);
              addNotificationRef.current({
                id: `${newReport.id}-status-${newReport.status}-${Date.now()}`,
                reportId: newReport.id,
                reportTitle: newReport.title,
                type: 'STATUS_CHANGE',
                title: 'Status Laporan Diperbarui',
                message: `Laporan Anda "${newReport.title}" telah diperbarui menjadi: ${statusLabel}`,
                timestamp: Date.now(),
                read: false
              });
            }

            // 2. Chat reply
            const oldConv = oldReport.conversation || [];
            const newConv = newReport.conversation || [];
            if (newConv.length > oldConv.length) {
              const oldMsgIds = new Set(oldConv.map(m => m.id));
              const newMessages = newConv.filter(m => !oldMsgIds.has(m.id));
              const foreignReplies = newMessages.filter(m => m.senderId !== currentUser.id);

              if (foreignReplies.length > 0) {
                foreignReplies.forEach((msg) => {
                  const isSenderAdmin = msg.senderRole === 'SUPER_ADMIN' || msg.senderRole === 'ADMIN_SMA';
                  const notifTitle = isSenderAdmin ? 'Pesan dari Administrator' : 'Pesan Baru Pelapor';
                  const notifMsg = isSenderAdmin
                    ? `Admin ${msg.senderName} membalas laporan "${newReport.title}": "${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}"`
                    : `Pelapor ${msg.senderName} mengirim pesan di "${newReport.title}": "${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}"`;

                  addNotificationRef.current({
                    id: `${newReport.id}-msg-${msg.id}-${Date.now()}`,
                    reportId: newReport.id,
                    reportTitle: newReport.title,
                    type: 'CHAT_REPLY',
                    title: notifTitle,
                    message: notifMsg,
                    timestamp: Date.now(),
                    read: false
                  });
                });
              }
            }
          }
        });
      }

      // Update ref and state
      prevReportsRef.current = reportsList;
      setAllReports(reportsList);
      setLoading(false);

      // Keep selected report updated if it exists
      if (selectedReport) {
        const updated = reportsList.find(r => r.id === selectedReport.id);
        if (updated) {
          setSelectedReport(updated);
        }
      }
    }, (error) => {
      console.error("Error reading reports snapshot:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedReport?.id, currentUser.id, currentUser.role, isAdmin]);

  // Toast auto-dismiss timer
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 7500);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const dismissToast = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNotificationClick = (notif: ReportNotification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    // Find report
    const targetReport = allReports.find((r) => r.id === notif.reportId);
    if (targetReport) {
      setSelectedReport(targetReport);
      setActiveTab('REPORT_DETAIL');
    }
    // Dismiss toast & panel
    setShowNotificationPanel(false);
    setToasts((prev) => prev.filter((t) => t.id !== notif.id));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotificationHistory = () => {
    setNotifications([]);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  // Handle loading full base64 attachment when selecting a report
  useEffect(() => {
    if (selectedReport?.attachment) {
      if (selectedReport.attachment.fileData === 'CHUNKS_EXIST') {
        setLoadingAttachment(true);
        setFullAttachmentData(null);
        dbGetReportAttachmentData(selectedReport.id)
          .then((data) => {
            setFullAttachmentData(data);
          })
          .catch((err) => {
            console.error("Failed to load chunks:", err);
          })
          .finally(() => {
            setLoadingAttachment(false);
          });
      } else {
        setFullAttachmentData(selectedReport.attachment.fileData);
      }
    } else {
      setFullAttachmentData(null);
    }
  }, [selectedReport?.id, selectedReport?.attachment?.fileData]);

  // Security guard to enforce that non-admins can only view their own reports
  useEffect(() => {
    if (selectedReport) {
      if (!isAdmin && selectedReport.reporterId !== currentUser.id) {
        setSelectedReport(null);
        setActiveTab('SERVICES');
      }
    }
  }, [selectedReport?.id, currentUser.id, isAdmin]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedReport?.conversation]);

  // Form setup helper
  const handleOpenForm = (type: ReportType) => {
    setFormService(type);
    setFormCategory(serviceCategories[type][0]);
    setFormTitle('');
    setFormDescription('');
    setFormIdentity('PROTECTED');
    setFormAttachment(null);
    setUploadError('');
    setActiveTab('SUBMIT_FORM');
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    setUploadError('');
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'video/mp4'
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Tipe berkas tidak didukung! Format yang diperbolehkan: PDF, JPG, PNG, DOCX, MP4.');
      return;
    }

    const maxSizeInBytes = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSizeInBytes) {
      setUploadError('Ukuran berkas melebihi batas maksimum 20 MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      const formattedSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      setFormAttachment({
        name: file.name,
        type: file.type,
        fileSize: formattedSize,
        fileData: base64String
      });
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca file!');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Submit report handler (Draft or official Submit)
  const handleSubmitReport = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (!formTitle.trim()) {
      alert('Judul laporan tidak boleh kosong!');
      return;
    }
    if (!formDescription.trim()) {
      alert('Deskripsi detail tidak boleh kosong!');
      return;
    }

    setIsSubmitting(true);
    const trackingSuffix = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `ALD-REP-${trackingSuffix}`;
    const nowISO = new Date().toISOString();

    const newReport: Report = {
      id: trackingCode,
      trackingCode,
      type: formService,
      title: formTitle,
      description: formDescription,
      category: formCategory,
      status,
      identityOption: formIdentity,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reporterUsername: currentUser.username,
      reporterRole: currentUser.role,
      reporterContact: currentUser.contact || '',
      createdAt: nowISO,
      updatedAt: nowISO,
      conversation: []
    };

    if (formAttachment) {
      newReport.attachment = formAttachment;
    }

    try {
      await dbSaveReport(newReport);
      await onLogAction('REPORT_CREATE', `Membuat laporan ${formService} baru dengan Kode Pelacakan ${trackingCode} (${status})`);
      
      alert(
        status === 'SUBMITTED'
          ? `Laporan berhasil dikirim!\nKode Pelacakan Anda: ${trackingCode}\nCatat kode ini untuk melacak status laporan.`
          : `Laporan disimpan sebagai Draft dengan Kode: ${trackingCode}`
      );
      
      // Clean up form
      setFormTitle('');
      setFormDescription('');
      setFormAttachment(null);
      setSelectedReport(newReport);
      setActiveTab('REPORT_DETAIL');
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan laporan!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send message chat handler
  const handleSendMessage = async () => {
    if (!selectedReport || !messageInput.trim()) return;

    setIsSendingMessage(true);
    const nowISO = new Date().toISOString();
    
    const newMessage: ReportMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderUsername: currentUser.username,
      senderRole: currentUser.role,
      content: messageInput,
      timestamp: nowISO
    };

    const updatedConversation = [...(selectedReport.conversation || []), newMessage];

    try {
      const docRef = doc(reportsCol, selectedReport.id);
      await updateDoc(docRef, {
        conversation: updatedConversation,
        updatedAt: nowISO
      });

      await onLogAction('REPORT_COMMENT_ADD', `Menambahkan pesan baru di Laporan ${selectedReport.id}`);
      setMessageInput('');
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim pesan!');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Admin action: update status
  const handleAdminUpdateStatus = async (newStatus: ReportStatus) => {
    if (!selectedReport) return;
    setUpdatingStatus(true);
    const nowISO = new Date().toISOString();

    try {
      const docRef = doc(reportsCol, selectedReport.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: nowISO
      });

      await onLogAction('REPORT_STATUS_UPDATE', `Mengubah status Laporan ${selectedReport.id} menjadi ${newStatus}`);
      alert(`Status laporan berhasil diubah ke: ${newStatus}`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah status!');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Admin action: assign handler
  const handleAdminAssign = async (assigneeId: string) => {
    if (!selectedReport) return;
    setUpdatingAssignee(true);
    const nowISO = new Date().toISOString();

    const selectedAssignee = users.find(u => u.id === assigneeId);
    const assigneeName = selectedAssignee ? selectedAssignee.name : 'Unknown Admin';

    try {
      const docRef = doc(reportsCol, selectedReport.id);
      await updateDoc(docRef, {
        assignedToId: assigneeId,
        assignedToName: assigneeName,
        updatedAt: nowISO
      });

      await onLogAction('REPORT_ASSIGNEE_UPDATE', `Menugaskan Laporan ${selectedReport.id} kepada ${assigneeName}`);
      alert(`Laporan berhasil ditugaskan kepada: ${assigneeName}`);
    } catch (err) {
      console.error(err);
      alert('Gagal menugaskan laporan!');
    } finally {
      setUpdatingAssignee(false);
    }
  };

  // Admin action: update internal notes
  const handleAdminSaveNotes = async () => {
    if (!selectedReport) return;
    const nowISO = new Date().toISOString();

    try {
      const docRef = doc(reportsCol, selectedReport.id);
      await updateDoc(docRef, {
        internalNotes: adminInternalNotes,
        updatedAt: nowISO
      });

      await onLogAction('REPORT_COMMENT_ADD', `Memperbarui Catatan Internal pada Laporan ${selectedReport.id}`);
      alert('Catatan internal berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan catatan internal!');
    }
  };

  // Initialize admin notes text
  useEffect(() => {
    if (selectedReport) {
      setAdminInternalNotes(selectedReport.internalNotes || '');
    }
  }, [selectedReport?.id]);

  // User Action: delete draft
  const handleDeleteDraft = async (reportId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus draft laporan ini? Tindakan ini tidak dapat dibatalkan.')) return;

    try {
      await dbDeleteReport(reportId);
      await onLogAction('DELETE', `Menghapus draft Laporan ${reportId}`);
      alert('Draft laporan berhasil dihapus.');
      setSelectedReport(null);
      setActiveTab('SERVICES');
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus draft!');
    }
  };

  // Code Tracking Lookup
  const handleTrackLookup = () => {
    setTrackingError('');
    const code = trackingCodeInput.trim().toUpperCase();
    if (!code) {
      setTrackingError('Kode pelacakan tidak boleh kosong!');
      return;
    }

    const found = allReports.find(r => r.id === code || r.trackingCode === code);
    if (found) {
      // Validate access
      if (!isAdmin && found.reporterId !== currentUser.id) {
        setTrackingError('Anda tidak memiliki wewenang untuk melihat laporan ini. Laporan bersifat rahasia.');
        return;
      }
      setSelectedReport(found);
      setActiveTab('REPORT_DETAIL');
    } else {
      setTrackingError('Kode pelacakan tidak ditemukan! Pastikan kode yang dimasukkan sudah benar.');
    }
  };

  // Download Attachment Helper
  const handleDownloadAttachment = () => {
    if (!selectedReport?.attachment || !fullAttachmentData) return;
    const link = document.createElement('a');
    link.href = fullAttachmentData;
    link.download = selectedReport.attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onLogAction('DOWNLOAD', `Mengunduh lampiran ${selectedReport.attachment.name} dari Laporan ${selectedReport.id}`);
  };

  // Filtering reports for display
  const userReports = allReports.filter(r => r.reporterId === currentUser.id);
  
  const filteredReportsForAdmin = allReports.filter(r => {
    // Filter Type
    if (adminFilterType !== 'ALL' && r.type !== adminFilterType) return false;
    // Filter Status
    if (adminFilterStatus !== 'ALL' && r.status !== adminFilterStatus) return false;
    // Filter search code
    if (adminSearchCode.trim() !== '') {
      const code = adminSearchCode.trim().toUpperCase();
      return r.id.toUpperCase().includes(code) || r.title.toUpperCase().includes(code);
    }
    return true;
  });

  // Calculate stats metrics
  const totalCount = allReports.length;
  const whistleblowingCount = allReports.filter(r => r.type === 'WHISTLEBLOWING').length;
  const complaintsCount = allReports.filter(r => r.type === 'COMPLAINT').length;
  const suggestionsCount = allReports.filter(r => r.type === 'SUGGESTION').length;
  const openCount = allReports.filter(r => ['DRAFT', 'SUBMITTED', 'UNDER_VERIFICATION', 'IN_PROGRESS', 'NEED_INFO'].includes(r.status)).length;
  const resolvedCount = allReports.filter(r => r.status === 'RESOLVED').length;

  // Render Whistleblowing Summary Card
  const renderWhistleblowingSummaryCard = () => {
    const wbReports = allReports.filter(r => r.type === 'WHISTLEBLOWING');
    const activeWb = wbReports.filter(r => ['SUBMITTED', 'IN_PROGRESS', 'NEED_INFO'].includes(r.status)).length;
    const verifiedWb = wbReports.filter(r => r.status === 'UNDER_VERIFICATION').length;
    const resolvedWb = wbReports.filter(r => r.status === 'RESOLVED').length;

    return (
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5 text-white overflow-hidden relative">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold tracking-widest text-rose-400 uppercase">
                Whistleblowing Summary
              </span>
              <span className="text-[10px] px-2 py-0.5 soft-bg/10 text-slate-300 rounded-full font-bold border border-white/5">
                {isAdmin ? 'Penyaringan: Seluruh Yayasan' : 'Penyaringan: Laporan Saya'}
              </span>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide">Status Whistleblowing System</h3>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-md">
              Ringkasan dugaan pelanggaran integritas, penyalahgunaan wewenang, dan etika berdasarkan peran Anda.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 md:w-auto w-full">
            {/* Active */}
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 text-center flex flex-col justify-center items-center min-w-[95px]">
              <div className="flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-rose-400" />
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Aktif</span>
              </div>
              <span className="text-xl font-bold text-rose-200 leading-none">{activeWb}</span>
              <span className="text-[8px] text-slate-500 font-bold mt-1">Butuh Proses</span>
            </div>
            
            {/* Verified */}
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 text-center flex flex-col justify-center items-center min-w-[95px]">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Verifikasi</span>
              </div>
              <span className="text-xl font-bold text-amber-200 leading-none">{verifiedWb}</span>
              <span className="text-[8px] text-slate-500 font-bold mt-1">Sedang Ditinjau</span>
            </div>
            
            {/* Resolved */}
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 text-center flex flex-col justify-center items-center min-w-[95px]">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Selesai</span>
              </div>
              <span className="text-xl font-bold text-emerald-200 leading-none">{resolvedWb}</span>
              <span className="text-[8px] text-slate-500 font-bold mt-1">Telah Selesai</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Status Badge
  const renderStatusBadge = (status: ReportStatus) => {
    const styling: Record<ReportStatus, { bg: string, text: string, label: string }> = {
      DRAFT: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', label: 'Draft' },
      SUBMITTED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Terkirim' },
      UNDER_VERIFICATION: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Verifikasi' },
      IN_PROGRESS: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Diproses' },
      NEED_INFO: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', label: 'Butuh Info' },
      RESOLVED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Selesai' },
      REJECTED: { bg: 'bg-stone-100 border-stone-200', text: 'text-stone-700', label: 'Ditolak' }
    };
    const info = styling[status];
    return (
      <span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold tracking-wide inline-flex items-center gap-1 ${info.bg} ${info.text}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {info.label}
      </span>
    );
  };

  // Render Service/Type Badge
  const renderTypeBadge = (type: ReportType) => {
    const styling: Record<ReportType, { bg: string, text: string, label: string, icon: any }> = {
      WHISTLEBLOWING: { bg: 'bg-rose-50 border-rose-200/50', text: 'text-rose-700', label: 'Whistleblowing', icon: ShieldAlert },
      COMPLAINT: { bg: 'bg-sky-50 border-sky-200/50', text: 'text-sky-700', label: 'Pengaduan', icon: ClipboardList },
      SUGGESTION: { bg: 'bg-emerald-50 border-emerald-200/50', text: 'text-emerald-700', label: 'Saran', icon: FileText }
    };
    const info = styling[type];
    const Icon = info.icon;
    return (
      <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 ${info.bg} ${info.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {info.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans select-none max-w-7xl mx-auto pb-12">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden bg-emerald-700 text-white rounded-xl p-6 border border-emerald-800/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 z-10 relative">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-wide">Reporting Center</h1>
            <p className="text-xs text-emerald-100 font-semibold mt-1">
              {isAdmin ? 'Portal Administrasi & Penanganan Laporan Yayasan' : 'Pusat Layanan Whistleblowing, Pengaduan Operasional, dan Usulan Konstruktif'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <button
                onClick={() => setActiveTab('ADMIN_DASHBOARD')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'ADMIN_DASHBOARD'
                    ? 'soft-bg text-[#015e2a]'
                    : 'soft-bg/10 hover:soft-bg/20 text-white'
                }`}
              >
                Dashboard Admin
              </button>
            )}
            <button
              onClick={() => setActiveTab('SERVICES')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'SERVICES'
                  ? 'soft-bg text-[#015e2a]'
                  : 'soft-bg/10 hover:soft-bg/20 text-white'
              }`}
            >
              Layanan Saya
            </button>
            <button
              onClick={() => setActiveTab('TRACK_SEARCH')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'TRACK_SEARCH'
                  ? 'soft-bg text-[#015e2a]'
                  : 'soft-bg/10 hover:soft-bg/20 text-white'
              }`}
            >
              Lacak Kode
            </button>

            {/* Notification Bell Button & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className={`relative p-2 rounded-xl transition-all flex items-center justify-center ${
                  showNotificationPanel || unreadNotificationCount > 0
                    ? 'soft-bg text-[#015e2a]'
                    : 'soft-bg/10 hover:soft-bg/20 text-white'
                }`}
                title="Notifikasi Real-time"
              >
                {unreadNotificationCount > 0 ? (
                  <BellRing className="w-4 h-4 animate-bounce" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#015e2a]">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotificationPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-80 soft-bg border border-slate-100 rounded-xl p-4 text-slate-800 z-50 overflow-hidden"
                  >
                    {/* Header of panel */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-bold text-sm">Notifikasi</span>
                        {unreadNotificationCount > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadNotificationCount} baru
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Sound Toggle */}
                        <button
                          onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                          className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                          title={isSoundEnabled ? "Matikan Suara" : "Aktifkan Suara"}
                        >
                          {isSoundEnabled ? (
                            <Volume2 className="w-3.5 h-3.5" />
                          ) : (
                            <VolumeX className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {/* Clear All */}
                        {notifications.length > 0 && (
                          <button
                            onClick={clearNotificationHistory}
                            className="text-[10px] text-rose-600 hover:text-rose-800 font-bold px-1.5 py-1 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            Bersihkan
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-slate-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 stroke-[1.5]" />
                          <p className="text-[11px] font-bold">Tidak ada notifikasi</p>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5 px-2">
                            Semua pembaruan status laporan dan balasan chat real-time akan muncul di sini.
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative flex gap-2.5 ${
                              notif.read
                                ? 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                                : 'bg-emerald-50/30 border-emerald-100/50 hover:bg-emerald-50/50 hover:border-emerald-100'
                            }`}
                          >
                            <div className="mt-0.5">
                              {notif.type === 'STATUS_CHANGE' ? (
                                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                                  <Clock className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[11px] font-bold leading-snug ${notif.read ? 'text-slate-700' : 'text-slate-900'}`}>
                                {notif.title}
                              </p>
                              <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-emerald-500 rounded-full self-center flex-shrink-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer of panel */}
                    {notifications.length > 0 && (
                      <div className="border-t border-slate-100 pt-2 mt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span>Riwayat Laporan</span>
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 hover:bg-emerald-50 px-1.5 py-0.5 rounded-md transition-all"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Tandai Semua Dibaca
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 soft-bg/90 rounded-xl border border-slate-100">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs text-slate-500 font-bold mt-3">Menghubungkan ke pusat pengaduan...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* VIEW: MAIN SERVICES LANDING */}
          {activeTab === 'SERVICES' && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Visual Whistleblowing Status Summary Card */}
              {renderWhistleblowingSummaryCard()}

              {/* Four Services Menu */}
              <div>
                <h2 className="text-sm font-bold text-[#015e2a] uppercase tracking-wider mb-4 px-1">Layanan Pengaduan Internal</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  {/* Whistleblowing System */}
                  <div
                    onClick={() => handleOpenForm('WHISTLEBLOWING')}
                    className="soft-bg/95 border border-rose-100 hover:border-rose-300 rounded-xl p-5  hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="p-3 bg-rose-50 text-rose-600 rounded-xl w-12 h-12 flex items-center justify-center mb-4 border border-rose-100/50 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                        <ShieldAlert className="w-6 h-6 stroke-[2.3]" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Whistleblowing System</h3>
                      <p className="text-[11px] text-slate-500 font-bold mt-2 leading-relaxed">
                        Laporkan pelanggaran integritas, penyalahgunaan wewenang, manipulasi keuangan, atau etika secara rahasia.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-rose-50/50 flex items-center justify-between text-rose-600 text-xs font-bold">
                      <span>Buat Laporan Rahasia</span>
                      <PlusCircle className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Operational Complaints */}
                  <div
                    onClick={() => handleOpenForm('COMPLAINT')}
                    className="soft-bg/95 border border-sky-100 hover:border-sky-300 rounded-xl p-5  hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="p-3 bg-sky-50 text-sky-600 rounded-xl w-12 h-12 flex items-center justify-center mb-4 border border-sky-100/50 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <ClipboardList className="w-6 h-6 stroke-[2.3]" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Aduan Operasional</h3>
                      <p className="text-[11px] text-slate-500 font-bold mt-2 leading-relaxed">
                        Sampaikan keluhan operasional, fasilitas unit rusak, layanan administrasi, atau masalah prasarana sekolah.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-sky-50/50 flex items-center justify-between text-sky-600 text-xs font-bold">
                      <span>Ajukan Keluhan</span>
                      <PlusCircle className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Constructive Suggestions */}
                  <div
                    onClick={() => handleOpenForm('SUGGESTION')}
                    className="soft-bg/95 border border-emerald-100 hover:border-emerald-300 rounded-xl p-5  hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-12 h-12 flex items-center justify-center mb-4 border border-emerald-100/50 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <FileText className="w-6 h-6 stroke-[2.3]" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Usulan / Saran</h3>
                      <p className="text-[11px] text-slate-500 font-bold mt-2 leading-relaxed">
                        Salurkan saran konstruktif, inisiasi digital, peningkatan kualitas perpustakaan, atau gagasan program baru.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-emerald-50/50 flex items-center justify-between text-emerald-600 text-xs font-bold">
                      <span>Kirim Saran</span>
                      <PlusCircle className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Report Tracking Service */}
                  <div
                    onClick={() => setActiveTab('TRACK_SEARCH')}
                    className="soft-bg/95 border border-amber-100 hover:border-amber-300 rounded-xl p-5  hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-12 h-12 flex items-center justify-center mb-4 border border-amber-100/50 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Search className="w-6 h-6 stroke-[2.3]" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Pelacakan Laporan</h3>
                      <p className="text-[11px] text-slate-500 font-bold mt-2 leading-relaxed">
                        Pantau status, tanggapan verifikator, komunikasi dua-arah, dan perkembangan laporan melalui Kode Pelacakan.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-amber-50/50 flex items-center justify-between text-amber-600 text-xs font-bold">
                      <span>Lacak Tiket Laporan</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* History list for non-admins */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-[#015e2a] uppercase tracking-wider px-1">Daftar Laporan Saya</h2>
                  <span className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
                    {userReports.length} Laporan
                  </span>
                </div>

                {userReports.length === 0 ? (
                  <div className="soft-card p-6 text-center flex flex-col items-center justify-center">
                    <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">Belum Ada Pengajuan</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1 max-w-sm">
                      Anda belum pernah mengirim laporan pengaduan atau saran. Laporan Anda akan tersimpan secara terstruktur di sini.
                    </p>
                  </div>
                ) : (
                  <div className="soft-bg/95 border border-slate-100/70 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 text-xs font-semibold text-slate-500 border-b border-slate-100">
                            <th className="py-4 px-6">Kode Tiket</th>
                            <th className="py-4 px-6">Layanan</th>
                            <th className="py-4 px-6">Judul Laporan</th>
                            <th className="py-4 px-6">Kategori</th>
                            <th className="py-4 px-6">Identitas</th>
                            <th className="py-4 px-6">Tanggal Update</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {userReports.map((report) => (
                            <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-700">{report.id}</td>
                              <td className="py-4 px-6">{renderTypeBadge(report.type)}</td>
                              <td className="py-4 px-6 text-xs font-bold text-slate-900 truncate max-w-xs">{report.title}</td>
                              <td className="py-4 px-6 text-xs text-slate-600 font-bold">{report.category}</td>
                              <td className="py-4 px-6">
                                {report.identityOption === 'PROTECTED' ? (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">Sandi Rahasia</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Terbuka</span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-[11px] text-slate-500 font-bold">
                                {new Date(report.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-4 px-6">{renderStatusBadge(report.status)}</td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedReport(report);
                                      setActiveTab('REPORT_DETAIL');
                                    }}
                                    className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition-all cursor-pointer"
                                    title="Detail Laporan & Diskusi"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {report.status === 'DRAFT' && (
                                    <button
                                      onClick={() => handleDeleteDraft(report.id)}
                                      className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all cursor-pointer"
                                      title="Hapus Draft"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* VIEW: SUBMISSION FORM */}
          {activeTab === 'SUBMIT_FORM' && (
            <motion.div
              key="submit_form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="soft-card p-6 max-w-4xl mx-auto space-y-6"
            >
              {/* Back & Form Title */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <button
                  onClick={() => setActiveTab('SERVICES')}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-md font-bold text-slate-800 uppercase tracking-wide">
                    Formulir {formService === 'WHISTLEBLOWING' ? 'Whistleblowing System (WBS)' : formService === 'COMPLAINT' ? 'Aduan Operasional' : 'Saran / Usulan'}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">Sampaikan laporan Anda dengan akurat untuk hasil terbaik.</p>
                </div>
              </div>

              {/* Service specific guidance */}
              {formService === 'WHISTLEBLOWING' && (
                <div className="bg-rose-50 border border-rose-100/50 p-4 rounded-xl flex gap-3 text-rose-950">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-sm leading-relaxed font-semibold">
                    <span className="font-semibold uppercase text-rose-700 block mb-1">MANDAT INTEGRITAS RAHASIA</span>
                    Gunakan Whistleblowing System hanya untuk pelanggaran berat seperti korupsi, penyalahgunaan wewenang, penggelapan aset yayasan, atau pemalsuan dokumen. Identitas Anda terlindungi penuh.
                  </div>
                </div>
              )}

              {/* Submission Fields */}
              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1.5">Kategori Masalah / Topik</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="soft-input font-bold cursor-pointer"
                  >
                    {serviceCategories[formService].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Report Title */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1.5">Ringkasan Judul Laporan</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Kerusakan Proyektor di Kelas XII SMA, atau Dugaan Kejanggalan Anggaran..."
                    className="soft-input"
                  />
                </div>

                {/* Report Description */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1.5">Kronologi / Penjelasan Detail</label>
                  <textarea
                    rows={6}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Tuliskan penjelasan detail secara objektif, meliputi apa yang terjadi, kapan, di mana, dan siapa yang terlibat..."
                    className="soft-input"
                  />
                </div>

                {/* Identity Option Selection */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-2">Pilihan Proteksi Identitas</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setFormIdentity('PROTECTED')}
                      className={`border p-4 rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                        formIdentity === 'PROTECTED'
                          ? 'border-emerald-500 bg-emerald-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={formIdentity === 'PROTECTED'}
                        onChange={() => setFormIdentity('PROTECTED')}
                        className="mt-1 accent-emerald-600"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">Identitas Dirahasiakan (Protected)</span>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-relaxed">
                          Identitas Anda dijamin rahasia dan hanya dapat diakses oleh petugas berwenang yang menangani laporan ini.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setFormIdentity('OPEN')}
                      className={`border p-4 rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                        formIdentity === 'OPEN'
                          ? 'border-emerald-500 bg-emerald-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={formIdentity === 'OPEN'}
                        onChange={() => setFormIdentity('OPEN')}
                        className="mt-1 accent-emerald-600"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">Identitas Terbuka (Open Identity)</span>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-relaxed">
                          Anda setuju bahwa identitas Anda dapat digunakan selama proses penanganan laporan secara terbuka.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Attachment Drag & Drop */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1.5">Dokumen / Media Lampiran (Max 20MB)</label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isDragOver
                        ? 'border-emerald-500 bg-emerald-50/30'
                        : formAttachment
                        ? 'border-emerald-400 bg-emerald-50/10'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <input
                      type="file"
                      id="report_file_input"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {formAttachment ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 inline-block">
                          <File className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 max-w-sm truncate mx-auto">{formAttachment.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{formAttachment.fileSize} • {formAttachment.type}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormAttachment(null);
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-bold px-3 py-1 rounded-lg transition-all"
                        >
                          Hapus File
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="report_file_input" className="w-full h-full cursor-pointer">
                        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">Tarik & Letakkan Berkas atau Klik</span>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Dukung PDF, JPG, PNG, DOCX, MP4 hingga 20 MB</p>
                      </label>
                    )}
                  </div>
                  {uploadError && (
                    <p className="text-[10px] text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {uploadError}
                    </p>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setActiveTab('SERVICES')}
                  className="soft-button-secondary px-4 py-2.5 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitReport('DRAFT')}
                  className="px-4 py-2.5 bg-[#ffbe2e]/10 hover:bg-[#ffbe2e]/20 text-amber-800 text-xs font-bold rounded-xl transition-all border border-[#ffbe2e]/25 flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Simpan Draft
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitReport('SUBMITTED')}
                  className="soft-button-primary px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Kirim Laporan Resmi
                </button>
              </div>
            </motion.div>
          )}

          {/* VIEW: TRACK SEARCH */}
          {activeTab === 'TRACK_SEARCH' && (
            <motion.div
              key="track_search"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="soft-card p-8 max-w-xl mx-auto text-center space-y-6"
            >
              <div className="p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 stroke-[2.3]" />
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Pusat Pelacakan Tiket</h3>
                <p className="text-[11px] text-slate-500 font-bold mt-1">
                  Masukkan Kode Pelacakan (ALD-REP-XXXX) Anda untuk memantau status penanganan, berkomunikasi dengan pengurus, atau mengunduh hasil tanggapan.
                </p>
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1.5">Kode Pelacakan Unik</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={trackingCodeInput}
                      onChange={(e) => setTrackingCodeInput(e.target.value)}
                      placeholder="Contoh: ALD-REP-4890"
                      className="soft-input font-mono font-bold uppercase tracking-wider flex-1"
                    />
                    <button
                      onClick={handleTrackLookup}
                      className="px-5 soft-button-primary text-xs font-bold rounded-xl transition-all active:scale-95"
                    >
                      Lacak
                    </button>
                  </div>
                  {trackingError && (
                    <p className="text-[10px] text-rose-600 font-bold mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {trackingError}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 text-left">
                <span className="text-[9.5px] font-bold uppercase text-emerald-800 tracking-wider block mb-2">Tips Rahasia Keamanan</span>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Semua data tersandi secara aman di dalam platform. Hindari membagikan kode pelacakan Anda kepada orang lain untuk menjaga keamanan dan kerahasiaan data laporan Anda.
                </p>
              </div>
            </motion.div>
          )}

          {/* VIEW: REPORT DETAIL & COMMUNICATIONS */}
          {activeTab === 'REPORT_DETAIL' && selectedReport && (
            <motion.div
              key="report_detail"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Back button row */}
              <div className="lg:col-span-12 flex items-center justify-between">
                <button
                  onClick={() => {
                    // Check if coming from admin dashboard or user list
                    if (isAdmin && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN_SMA')) {
                      setActiveTab('ADMIN_DASHBOARD');
                    } else {
                      setActiveTab('SERVICES');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                </button>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-bold">Kode Tiket:</span>
                  <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {selectedReport.id}
                  </span>
                </div>
              </div>

              {/* Left Column: Report Details & Status Tracker */}
              <div className="lg:col-span-7 space-y-6">
                {/* Details Card */}
                <div className="soft-card p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 pb-4">
                    <div className="space-y-0.5">
                      {renderTypeBadge(selectedReport.type)}
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mt-1.5">{selectedReport.category}</h3>
                    </div>
                    <div>
                      {renderStatusBadge(selectedReport.status)}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h4 className="text-md font-bold text-slate-900 leading-snug">{selectedReport.title}</h4>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap bg-slate-50/55 p-4 rounded-xl border border-slate-100/50">
                      {selectedReport.description}
                    </p>
                  </div>

                  {/* Attachment metadata */}
                  {selectedReport.attachment && (
                    <div className="border border-emerald-500/10 bg-emerald-50/10 p-4 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800 shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{selectedReport.attachment.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{selectedReport.attachment.fileSize} • {selectedReport.attachment.type}</p>
                        </div>
                      </div>
                      
                      {loadingAttachment ? (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat...
                        </span>
                      ) : (
                        <button
                          onClick={handleDownloadAttachment}
                          disabled={!fullAttachmentData}
                          className="px-3 py-1.5 soft-button-primary text-[10px] font-bold rounded-lg transition-all shrink-0 disabled:opacity-50"
                        >
                          Unduh Berkas
                        </button>
                      )}
                    </div>
                  )}

                  {/* Workflow Stepper UI */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#015e2a] block">Progres Penanganan Laporan</span>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 select-none px-1">
                      <span>Draft</span>
                      <span>Verifikasi</span>
                      <span>Proses</span>
                      <span>Selesai</span>
                    </div>
                    {/* Visual bar */}
                    {(() => {
                      const statusWeights: Record<ReportStatus, number> = {
                        DRAFT: 10,
                        SUBMITTED: 30,
                        UNDER_VERIFICATION: 50,
                        IN_PROGRESS: 75,
                        NEED_INFO: 60,
                        RESOLVED: 100,
                        REJECTED: 100
                      };
                      const weight = statusWeights[selectedReport.status];
                      const isRejected = selectedReport.status === 'REJECTED';
                      
                      return (
                        <div className="relative">
                          <div className="h-2 bg-slate-100 rounded-full w-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${isRejected ? 'bg-rose-500' : 'bg-emerald-600'}`}
                              style={{ width: `${weight}%` }}
                            ></div>
                          </div>
                          
                          {/* Dot step highlights */}
                          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-1">
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white"></div>
                            <div className={`w-3.5 h-3.5 rounded-full border border-white ${weight >= 50 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                            <div className={`w-3.5 h-3.5 rounded-full border border-white ${weight >= 75 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                            <div className={`w-3.5 h-3.5 rounded-full border border-white ${weight >= 100 ? (isRejected ? 'bg-rose-500' : 'bg-emerald-600') : 'bg-slate-200'}`}></div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Information block */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 text-[11px] font-semibold text-slate-500">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Dibuat Pada</span>
                      <span>{new Date(selectedReport.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Terakhir Diperbarui</span>
                      <span>{new Date(selectedReport.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Pengirim (Pelapor)</span>
                      <span>
                        {selectedReport.identityOption === 'PROTECTED' && !isAdmin
                          ? 'Sandi Rahasia (Protected)'
                          : `${selectedReport.reporterName} (${selectedReport.reporterRole.replace('_', ' ')})`}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Petugas Penjawab</span>
                      <span>{selectedReport.assignedToName || 'Belum Ditugaskan'}</span>
                    </div>
                  </div>
                </div>

                {/* ADMIN ONLY CONTROL PANEL */}
                {isAdmin && (
                  <div className="bg-emerald-950 text-white border border-emerald-900 rounded-xl p-6 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> PANEL PENANGANAN ADMINISTRATOR
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Update Status */}
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200 block mb-1">Ubah Status Workflow</label>
                        <select
                          value={selectedReport.status}
                          disabled={updatingStatus}
                          onChange={(e) => handleAdminUpdateStatus(e.target.value as ReportStatus)}
                          className="w-full bg-emerald-900 border border-emerald-800 text-emerald-100 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="SUBMITTED">SUBMITTED</option>
                          <option value="UNDER_VERIFICATION">UNDER VERIFICATION</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="NEED_INFO">NEED INFO</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>

                      {/* Assignee Selection */}
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200 block mb-1">Tugaskan Kepada Petugas</label>
                        <select
                          value={selectedReport.assignedToId || ''}
                          disabled={updatingAssignee}
                          onChange={(e) => handleAdminAssign(e.target.value)}
                          className="w-full bg-emerald-900 border border-emerald-800 text-emerald-100 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                        >
                          <option value="">-- Pilih Petugas Admin --</option>
                          {users.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN_SMA').map((u) => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Internal Notes */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200 block">Catatan Internal (Khusus Admin / Rahasia)</label>
                        <button
                          onClick={handleAdminSaveNotes}
                          className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 rounded-md text-[10px] font-semibold text-white"
                        >
                          Simpan Catatan
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={adminInternalNotes}
                        onChange={(e) => setAdminInternalNotes(e.target.value)}
                        placeholder="Tuliskan catatan internal di sini. Catatan ini hanya terlihat oleh administrator dan tidak akan terlihat oleh pelapor..."
                        className="w-full bg-emerald-900 border border-emerald-800 text-emerald-100 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Private Chat Conversation */}
              <div className="lg:col-span-5 soft-card overflow-hidden flex flex-col h-[580px]">
                {/* Chat Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-4 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#015e2a]" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Diskusi & Komunikasi</span>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-600 border border-slate-300 px-2 py-0.5 rounded-full font-semibold tracking-wider uppercase">
                    Kanal Rahasia
                  </span>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30">
                  {/* System message at start */}
                  <div className="bg-slate-100 border border-slate-200/50 p-3 rounded-xl text-xs font-semibold text-slate-500 leading-relaxed">
                    <Lock className="w-3.5 h-3.5 inline-block mr-1 text-slate-400" />
                    Kanal diskusi ini terenkripsi penuh. Hanya Anda dan petugas verifikator berwenang yang dapat membaca dan membalas diskusi di tiket ini.
                  </div>

                  {(!selectedReport.conversation || selectedReport.conversation.length === 0) ? (
                    <div className="text-center py-10">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-[10px] text-slate-400 font-bold">Belum ada tanggapan.</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Tulis pesan di bawah untuk memulai percakapan.</p>
                    </div>
                  ) : (
                    selectedReport.conversation.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      const isAdminMsg = msg.senderRole === 'SUPER_ADMIN' || msg.senderRole.startsWith('ADMIN_');
                      
                      // Role badge styling
                      let badgeClasses = "bg-slate-100 text-slate-600 border border-slate-200";
                      if (msg.senderRole === 'SUPER_ADMIN') {
                        badgeClasses = "bg-amber-500/10 text-amber-700 border border-amber-500/20";
                      } else if (msg.senderRole.startsWith('ADMIN_')) {
                        badgeClasses = "bg-blue-500/10 text-blue-700 border border-blue-500/20";
                      } else if (msg.senderRole === 'GURU') {
                        badgeClasses = "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20";
                      } else if (msg.senderRole === 'STAFF') {
                        badgeClasses = "bg-purple-500/10 text-purple-700 border border-purple-500/20";
                      }

                      const initials = msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'U';

                      return (
                        <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                          {/* Small Round Avatar */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isMe 
                              ? 'bg-emerald-600 text-white' 
                              : isAdminMsg 
                                ? 'bg-amber-600 text-white' 
                                : 'bg-slate-200 text-slate-700'
                          }`}>
                            {initials}
                          </div>

                          <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                            {/* Sender details */}
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-slate-400 tracking-wide">
                              <span>{isMe ? 'Saya' : msg.senderName}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${badgeClasses}`}>
                                {msg.senderRole.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Message bubble */}
                            <div
                              className={`rounded-xl px-3.5 py-2 text-xs font-semibold leading-relaxed transition-all ${
                                isMe
                                  ? 'bg-emerald-600 text-white rounded-tr-none'
                                  : 'soft-bg border border-slate-100 text-slate-800 rounded-tl-none'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <span className={`text-[8px] block text-right mt-1 font-bold ${isMe ? 'text-emerald-100/80' : 'text-slate-400'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Message Input box */}
                <div className="p-3 soft-bg border-t border-slate-100 shrink-0">
                  {selectedReport.status === 'RESOLVED' || selectedReport.status === 'REJECTED' ? (
                    <div className="bg-slate-50 text-center p-2.5 rounded-xl text-[10px] text-slate-400 font-semibold uppercase border border-dashed border-slate-200">
                      Diskusi Ditutup (Laporan Selesai / Ditolak)
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Ketik balasan Anda di sini... (Enter untuk kirim)"
                        className="flex-1 bg-emerald-50/10 border border-emerald-100 rounded-xl px-3 py-2 text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 focus:soft-bg transition-all resize-none custom-scrollbar"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={isSendingMessage || !messageInput.trim()}
                        className="px-4 soft-button-primary disabled:bg-slate-200 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer disabled:text-slate-400"
                      >
                        {isSendingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: ADMIN DASHBOARD */}
          {activeTab === 'ADMIN_DASHBOARD' && isAdmin && (
            <motion.div
              key="admin_dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Whistleblowing Summary Card */}
              {renderWhistleblowingSummaryCard()}

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Total Reports */}
                <div className="soft-card p-6 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Laporan</span>
                    <p className="text-xl font-bold text-slate-800 leading-none">{totalCount}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Seluruh Tiket</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/50">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                </div>

                {/* Whistleblowing Count */}
                <div className="soft-card p-6 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Whistleblowing</span>
                    <p className="text-xl font-bold text-slate-800 leading-none">{whistleblowingCount}</p>
                    <p className="text-[10px] text-rose-400 font-bold mt-1">Sandi Rahasia</p>
                  </div>
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100/50">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>

                {/* Complaints Count */}
                <div className="soft-card p-6 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest block">Pengaduan</span>
                    <p className="text-xl font-bold text-slate-800 leading-none">{complaintsCount}</p>
                    <p className="text-[10px] text-sky-400 font-bold mt-1">Fasilitas / Layanan</p>
                  </div>
                  <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100/50">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                </div>

                {/* Suggestions Count */}
                <div className="soft-card p-6 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Usulan Saran</span>
                    <p className="text-xl font-bold text-slate-800 leading-none">{suggestionsCount}</p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">Saran Konstruktif</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>

                {/* Open Cases */}
                <div className="soft-card p-6 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">Kasus Terbuka</span>
                    <p className="text-xl font-bold text-slate-800 leading-none">{openCount}</p>
                    <p className="text-[10px] text-amber-500 font-bold mt-1">Butuh Proses</p>
                  </div>
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/50">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                {/* Resolved Cases & Resolution Time */}
                <div className="soft-card p-6 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block">Tuntas (Resolved)</span>
                    <p className="text-xl font-bold text-slate-800 leading-none">{resolvedCount}</p>
                    <p className="text-[10px] text-teal-500 font-bold mt-1">Rata-rata: 1.2 hari</p>
                  </div>
                  <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100/50">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Filters & Actions Control Bar */}
              <div className="soft-card p-5 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Title or Tracking code */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={adminSearchCode}
                      onChange={(e) => setAdminSearchCode(e.target.value)}
                      placeholder="Cari kode tiket / judul..."
                      className="bg-emerald-50/10 border border-emerald-100 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 w-56"
                    />
                  </div>

                  {/* Filter Type */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Tipe:</span>
                    <select
                      value={adminFilterType}
                      onChange={(e) => setAdminFilterType(e.target.value)}
                      className="bg-emerald-50/10 border border-emerald-100 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="ALL">SEMUA</option>
                      <option value="WHISTLEBLOWING">WHISTLEBLOWING</option>
                      <option value="COMPLAINT">PENGADUAN</option>
                      <option value="SUGGESTION">SARAN</option>
                    </select>
                  </div>

                  {/* Filter Status */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Status:</span>
                    <select
                      value={adminFilterStatus}
                      onChange={(e) => setAdminFilterStatus(e.target.value)}
                      className="bg-emerald-50/10 border border-emerald-100 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="ALL">SEMUA</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="UNDER_VERIFICATION">UNDER VERIFICATION</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="NEED_INFO">NEED INFO</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-500">
                  Ditemukan: <span className="text-emerald-700 font-semibold">{filteredReportsForAdmin.length}</span> laporan
                </div>
              </div>

              {/* Master Administrative List of Submissions */}
              <div className="soft-bg/95 border border-slate-100 rounded-xl overflow-hidden">
                {filteredReportsForAdmin.length === 0 ? (
                  <div className="p-16 text-center flex flex-col items-center justify-center">
                    <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">Laporan Tidak Ditemukan</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1">
                      Tidak ada laporan masuk yang memenuhi filter penelusuran di atas.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-50/80 text-slate-400 text-xs font-semibold text-slate-500 border-b border-slate-100">
                          <th className="py-4 px-6">Kode Tiket</th>
                          <th className="py-4 px-6">Layanan</th>
                          <th className="py-4 px-6">Judul Laporan / Pengirim</th>
                          <th className="py-4 px-6">Kategori</th>
                          <th className="py-4 px-6">Identitas</th>
                          <th className="py-4 px-6">Ditugaskan Ke</th>
                          <th className="py-4 px-6">Tanggal Masuk</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredReportsForAdmin.map((report) => (
                          <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-700">{report.id}</td>
                            <td className="py-4 px-6">{renderTypeBadge(report.type)}</td>
                            <td className="py-4 px-6 min-w-[200px]">
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-slate-900 block truncate max-w-xs">{report.title}</span>
                                <span className="text-[10px] text-slate-500 font-bold block">
                                  {report.identityOption === 'PROTECTED' ? (
                                    <span className="text-rose-600 font-semibold">Protected Identity</span>
                                  ) : (
                                    <span className="text-slate-600 font-semibold">{report.reporterName} ({report.reporterRole.replace('_', ' ')})</span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-600 font-bold">{report.category}</td>
                            <td className="py-4 px-6">
                              {report.identityOption === 'PROTECTED' ? (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">Dirahasiakan</span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Terbuka</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-xs font-bold text-slate-700">
                              {report.assignedToName ? (
                                <span className="text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100/50">{report.assignedToName}</span>
                              ) : (
                                <span className="text-slate-400 italic">Belum Ditugaskan</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-[11px] text-slate-500 font-bold">
                              {new Date(report.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-4 px-6">{renderStatusBadge(report.status)}</td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setActiveTab('REPORT_DETAIL');
                                }}
                                className="px-3 py-1.5 soft-button-primary text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
                              >
                                Proses Laporan
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={() => handleNotificationClick(toast)}
              className="soft-card p-4 flex gap-3 pointer-events-auto cursor-pointer hover:border-emerald-100 transition-all text-slate-800"
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'STATUS_CHANGE' ? (
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold leading-snug text-slate-900">
                    {toast.title}
                  </p>
                  <button
                    onClick={(e) => dismissToast(toast.id, e)}
                    className="p-0.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal mt-1">
                  {toast.message}
                </p>
                <p className="text-[8px] text-[#015e2a] font-semibold tracking-wide uppercase mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 soft-gradient-dark rounded-full animate-ping" />
                  Klik untuk melihat detail
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
