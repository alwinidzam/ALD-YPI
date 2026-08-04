/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  Shield,
  FileText,
  Search,
  Folder,
  FolderOpen,
  Download,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  Lock,
  ChevronRight,
  ChevronLeft,
  Bell,
  Sparkles,
  AlertCircle,
  HelpCircle,
  FileUp,
  User as UserIcon,
  BookOpen,
  Info,
  CheckCircle2,
  Bookmark,
  Building,
  Plus,
  X,
  LayoutGrid,
  List,
  Edit,
  RefreshCw,
  BellOff,
  Link2,
  Camera,
  Building2, Users, CalendarDays, Paperclip, Globe, ShieldAlert } from 'lucide-react';

import { User, DocumentMetadata, Announcement, AuditLog, UserRole, CategoryType, InstitutionType, AnnouncementAttachment, AnnouncementVisibility } from './types';
import { DataError } from './components/DataError';
import { SectionErrorBoundary } from './components/SectionErrorBoundary';
import { InstitutionSkeleton, ProgramEventSkeleton } from './components/SkeletonLoaders';
import { InstitutionDirectory } from './components/InstitutionDirectory';
import { InstitutionProfileView } from './components/InstitutionProfileView';
import { EventDetail } from './components/EventDetail';
import AnnouncementDetailView from './components/AnnouncementDetailView';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { ALDDatabase, generateFileName, getRoleInstitution, hashPassword, compressBase64Image } from './data';
import { onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import {
  dbSaveUser,
  dbDeleteUser,
  dbSaveDocument,
  dbDeleteDocument,
  dbGetDocumentData,
  dbSaveAnnouncement,
  dbDeleteAnnouncement,
  dbAddAuditLog,
  dbClearAuditLogs,
  handleFirestoreError,
  OperationType
} from './firebase';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { LazyImage } from './components/LazyImage';
import { parseGoogleDriveLink } from './driveLink';
import { LiveClock } from './components/LiveClock';
import ConfirmDialog from './components/ConfirmDialog';
import { DocDetailsModal } from './components/DocDetailsModal';
import { DocumentScannerModal } from './components/DocumentScannerModal';
import { BackgroundSyncStatusBar } from './components/BackgroundSyncStatusBar';
import { OfflineBanner } from './components/native/OfflineBanner';
import { PwaUpdateDialog } from './components/native/PwaUpdateDialog';
import { NotificationDrawer } from './components/native/NotificationDrawer';
import { PullToRefresh } from './components/native/PullToRefresh';
import { hapticService } from './services/HapticService';
import { feedbackService } from './lib/FeedbackService';
import { navigationService } from './services/NavigationService';
import { notificationService } from './services/NotificationService';

// Route-level Code Splitting with React.lazy
const PdfViewer = React.lazy(() => import('./components/PdfViewer'));
const AuditLogView = React.lazy(() => import('./components/AuditLogView'));
const UserManagementView = React.lazy(() => import('./components/UserManagementView'));
const ReportingCenter = React.lazy(() => import('./components/reporting/ReportingCenter'));
const ScannerPage = React.lazy(() => import('./domains/attendance/ui/scanner/ScannerPage').then(m => ({ default: m.ScannerPage })));
const AttendanceDashboardPage = React.lazy(() => import('./domains/attendance/ui/dashboard/AttendanceDashboardPage').then(m => ({ default: m.AttendanceDashboardPage })));
const StaffManagementPage = React.lazy(() => import('./domains/attendance/ui/staff/StaffManagementPage').then(m => ({ default: m.StaffManagementPage })));

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend
} from 'recharts';
const ypiLogo = 'https://lh3.googleusercontent.com/d/1_Bu-223XZeb0XfAb9hon6QITM_45br3X';

export default function App() {
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("ald_current_session");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse saved session:", e);
      return null;
    }
  });
  const {
    users, setUsers, isUsersLoading, usersError,
    documents, setDocuments, isDocsLoading, docsError,
    announcements, setAnnouncements, isAnnsLoading, annsError,
    auditLogs, setAuditLogs, isLogsLoading, logsError,
  } = useFirestoreSync({ syncTrigger, setCurrentUser });
  const handleTryAgain = () => setSyncTrigger((prev) => prev + 1);

  // Current session user state
  // Navigation and Views
  const [currentView, setCurrentView] = useState<string>(() => {
    const saved = localStorage.getItem("ald_current_session");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === 'GURU' || u.role === 'STAFF') {
          return 'announcements';
        }
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }
    return 'home';
  });

  // Dashboard Chart state
  const [chartYear, setChartYear] = useState<string>('2026');
  const [chartMode, setChartMode] = useState<'stacked' | 'grouped'>('stacked');
  const [chartPeriod, setChartPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setCurrentView(customEvent.detail);
    };
    window.addEventListener('ald-navigate', handleNavigate);
    return () => window.removeEventListener('ald-navigate', handleNavigate);
  }, []);

  // Custom confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Login form states
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('ald_remember_me') === 'true';
  });
  const [usernameInput, setUsernameInput] = useState(() => {
    const savedRemember = localStorage.getItem('ald_remember_me') === 'true';
    return savedRemember ? (localStorage.getItem('ald_remembered_username') || '') : '';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [triedSubmit, setTriedSubmit] = useState(false);

  // Favorites state for VIEWERS (PRD custom requirement!)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ald_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Selected PDF viewer document state
  const [selectedDocForView, setSelectedDocForView] = useState<DocumentMetadata | null>(null);

  // Selected document for details modal (mobile slide-up)
  const [selectedDocForDetails, setSelectedDocForDetails] = useState<DocumentMetadata | null>(null);

  // Document Camera Scanner Modal state
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);

  // Mobile Push Notification Drawer state
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);

  // --- BROWSER NAVIGATION BACK BUTTON SUPPORT ---
  const isPopStateRef = useRef(false);
  const documentsRef = useRef(documents);

  // Keep documents ref updated for popstate listener lookup without re-triggering useEffect
  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  // Synchronize popstate event with React state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize the history state if empty or replace it with current view on mount
    window.history.replaceState({
      currentView,
      selectedDocId: selectedDocForView ? selectedDocForView.id : null,
      selectedDocForDetailsId: selectedDocForDetails ? selectedDocForDetails.id : null
    }, '');

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      isPopStateRef.current = true;

      if (state) {
        if (state.currentView) {
          setCurrentView(state.currentView);
        }

        if (state.selectedDocId) {
          const doc = documentsRef.current.find((d) => d.id === state.selectedDocId);
          setSelectedDocForView(doc || null);
        } else {
          setSelectedDocForView(null);
        }

        if (state.selectedDocForDetailsId) {
          const doc = documentsRef.current.find((d) => d.id === state.selectedDocForDetailsId);
          setSelectedDocForDetails(doc || null);
        } else {
          setSelectedDocForDetails(null);
        }
      } else {
        // If state is null, user popped back to the initial page state, default to 'home'
        setCurrentView('home');
        setSelectedDocForView(null);
        setSelectedDocForDetails(null);
      }

      // Reset the flag to allow user-initiated pushes again
      setTimeout(() => {
        isPopStateRef.current = false;
      }, 80);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Push new history entries when the state changes via user actions
  useEffect(() => {
    if (isPopStateRef.current) return;

    const currentState = window.history.state;
    const nextView = currentView;
    const nextDocId = selectedDocForView ? selectedDocForView.id : null;
    const nextDocForDetailsId = selectedDocForDetails ? selectedDocForDetails.id : null;

    // Check if the next state differs from the currently recorded history state
    const isDifferent = !currentState ||
      currentState.currentView !== nextView ||
      currentState.selectedDocId !== nextDocId ||
      currentState.selectedDocForDetailsId !== nextDocForDetailsId;

    if (isDifferent) {
      window.history.pushState({
        currentView: nextView,
        selectedDocId: nextDocId,
        selectedDocForDetailsId: nextDocForDetailsId
      }, '');
    }
  }, [currentView, selectedDocForView, selectedDocForDetails]);

  // PWA installation state
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      const isLocallyInstalled = localStorage.getItem('ald_pwa_installed') === 'true';
      return !isStandalone && !isLocallyInstalled;
    }
    return false;
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      const isLocallyInstalled = localStorage.getItem('ald_pwa_installed') === 'true';
      if (!isStandalone && !isLocallyInstalled) {
        setShowInstallBtn(true);
      }
    };

    const handleAppInstalled = () => {
      setShowInstallBtn(false);
      setPwaPrompt(null);
      localStorage.setItem('ald_pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone || localStorage.getItem('ald_pwa_installed') === 'true') {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    // Check if inside an iframe (like AI Studio preview frame)
    const isIframe = window.self !== window.top;
    
    if (isIframe) {
      alert(
        "Sistem Deteksi Pengaman Browser:\n\n" +
        "Instalasi aplikasi native PWA dicegah oleh browser saat berada di dalam frame pratinjau AI Studio.\n\n" +
        "Untuk memasang langsung sebagai aplikasi native, silakan klik tombol 'Open in new tab' (Buka di tab baru) di sudut kanan atas panel pratinjau, lalu klik tombol pasang kembali di tab baru tersebut!"
      );
      return;
    }

    if (pwaPrompt) {
      try {
        await pwaPrompt.prompt();
        const { outcome } = await pwaPrompt.userChoice;
        if (outcome === 'accepted') {
          setPwaPrompt(null);
          setShowInstallBtn(false);
          localStorage.setItem('ald_pwa_installed', 'true');
        }
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
    } else {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      if (isStandalone) {
        alert("Aplikasi Arsip YPI sudah terpasang dan berjalan sebagai native app di perangkat Anda!");
        return;
      }

      // Check if iOS (Apple Safari)
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      
      if (isIOS) {
        alert(
          "Pemasangan Aplikasi di iOS (Apple iPhone/iPad):\n\n" +
          "1. Ketuk tombol 'Bagikan' (Share) di menu navigasi Safari.\n" +
          "2. Cari dan pilih 'Tambahkan ke Layar Utama' (Add to Home Screen).\n" +
          "3. Ketuk 'Tambah' (Add) di sudut kanan atas.\n\n" +
          "Aplikasi Arsip YPI akan langsung terpasang di layar utama perangkat Anda!"
        );
      } else {
        alert(
          "Instruksi Pemasangan Manual:\n\n" +
          "Browser Anda belum memicu dialog instalasi satu-klik otomatis. Pastikan:\n" +
          "1. Halaman ini dibuka langsung di browser (bukan di dalam frame pratinjau AI Studio).\n" +
          "2. Untuk Chrome/Edge, Anda juga dapat mengklik ikon instalasi (ikon unduh/tambah) langsung di sebelah kanan bilah alamat (address bar) browser Anda."
        );
      }
    }
  };

  // Announcements slide show index state
  const activeAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const isCreator = ann.createdByUsername === currentUser?.username;
      const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
      
      // A creator or Super Admin can always see their own / all announcements
      if (isCreator || isSuperAdmin) return true;

      // For others, check visibility and targetRole
      const isPublic = !ann.visibility || ann.visibility === 'PUBLIC';
      if (!isPublic) return false; // Private is restricted to creator/Super Admin

      if (ann.targetRole === 'ALL') return true;
      return ann.targetRole === currentUser?.role;
    });
  }, [announcements, currentUser]);

  const [annIndex, setAnnIndex] = useState(0);
  const [annDirection, setAnnDirection] = useState(1); // -1 for left, 1 for right

  // Profile management edit states
  const [profileName, setProfileName] = useState('');
  const [profileContact, setProfileContact] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync profile form states with current authenticated user
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileContact(currentUser.contact || '');
      setProfilePhoto(currentUser.photoURL || '');
    }
  }, [currentUser, currentView]);

  // Announcement edit/update state
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);

  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;
    const safeIdx = annIndex >= activeAnnouncements.length ? 0 : annIndex;
    const currentAnn = activeAnnouncements[safeIdx];
    
    // Dynamic timing based on announcement priority:
    // Low: 3s, Normal: 5s, High: 7s, Urgent: 10s
    let duration = 5000;
    if (currentAnn) {
      const p = currentAnn.priority;
      if (p === 'LOW') duration = 3000;
      else if (p === 'NORMAL') duration = 5000;
      else if (p === 'HIGH') duration = 7000;
      else if (p === 'URGENT') duration = 10000;
    }

    const interval = setInterval(() => {
      setAnnDirection(1);
      setAnnIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, duration);
    return () => clearInterval(interval);
  }, [activeAnnouncements.length, annIndex, activeAnnouncements]);

  const logAction = async (
    username: string,
    name: string,
    role: UserRole,
    action: AuditLog['action'],
    details: string
  ) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      username,
      name,
      role,
      action,
      details,
      ipAddress: '127.0.0.1'
    };
    try {
      await dbAddAuditLog(newLog);
    } catch (err) {
      console.error('Failed to log audit action:', err);
    }
  };

  useEffect(() => {
    localStorage.setItem('ald_favorites', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  // Helpers for action limits/quotas (WIB Midnight reset)
  const getTodayDateString = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 3600000 * 7); // Offset for UTC+7 WIB
    const yyyy = wib.getFullYear();
    const mm = String(wib.getMonth() + 1).padStart(2, '0');
    const dd = String(wib.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // --- AUTHENTICATION FLOWS ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setTriedSubmit(true);

    if (!usernameInput.trim() || !passwordInput.trim()) {
      return;
    }

    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === usernameInput.trim().toLowerCase()
    );

    if (!matchedUser) {
      setLoginError('Username tidak ditemukan atau salah.');
      return;
    }

    if (matchedUser.status === 'INACTIVE') {
      setLoginError('Akun Anda dinonaktifkan sementara. Hubungi Super Administrator.');
      return;
    }

    const hashedInput = hashPassword(passwordInput.trim());
    if (matchedUser.passwordHash !== hashedInput) {
      setLoginError('Kata sandi salah. Harap coba kembali.');
      return;
    }

    // Login successful
    const updatedUser = {
      ...matchedUser,
      lastLogin: new Date().toISOString()
    };

    if (rememberMe) {
      localStorage.setItem('ald_remember_me', 'true');
      localStorage.setItem('ald_remembered_username', usernameInput.trim());
    } else {
      localStorage.setItem('ald_remember_me', 'false');
      localStorage.removeItem('ald_remembered_username');
    }

    dbSaveUser(updatedUser).then(() => {
      setCurrentUser(updatedUser);
      localStorage.setItem('ald_current_session', JSON.stringify(updatedUser));
      logAction(
        updatedUser.username,
        updatedUser.name,
        updatedUser.role,
        'LOGIN',
        'Berhasil masuk ke sistem ALD'
      );
      // Reset forms inside the successful callback
      setTriedSubmit(false);
      setUsernameInput(rememberMe ? usernameInput.trim() : '');
      setPasswordInput('');
      setLoginError('');
      const isGuruOrStaff = updatedUser.role === 'GURU' || updatedUser.role === 'STAFF';
      setCurrentView(isGuruOrStaff ? 'announcements' : 'home');
    });
  };

  const handleLogout = () => {
    if (!currentUser) return;

    logAction(
      currentUser.username,
      currentUser.name,
      currentUser.role,
      'LOGOUT',
      'Berhasil keluar dari sistem ALD'
    );

    setCurrentUser(null);
    localStorage.removeItem('ald_current_session');
    const savedRemember = localStorage.getItem('ald_remember_me') === 'true';
    setUsernameInput(savedRemember ? (localStorage.getItem('ald_remembered_username') || '') : '');
    setPasswordInput('');
    setTriedSubmit(false);
    setCurrentView('home');
  };

  // Quick Developer Credentials Selector
  const quickLogin = (role: 'SUPER_ADMIN' | 'ADMIN_SMA' | 'VIEWER') => {
    let u = 'superadmin';
    let p = 'admin123';
    if (role === 'ADMIN_SMA') {
      u = 'adminsma';
      p = 'sma123';
    } else if (role === 'VIEWER') {
      u = 'viewer';
      p = 'viewer123';
    }
    setUsernameInput(u);
    setPasswordInput(p);
    setTriedSubmit(false);
    setLoginError('');
  };

  // --- DOCUMENT PERSISTENCE OPERATIONS ---
  const handleUploadDocument = async (newDoc: Omit<DocumentMetadata, 'id' | 'uploadDate' | 'uploader' | 'downloadCount'>, simulatedFile: boolean) => {
    if (!currentUser) return false;

    // Check duplicate
    const isDuplicate = documents.some((d) => d.fileName.toLowerCase() === newDoc.fileName.toLowerCase());
    if (isDuplicate) {
      alert(`Gagal unggah! Berkas bernama "${newDoc.fileName}" sudah ada di arsip. Harap periksa kembali bulan, tahun, atau kategori laporan.`);
      return false;
    }

    // Check daily upload limit for non-SUPER_ADMIN
    const today = getTodayDateString();
    const currentUploadCount = currentUser.role !== 'SUPER_ADMIN' && currentUser.lastActionResetDate === today ? (currentUser.dailyUploadCount || 0) : 0;
    const maxUploads = currentUser.role === 'SUPER_ADMIN' ? 100 : 10;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUploadCount >= maxUploads) {
      alert(`Gagal unggah! Batas harian unggahan laporan unit Anda telah tercapai (${maxUploads} kali). Harap lakukan pengarsipan kembali besok.`);
      return false;
    }

    const docEntry: DocumentMetadata = {
      ...newDoc,
      id: 'doc-' + Date.now(),
      uploadDate: new Date().toISOString(),
      uploader: currentUser.name,
      downloadCount: 0
    };

    try {
      // Save document metadata to Firestore first
      await dbSaveDocument(docEntry);

      await logAction(
        currentUser.username,
        currentUser.name,
        currentUser.role,
        'UPLOAD',
        `Mengunggah dokumen baru: ${docEntry.fileName}`
      );

      // Increment upload count and update in Firestore & local state
      const updatedUser: User = {
        ...currentUser,
        lastActionResetDate: today,
        dailyUploadCount: currentUser.lastActionResetDate === today ? (currentUser.dailyUploadCount || 0) + 1 : 1
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('ald_current_session', JSON.stringify(updatedUser));
      setUsers((prev) => prev.map((u) => u.id === currentUser.id ? updatedUser : u));
      await dbSaveUser(updatedUser);

      // Optimistic local documents update
      setDocuments((prev) => [docEntry, ...prev]);

      alert(`Berhasil! Dokumen "${docEntry.fileName}" sukses diunggah dan diarsipkan.`);
      setCurrentView('archive');
      return true;
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Gagal mengunggah dokumen ke basis data. Silakan coba beberapa saat lagi.');
      return false;
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!currentUser) return;
    const docToDelete = documents.find((d) => d.id === docId);
    if (!docToDelete) return;

    // Permissions check based on Matrix in PRD
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const institutionAllowed = getRoleInstitution(currentUser.role);
    const isOwner = docToDelete.institution === institutionAllowed;
    const isSelapananAdmin = currentUser.role === 'ADMIN_SELAPANAN' && docToDelete.category === 'SELAPANAN';

    if (!isSuperAdmin && !isOwner && !isSelapananAdmin) {
      alert('Hak akses ditolak! Anda hanya diperbolehkan menghapus berkas arsip unit lembaga Anda sendiri atau kategori Selapanan jika Anda Admin Selapanan.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Berkas Arsip',
      message: `Apakah Anda yakin ingin menghapus arsip "${docToDelete.fileName}"? Dokumen ini akan langsung dihilangkan dari basis data.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      isDanger: true,
      onConfirm: async () => {
        // Optimistic state updates
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        setFavoriteIds((prev) => prev.filter((id) => id !== docId));

        await dbDeleteDocument(docId);

        await logAction(
          currentUser.username,
          currentUser.name,
          currentUser.role,
          'DELETE',
          `Menghapus berkas arsip: ${docToDelete.fileName}`
        );

        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDownloadDocument = async (doc: DocumentMetadata) => {
    if (!currentUser) return;

    const updatedDoc = { ...doc, downloadCount: doc.downloadCount + 1 };
    dbSaveDocument(updatedDoc).then(() => {
      logAction(
        currentUser.username,
        currentUser.name,
        currentUser.role,
        'DOWNLOAD',
        `Mengunduh berkas laporan: ${doc.fileName}`
      );
    });

    if (doc.sourceType === 'DRIVE_LINK') {
      if (doc.driveUrl) {
        window.open(doc.driveUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('Tautan Google Drive untuk dokumen ini tidak ditemukan atau rusak.');
      }
      return;
    }

    let fileData = doc.fileData;
    if (fileData === 'CHUNKS_EXIST') {
      try {
        fileData = await dbGetDocumentData(doc.id);
      } catch (err) {
        console.error('Failed to download document chunks:', err);
      }
    }

    if (fileData && fileData.startsWith('data:application/pdf;base64,')) {
      try {
        const base64Parts = fileData.split(',');
        const mime = base64Parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const bstr = atob(base64Parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        window.document.body.appendChild(a);
        a.click();
        a.remove();
        // Revoking immediately can abort the download before the browser has
        // finished reading the blob, especially for large PDFs. Give it a beat.
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        return;
      } catch (err) {
        console.error('Failed to download base64 pdf:', err);
      }
    }

    // Creating actual simulated file download
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    window.document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleOpenPdf = (doc: DocumentMetadata) => {
    if (!currentUser) return;
    setSelectedDocForView(doc);

    logAction(
      currentUser.username,
      currentUser.name,
      currentUser.role,
      'VIEW_PDF',
      `Membuka penampil PDF digital: ${doc.fileName}`
    );
  };

  const toggleFavorite = (docId: string) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(docId);
      if (exists) {
        return prev.filter((id) => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  // --- ANNOUNCEMENTS CRUD ---
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [annTarget, setAnnTarget] = useState<'ALL' | UserRole>('ALL');
  const [annVisibility, setAnnVisibility] = useState<AnnouncementVisibility>('PUBLIC');
  const [selectedAnnDetail, setSelectedAnnDetail] = useState<Announcement | null>(null);
  const [annAttachment, setAnnAttachment] = useState<AnnouncementAttachment | null>(null);
  const [annDetailBackView, setAnnDetailBackView] = useState<'home' | 'announcements'>('home');

  const handleEditAnnouncement = (ann: Announcement) => {
    if (!currentUser) return;
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const canManage = isSuperAdmin || (currentUser.role !== 'VIEWER' && ann.createdByUsername === currentUser.username);
    if (!canManage) {
      alert('Hak akses ditolak! Anda hanya diperbolehkan mengubah pengumuman yang Anda buat sendiri.');
      return;
    }
    setEditingAnnId(ann.id);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setAnnPriority(ann.priority);
    setAnnTarget(ann.targetRole);
    setAnnVisibility(ann.visibility || 'PUBLIC');
    setAnnAttachment(ann.attachment || null);
    setShowAnnModal(true);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!annTitle.trim() || !annContent.trim()) {
      alert('Judul dan Konten pengumuman wajib diisi.');
      return;
    }

    if (editingAnnId) {
      // EDITING EXISTING ANNOUNCEMENT
      const existing = announcements.find((a) => a.id === editingAnnId);
      if (!existing) return;

      const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
      const canManage = isSuperAdmin || (currentUser.role !== 'VIEWER' && existing.createdByUsername === currentUser.username);
      if (!canManage) {
        alert('Hak akses ditolak! Anda hanya diperbolehkan mengubah pengumuman yang Anda buat sendiri.');
        return;
      }

      const updatedAnn: Announcement = {
        ...existing,
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
        targetRole: annTarget,
        visibility: annVisibility,
        updatedBy: currentUser.name,
        updatedAt: new Date().toISOString(),
        attachment: annAttachment || undefined
      };

      // Optimistic local state update
      setAnnouncements((prev) => prev.map((a) => (a.id === editingAnnId ? updatedAnn : a)));

      dbSaveAnnouncement(updatedAnn).then(() => {
        logAction(
          currentUser.username,
          currentUser.name,
          currentUser.role,
          'ANNOUNCEMENT_UPDATE',
          `Memperbarui pengumuman: ${updatedAnn.title}`
        );
      });
    } else {
      // CREATING NEW ANNOUNCEMENT
      const newAnn: Announcement = {
        id: 'ann-' + Date.now(),
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
        targetRole: annTarget,
        visibility: annVisibility,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], // 30 Days expiry
        status: 'ACTIVE',
        createdBy: currentUser.name,
        createdByUsername: currentUser.username,
        createdAt: new Date().toISOString(),
        attachment: annAttachment || undefined
      };

      // Optimistic local state update
      setAnnouncements((prev) => [newAnn, ...prev]);

      dbSaveAnnouncement(newAnn).then(() => {
        logAction(
          currentUser.username,
          currentUser.name,
          currentUser.role,
          'ANNOUNCEMENT_CREATE',
          `Membuat pengumuman baru: ${newAnn.title}`
        );
      });
    }

    setShowAnnModal(false);
    setEditingAnnId(null);

    // Reset forms
    setAnnTitle('');
    setAnnContent('');
    setAnnPriority('NORMAL');
    setAnnTarget('ALL');
    setAnnVisibility('PUBLIC');
    setAnnAttachment(null);
  };

  const handleAnnFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 5MB to prevent Firestore document overflow
    if (file.size > 5 * 1024 * 1024) {
      alert("Gagal mengunggah! Ukuran file lampiran terlalu besar. Batas maksimal adalah 5 MB.");
      return;
    }

    const nameLower = file.name.toLowerCase();
    let type: 'pdf' | 'jpg' | 'png' = 'jpg';
    if (nameLower.endsWith('.pdf')) {
      type = 'pdf';
    } else if (nameLower.endsWith('.png')) {
      type = 'png';
    } else if (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) {
      type = 'jpg';
    } else {
      alert("Format berkas tidak didukung! Format yang diperbolehkan hanya PDF, JPG, atau PNG.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const formattedSize = file.size >= 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
        : (file.size / 1024).toFixed(1) + " KB";
      setAnnAttachment({
        name: file.name,
        type,
        fileSize: formattedSize,
        fileData: base64Data
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!currentUser) return;
    const ann = announcements.find((a) => a.id === id);
    if (!ann) return;

    // CRUD role checks
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const canManage = isSuperAdmin || (currentUser.role !== 'VIEWER' && ann.createdByUsername === currentUser.username);

    if (!canManage) {
      alert('Hak akses ditolak! Anda hanya diperbolehkan menghapus pengumuman yang Anda buat sendiri.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Pengumuman',
      message: `Apakah Anda yakin ingin menghapus pengumuman "${ann.title}"?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      isDanger: true,
      onConfirm: async () => {
        // Optimistic state updates
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));

        await dbDeleteAnnouncement(id);

        await logAction(
          currentUser.username,
          currentUser.name,
          currentUser.role,
          'ANNOUNCEMENT_DELETE',
          `Menghapus pengumuman: ${ann.title}`
        );

        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- VIEWS FILTER COMPOSITIONS ---

  // Dashboard Stats filtered by user role permissions
  const getDashboardStats = () => {
    const targetDocs = getAllowedDocumentsForBrowsing();

    const docCount = targetDocs.length;
    const totalDownloads = targetDocs.reduce((acc, d) => acc + d.downloadCount, 0);
    const activeUsersCount = users.filter((u) => u.status === 'ACTIVE').length;
    
    // Calculate actual storage usage by parsing the fileSize string (converting KB/GB to MB base first)
    const totalSizeMB = targetDocs.reduce((acc, d) => {
      const sizeStr = d.fileSize || '0';
      const parsed = parseFloat(sizeStr);
      if (isNaN(parsed)) return acc;
      
      if (sizeStr.toUpperCase().includes('KB')) {
        return acc + (parsed / 1024);
      } else if (sizeStr.toUpperCase().includes('GB')) {
        return acc + (parsed * 1024);
      } else {
        // Default to MB
        return acc + parsed;
      }
    }, 0);

    const totalStorageUsageGBNum = totalSizeMB / 1024;
    const totalStorageUsageGB = totalStorageUsageGBNum > 0 && totalStorageUsageGBNum < 0.1
      ? totalStorageUsageGBNum.toFixed(4)
      : totalStorageUsageGBNum.toFixed(2);

    return {
      docCount,
      totalDownloads,
      activeUsersCount,
      totalStorageUsageGB
    };
  };

  // Filtered documents by user role for browse
  const getAllowedDocumentsForBrowsing = () => {
    if (!currentUser) return [];

    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const isViewer = currentUser.role === 'VIEWER';

    if (isSuperAdmin) {
      return documents;
    }

    if (isViewer) {
      // Viewer can only see PUBLIC documents
      return documents.filter((d) => !d.visibility || d.visibility === 'PUBLIC');
    }
    
    if (currentUser.role === 'ADMIN_SELAPANAN') {
      return documents.filter((d) => d.category === 'SELAPANAN');
    }

    const institutionAllowed = getRoleInstitution(currentUser.role);
    if (institutionAllowed) {
      return documents.filter((d) => d.institution === institutionAllowed);
    }
    return [];
  };

  // --- RENDERING VIEWS ---

  // View: HOME PAGE
  const renderHomeView = () => {
    const stats = getDashboardStats();
    const allowedDocs = getAllowedDocumentsForBrowsing();
    const recentUploads = [...allowedDocs].slice(0, 4);

    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    // Calculate daily upload quota warning status
    const today = getTodayDateString();
    const currentUploadCount = currentUser && (currentUser.lastActionResetDate === today) ? (currentUser.dailyUploadCount || 0) : 0;
    const maxUploads = currentUser?.role === 'SUPER_ADMIN' ? 100 : 10;
    const isCloseToLimit = currentUser?.role !== 'SUPER_ADMIN' && currentUploadCount >= 8;

    return (
      <div className="space-y-6">
        
        {/* Welcome Greeting & Institutional Header - Profil Lembaga Pendidikan */}
        <SectionErrorBoundary
          isLoading={isUsersLoading}
          error={usersError}
          onRetry={handleTryAgain}
          skeleton={<InstitutionSkeleton />}
          errorTitle="Koneksi Database Gagal"
          errorMessage="Gagal memuat Profil Lembaga Pendidikan dari Firestore. Silakan periksa koneksi Anda dan coba kembali."
        >
          <div className="relative overflow-hidden soft-gradient-dark text-white rounded-2xl p-6 sm:p-7 border border-white/10 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative z-10">
              {/* Elegant Avatar with bright green background & soft ring */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shrink-0 relative overflow-hidden bg-[#00be5a] flex items-center justify-center border-2 border-white/30 shadow-inner ring-4 ring-emerald-900/60">
                {currentUser?.photoURL ? (
                  <LazyImage
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <svg className="w-8 h-8 text-white fill-white opacity-95" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4.2" />
                    <path d="M12 13.9c-4.4 0-8 3.5-8 8.1h16c0-4.6-3.6-8.1-8-8.1z" />
                  </svg>
                )}
              </div>
  
              {/* Greeting and Role Labels */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-serif font-normal text-white/90 leading-tight">
                  Selamat Datang,
                </h2>
                <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-white leading-tight mt-0.5">
                  {currentUser?.name}
                </h3>
                <p className="text-[10px] sm:text-xs text-emerald-100/90 font-medium tracking-wide mt-2">
                  As <span className="font-semibold uppercase">{currentUser?.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : currentUser?.role.replace('_', ' ')}</span> Yayasan Pendidikan Islam Raudhotut Tholibin Bungo
                </p>
              </div>
            </div>
  
            {/* Thin horizontal opacity divider */}
            <div className="border-t border-white/15 my-4 relative z-10" />
            <div className="relative z-10">
              <LiveClock />
            </div>
          </div>
          </SectionErrorBoundary>

        {/* PROGRAM & KEGIATAN YAYASAN (ANNOUNCEMENTS SECTION) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[#015e2a] px-2 select-none">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                
              </h3>
            </div>
          </div>
          <SectionErrorBoundary
            isLoading={isAnnsLoading}
            error={annsError}
            onRetry={handleTryAgain}
            skeleton={<ProgramEventSkeleton />}
            errorTitle="Koneksi Database Gagal"
            errorMessage="Gagal memuat program & kegiatan yayasan dari Firestore. Silakan periksa koneksi Anda dan coba kembali."
          >
          
          {activeAnnouncements.length === 0 ? (
          <div className="soft-card p-6 sm:p-8 text-center flex flex-col items-center justify-center">
              <BellOff className="w-10 h-10 text-emerald-300 mb-2" />
              <h4 className="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wide">Belum Ada Program & Kegiatan</h4>
              <p className="text-[11px] text-emerald-800/60 font-semibold mt-1 max-w-md">
                Tidak ada program kerja yayasan atau kegiatan aktif saat ini. Hubungi pengurus pusat untuk informasi lebih lanjut.
              </p>
              <button
                onClick={handleTryAgain}
                className="mt-4 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-4.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Perbarui Data
              </button>
            </div>
        ) : (() => {
          const safeAnnIndex = annIndex >= activeAnnouncements.length ? 0 : annIndex;
          const ann = activeAnnouncements[safeAnnIndex];

          const handlePrev = () => {
            setAnnDirection(-1);
            setAnnIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length);
          };

          const handleNext = () => {
            setAnnDirection(1);
            setAnnIndex((prev) => (prev + 1) % activeAnnouncements.length);
          };

          const fullMonths = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
          const fullDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const annDate = new Date(ann.startDate);
          
          // Format Date beautifully to match design requirements
          const formattedAnnDate = `${fullDays[annDate.getDay()]}, ${annDate.getDate()} ${fullMonths[annDate.getMonth()]} ${annDate.getFullYear()}`;

          // Resolve creator correctly: check by username, then role, then fallback to ensure Muhammad Alwi Nidzam displays correctly
          const creator = users.find((u) => u.username === ann.createdByUsername) || 
                          users.find((u) => u.role === 'SUPER_ADMIN') || 
                          users.find((u) => u.username === 'admin');
          const creatorName = creator ? creator.name : (ann.createdBy || 'Muhammad Alwi Nidzam');

          // Motion transition variants for direction-aware sliding
          const slideVariants = {
            enter: (dir: number) => ({
              x: dir > 0 ? 60 : -60,
              opacity: 0,
              filter: 'blur(4px)'
            }),
            center: {
              x: 0,
              opacity: 1,
              filter: 'blur(0px)'
            },
            exit: (dir: number) => ({
              x: dir > 0 ? -60 : 60,
              opacity: 0,
              filter: 'blur(4px)'
            })
          };

          return (
            <div className="space-y-3">
              {/* Header row: perfectly aligned and matching the clean typography */}
              <div className="flex items-center justify-between text-[#015e2a] px-2 select-none">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#015e2a] stroke-[2.5]" />
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                    PROGRAM & KEGIATAN YAYASAN
                  </h3>
                </div>
                {activeAnnouncements.length > 1 && (
                  <span className="text-xs sm:text-sm font-bold text-[#015e2a]">
                    {safeAnnIndex + 1} dari {activeAnnouncements.length}
                  </span>
                )}
              </div>

              {/* Outer Card in Forest Green (Premium Soft UI with very soft shadows and light-glow) */}
              <div
                onTouchStart={(e) => {
                  (window as any)._swipeStartX = e.touches[0].clientX;
                }}
                onTouchEnd={(e) => {
                  const startX = (window as any)._swipeStartX;
                  if (startX === undefined) return;
                  const endX = e.changedTouches[0].clientX;
                  const diffX = startX - endX;
                  if (diffX > 50) {
                    handleNext();
                  } else if (diffX < -50) {
                    handlePrev();
                  }
                  delete (window as any)._swipeStartX;
                }}
                className="relative overflow-hidden soft-gradient-dark rounded-2xl p-4 sm:p-5 transition-all duration-300 select-none border border-white/10 flex flex-col items-center w-full touch-pan-y shadow-lg"
              >
                {/* Inner Translucent Dark Container */}
                <div
                  style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}
                  className="w-full bg-gradient-to-br from-white/10 via-[#003d17]/40 to-[#001a09]/70 border-t border-l border-white/25 border-b border-r border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 flex flex-col gap-3 relative z-10 group transition-all duration-300 hover:border-white/20"
                >
                  {/* Left Navigation Chevron INSIDE the glass container */}
                  {activeAnnouncements.length > 1 && (
                    <button
                      onClick={handlePrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full soft-bg/10 hover:soft-bg/20 hover:scale-105 active:scale-95 border border-white/15 text-white hidden sm:flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer z-30 backdrop-blur-md"
                      title="Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}

                  {/* Right Navigation Chevron INSIDE the glass container */}
                  {activeAnnouncements.length > 1 && (
                    <button
                      onClick={handleNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full soft-bg/10 hover:soft-bg/20 hover:scale-105 active:scale-95 border border-white/15 text-white hidden sm:flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer z-30 backdrop-blur-md"
                      title="Selanjutnya"
                    >
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}

                  {/* Swipe-animated announcement viewport with generous horizontal padding for chevrons */}
                  <div className="w-full overflow-hidden">
                    <AnimatePresence initial={false} custom={annDirection} mode="wait">
                      <motion.div
                        key={safeAnnIndex}
                        custom={annDirection}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          x: { type: "spring", stiffness: 380, damping: 35 },
                          opacity: { duration: 0.18 },
                          filter: { duration: 0.18 }
                        }}
                        className="flex flex-col gap-3 w-full px-4 sm:px-10 md:px-12"
                      >
                        {/* Area 1: Bell Icon and Status Badge */}
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-[#01250d] text-[#ffb300] rounded-lg border border-white/10 shrink-0 w-8 h-8 flex items-center justify-center">
                            <Bell className="w-4 h-4 stroke-[2]" />
                          </div>
                          <span className={`text-[10px] font-bold tracking-wider px-3 py-1 rounded-lg uppercase border ${
                            ann.priority === 'URGENT'
                              ? 'bg-red-500/85 text-white border-red-500/30'
                              : ann.priority === 'HIGH'
                              ? 'bg-[#ffa000] text-[#013514] border-[#ffa000]/30'
                              : 'bg-[#52a35d] text-[#013514] border-emerald-600/15'
                          }`}>
                            {ann.priority === 'NORMAL' ? 'NORMAL' : ann.priority}
                          </span>
                        </div>

                        {/* Area 2: Title & Content Text */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <h4 className="text-base sm:text-lg font-semibold text-white uppercase tracking-wider leading-snug">
                            {ann.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-white/95 font-medium leading-relaxed max-w-4xl">
                            {ann.content.length > 150 ? `${ann.content.slice(0, 150)}...` : ann.content}
                          </p>
                        </div>

                        {/* Divider Line */}
                        <div className="border-t border-white/10 my-0.5" />

                        {/* Area 3: Clean Metadata Info with Gold Value Highlights and Lihat Semua Button */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] sm:text-xs text-white/80 font-bold">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="flex items-center gap-1.5">
                              <span>• Oleh :</span>
                              <span className="text-[#ffb300] font-bold tracking-wide">{creatorName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>• Dibuat Tanggal :</span>
                              <span className="text-[#ffb300] font-bold tracking-wide">{formattedAnnDate}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              setSelectedAnnDetail(ann);
                              setAnnDetailBackView('home');
                              setCurrentView('announcement-detail');
                            }}
                            className="bg-[#ffb300] hover:bg-[#ffa000] text-[#013514] font-bold px-3 py-1.5 rounded-lg text-[10px] sm:text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer hover:scale-[1.02]"
                          >
                            Lihat Selengkapnya <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Carousel Indicator: Capsule indicators at the bottom */}
                {activeAnnouncements.length > 1 && (
                  <div className="flex justify-center items-center gap-1.5 mt-2.5 relative z-10 select-none">
                    {activeAnnouncements.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setAnnDirection(idx > safeAnnIndex ? 1 : -1);
                          setAnnIndex(idx);
                        }}
                        className={`rounded-full transition-all duration-300 cursor-pointer ${
                          safeAnnIndex === idx ? 'bg-[#ffb300] w-8 h-2' : 'bg-[#ffb300]/30 w-2 h-2 hover:bg-[#ffb300]/60'
                        }`}
                        title={`Buka pengumuman ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
          </SectionErrorBoundary>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="soft-card soft-card-hover p-5 rounded-2xl flex items-center justify-between transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">Total Arsip</span>
              <p className="text-2xl font-extrabold text-emerald-950 leading-none">{stats.docCount}</p>
              <p className="text-[10px] text-emerald-800/50 font-semibold mt-1">Berkas PDF terverifikasi</p>
            </div>
            <div className="soft-inset p-3.5 rounded-2xl text-emerald-800 shrink-0 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="soft-card soft-card-hover p-5 rounded-2xl flex items-center justify-between transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">Pengunduhan</span>
              <p className="text-2xl font-extrabold text-emerald-950 leading-none">{stats.totalDownloads}</p>
              <p className="text-[10px] text-emerald-800/50 font-semibold mt-1">Total klik unduh arsip</p>
            </div>
            <div className="soft-inset p-3.5 rounded-2xl text-emerald-800 shrink-0 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
          </div>

          <div className="soft-card soft-card-hover p-5 rounded-2xl flex items-center justify-between transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">Storage Terpakai</span>
              <p className="text-2xl font-extrabold text-emerald-950 leading-none">{stats.totalStorageUsageGB} GB</p>
              <p className="text-[10px] text-emerald-800/50 font-semibold mt-1">Kuota Maks: 50.0 GB</p>
            </div>
            <div className="soft-inset p-3.5 rounded-2xl text-emerald-800 shrink-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
          </div>

          <div className="soft-card soft-card-hover p-5 rounded-2xl flex items-center justify-between transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">Operator Aktif</span>
              <p className="text-2xl font-extrabold text-emerald-950 leading-none">{stats.activeUsersCount}</p>
              <p className="text-[10px] text-emerald-800/50 font-semibold mt-1">Admin seluruh lembaga</p>
            </div>
            <div className="soft-inset p-3.5 rounded-2xl text-emerald-800 shrink-0 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* DIREKTORI & EVENT QUICK LINKS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <button 
            onClick={() => setCurrentView('institution-directory')}
            className="soft-card soft-card-hover p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer group relative overflow-hidden transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full opacity-50 -z-0" />
            <div className="soft-inset p-3.5 text-emerald-800 rounded-2xl mb-3 group-hover:scale-110 group-hover:soft-button-primary transition-all duration-300 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wide z-10">Direktori Lembaga</h4>
            <p className="text-[10px] text-emerald-800/60 font-semibold mt-1 z-10">Profil & Pimpinan Unit</p>
          </button>
          
          <button 
            onClick={() => setCurrentView('event-selapanan')}
            className="soft-card soft-card-hover p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer group relative overflow-hidden transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-950/5 rounded-bl-full opacity-50 -z-0" />
            <div className="soft-inset p-3.5 text-emerald-800 rounded-2xl mb-3 group-hover:scale-110 group-hover:soft-button-primary transition-all duration-300 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wide z-10">Selapanan</h4>
            <p className="text-[10px] text-emerald-800/60 font-semibold mt-1 z-10">Agenda Rutin Bulanan</p>
          </button>

          <button 
            onClick={() => setCurrentView('event-harlah')}
            className="soft-card soft-card-hover p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer group relative overflow-hidden transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full opacity-50 -z-0" />
            <div className="soft-inset p-3.5 text-amber-600 rounded-2xl mb-3 group-hover:scale-110 group-hover:soft-button-primary transition-all duration-300 flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wide z-10">Harlah Yayasan</h4>
            <p className="text-[10px] text-emerald-800/60 font-semibold mt-1 z-10">Peringatan Tahunan</p>
          </button>

          <button 
            onClick={() => setCurrentView('reporting-center')}
            className="soft-card soft-card-hover p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer group relative overflow-hidden transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full opacity-50 -z-0" />
            <div className="soft-inset p-3.5 text-emerald-700 rounded-2xl mb-3 group-hover:scale-110 group-hover:soft-button-primary transition-all duration-300 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wide z-10">Pusat Laporan</h4>
            <p className="text-[10px] text-emerald-800/60 font-semibold mt-1 z-10">Pengaduan & Aspirasi</p>
          </button>
        </div>

        {/* RECENT UPLOADS */}
        <div className="soft-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100/50 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">Arsip Terbaru</h3>
              <p className="text-[10px] text-emerald-800/60 font-semibold">Unggahan berkas laporan terakhir</p>
            </div>
            <button
              onClick={() => setCurrentView('archive')}
              className="soft-button-secondary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentUploads.map((doc) => (
              <div key={doc.id} className="soft-inset p-3.5 rounded-xl flex items-center justify-between gap-4 group hover:bg-emerald-50/50 transition-all border border-white/20">
                <div className="flex items-center gap-3 truncate min-w-0">
                  <div className="soft-card p-2 text-emerald-800 rounded-lg shrink-0 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-emerald-950 truncate leading-tight group-hover:text-emerald-700 transition-colors">
                      {doc.fileName}
                    </h4>
                    <p className="text-[10px] text-emerald-800/50 font-semibold truncate uppercase mt-0.5">
                      {doc.category} • {doc.institution} • {doc.year}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenPdf(doc)}
                    className="soft-button-secondary p-2 rounded-lg text-emerald-800 hover:text-emerald-950 transition-all cursor-pointer"
                    title="Quick View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="soft-button-secondary p-2 rounded-lg text-emerald-800 hover:text-emerald-950 transition-all cursor-pointer"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {recentUploads.length === 0 && (
              <p className="text-xs text-emerald-800/50 text-center py-10">Belum ada berkas laporan yang diunggah.</p>
            )}
          </div>
        </div>

      </div>
    );
  };

  // View: WORKSPACE DASHBOARD (Upload Dokumen + Membuat Pengumuman)
  const renderDashboardView = () => {
    const isViewer = currentUser?.role === 'VIEWER';
    if (isViewer) {
      return (
        <div className="soft-card p-8 text-center">
          <p className="text-emerald-950 font-bold">Akses Terbatas</p>
          <p className="text-xs text-stone-500 font-semibold mt-1">Halaman operasional ini hanya untuk Pengurus/Admin.</p>
        </div>
      );
    }

    const chartMonths = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ];
    const INSTITUTIONS: InstitutionType[] = ['YPI', 'SMA', 'MTS', 'MADIN', 'TK', 'PESANTREN'];
    
    const monthlyChartData = chartMonths.map((m) => {
      const dataPoint: { [key: string]: any } = { month: m };
      INSTITUTIONS.forEach((inst) => {
        dataPoint[inst] = documents.filter((doc) => 
          doc.year === chartYear && 
          doc.month.toUpperCase() === m && 
          doc.institution === inst
        ).length;
      });
      return dataPoint;
    });

    const chartYears = ['2024', '2025', '2026'];
    const yearlyChartData = chartYears.map((yr) => {
      const dataPoint: { [key: string]: any } = { year: yr };
      INSTITUTIONS.forEach((inst) => {
        dataPoint[inst] = documents.filter((doc) => 
          doc.year === yr && 
          doc.institution === inst
        ).length;
      });
      return dataPoint;
    });

    const isMonthly = chartPeriod === 'monthly';
    const activeChartData = isMonthly ? monthlyChartData : yearlyChartData;
    const xAxisDataKey = isMonthly ? 'month' : 'year';
    const totalUploadsToShow = isMonthly 
      ? documents.filter((doc) => doc.year === chartYear).length
      : documents.length;

    const instColors: { [key: string]: string } = {
      YPI: '#0f766e',
      SMA: '#10b981',
      MTS: '#0284c7',
      MADIN: '#6366f1',
      TK: '#f59e0b',
      PESANTREN: '#ec4899'
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
        return (
          <div className="soft-gradient-dark text-stone-100 p-4 rounded-xl border border-emerald-500/30 max-w-sm font-sans">
            <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-2">{label}</p>
            <div className="space-y-1.5 text-xs">
              {payload.map((entry: any) => {
                if (entry.value === 0) return null;
                return (
                  <div key={entry.name} className="flex items-center justify-between gap-6 font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-stone-300 uppercase tracking-wider">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-stone-100">{entry.value} Berkas</span>
                  </div>
                );
              })}
            </div>
            {total > 0 && (
              <div className="border-t border-emerald-500/20 mt-3 pt-2 flex items-center justify-between text-xs font-bold text-emerald-300 uppercase">
                <span>Total Unggahan</span>
                <span>{total} Berkas</span>
              </div>
              )}
          </div>
        );
      }
      return null;
    };

    return (
      <div className="space-y-6">
        {/* Workspace Title Header */}
        <div className="soft-gradient-dark rounded-2xl p-6 sm:p-7 text-white relative overflow-hidden border border-white/10 shadow-lg">
          <div className="relative z-10 space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-wide">
              DASHBOARD ADMIN, {currentUser?.name || 'PENGURUS'}
            </h1>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-emerald-300">
              RUANG KERJA PENGURUS
            </p>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-4xl leading-relaxed">
              Workspace terintegrasi untuk mengelola arsip digital yayasan, mengunggah laporan dan dokumen resmi, serta menyusun dan mempublikasikan pengumuman kepada seluruh unit kerja dalam satu alur kerja yang efisien.
            </p>
          </div>
        </div>

        {/* Visualisasi Statistik Aktivitas Unggahan */}
        <div className="soft-bg p-5 sm:p-7 rounded-xl border border-emerald-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100/60 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-800 rounded-xl">
                <svg className="w-5 h-5 text-emerald-850" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                  {isMonthly ? 'STATISTIK ARSIP DIGITAL BULANAN' : 'STATISTIK ARSIP DIGITAL TAHUNAN'}
                </h3>
                <p className="text-[10px] text-emerald-800/60 font-bold">
                  {isMonthly 
                    ? `Grafik sebaran aktivitas unggahan dokumen resmi per unit lembaga untuk Tahun Laporan ${chartYear}.`
                    : 'Grafik sebaran tren aktivitas unggahan dokumen resmi tahunan per unit lembaga.'
                  }
                </p>
              </div>
            </div>

            {/* Chart Controls */}
            <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
              {/* Period Selector (Monthly vs Yearly) */}
              <div className="flex soft-bg p-1 rounded-xl border border-emerald-100/60">
                <button
                  onClick={() => setChartPeriod('monthly')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    isMonthly
                      ? 'bg-emerald-800 text-white'
                      : 'text-emerald-800/60 hover:text-emerald-950 hover:bg-emerald-50'
                  }`}
                >
                  Bulanan
                </button>
                <button
                  onClick={() => setChartPeriod('yearly')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    !isMonthly
                      ? 'bg-emerald-800 text-white'
                      : 'text-emerald-800/60 hover:text-emerald-950 hover:bg-emerald-50'
                  }`}
                >
                  Tahunan
                </button>
              </div>

              {/* Year Selector (Only visible for Monthly view) */}
              {isMonthly && (
                <div className="flex soft-bg p-1 rounded-xl border border-emerald-100/60">
                  {['2026', '2025', '2024'].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setChartYear(yr)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                        chartYear === yr
                          ? 'bg-emerald-800 text-white'
                          : 'text-emerald-800/60 hover:text-emerald-950 hover:bg-emerald-50'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              )}

              {/* Chart Mode Toggle */}
              <div className="flex soft-bg p-1 rounded-xl border border-emerald-100/60">
                <button
                  onClick={() => setChartMode('stacked')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    chartMode === 'stacked'
                      ? 'bg-emerald-800 text-white'
                      : 'text-emerald-800/60 hover:text-emerald-950 hover:bg-emerald-50'
                  }`}
                >
                  Tumpuk
                </button>
                <button
                  onClick={() => setChartMode('grouped')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    chartMode === 'grouped'
                      ? 'bg-emerald-800 text-white'
                      : 'text-emerald-800/60 hover:text-emerald-950 hover:bg-emerald-50'
                  }`}
                >
                  Grup
                </button>
              </div>
            </div>
          </div>

          {totalUploadsToShow === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-emerald-100 rounded-xl flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-stone-50 rounded-full text-stone-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <p className="text-emerald-950 text-xs font-bold uppercase tracking-wider">Tidak Ada Aktivitas Unggahan</p>
              <p className="text-[10px] text-stone-500 font-bold max-w-sm">
                {isMonthly 
                  ? `Belum ada dokumen yang terdaftar untuk tahun laporan ${chartYear} di database.`
                  : 'Belum ada dokumen yang terdaftar di database.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Responsive Chart Container */}
              <div className="w-full h-[300px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f1" />
                    <XAxis
                      dataKey={xAxisDataKey}
                      stroke="#065f46"
                      fontSize={9}
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis
                      stroke="#065f46"
                      fontSize={9}
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f4f7f5', opacity: 0.5 }} />
                    {INSTITUTIONS.map((inst) => (
                      <Bar
                        key={inst}
                        dataKey={inst}
                        name={inst}
                        fill={instColors[inst]}
                        stackId={chartMode === 'stacked' ? 'a' : undefined}
                        radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                        maxBarSize={chartMode === 'stacked' ? 40 : 15}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend Section */}
              <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 pt-2 border-t border-stone-100">
                {INSTITUTIONS.map((inst) => (
                  <div key={inst} className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-950">
                    <span className="w-3 h-3 rounded-md" style={{ backgroundColor: instColors[inst] }} />
                    <span>{inst === 'YPI' ? 'YPI (YAYASAN)' : `${inst} RAUDHOTUT`}</span>
                  </div>
                ))}
              </div>
            </div>
            )}
        </div>

        {/* Vertical Stack Workspace Grid */}
        <div className="flex flex-col gap-8">
          {/* Column 1: Upload Dokumen */}
          <div className="soft-bg p-4 sm:p-6 rounded-xl border border-emerald-200/20 space-y-6">
            <div className="flex items-center gap-3 border-b border-emerald-100 pb-4">
              <div className="p-2 bg-emerald-500/10 text-emerald-800 rounded-xl">
                <FileUp className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                  MANAJEMEN DOKUMEN & ARSIP DIGITAL
                </h3>
                <p className="text-[10px] text-emerald-800/60 font-bold">
                  Unggah, lengkapi metadata, dan kelola pengarsipan dokumen secara terstruktur agar mudah dicari, diverifikasi, dan didistribusikan.
                </p>
              </div>
            </div>
            {renderUploadView(true)}
          </div>

          {/* Column 2: Membuat Pengumuman */}
          <div className="soft-bg p-4 sm:p-6 rounded-xl border border-emerald-200/20 space-y-6">
            <div className="flex items-center gap-3 border-b border-emerald-100 pb-4">
              <div className="p-2 bg-emerald-500/10 text-emerald-855 rounded-xl">
                <Bell className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                  PUSAT PENGELOLAAN PENGUMUMAN
                </h3>
                <p className="text-[10px] text-emerald-800/60 font-bold">
                  Buat, kelola, dan publikasikan pengumuman resmi kepada pengguna atau unit kerja sesuai target distribusi secara cepat dan terpusat.
                </p>
              </div>
            </div>
            {renderAnnouncementsView(true)}
          </div>
        </div>
      </div>
    );
  };

  // View: ARCHIVE EXPLORER
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'ALL'>('ALL');
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionType | 'ALL'>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [explorerViewMode, setExplorerViewMode] = useState<'grid' | 'list'>('grid');
  const [explorerSearchQuery, setExplorerSearchQuery] = useState('');
  const [explorerDisplayMode, setExplorerDisplayMode] = useState<'folder' | 'flat'>('folder');
  const [folderPath, setFolderPath] = useState<string[]>([]);
  const [folderGrouping, setFolderGrouping] = useState<'institution' | 'category' | 'year'>('institution');

  // Helper for folder navigation dimension mapping
  const getDimensionAtLevel = (level: number, currentGrouping: 'institution' | 'category' | 'year') => {
    if (currentGrouping === 'institution') {
      if (level === 0) return 'institution';
      if (level === 1) return 'category';
      return 'year';
    } else if (currentGrouping === 'category') {
      if (level === 0) return 'category';
      if (level === 1) return 'institution';
      return 'year';
    } else {
      if (level === 0) return 'year';
      if (level === 1) return 'institution';
      return 'category';
    }
  };

  useEffect(() => {
    if (explorerDisplayMode === 'folder') {
      let inst: InstitutionType | 'ALL' = 'ALL';
      let cat: CategoryType | 'ALL' = 'ALL';
      let yr = 'ALL';

      folderPath.forEach((val, idx) => {
        const dimension = getDimensionAtLevel(idx, folderGrouping);
        if (dimension === 'institution') inst = val as InstitutionType;
        if (dimension === 'category') cat = val as CategoryType;
        if (dimension === 'year') yr = val;
      });

      setSelectedInstitution(inst);
      setSelectedCategory(cat);
      setSelectedYear(yr);
    }
  }, [folderPath, folderGrouping, explorerDisplayMode]);

  const renderArchiveView = () => {
    const allowedDocs = getAllowedDocumentsForBrowsing();

    const getOptionsForDimension = (dimension: 'institution' | 'category' | 'year') => {
      if (dimension === 'institution') {
        const userInst = getRoleInstitution(currentUser?.role || 'VIEWER');
        if (currentUser?.role === 'ADMIN_SELAPANAN') return ['YPI'];
        if (userInst) return [userInst];
        return ['YPI', 'SMA', 'MTS', 'MADIN', 'TK', 'PESANTREN'];
      }
      if (dimension === 'category') {
        if (currentUser?.role === 'ADMIN_SELAPANAN') return ['SELAPANAN'];
        return ['KEUANGAN', 'KEGIATAN', 'SURAT', 'DOKUMEN', 'SELAPANAN', 'LAINNYA'];
      }
      return ['2026', '2025', '2024'];
    };

    const getFolderContentsCount = (pathArray: string[], currentGrouping: 'institution' | 'category' | 'year') => {
      return allowedDocs.filter((doc) => {
        for (let i = 0; i < pathArray.length; i++) {
          const val = pathArray[i];
          const dimension = getDimensionAtLevel(i, currentGrouping);
          if (dimension === 'institution' && doc.institution !== val) return false;
          if (dimension === 'category' && doc.category !== val) return false;
          if (dimension === 'year' && doc.year !== val) return false;
        }
        return true;
      }).length;
    };

    const handleGroupChange = (grouping: 'institution' | 'category' | 'year') => {
      setFolderGrouping(grouping);
      setFolderPath([]);
    };

    // Filters matching category, institution, year, and search keywords
    const filteredDocs = allowedDocs.filter((doc) => {
      const matchCat = selectedCategory === 'ALL' ? true : doc.category === selectedCategory;
      const matchInst = selectedInstitution === 'ALL' ? true : doc.institution === selectedInstitution;
      const matchYear = selectedYear === 'ALL' ? true : doc.year === selectedYear;
      
      const searchLower = explorerSearchQuery.toLowerCase();
      const matchSearch = explorerSearchQuery === '' ? true : (
        doc.fileName.toLowerCase().includes(searchLower) ||
        (doc.description || '').toLowerCase().includes(searchLower) ||
        doc.uploader.toLowerCase().includes(searchLower) ||
        doc.category.toLowerCase().includes(searchLower) ||
        doc.institution.toLowerCase().includes(searchLower)
      );

      return matchCat && matchInst && matchYear && matchSearch;
    });

    const categories: (CategoryType | 'ALL')[] = currentUser?.role === 'ADMIN_SELAPANAN'
      ? ['SELAPANAN']
      : ['ALL', 'KEUANGAN', 'KEGIATAN', 'SURAT', 'DOKUMEN', 'LAINNYA', 'SELAPANAN'];
    
    // Automatically set default category filter if not already set
    if (currentUser?.role === 'ADMIN_SELAPANAN' && selectedCategory !== 'SELAPANAN') {
      setTimeout(() => setSelectedCategory('SELAPANAN'), 0);
    }
    
    // Available institutions for filter based on user roles
    const userInst = getRoleInstitution(currentUser?.role || 'VIEWER');
    const institutions: (InstitutionType | 'ALL')[] = currentUser?.role === 'ADMIN_SELAPANAN'
      ? ['YPI']
      : userInst ? [userInst] : ['ALL', 'YPI', 'SMA', 'MTS', 'MADIN', 'TK', 'PESANTREN'];

    // Automatically set default institution filter if not already set
    if (currentUser?.role === 'ADMIN_SELAPANAN' && selectedInstitution !== 'YPI') {
      setTimeout(() => setSelectedInstitution('YPI'), 0);
    }

    const years = ['ALL', '2026', '2025', '2024'];
    const isViewer = currentUser?.role === 'VIEWER';

    // Helper to get category-specific styling
    const getCategoryTheme = (cat: string) => {
      switch (cat) {
        case 'KEUANGAN':
          return {
            bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/50',
            dot: 'bg-emerald-500',
            glow: 'rgba(16,185,129,0.12)',
            gradient: 'from-emerald-400 to-teal-500'
          };
        case 'KEGIATAN':
          return {
            bg: 'bg-indigo-50 text-indigo-800 border-indigo-200/50',
            dot: 'bg-indigo-500',
            glow: 'rgba(99,102,241,0.12)',
            gradient: 'from-indigo-400 to-blue-500'
          };
        case 'SURAT':
          return {
            bg: 'bg-amber-50 text-amber-900 border-amber-250/50',
            dot: 'bg-amber-500',
            glow: 'rgba(245,158,11,0.12)',
            gradient: 'from-amber-400 to-orange-500'
          };
        case 'DOKUMEN':
          return {
            bg: 'bg-rose-50 text-rose-800 border-rose-200/50',
            dot: 'bg-rose-500',
            glow: 'rgba(244,63,94,0.12)',
            gradient: 'from-rose-400 to-pink-500'
          };
        case 'SELAPANAN':
          return {
            bg: 'bg-violet-50 text-violet-800 border-violet-200/50',
            dot: 'bg-violet-500',
            glow: 'rgba(139,92,246,0.12)',
            gradient: 'from-violet-400 to-fuchsia-500'
          };
        default:
          return {
            bg: 'bg-slate-50 text-slate-800 border-slate-200/50',
            dot: 'bg-slate-500',
            glow: 'rgba(100,116,139,0.12)',
            gradient: 'from-slate-400 to-slate-500'
          };
      }
    };

    return (
      <div className="space-y-6">
        
        {/* Header Title with Layout Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100/30 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-emerald-950 flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/60">
                <Folder className="w-5 h-5" />
              </div>
              Arsip Digital Explorer
            </h2>
            <p className="text-xs text-emerald-800/60 font-semibold mt-1">
              Penelusuran berkas laporan yang diatur rapi berdasarkan kategori, lembaga unit, dan tahun buku.
            </p>
          </div>

          {/* View Mode Toggle Switch */}
          <div className="flex items-center gap-1 bg-emerald-500/5 border border-emerald-100/50 p-1.5 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setExplorerViewMode('grid')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                explorerViewMode === 'grid'
                  ? 'soft-bg text-emerald-900 border border-emerald-100/30'
                  : 'text-emerald-800/60 hover:text-emerald-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setExplorerViewMode('list')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                explorerViewMode === 'list'
                  ? 'soft-bg text-emerald-900 border border-emerald-100/30'
                  : 'text-emerald-800/60 hover:text-emerald-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>
        </div>

        {/* Tampilan Mode Switch (Folder vs Semua Berkas) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-emerald-500/5 border border-emerald-150/20 p-1.5 rounded-xl w-fit">
          <button
            onClick={() => {
              setExplorerDisplayMode('folder');
              setFolderPath([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              explorerDisplayMode === 'folder'
                ? 'bg-emerald-800 text-white border border-emerald-900'
                : 'text-emerald-850/60 hover:text-emerald-900'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Mode Folder</span>
          </button>
          <button
            onClick={() => setExplorerDisplayMode('flat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              explorerDisplayMode === 'flat'
                ? 'bg-emerald-800 text-white border border-emerald-900'
                : 'text-emerald-850/60 hover:text-emerald-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Semua Berkas (Flat List)</span>
          </button>
        </div>

        {/* UNIFIED SEARCH & SOFT FILTER CHIPS PANEL */}
        <div className="soft-card p-6 space-y-5">
          
          {/* Integrated Real-time Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-800/50 absolute left-4.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari cepat nama arsip, keterangan, uploader atau kata kunci di dalam explorer ini..."
              value={explorerSearchQuery}
              onChange={(e) => setExplorerSearchQuery(e.target.value)}
              className="soft-input"
            />
            {explorerSearchQuery && (
              <button 
                onClick={() => setExplorerSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-emerald-50 rounded-lg text-emerald-800/50 hover:text-emerald-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* FOLDER MODE: Show grouping options at root, or breadcrumbs when inside folders */}
          {explorerDisplayMode === 'folder' && !explorerSearchQuery && (
            <div className="space-y-4 pt-1">
              {/* Grouping option select at Root level */}
              {folderPath.length === 0 ? (
                <div className="bg-emerald-50/30 border border-emerald-100/30 rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-emerald-950">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span className="text-xs font-bold">Pilih Struktur Pengelompokan Folder:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleGroupChange('institution')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        folderGrouping === 'institution'
                          ? 'soft-bg border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/10'
                          : 'soft-bg/50 border-emerald-100/40 text-emerald-800/70 hover:bg-emerald-50/50'
                      }`}
                    >
                      <span className="font-semibold text-xs">🏢 Berdasarkan Lembaga Unit</span>
                      <span className="text-[10px] text-stone-400 font-semibold mt-0.5">Lembaga ➔ Kategori ➔ Tahun</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleGroupChange('category')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        folderGrouping === 'category'
                          ? 'soft-bg border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/10'
                          : 'soft-bg/50 border-emerald-100/40 text-emerald-800/70 hover:bg-emerald-50/50'
                      }`}
                    >
                      <span className="font-semibold text-xs">📁 Berdasarkan Kategori</span>
                      <span className="text-[10px] text-stone-400 font-semibold mt-0.5">Kategori ➔ Lembaga ➔ Tahun</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGroupChange('year')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        folderGrouping === 'year'
                          ? 'soft-bg border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/10'
                          : 'soft-bg/50 border-emerald-100/40 text-emerald-800/70 hover:bg-emerald-50/50'
                      }`}
                    >
                      <span className="font-semibold text-xs">📅 Berdasarkan Tahun Buku</span>
                      <span className="text-[10px] text-stone-400 font-semibold mt-0.5">Tahun Buku ➔ Lembaga ➔ Kategori</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Breadcrumbs Navigator inside folder path */
                <div className="flex items-center gap-3 soft-bg/60 border border-emerald-100/30 px-4 py-3 rounded-xl">
                  <button
                    onClick={() => setFolderPath(folderPath.slice(0, -1))}
                    className="p-1.5 soft-bg border border-emerald-100/50 text-emerald-800 hover:text-emerald-950 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-[1.03] shrink-0"
                    title="Kembali ke folder sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold text-emerald-900 select-none scrollbar-none py-1">
                    <button
                      onClick={() => setFolderPath([])}
                      className="hover:text-emerald-600 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Folder className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Arsip Utama</span>
                    </button>
                    
                    {folderPath.map((folder, index) => {
                      const isLast = index === folderPath.length - 1;
                      return (
                        <React.Fragment key={index}>
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                          <button
                            disabled={isLast}
                            onClick={() => setFolderPath(folderPath.slice(0, index + 1))}
                            className={`transition-colors flex items-center gap-1 shrink-0 ${
                              isLast ? 'text-emerald-950 font-bold cursor-default' : 'hover:text-emerald-600 cursor-pointer'
                            }`}
                          >
                            <span>{folder}</span>
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FLAT MODE (or Search active): Show detailed filter chips */}
          {(explorerDisplayMode === 'flat' || explorerSearchQuery) && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 pt-1">
              {/* Category Selector Rows */}
              <div className="space-y-2 xl:col-span-12">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/50 block">Kategori Laporan</span>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => {
                    const theme = getCategoryTheme(cat);
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-880 scale-[1.01]'
                            : 'soft-bg/80 text-emerald-900 hover:bg-emerald-50 border-emerald-100/30'
                        }`}
                      >
                        {cat !== 'ALL' && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'soft-bg' : theme.dot}`}></span>
                        )}
                        <span>{cat === 'ALL' ? 'Semua Kategori' : cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Institution Selector Rows */}
              {institutions.length > 1 && (
                <div className="space-y-2 pt-3 border-t border-emerald-100/20 xl:col-span-7 xl:border-t-0 xl:pt-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/50 block">Lembaga Unit Yayasan</span>
                  <div className="flex flex-wrap gap-1.5">
                    {institutions.map((inst) => {
                      const isSelected = selectedInstitution === inst;
                      return (
                        <button
                          key={inst}
                          onClick={() => setSelectedInstitution(inst)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-800 text-white border-emerald-800 scale-[1.01]'
                              : 'soft-bg/80 text-emerald-900 hover:bg-emerald-50 border-emerald-100/30'
                          }`}
                        >
                          {inst === 'ALL' ? 'Semua Lembaga' : inst}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Year selector row */}
              <div className={`space-y-2 pt-3 border-t border-emerald-100/20 xl:border-t-0 xl:pt-0 ${institutions.length > 1 ? 'xl:col-span-5 xl:border-l xl:border-emerald-150/10 xl:pl-5' : 'xl:col-span-12'}`}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/50 block">Tahun Buku</span>
                <div className="flex flex-wrap gap-1.5">
                  {years.map((yr) => {
                    const isSelected = selectedYear === yr;
                    return (
                      <button
                        key={yr}
                        onClick={() => setSelectedYear(yr)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 scale-[1.01]'
                            : 'soft-bg/80 text-emerald-900 hover:bg-emerald-50 border-emerald-100/30'
                        }`}
                      >
                        {yr === 'ALL' ? 'Semua Tahun' : yr}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quick Counter Info */}
          <div className="pt-3 border-t border-emerald-100/20 flex items-center justify-between text-[10px] text-emerald-800/50 font-bold">
            <span>Ditemukan: {filteredDocs.length} Berkas Laporan</span>
            {explorerSearchQuery && (
              <span className="text-emerald-700 bg-emerald-500/5 px-2.5 py-0.5 rounded-full border border-emerald-100/30">
                Pencarian Aktif: "{explorerSearchQuery}"
              </span>
            )}
          </div>
        </div>

        {/* DOCUMENTS EXPLORER CONTENT GRID/TABLE CONTAINER */}
        {isDocsLoading ? (
          /* ================= LOADING SKELETON STATE ================= */
          explorerViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="soft-card p-6 animate-pulse flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="relative h-28 w-full bg-emerald-500/5 rounded-xl border border-emerald-100/10 mb-4 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-200/40"></div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="h-4 bg-emerald-100/60 rounded-full w-20"></div>
                      <div className="h-6 bg-emerald-50 rounded-lg w-8"></div>
                    </div>
                    <div className="h-4 bg-emerald-100/80 rounded-full w-3/4 mb-2"></div>
                    <div className="soft-bg border border-emerald-500/5 rounded-xl px-3 py-2 mt-2">
                      <div className="h-3 bg-emerald-50 rounded-full w-full mb-1.5"></div>
                      <div className="h-3 bg-emerald-50 rounded-full w-2/3"></div>
                    </div>
                  </div>
                  <div className="border-t border-emerald-100/30 pt-3 mt-4 flex items-center justify-between">
                    <div className="w-20">
                      <div className="h-2 bg-emerald-50 rounded-full w-10 mb-1"></div>
                      <div className="h-3 bg-emerald-50 rounded-full w-14"></div>
                    </div>
                    <div className="h-8 bg-emerald-50 rounded-xl w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="soft-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse ">
                  <thead>
                    <tr className="soft-bg border-b border-emerald-100/30">
                      <th className="py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-850">Arsip / Nama Berkas</th>
                      <th className="py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-850 hidden md:table-cell">Unit</th>
                      <th className="py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-850 hidden md:table-cell">Kategori</th>
                      <th className="py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-850 hidden sm:table-cell">Tahun Buku</th>
                      <th className="py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-850 hidden sm:table-cell">Ukuran</th>
                      <th className="py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-850 hidden lg:table-cell">Pengunggah</th>
                      <th className="py-3.5 px-4 text-right text-[10px] font-semibold uppercase tracking-wider text-emerald-850">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100/20">
                    {[1, 2, 3, 4].map((n) => (
                      <tr key={n} className="animate-pulse">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-emerald-100/50"></div>
                            <div className="space-y-1.5 flex-1 max-w-xs">
                              <div className="h-3.5 bg-emerald-100/70 rounded-full w-3/4"></div>
                              <div className="h-2.5 bg-emerald-50 rounded-full w-1/2"></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell"><div className="h-5 bg-emerald-50 rounded-md w-12"></div></td>
                        <td className="py-4 px-4 hidden md:table-cell"><div className="h-5 bg-emerald-50 rounded-full w-16"></div></td>
                        <td className="py-4 px-4 hidden sm:table-cell"><div className="h-4 bg-emerald-50 rounded-full w-14"></div></td>
                        <td className="py-4 px-4 hidden sm:table-cell"><div className="h-4 bg-emerald-50 rounded-full w-10"></div></td>
                        <td className="py-4 px-4 hidden lg:table-cell"><div className="h-4 bg-emerald-50 rounded-full w-16"></div></td>
                        <td className="py-4 px-4 text-right"><div className="h-8 bg-emerald-50 rounded-xl w-16 ml-auto"></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : docsError ? (
          /* ================= ERROR CONNECTION STATE ================= */
          <DataError
            title="Koneksi Arsip Terputus"
            message="Sistem gagal terhubung ke database arsip yayasan. Harap pastikan koneksi internet Anda stabil dan coba lagi."
            onRetry={handleTryAgain}
          />
        ) : (
          <div className="space-y-6">
            {/* Folders List (if folder mode is active and we are not at maximum depth) */}
            {explorerDisplayMode === 'folder' && !explorerSearchQuery && folderPath.length < 3 && (
              (() => {
                const currentDimension = getDimensionAtLevel(folderPath.length, folderGrouping);
                const folderOptions = getOptionsForDimension(currentDimension).filter(option => {
                  const count = getFolderContentsCount([...folderPath, option], folderGrouping);
                  return count > 0;
                });

                return (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-emerald-700" />
                      <span>Sub-Folder ({folderOptions.length})</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {folderOptions.map((option) => {
                        const count = getFolderContentsCount([...folderPath, option], folderGrouping);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setFolderPath([...folderPath, option])}
                            className="soft-card p-6 text-left transition-all hover:scale-[1.02]  hover:border-emerald-200 cursor-pointer flex items-center gap-3.5 group"
                          >
                            <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl border border-yellow-100/50 group-hover:bg-yellow-100/60 transition-colors shrink-0">
                              <Folder className="w-6 h-6 fill-yellow-200 text-yellow-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-emerald-950 block truncate group-hover:text-emerald-700 transition-colors">
                                {option}
                              </span>
                              <span className="text-[10px] text-emerald-800/50 font-bold block mt-0.5">
                                {count} Berkas
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-emerald-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}

            {explorerDisplayMode === 'folder' && !explorerSearchQuery && folderPath.length < 3 && filteredDocs.length > 0 && (
              <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-2 pt-4 border-t border-emerald-100/20">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Semua Berkas dalam Folder Ini ({filteredDocs.length})</span>
              </h3>
            )}

            {filteredDocs.length > 0 && (
              explorerViewMode === 'grid' ? (
              /* ================= GRID VIEW (CARDS LAYOUT) ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocs.map((doc) => {
              const isFav = favoriteIds.includes(doc.id);
              const theme = getCategoryTheme(doc.category);
              return (
                <div
                  key={doc.id}
                  className="soft-card soft-card-hover p-6 hover:border-emerald-200/60 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between group h-[370px] w-full"
                >
                  <div>
                    {/* Stylized Ilustrative File Preview Header Frame */}
                    <div className="relative h-28 w-full bg-[#f8fafc] rounded-xl border border-emerald-100/20 mb-4 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-radial-gradient from-transparent to-white/40"></div>
                      <div className={`p-4 rounded-full bg-gradient-to-br ${theme.gradient} text-white transition-transform duration-300 group-hover:scale-110 shadow-md`}>
                        <FileText className="w-6 h-6 stroke-[2]" />
                      </div>
                      
                      {/* Interactive Float Badges inside Preview */}
                      <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-800 text-white text-[10px] font-bold tracking-wider uppercase">
                        {doc.institution}
                      </span>
                      <span className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border ${
                        doc.visibility === 'PRIVATE'
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-sky-600 text-white border-sky-500'
                      }`}>
                        {doc.visibility === 'PRIVATE' ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                        {doc.visibility === 'PRIVATE' ? 'Privat' : 'Publik'}
                      </span>
                      <span className="absolute bottom-3 right-3 text-[10px] text-emerald-800/60 font-bold font-mono soft-bg/80 backdrop-blur-xs border border-emerald-100/20 px-1.5 py-0.5 rounded-md">
                        {doc.fileSize}
                      </span>
                    </div>

                    {/* Metadata indicators row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${theme.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></span>
                        {doc.category}
                      </span>

                      {/* Favorite star toggle ONLY for VIEWERS */}
                      {isViewer && (
                        <button
                          onClick={() => toggleFavorite(doc.id)}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-400 hover:text-yellow-500 rounded-lg transition-colors cursor-pointer"
                          title={isFav ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
                        >
                          <Bookmark className={`w-4.5 h-4.5 ${isFav ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Document title */}
                    <h3 className="text-xs font-bold text-emerald-950 leading-snug tracking-tight group-hover:text-emerald-700 transition-colors line-clamp-1" title={doc.fileName}>
                      {doc.fileName}
                    </h3>

                    {/* Description text with soft quote layout */}
                    <div className="soft-bg border border-emerald-500/5 rounded-xl px-3 py-2 mt-2">
                      <p className="text-[10px] text-emerald-800/70 leading-relaxed font-semibold line-clamp-2 italic h-7">
                        "{doc.description || 'Tidak ada uraian deskripsi tambahan.'}"
                      </p>
                    </div>

                    {/* Date Index Badge */}
                    <div className="flex items-center gap-1.5 mt-3 text-[10px] text-emerald-800/40 font-semibold uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400/70" />
                      <span>{doc.month} {doc.year}</span>
                    </div>
                  </div>

                  {/* Card Actions Bottom Row */}
                  <div className="border-t border-emerald-100/30 pt-3 mt-4 flex items-center justify-between">
                    <div className="min-w-0 max-w-[110px]">
                      <span className="text-[8px] text-emerald-800/40 block font-bold uppercase tracking-wider leading-none">Uploader</span>
                      <span className="text-[10px] text-emerald-800/60 truncate font-bold block mt-0.5" title={doc.uploader}>
                        {doc.uploader.split(',')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenPdf(doc)}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/30 transition-all flex items-center gap-1 cursor-pointer"
                        title="Buka Berkas"
                      >
                        <Eye className="w-3 h-3" /> Buka
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="p-1.5 hover:bg-emerald-50 text-emerald-800/70 hover:text-emerald-950 rounded-xl border border-transparent hover:border-emerald-100/30 transition-all cursor-pointer"
                        title="Unduh PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Delete action checking matrix */}
                      {(!isViewer) && (
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 hover:bg-red-50 text-emerald-300 hover:text-red-600 rounded-xl transition-all cursor-pointer"
                          title="Hapus Berkas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          /* ================= LIST VIEW (TABLE LAYOUT) ================= */
          <div className="soft-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse ">
                <thead>
                  <tr className="soft-bg border-b border-emerald-100/30">
                    <th className="py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-850">Arsip / Nama Berkas</th>
                    <th className="py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-850 hidden md:table-cell">Unit</th>
                    <th className="py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-850 hidden md:table-cell">Kategori</th>
                    <th className="py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-850 hidden sm:table-cell">Tahun Buku</th>
                    <th className="py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-850 hidden sm:table-cell">Ukuran</th>
                    <th className="py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-850 hidden lg:table-cell">Pengunggah</th>
                    <th className="py-3.5 px-4 text-right text-[10px] font-semibold uppercase tracking-wider text-emerald-850">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100/20">
                  {filteredDocs.map((doc) => {
                    const theme = getCategoryTheme(doc.category);
                    const isFav = favoriteIds.includes(doc.id);
                    return (
                      <tr 
                        key={doc.id} 
                        onClick={() => setSelectedDocForDetails(doc)}
                        className="hover:bg-emerald-500/5 transition-all duration-150 group cursor-pointer"
                      >
                        {/* Name Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient} text-white`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="max-w-xs sm:max-w-md md:max-w-lg truncate">
                              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 truncate group-hover:text-emerald-850 transition-colors" title={doc.fileName}>
                                {doc.fileName}
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[8px] font-bold tracking-widest uppercase border ${
                                  doc.visibility === 'PRIVATE'
                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                    : 'bg-sky-100 text-sky-800 border-sky-200'
                                }`}>
                                  {doc.visibility === 'PRIVATE' ? 'Privat' : 'Publik'}
                                </span>
                              </span>
                              <span className="text-[10px] text-emerald-800/50 hidden sm:block font-semibold truncate mt-0.5" title={doc.description}>
                                {doc.description || 'Tidak ada uraian deskripsi tambahan.'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Unit Column */}
                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-100/30">
                            {doc.institution}
                          </span>
                        </td>

                        {/* Category Column */}
                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wider uppercase ${theme.bg}`}>
                            <span className={`w-1 h-1 rounded-full ${theme.dot}`}></span>
                            {doc.category}
                          </span>
                        </td>

                        {/* Year Column */}
                        <td className="py-3.5 px-4 text-xs font-bold text-emerald-900 hidden sm:table-cell">
                          {doc.month} {doc.year}
                        </td>

                        {/* Size Column */}
                        <td className="py-3.5 px-4 text-xs font-mono font-bold text-emerald-800/70 hidden sm:table-cell">
                          {doc.fileSize}
                        </td>

                        {/* Uploader Column */}
                        <td className="py-3.5 px-4 text-xs font-semibold text-emerald-850 hidden lg:table-cell">
                          {doc.uploader.split(',')[0]}
                        </td>

                        {/* Actions Column */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Favorite toggle for Viewer in table row */}
                            {isViewer && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(doc.id);
                                }}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-400 hover:text-yellow-500 rounded-lg transition-colors cursor-pointer"
                                title={isFav ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
                              >
                                <Bookmark className={`w-4 h-4 ${isFav ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDocForDetails(doc);
                              }}
                              className="p-1.5 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-950 rounded-lg transition-colors cursor-pointer"
                              title="Rincian Berkas"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPdf(doc);
                              }}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer"
                            >
                              Buka
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDocument(doc);
                              }}
                              className="p-1.5 hover:bg-emerald-50 text-emerald-800/70 hover:text-emerald-950 rounded-lg transition-all cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {!isViewer && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(doc.id);
                                }}
                                className="p-1.5 hover:bg-red-50 text-emerald-300 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                                title="Delete Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {filteredDocs.length === 0 && (
          <div className="border border-dashed border-emerald-200/60 rounded-xl p-16 text-center soft-bg/50 backdrop-blur-xs flex flex-col items-center justify-center">
            <div className="p-4 bg-emerald-50 border border-emerald-100/40 text-emerald-200 rounded-xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <Folder className="w-7 h-7 text-emerald-400/60" />
            </div>
            <h3 className="text-xs font-bold text-emerald-950">Arsip Tidak Ditemukan</h3>
            <p className="text-[11px] text-emerald-800/50 font-bold mt-1 max-w-sm mx-auto leading-relaxed mb-4">
              {documents.length === 0
                ? 'Database arsip digital kosong atau gagal mengunduh data laporan lembaga unit.'
                : 'Tidak ditemukan laporan pertanggungjawaban dalam filter kombinasi terpilih atau kata pencari Anda.'}
            </p>
            <div className="flex items-center gap-2">
              {documents.length === 0 && (
                <button
                  onClick={handleTryAgain}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-4.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer animate-pulse"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
                </button>
              )}
              {explorerSearchQuery && (
                <button
                  onClick={() => setExplorerSearchQuery('')}
                  className="soft-bg border border-emerald-200 hover:bg-emerald-50 text-emerald-900 font-semibold px-4.5 py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          </div>
          )}

      </div>
    );
  };

  // View: QUICK SEARCH PANEL
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<string>('ALL');
  const [searchInstitution, setSearchInstitution] = useState<string>('ALL');
  const [searchYear, setSearchYear] = useState<string>('ALL');

  const renderSearchView = () => {
    const allowedDocs = getAllowedDocumentsForBrowsing();

    const results = allowedDocs.filter((doc) => {
      const matchesText =
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.uploader.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = searchCategory === 'ALL' ? true : doc.category === searchCategory;
      const matchesInst = searchInstitution === 'ALL' ? true : doc.institution === searchInstitution;
      const matchesYr = searchYear === 'ALL' ? true : doc.year === searchYear;

      return matchesText && matchesCat && matchesInst && matchesYr;
    });

    const isViewer = currentUser?.role === 'VIEWER';

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-emerald-950 flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-850" /> Pencarian Cepat Laporan
          </h2>
          <p className="text-xs text-emerald-800/60 font-semibold mt-0.5">
            Gunakan kotak pencari pintar ini untuk melacak file secara instan menggunakan kata kunci nama berkas atau uploader.
          </p>
        </div>

        {/* SEARCH BOX AND CONTROLS */}
        <div className="soft-card p-6 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-800/60 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Masukkan kata kunci nama laporan, uploader, atau deskripsi kegiatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="soft-input"
            />
          </div>

          {/* Quick filter row grids */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/60 block mb-1">Kategori</label>
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                disabled={currentUser?.role === 'ADMIN_SELAPANAN'}
                className="soft-input"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="KEUANGAN">KEUANGAN</option>
                <option value="KEGIATAN">KEGIATAN</option>
                <option value="SURAT">SURAT</option>
                <option value="DOKUMEN">DOKUMEN</option>
                <option value="LAINNYA">LAINNYA</option>
                <option value="SELAPANAN">SELAPANAN</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/60 block mb-1">Unit Yayasan</label>
              <select
                value={searchInstitution}
                onChange={(e) => setSearchInstitution(e.target.value)}
                disabled={!!getRoleInstitution(currentUser?.role || 'VIEWER') || currentUser?.role === 'ADMIN_SELAPANAN'}
                className="soft-input"
              >
                <option value="ALL">Semua Unit Lembaga</option>
                <option value="YPI">YPI (Pusat)</option>
                <option value="SMA">SMA</option>
                <option value="MTS">MTS</option>
                <option value="MADIN">MADIN</option>
                <option value="TK">TK</option>
                <option value="PESANTREN">PESANTREN</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/60 block mb-1">Tahun Buku</label>
              <select
                value={searchYear}
                onChange={(e) => setSearchYear(e.target.value)}
                className="soft-input"
              >
                <option value="ALL">Semua Tahun</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>
        </div>

        {/* RESULTS TABLE */}
        <div className="soft-bg/95 border border-emerald-100/60 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs ">
              <thead>
                <tr className="bg-[#fafcfb] text-emerald-800/80 font-bold border-b border-emerald-100/60">
                  <th className="p-4">Nama Dokumen Arsip</th>
                  <th className="p-4 hidden md:table-cell">Kategori</th>
                  <th className="p-4 w-[120px] hidden sm:table-cell">Periode Buku</th>
                  <th className="p-4 w-[110px] hidden sm:table-cell">Ukuran Berkas</th>
                  <th className="p-4 w-[120px] text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/30">
                {results.map((doc) => (
                  <tr 
                    key={doc.id} 
                    onClick={() => setSelectedDocForDetails(doc)}
                    className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
                  >
                    {/* Document details */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100/40 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                            {doc.fileName}
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[8px] font-bold tracking-widest uppercase border ${
                              doc.visibility === 'PRIVATE'
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : 'bg-sky-100 text-sky-800 border-sky-200'
                            }`}>
                              {doc.visibility === 'PRIVATE' ? 'Privat' : 'Publik'}
                            </span>
                          </p>
                          <p className="text-[10px] text-emerald-855/55 font-semibold hidden sm:block">Uploader: {doc.uploader}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category flag */}
                    <td className="p-4 hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100/50 text-[10px] font-bold tracking-wider uppercase">
                        {doc.category}
                      </span>
                    </td>

                    {/* Period year month */}
                    <td className="p-4 font-bold text-emerald-800/80 uppercase hidden sm:table-cell">
                      {doc.month} {doc.year}
                    </td>

                    {/* Size */}
                    <td className="p-4 font-mono font-semibold text-emerald-800/60 hidden sm:table-cell">
                      {doc.fileSize}
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocForDetails(doc);
                          }}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-950 rounded-lg transition-colors cursor-pointer"
                          title="Rincian Berkas"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPdf(doc);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded-lg transition-all cursor-pointer"
                          title="Open PDF"
                        >
                          Lihat
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadDocument(doc);
                          }}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-800/75 hover:text-emerald-950 rounded-lg transition-all cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-emerald-800/50">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-emerald-200" />
                      <p className="text-xs font-bold">Tidak ada arsip laporan yang cocok dengan filter pencarian.</p>
                      <p className="text-[11px] text-emerald-800/40 mt-0.5 font-semibold">Coba gunakan kata kunci uploader atau bulan yang lain.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  };

  // View: UPLOAD FILE FORM
  const [upCategory, setUpCategory] = useState<CategoryType>('KEUANGAN');
  const [upInstitution, setUpInstitution] = useState<InstitutionType>('SMA');
  const [upMonth, setUpMonth] = useState<string>('JANUARI');
  const [upYear, setUpYear] = useState<string>('2026');
  const [upDescription, setUpDescription] = useState('');
  const [upSelectedFile, setUpSelectedFile] = useState<File | null>(null);
  const [upDragOver, setUpDragOver] = useState(false);
  const [upVisibility, setUpVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [upSourceType, setUpSourceType] = useState<'FILE' | 'DRIVE_LINK'>('FILE');
  const [upDriveUrl, setUpDriveUrl] = useState('');
  const [upDriveUrlError, setUpDriveUrlError] = useState<string | null>(null);

  // Set default unit and category lock on mount for specific admins
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'ADMIN_SELAPANAN') {
        setUpCategory('SELAPANAN');
        setUpInstitution('YPI');
        setSearchCategory('SELAPANAN');
        setSearchInstitution('YPI');
      } else {
        const defaultInst = getRoleInstitution(currentUser.role);
        if (defaultInst) {
          setUpInstitution(defaultInst);
          setSearchInstitution(defaultInst);
        } else {
          setUpInstitution('YPI');
          setSearchInstitution('ALL');
        }
        setUpCategory('KEUANGAN');
        setSearchCategory('ALL');
      }
    }
  }, [currentUser]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setUpDragOver(true);
  };

  const handleDragLeave = () => {
    setUpDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUpDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setUpSelectedFile(file);
      } else {
        alert('Format file tidak didukung! Sistem ALD hanya menerima dokumen berformat Adobe PDF (.pdf).');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setUpSelectedFile(file);
      } else {
        alert('Harap pilih dokumen berekstensi Adobe PDF (.pdf) saja.');
      }
    }
  };

  const handleFormUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const autoName = generateFileName(upCategory, upInstitution, upMonth, upYear);

    if (upSourceType === 'DRIVE_LINK') {
      const parsed = parseGoogleDriveLink(upDriveUrl);
      if (!parsed) {
        setUpDriveUrlError('Tautan tidak valid. Pastikan Anda menempel tautan "Bagikan" dari Google Drive (drive.google.com/file/d/... atau docs.google.com/.../d/...).');
        return;
      }
      setUpDriveUrlError(null);

      (async () => {
        const success = await handleUploadDocument(
          {
            fileName: autoName,
            category: upCategory,
            institution: upInstitution,
            year: upYear,
            month: upMonth,
            description: upDescription.trim(),
            fileSize: 'Tautan Google Drive',
            visibility: upVisibility,
            sourceType: 'DRIVE_LINK',
            driveUrl: upDriveUrl.trim(),
            driveFileId: parsed.fileId
          },
          false
        );

        if (success) {
          setUpDescription('');
          setUpDriveUrl('');
          setUpVisibility('PUBLIC');
        }
      })();
      return;
    }

    if (!upSelectedFile) {
      alert('Anda belum melampirkan berkas fisik PDF! Harap pilih berkas terlebih dahulu.');
      return;
    }

    if (upSelectedFile.size > 20 * 1024 * 1024) { // 20 MB
      alert(`Gagal unggah! Ukuran berkas PDF Anda terlalu besar (${(upSelectedFile.size / (1024 * 1024)).toFixed(1)} MB). Sistem ALD membatasi ukuran unggahan dokumen fisik maksimal 20 MB agar dapat diarsipkan secara utuh. Jika berkas Anda lebih besar dari itu, gunakan opsi "Tautkan Google Drive" di atas.`);
      return;
    }

    // Read the file as Base64 Data URL
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      
      let finalSize = '';
      if (upSelectedFile.size >= 1024 * 1024) {
        finalSize = (upSelectedFile.size / (1024 * 1024)).toFixed(1) + ' MB';
      } else {
        finalSize = (upSelectedFile.size / 1024).toFixed(1) + ' KB';
      }

      const success = await handleUploadDocument(
        {
          fileName: autoName,
          category: upCategory,
          institution: upInstitution,
          year: upYear,
          month: upMonth,
          description: upDescription.trim(),
          fileSize: finalSize,
          fileData: base64Data,
          visibility: upVisibility,
          sourceType: 'FILE'
        },
        true
      );

      if (success) {
        // Reset forms
        setUpDescription('');
        setUpSelectedFile(null);
        setUpVisibility('PUBLIC');
      }
    };
    reader.onerror = () => {
      alert('Gagal membaca berkas PDF. Silakan coba kembali.');
    };
    reader.readAsDataURL(upSelectedFile);
  };

  const renderUploadView = (hideHeader = false) => {
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
    const institutionLocked = getRoleInstitution(currentUser?.role || 'VIEWER');
    
    // Auto generated filename preview based on metadata input
    const generatedNamePreview = generateFileName(upCategory, upInstitution, upMonth, upYear);

    const months = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ];
    const years = ['2026', '2025', '2024'];

    return (
      <div className="space-y-6">
        {!hideHeader && (
          <div>
            <h2 className="text-xl font-bold tracking-tight text-emerald-950 flex items-center gap-2">
              <FileUp className="w-5 h-5 text-emerald-850" /> Unggah & Arsipkan Laporan
            </h2>
            <p className="text-xs text-emerald-800/60 font-semibold mt-0.5">
              Pastikan berkas berformat PDF. Nama dokumen akan dibuat seragam otomatis oleh sistem sesuai format kesepakatan yayasan.
            </p>
          </div>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* UPLOAD FORM CONTROLS */}
          <form onSubmit={handleFormUploadSubmit} className="lg:col-span-7 soft-card p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 border-b border-emerald-100/40 pb-2 mb-2">
              Metadata Laporan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/60 block mb-1">Kategori Arsip *</label>
                <select
                  value={upCategory}
                  disabled={currentUser?.role === 'ADMIN_SELAPANAN'}
                  onChange={(e) => setUpCategory(e.target.value as CategoryType)}
                  className="soft-input"
                >
                  <option value="KEUANGAN">KEUANGAN (SPP, BOS, Kas)</option>
                  <option value="KEGIATAN">KEGIATAN (Proposal, LPJ)</option>
                  <option value="SURAT">SURAT RESMI (SK, Mandat)</option>
                  <option value="DOKUMEN">DOKUMEN (Sertifikasi, Akreditasi)</option>
                  <option value="LAINNYA">LAINNYA</option>
                  <option value="SELAPANAN">SELAPANAN (Pengajian / Kegiatan Rutin)</option>
                </select>
                {currentUser?.role === 'ADMIN_SELAPANAN' && (
                  <span className="text-[10px] text-emerald-800/40 font-bold mt-1 block leading-tight">
                    *Terkunci otomatis ke kategori Selapanan.
                  </span>
                )}
              </div>

              {/* Institution (Locked if unit admin, open if superadmin) */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/60 block mb-1">Unit Lembaga *</label>
                <select
                  value={upInstitution}
                  disabled={!!institutionLocked || currentUser?.role === 'ADMIN_SELAPANAN'}
                  onChange={(e) => setUpInstitution(e.target.value as InstitutionType)}
                  className="soft-input"
                >
                  <option value="YPI">YPI (Pusat / Yayasan)</option>
                  <option value="SMA">SMA Raudhotut Tholibin</option>
                  <option value="MTS">MTs Raudhotut Tholibin</option>
                  <option value="MADIN">Madrasah Diniyah (MADIN)</option>
                  <option value="TK">TK Raudhotut Tholibin</option>
                  <option value="PESANTREN">Pondok Pesantren</option>
                </select>
                {(institutionLocked || currentUser?.role === 'ADMIN_SELAPANAN') && (
                  <span className="text-[10px] text-emerald-800/40 font-bold mt-1 block leading-tight">
                    *Terkunci otomatis ke wewenang unit Anda.
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Month */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/60 block mb-1">Periode Bulan *</label>
                <select
                  value={upMonth}
                  onChange={(e) => setUpMonth(e.target.value)}
                  className="soft-input"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/60 block mb-1">Tahun Buku *</label>
                <select
                  value={upYear}
                  onChange={(e) => setUpYear(e.target.value)}
                  className="soft-input"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description details */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/60 block mb-1">Uraian / Deskripsi Tambahan (Opsional)</label>
              <textarea
                rows={3}
                placeholder="Tuliskan perincian singkat isi laporan (e.g., Laporan realisasi dana BOS tahap 1, gaji asatidz bulan Mei)..."
                value={upDescription}
                onChange={(e) => setUpDescription(e.target.value)}
                className="soft-input"
              />
            </div>

            {/* Visibilitas Laporan */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/60 block mb-1.5">Akses Visibilitas / Privasi Dokumen *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUpVisibility('PUBLIC')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    upVisibility === 'PUBLIC'
                      ? 'bg-emerald-50/85 border-emerald-500/80 text-emerald-950 ring-2 ring-emerald-500/10'
                      : 'soft-bg/40 border-emerald-100/60 text-stone-500 hover:soft-bg/80'
                  }`}
                >
                  <span className="font-semibold text-xs">🌐 Publik</span>
                  <span className="text-[10px] text-stone-400 font-medium">Bisa diakses Viewer & Yayasan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUpVisibility('PRIVATE')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    upVisibility === 'PRIVATE'
                      ? 'bg-purple-50/85 border-purple-500/80 text-purple-950 ring-2 ring-purple-500/10'
                      : 'soft-bg/40 border-emerald-100/60 text-stone-500 hover:soft-bg/80'
                  }`}
                >
                  <span className="font-semibold text-xs">🔒 Privat</span>
                  <span className="text-[10px] text-stone-400 font-medium">Hanya Unit Anda & Super Admin</span>
                </button>
              </div>
            </div>

            {/* Sumber Dokumen: Unggah Berkas vs Tautkan Google Drive */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/60 block mb-1.5">Sumber Dokumen *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { setUpSourceType('FILE'); setUpDriveUrlError(null); }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    upSourceType === 'FILE'
                      ? 'bg-emerald-50/85 border-emerald-500/80 text-emerald-950 ring-2 ring-emerald-500/10'
                      : 'soft-bg/40 border-emerald-100/60 text-stone-500 hover:soft-bg/80'
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  <span className="font-semibold text-xs">Unggah Berkas PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsScannerModalOpen(true)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800"
                >
                  <Camera className="w-4 h-4 text-[#ffb300]" />
                  <span className="font-semibold text-xs">Pindai Kamera</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUpSourceType('DRIVE_LINK')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    upSourceType === 'DRIVE_LINK'
                      ? 'bg-sky-50/85 border-sky-500/80 text-sky-950 ring-2 ring-sky-500/10'
                      : 'soft-bg/40 border-emerald-100/60 text-stone-500 hover:soft-bg/80'
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  <span className="font-semibold text-xs">Tautkan Google Drive</span>
                </button>
              </div>
            </div>

            {upSourceType === 'FILE' ? (
              /* Drag & Drop PDF upload zone */
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/60 block mb-1">Dokumen Fisik PDF *</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    upDragOver
                      ? 'border-yellow-400 bg-yellow-50/10'
                      : upSelectedFile
                      ? 'border-emerald-400 bg-emerald-50/10'
                      : 'border-emerald-100/60 hover:border-emerald-300 soft-bg'
                  }`}
                >
                  <input
                    type="file"
                    id="up_file_input"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {upSelectedFile ? (
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-800 border border-emerald-200/50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-950 truncate max-w-xs mx-auto">
                          {upSelectedFile.name}
                        </p>
                        <p className="text-[10px] text-emerald-800/50 font-mono font-bold">
                          {(upSelectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUpSelectedFile(null)}
                        className="text-[10px] font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Hapus Lampiran
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="up_file_input" className="cursor-pointer space-y-2 block">
                      <div className="w-10 h-10 bg-emerald-100/40 text-emerald-850 rounded-full flex items-center justify-center mx-auto">
                        <FileUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900">
                          Seret berkas PDF ke sini atau <span className="text-emerald-700 hover:underline">Pilih Berkas</span>
                        </p>
                        <p className="text-[10px] text-emerald-800/40 mt-1 font-semibold">Maksimum ukuran dokumen: 100 MB (.pdf)</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            ) : (
              /* Google Drive link attachment */
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/60 block mb-1">Tautan Berbagi Google Drive *</label>
                <div className={`border-2 rounded-xl p-5 transition-all ${
                  upDriveUrlError ? 'border-red-300 bg-red-50/30' : 'border-sky-100 bg-sky-50/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <input
                      type="url"
                      inputMode="url"
                      value={upDriveUrl}
                      onChange={(e) => { setUpDriveUrl(e.target.value); if (upDriveUrlError) setUpDriveUrlError(null); }}
                      placeholder="https://drive.google.com/file/d/xxxxxxxxxxxx/view?usp=sharing"
                      className="flex-1 soft-bg border border-sky-200/70 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-sky-950 focus:outline-none focus:border-sky-500 transition-all"
                    />
                  </div>
                  {upDriveUrlError ? (
                    <p className="text-[10px] font-bold text-red-600 mt-2.5 pl-13 leading-relaxed">{upDriveUrlError}</p>
                  ) : (
                    <p className="text-[10px] text-sky-800/60 font-semibold mt-2.5 pl-13 leading-relaxed">
                      Pastikan akses berbagi file diatur ke <span className="font-semibold">"Siapa saja yang memiliki link"</span> di Google Drive, agar dokumen dapat dibuka oleh pengguna lain di sistem ALD.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Form actions */}
            <div className="border-t border-emerald-100/40 pt-4 flex items-center justify-end">
              <button
                type="submit"
                className="soft-button-primary px-5 py-2.5 rounded-xl text-xs font-semibold  transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-100" /> Simpan & Arsipkan Dokumen
              </button>
            </div>

          </form>

          {/* DYNAMIC AUTO-GENERATING FILENAME PREVIEW */}
          <div className="lg:col-span-5 soft-bg border border-emerald-200/40 text-emerald-950 rounded-xl p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Automated Filename Preview</h4>
            <p className="text-[11px] text-emerald-800/80 leading-relaxed font-semibold">
              Sistem akan merubah nama file fisik secara standar untuk kerapian pengarsipan yayasan.
            </p>

            <div className="soft-bg border border-emerald-100 p-4 rounded-xl space-y-3 font-mono">
              <div>
                <span className="text-[8px] font-bold text-emerald-700/60 uppercase tracking-widest block">
                  {upSourceType === 'DRIVE_LINK' ? 'Tautan Google Drive' : 'Input File Asli'}
                </span>
                <span className="text-[10px] text-slate-600 block truncate italic">
                  {upSourceType === 'DRIVE_LINK'
                    ? (upDriveUrl || 'belum ada tautan ditempel')
                    : (upSelectedFile ? upSelectedFile.name : 'belum_ada_file_terpilih.pdf')}
                </span>
              </div>
              <div className="border-t border-emerald-100 pt-2.5">
                <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-widest block">Nama File Baru Hasil Pengarsipan</span>
                <span className="text-xs font-bold text-emerald-900 block break-words mt-1">
                  {generatedNamePreview}
                </span>
              </div>
            </div>

            <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-100/50 text-[10px] text-emerald-800/80 space-y-2 leading-relaxed">
              <p className="font-bold text-emerald-950">ℹ️ Penjelasan Formula Standar:</p>
              <ul className="list-disc pl-4 space-y-1 font-semibold">
                <li>[KATEGORI] = {upCategory}</li>
                <li>[LEMBAGA] = {upInstitution}</li>
                <li>[BULAN] = {upMonth}</li>
                <li>[TAHUN] = {upYear}</li>
              </ul>
            </div>
          </div>

        </div>

      </div>
    );
  };

  // View: FAVORITE FILE MANAGER (PRD special Viewer view!)
  const renderFavoritesView = () => {
    const isViewer = currentUser?.role === 'VIEWER';
    if (!isViewer) return null;

    const favDocs = documents.filter((doc) => favoriteIds.includes(doc.id));

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-emerald-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" /> Berkas Laporan Favorit Anda
          </h2>
          <p className="text-xs text-emerald-800/60 font-semibold mt-0.5">
            Daftar pintasan cepat berkas laporan penting yang sering Anda akses secara berkala.
          </p>
        </div>

        {/* Favorite Document Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favDocs.map((doc) => (
            <div
              key={doc.id}
              className="soft-card soft-card-hover p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100/50 text-[10px] font-bold tracking-wider uppercase">
                    {doc.institution}
                  </span>
                  <button
                    onClick={() => toggleFavorite(doc.id)}
                    className="p-1.5 hover:bg-emerald-50 text-yellow-500 rounded-lg transition-colors cursor-pointer"
                    title="Hapus dari Favorit"
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500" />
                  </button>
                </div>

                <h3 className="text-xs font-bold text-emerald-950 truncate">{doc.fileName}</h3>
                <p className="text-[11px] text-emerald-800/70 italic mt-1.5 line-clamp-2 h-8">"{doc.description}"</p>
              </div>

              <div className="border-t border-emerald-100/40 pt-3 mt-4 flex items-center justify-between">
                <span className="text-[10px] text-emerald-800/50 font-semibold">{doc.month} {doc.year}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenPdf(doc)}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" /> Buka
                  </button>
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="p-1.5 hover:bg-emerald-50 text-emerald-850 rounded-lg transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}

          {favDocs.length === 0 && (
            <div className="col-span-full border border-dashed border-emerald-200 rounded-xl p-12 text-center soft-bg/50">
              <Sparkles className="w-12 h-12 text-emerald-200 mx-auto mb-2" />
              <h3 className="text-xs font-bold text-emerald-800">Daftar Favorit Masih Kosong</h3>
              <p className="text-[11px] text-emerald-800/50 mt-0.5">Silakan telusuri Arsip Explorer dan beri tanda bintang pada berkas yang Anda butuhkan.</p>
            </div>
            )}
        </div>

      </div>
    );
  };

  // View: ANNOUNCEMENTS MANAGEMENT (Admins / SuperAdmin)
  const renderAnnouncementsView = (hideHeader = false) => {
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    return (
      <div className="space-y-6">
        {!hideHeader ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-emerald-950 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-850" /> Pengumuman Resmi Pengurus
              </h2>
              <p className="text-xs text-emerald-800/60 font-semibold mt-0.5">
                Daftar instruksi resmi yang disiarkan kepada operator unit lembaga Raudhotut Tholibin.
              </p>
            </div>

            {currentUser?.role !== 'VIEWER' && (
              <button
                onClick={() => {
                  setEditingAnnId(null);
                  setAnnTitle('');
                  setAnnContent('');
                  setAnnPriority('NORMAL');
                  setAnnTarget('ALL');
                  setAnnVisibility('PUBLIC');
                  setAnnAttachment(null);
                  setShowAnnModal(true);
                }}
                className="soft-button-primary px-4 py-2.5 flex items-center gap-2 text-xs font-bold self-end sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Buat Pengumuman Baru
              </button>
            )}
          </div>
        ) : (
          currentUser?.role !== 'VIEWER' && (
            <div className="flex justify-end pb-2">
              <button
                onClick={() => {
                  setEditingAnnId(null);
                  setAnnTitle('');
                  setAnnContent('');
                  setAnnPriority('NORMAL');
                  setAnnTarget('ALL');
                  setAnnVisibility('PUBLIC');
                  setAnnAttachment(null);
                  setShowAnnModal(true);
                }}
                className="soft-button-primary w-full sm:w-auto px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Buat Pengumuman Baru
              </button>
            </div>
          )
        )}

        {/* ANNOUNCEMENT ROW LIST */}
        <div className="space-y-4">
          {activeAnnouncements.map((ann) => {
            const canManage = isSuperAdmin || (currentUser?.role !== 'VIEWER' && ann.createdByUsername === currentUser?.username);
            const creator = users.find((u) => u.username === ann.createdByUsername) || 
                            users.find((u) => u.role === 'SUPER_ADMIN') || 
                            users.find((u) => u.username === 'admin');
            const creatorName = creator ? creator.name : (ann.createdBy || 'Muhammad Alwi Nidzam');
            const isPrivate = ann.visibility === 'PRIVATE';
            return (
              <div
                key={ann.id}
                className="border border-emerald-100/60 soft-bg/95 rounded-xl p-5  transition-all relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-yellow-100 text-yellow-800 font-semibold tracking-widest text-[8px] px-2 py-0.5 rounded-lg uppercase">
                        {ann.priority}
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 font-bold tracking-widest text-[8px] px-2 py-0.5 rounded-lg uppercase border border-emerald-100/40">
                        Target: {ann.targetRole === 'ALL' ? 'Semua Unit' : ann.targetRole}
                      </span>
                      <span className={`font-bold tracking-widest text-[8px] px-2 py-0.5 rounded-lg uppercase border ${
                        isPrivate
                          ? 'bg-purple-50 text-purple-800 border-purple-200/50'
                          : 'bg-sky-50 text-sky-800 border-sky-100/50'
                      }`}>
                        {isPrivate ? 'Privat' : 'Publik'}
                      </span>
                      <h3 className="text-xs font-bold text-emerald-950 leading-snug">{ann.title}</h3>
                    </div>

                    <p className="text-xs text-emerald-850/80 font-semibold leading-relaxed max-w-2xl">
                      {ann.content}
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => {
                          setSelectedAnnDetail(ann);
                          setAnnDetailBackView('announcements');
                          setCurrentView('announcement-detail');
                        }}
                        className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-855 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide border border-emerald-100/40 cursor-pointer transition-all active:scale-95"
                      >
                        {ann.attachment ? <Paperclip className="w-3.5 h-3.5 text-emerald-700" /> : <Bell className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />}
                        {ann.attachment ? 'Buka Detail & Lampiran' : 'Buka Detail Pengumuman'}
                      </button>
                    </div>

                    <div className="text-[10px] text-emerald-800/40 font-bold flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-emerald-50">
                      <span>Dibuat Oleh: <span className="text-emerald-850 font-semibold">{creatorName}</span></span>
                      {ann.createdAt && (
                        <span>Dibuat Pada: <span className="text-emerald-850 font-semibold">{new Date(ann.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).replace(/:/g, '.')}</span></span>
                      )}
                      {ann.updatedBy && (
                        <span>Diperbarui Oleh: <span className="text-emerald-850 font-semibold">{ann.updatedBy}</span></span>
                      )}
                      {ann.updatedAt && (
                        <span>Diperbarui Pada: <span className="text-emerald-850 font-semibold">{new Date(ann.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).replace(/:/g, '.')}</span></span>
                      )}
                      <span>•</span>
                      <span>Periode Aktif: {ann.startDate} s.d. {ann.endDate}</span>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEditAnnouncement(ann)}
                        className="p-1.5 hover:bg-emerald-50 text-emerald-400 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                        title="Edit Pengumuman"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1.5 hover:bg-red-50 text-emerald-300 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Pengumuman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    )}
                </div>
              </div>
            );
          })}

          {activeAnnouncements.length === 0 && (
            <div className="border border-dashed border-emerald-200 rounded-xl p-12 text-center soft-bg/50">
              <Bell className="w-12 h-12 text-emerald-200 mx-auto mb-2" />
              <p className="text-xs font-bold text-emerald-800">Belum ada pengumuman penyusunan berkas.</p>
            </div>
            )}
        </div>

        {/* --- ADD/EDIT ANNOUNCEMENT MODAL --- */}
        {showAnnModal && (
          <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="soft-bg border border-emerald-100/50 rounded-xl w-full max-w-md p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-emerald-100/40 pb-3 mb-4">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-850" /> {editingAnnId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                </h3>
                <button onClick={() => setShowAnnModal(false)} className="text-emerald-400 hover:text-emerald-600 p-1 rounded-lg cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block mb-1">Judul Pengumuman *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Batas Akhir LPJ Dana BOS SMA"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="soft-input"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block mb-1">Isi Pesan Pengumuman *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tuliskan petunjuk rinci untuk operator..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="soft-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block mb-1">Prioritas Penting</label>
                    <select
                      value={annPriority}
                      onChange={(e) => setAnnPriority(e.target.value as any)}
                      className="soft-input"
                    >
                      <option value="LOW">LOW (Rendah)</option>
                      <option value="NORMAL">NORMAL</option>
                      <option value="HIGH">HIGH (Tinggi)</option>
                      <option value="URGENT">URGENT (Penting)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block mb-1">Target Pengguna</label>
                    <select
                      value={annTarget}
                      onChange={(e) => setAnnTarget(e.target.value as any)}
                      className="soft-input"
                    >
                      <option value="ALL">ALL (Seluruh Pengguna)</option>
                      <option value="ADMIN_SMA">Hanya Operator SMA</option>
                      <option value="ADMIN_MTS">Hanya Operator MTS</option>
                      <option value="VIEWER">Hanya Viewer Eksternal</option>
                    </select>
                  </div>
                </div>

                <div className="soft-bg/30 border border-emerald-100/30 rounded-xl p-3.5 space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block">Lampiran Dokumen (Pilihan: PDF, JPG, PNG)</label>
                  
                  {annAttachment ? (
                    <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100/60 rounded-xl px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Paperclip className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="font-bold text-emerald-950 truncate max-w-[200px]" title={annAttachment.name}>{annAttachment.name}</span>
                        <span className="text-[10px] text-stone-400 font-semibold shrink-0">({annAttachment.fileSize})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAnnAttachment(null)}
                        className="text-red-500 hover:text-red-700 font-bold text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-lg hover:bg-red-50 transition-all cursor-pointer shrink-0 active:scale-95"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="announcement-file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleAnnFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="announcement-file"
                        className="flex items-center gap-2 justify-center py-2.5 px-4 border border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl bg-emerald-50/10 hover:bg-emerald-50/30 text-emerald-850 font-bold text-xs cursor-pointer transition-all active:scale-95"
                      >
                        <Paperclip className="w-4 h-4 text-emerald-700" />
                        Pilih Lampiran Berkas
                      </label>
                      <p className="text-[10px] text-stone-400/80 font-bold mt-1 text-center">Format yang didukung: PDF, JPG, PNG (maksimal 5MB).</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block mb-1.5">Visibilitas Pengumuman</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAnnVisibility('PUBLIC')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        annVisibility === 'PUBLIC'
                          ? 'bg-emerald-50/85 border-emerald-500/80 text-emerald-950 ring-2 ring-emerald-500/10'
                          : 'soft-bg/40 border-emerald-100/60 text-stone-500 hover:soft-bg/80'
                      }`}
                    >
                      <span className="font-semibold text-xs">🌐 Publik</span>
                      <span className="text-[10px] text-stone-400 font-medium">Sesuai unit target</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnnVisibility('PRIVATE')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        annVisibility === 'PRIVATE'
                          ? 'bg-purple-50/85 border-purple-500/80 text-purple-950 ring-2 ring-purple-500/10'
                          : 'soft-bg/40 border-emerald-100/60 text-stone-500 hover:soft-bg/80'
                      }`}
                    >
                      <span className="font-semibold text-xs">🔒 Privat</span>
                      <span className="text-[10px] text-stone-400 font-medium">Hanya Anda & Admin</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-emerald-100/40 pt-4 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAnnModal(false)}
                    className="px-4 py-2 border border-emerald-100 hover:bg-emerald-50 rounded-xl text-xs font-bold text-emerald-850 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="soft-button-primary px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    Siarkan Pengumuman
                  </button>
                </div>
              </form>
            </div>
          </div>
          )}

      </div>
    );
  };

  // View: APP SETTINGS, SUPPORT INFO, AND SUPPORT MANUALS
  const renderSettingsView = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-emerald-950 flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-850" /> Informasi Sistem & Panduan Manual ALD
          </h2>
          <p className="text-xs text-emerald-800/60 font-semibold mt-0.5">
            Dokumentasi rujukan, hak cipta, serta panduan lengkap cara pengoperasian aplikasi ALD Raudhotut Tholibin.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Support documentation block */}
          <div className="lg:col-span-8 soft-card p-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase text-emerald-950 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-850" /> Panduan Singkat Penamaan & Metadata
              </h3>
              <p className="text-xs text-emerald-800/80 leading-relaxed font-semibold">
                Penyusunan berkas laporan digital dirancang terstruktur secara terpusat untuk menjaga kredibilitas pelaporan internal yayasan. Di bawah ini adalah prosedur yang wajib ditaati:
              </p>
              <ol className="list-decimal pl-5 text-xs text-emerald-800/70 space-y-2 font-semibold">
                <li>
                  <strong className="text-emerald-950">Format File Fisik:</strong> Dokumen yang sah hanyalah berekstensi <span className="font-mono bg-emerald-50 border border-emerald-100/30 px-1.5 py-0.5 rounded text-[11px] font-semibold text-emerald-900">.pdf</span> dengan scan resolusi optimal 150 - 300 DPI (terang, terbaca, dan tidak pecah).
                </li>
                <li>
                  <strong className="text-emerald-950">Penyatuan Halaman:</strong> Laporan pertanggungjawaban beserta seluruh lampiran kuitansi/bukti transaksi wajib digabungkan dalam satu file PDF tunggal (tidak terpisah-pisah).
                </li>
                <li>
                  <strong className="text-emerald-950">Penamaan Otomatis:</strong> Operator lembaga dilarang merubah nama file manual secara acak. Cukup isikan metadata dengan benar, maka sistem ALD akan langsung menamai berkas tersebut secara seragam.
                </li>
              </ol>
            </div>

            <div className="border-t border-emerald-100/40 pt-6 space-y-3">
              <h3 className="text-sm font-bold uppercase text-emerald-950 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-850" /> Matriks Otorisasi Pengguna (Role Permission)
              </h3>
              <p className="text-xs text-emerald-800/80 leading-relaxed font-semibold">
                Setiap akun diidentifikasi berdasar unit kerjanya masing-masing untuk mengeliminasi potensi kebocoran laporan keuangan sensitif:
              </p>
              <ul className="list-disc pl-5 text-xs text-emerald-800/70 space-y-1.5 font-semibold">
                <li><strong className="text-emerald-950">Super Admin (Yayasan Pusat):</strong> Memiliki wewenang mutlak mencakup pendaftaran operator baru, pengumuman siaran, melihat seluruh arsip unit, audit system, serta penghapusan berkas.</li>
                <li><strong className="text-emerald-950">Admin Unit Lembaga (e.g., Admin SMA, MTs):</strong> Hanya dapat mengunggah berkas untuk unitnya sendiri. Berkas milik unit lain terkunci dari modifikasi maupun penghapusan.</li>
                <li><strong className="text-emerald-950">Viewer Utama (Yayasan Pengawas):</strong> Hanya diizinkan membaca, mencari, melakukan unduh laporan tanpa hak memodifikasi atau menghapus berkas.</li>
              </ul>
            </div>
          </div>

          {/* Credits and specs */}
          <div className="lg:col-span-4 soft-bg border border-emerald-200/30 text-emerald-950 rounded-xl p-6 space-y-5">
            <h4 className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Spesifikasi Sistem ALD</h4>

            <div className="space-y-3.5 text-xs font-mono">
              <div className="border-b border-emerald-100 pb-2 flex items-center justify-between text-emerald-800">
                <span>Versi Aplikasi</span>
                <span className="font-bold text-emerald-950">v1.0.0 Production</span>
              </div>
              <div className="border-b border-emerald-100 pb-2 flex items-center justify-between text-emerald-800">
                <span>Mesin Database</span>
                <span className="font-bold text-emerald-950">Cloud Firestore API</span>
              </div>
              <div className="border-b border-emerald-100 pb-2 flex items-center justify-between text-emerald-800">
                <span>Sertifikasi Enkripsi</span>
                <span className="font-bold text-emerald-700">TLS 1.3 Certified</span>
              </div>
              <div className="border-b border-emerald-100 pb-2 flex items-center justify-between text-emerald-800">
                <span>Git.Repository by.</span>
                <span className="font-bold text-emerald-950 text-right">wiu</span>
              </div>
              <div className="pt-2 flex items-center justify-between text-emerald-700 text-[10px]">
                <span>Tahun Rilis</span>
                <span>Juni 2026</span>
              </div>
            </div>

            <div className="soft-bg/80 border border-emerald-100/50 p-4 rounded-xl text-[10px] text-emerald-800/80 leading-relaxed space-y-1">
              <p className="font-bold text-emerald-950">© 2026 Yayasan Pendidikan Islam Raudhotut Tholibin.</p>
              <p>Seluruh hak cipta dilindungi undang-undang. Sistem arsip digital ini hanya ditujukan untuk keperluan internal lembaga.</p>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // View: USER PROFILE CONFIGURATION & QUOTA TRACKER
  const renderProfileView = () => {
    if (!currentUser) return null;

    const today = getTodayDateString();
    const currentUploadCount = (currentUser.lastActionResetDate === today) ? (currentUser.dailyUploadCount || 0) : 0;
    const maxUploads = currentUser.role === 'SUPER_ADMIN' ? 100 : 10;
    const isCloseToLimit = currentUser.role !== 'SUPER_ADMIN' && currentUploadCount >= 8;

    const userInitials = profileName
      ? profileName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : 'U';

    const handlePresetAvatar = (color: string) => {
      const initialsSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${color}"/>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">${userInitials}</text>
      </svg>`;
      setProfilePhoto(`data:image/svg+xml;utf8,${encodeURIComponent(initialsSvg)}`);
    };

    const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
          alert('Format berkas tidak didukung! Pastikan Anda memilih file gambar (.png, .jpg, .jpeg).');
          return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
          const result = event.target?.result as string;
          try {
            const compressed = await compressBase64Image(result);
            setProfilePhoto(compressed);
          } catch (err) {
            console.error('Failed to compress avatar:', err);
            setProfilePhoto(result);
          }
        };
        reader.readAsDataURL(file);
      }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profileName.trim()) {
        alert('Nama lengkap tidak boleh kosong.');
        return;
      }

      setIsSavingProfile(true);

      try {
        // Double check and compress the photoURL before saving to avoid Firestore payload limits
        const finalPhoto = await compressBase64Image(profilePhoto);

        const updatedUser: User = {
          ...currentUser,
          name: profileName.trim(),
          contact: profileContact.trim(),
          photoURL: finalPhoto
        };

        await dbSaveUser(updatedUser);

        // Update local session & parent users state list
        setCurrentUser(updatedUser);
        localStorage.setItem('ald_current_session', JSON.stringify(updatedUser));
        setUsers((prev) => prev.map((u) => (u.id === currentUser.id || u.username === currentUser.username ? updatedUser : u)));

        await logAction(
          currentUser.username,
          updatedUser.name,
          currentUser.role,
          'EDIT_PROFILE',
          `Memperbarui profil pribadi: Nama baru "${updatedUser.name}", Kontak: "${updatedUser.contact}"`
        );

        alert('Berhasil! Profil pribadi Anda telah sukses diperbarui dan disinkronisasikan ke sistem.');
      } catch (err) {
        console.error('Failed to update profile:', err);
        alert('Gagal memperbarui profil. Harap periksa jaringan Anda.');
      } finally {
        setIsSavingProfile(false);
      }
    };

    const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!oldPassword || !newPassword || !confirmPassword) {
        alert('Semua kolom kata sandi harus diisi.');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        alert('Kata sandi baru dan konfirmasi kata sandi tidak cocok.');
        return;
      }
      
      if (newPassword.length < 6) {
        alert('Kata sandi baru minimal 6 karakter.');
        return;
      }

      setIsChangingPassword(true);

      try {
        // Verify old password
        const oldHashed = hashPassword(oldPassword);
        if (oldHashed !== currentUser.passwordHash) {
          alert('Kata sandi lama yang Anda masukkan salah.');
          setIsChangingPassword(false);
          return;
        }

        const newHashed = hashPassword(newPassword);
        const updatedUser: User = {
          ...currentUser,
          passwordHash: newHashed
        };

        await dbSaveUser(updatedUser);
        
        // Update local session
        setCurrentUser(updatedUser);
        localStorage.setItem('ald_current_session', JSON.stringify(updatedUser));
        setUsers((prev) => prev.map((u) => (u.id === currentUser.id || u.username === currentUser.username ? updatedUser : u)));

        await logAction(
          currentUser.username,
          updatedUser.name,
          currentUser.role,
          'RESET_PASSWORD',
          `Mengubah kata sandi secara mandiri`
        );

        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        alert('Kata sandi Anda telah berhasil diubah.');
      } catch (err) {
        console.error('Failed to update password:', err);
        alert('Gagal memperbarui kata sandi. Harap periksa jaringan Anda.');
      } finally {
        setIsChangingPassword(false);
      }
    };

    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-emerald-950 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-emerald-850" /> Pengaturan Profil Operator
          </h2>
          <p className="text-xs text-emerald-800/60 font-semibold mt-0.5">
            Kelola nama lengkap terdaftar, informasi kontak Whatsapp, serta visual foto profil Anda secara aman.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* PROFILE FORM PANEL */}
          <form onSubmit={handleProfileSubmit} className="lg:col-span-7 soft-card p-6 space-y-6">
            
            {/* Photo Avatar Editor */}
            <div className="space-y-4">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block">Foto Profil Anda</label>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="relative shrink-0 group">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Avatar"
                      className="relative w-20 h-20 rounded-xl object-cover border-2 border-emerald-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="relative w-20 h-20 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-2xl border-2 border-emerald-100 shrink-0 uppercase">
                      {userInitials}
                    </div>
                    )}
                  {profilePhoto && (
                    <button
                      type="button"
                      onClick={() => setProfilePhoto('')}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full z-10 transition-transform active:scale-90"
                      title="Hapus foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <p className="text-[11px] text-slate-500 font-semibold leading-normal">
                    Pilih warna inisial instan di bawah ini atau unggah foto asli Anda sendiri (maksimal 1 MB).
                  </p>
                  
                  {/* Preset Colors */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => handlePresetAvatar('#059669')} className="w-6 h-6 rounded-lg bg-[#059669] hover:scale-110 active:scale-95 transition-transform" title="Emerald" />
                    <button type="button" onClick={() => handlePresetAvatar('#2563eb')} className="w-6 h-6 rounded-lg bg-[#2563eb] hover:scale-110 active:scale-95 transition-transform" title="Blue" />
                    <button type="button" onClick={() => handlePresetAvatar('#7c3aed')} className="w-6 h-6 rounded-lg bg-[#7c3aed] hover:scale-110 active:scale-95 transition-transform" title="Violet" />
                    <button type="button" onClick={() => handlePresetAvatar('#d97706')} className="w-6 h-6 rounded-lg bg-[#d97706] hover:scale-110 active:scale-95 transition-transform" title="Amber" />
                    <button type="button" onClick={() => handlePresetAvatar('#dc2626')} className="w-6 h-6 rounded-lg bg-[#dc2626] hover:scale-110 active:scale-95 transition-transform" title="Rose" />
                    <button type="button" onClick={() => handlePresetAvatar('#0891b2')} className="w-6 h-6 rounded-lg bg-[#0891b2] hover:scale-110 active:scale-95 transition-transform" title="Cyan" />
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                      id="profile_photo_upload"
                    />
                    <label
                      htmlFor="profile_photo_upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                    >
                      <FileUp className="w-3.5 h-3.5" /> Pilih File Gambar
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block mb-1">Nama Pengguna *</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Alwi Nidzam"
                  className="soft-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block mb-1">ID Operator / Username</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.username}
                    className="w-full soft-bg/50 border border-emerald-100/40 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-800/60 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block mb-1">Kontak Whatsapp / HP</label>
                  <input
                    type="text"
                    value={profileContact}
                    onChange={(e) => setProfileContact(e.target.value)}
                    placeholder="e.g. 081234567890"
                    className="soft-input"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-emerald-100/40 pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="soft-button-primary px-5 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>

          {/* USER SYSTEM ROLE & CAPABILITY INFO PANEL */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Active System Role Card */}
            <div className="soft-card p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-700/10 rounded-xl border border-emerald-700/10 text-emerald-800">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Status & Hak Akses</h3>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/10 uppercase mt-0.5 inline-block">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-4 font-sans text-xs">
                <div className="soft-bg/80 p-4 border border-emerald-100/60 rounded-xl space-y-2.5 leading-relaxed text-slate-600">
                  <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                    ⚡ Kapasitas Unggah Bebas Limit
                  </p>
                  <p className="font-medium">
                    Sistem ALD <span className="font-bold text-emerald-800">tidak membatasi jumlah maksimum berkas unggahan harian Anda</span>. Anda memiliki keleluasaan penuh untuk mengunggah laporan pertanggungjawaban kapan pun dibutuhkan demi kelancaran administrasi yayasan.
                  </p>
                </div>

                <div className="soft-bg/80 p-4 border border-emerald-100/60 rounded-xl space-y-2.5 leading-relaxed text-slate-600">
                  <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                    🛡️ Tingkat Kredensial Keamanan
                  </p>
                  <p className="font-medium">
                    Sesuai dengan peran Anda sebagai <span className="font-bold text-emerald-800 uppercase">{currentUser.role.replace('_', ' ')}</span>, sistem akan menyaring visibilitas dokumen untuk melindungi kerahasiaan keuangan antar unit lembaga.
                  </p>
                </div>
              </div>
            </div>

            {/* Change Password Panel */}
            <form onSubmit={handlePasswordChangeSubmit} className="soft-card p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase text-emerald-950 flex items-center gap-1.5"><Lock className="w-4 h-4 text-emerald-850" /> Ubah Kata Sandi</h4>
              <p className="text-[11px] text-emerald-800/70 leading-relaxed font-semibold">
                Anda dapat mengubah kata sandi Anda sendiri. Jika Anda lupa kata sandi lama Anda, silakan hubungi Administrator Yayasan.
              </p>
              
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block mb-1">Kata Sandi Lama</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="soft-input"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block mb-1">Kata Sandi Baru</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="soft-input"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-850/60 block mb-1">Konfirmasi Kata Sandi Baru</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="soft-input"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full text-center py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isChangingPassword ? 'Mengubah...' : 'Ganti Kata Sandi'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    );
  };

  // View: PUBLIC ANONYMOUS GREETING / LOGIN GATE
  if (!currentUser) {
    return (
      <div
        id="login_root"
        className="min-h-screen flex flex-col justify-between select-none font-sans relative overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.45), rgba(4, 63, 47, 0.75)), url('https://lh3.googleusercontent.com/d/1h5-p31QCVcXS6XzgK5xHCtWNk2WmzxsB')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Decorative Top header */}
        <header className="py-4 px-6 shrink-0 border-b border-white/10 soft-bg/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={ypiLogo}
                alt="Logo YPI"
                className="w-10 h-10 object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-[10px] text-emerald-800 font-bold tracking-wider uppercase leading-none">
                  Arsip YPI
                </p>
                <h1 className="text-sm sm:text-base font-bold text-emerald-950 tracking-wide uppercase leading-tight mt-1">
                  YPI RAUDHOTUT THOLIBIN
                </h1>
              </div>
            </div>
            <span className="hidden sm:inline text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100/40">
              SISTEM ARSIP YPI
            </span>
          </div>
        </header>

        {/* Center Card */}
        <main className="flex-1 flex items-center justify-center p-4 animate-login-entry">
          <div className="relative w-full max-w-md rounded-2xl border border-white/20 p-6 sm:p-8 shadow-none isolate overflow-hidden">
            {/* Layer 1: Isolated Backdrop Blur Glass Surface (Background layer only) */}
            <div
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-xl pointer-events-none -z-10 rounded-2xl"
              style={{ transform: 'translateZ(0)' }}
            />

            {/* Layer 2: Foreground Content Layer (Completely decoupled from backdrop-filter) */}
            <div className="relative z-10 space-y-6">
              {/* Intro text */}
              <div className="text-center space-y-1">
                <h1 className="text-lg font-bold tracking-tight text-white uppercase">
                  Login User
                </h1>
              </div>

              {/* Error alerts */}
              {loginError && (
                <div className="bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-semibold p-3.5 rounded-xl flex gap-2.5 items-start shadow-none">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">{loginError}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="login-field-group">
                  <label className="text-xs font-medium text-emerald-200 block mb-1.5">Username Operator</label>
                  <input
                    type="text"
                    placeholder="e.g. superadmin atau adminsma"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      setTriedSubmit(false);
                      if (loginError) setLoginError('');
                    }}
                    className={`w-full bg-white/10 hover:bg-white/15 border rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-white/40 focus:outline-none shadow-none transition-all duration-200 ${
                      triedSubmit && !usernameInput.trim()
                        ? 'border-rose-400 bg-rose-500/20 focus:border-rose-400'
                        : 'border-white/15 focus:border-emerald-400 focus:bg-white/20'
                    }`}
                  />
                  {triedSubmit && !usernameInput.trim() && (
                    <p className="text-[10px] text-rose-300 font-semibold mt-1.5 flex items-center gap-1 animate-error-shake">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" /> Username tidak boleh kosong!
                    </p>
                  )}
                </div>

                <div className="login-field-group">
                  <label className="text-xs font-medium text-emerald-200 block mb-1.5">Kata Sandi Akun</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setTriedSubmit(false);
                        if (loginError) setLoginError('');
                      }}
                      className={`w-full bg-white/10 hover:bg-white/15 border rounded-xl pl-4 pr-11 py-3 text-xs font-semibold text-white placeholder-white/40 focus:outline-none shadow-none transition-all duration-200 ${
                        triedSubmit && !passwordInput.trim()
                          ? 'border-rose-400 bg-rose-500/20 focus:border-rose-400'
                          : 'border-white/15 focus:border-emerald-400 focus:bg-white/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1 rounded-lg focus:outline-none transition-all cursor-pointer"
                      title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {triedSubmit && !passwordInput.trim() && (
                    <p className="text-[10px] text-rose-300 font-semibold mt-1.5 flex items-center gap-1 animate-error-shake">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" /> Kata sandi tidak boleh kosong!
                    </p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${
                      rememberMe
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'border-white/30 bg-white/5 group-hover:border-white/50'
                    }`}>
                      {rememberMe && <span className="text-[10px] font-bold leading-none">✓</span>}
                    </div>
                    <span className="text-[11px] font-bold text-emerald-200/90 group-hover:text-white transition-colors">
                      Ingat Saya
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full soft-button-primary py-3 rounded-xl text-xs font-semibold border-2 border-white/95 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-emerald-100 stroke-[2.5]" /> Login
                </button>
              </form>
            </div>
          </div>
        </main>

        {/* Footer info */}
        <footer className="py-6 px-6 shrink-0 text-center text-[10px] text-white/60 font-semibold uppercase tracking-widest">
          <span className="hidden sm:inline">© 2026 Yayasan Pendidikan Islam Raudhotut Tholibin Pati • All rights reserved.</span>
          <span className="inline sm:hidden">©2026 YPI-RT | developed by wiu.</span>
        </footer>
      </div>
    );
  }

  // --- COMPILATION RENDER OF LOGGED-IN WORKSPACE ---
  return (
    <div id="ald_workspace_root" className="min-h-screen soft-bg text-emerald-950 flex flex-col select-none font-sans relative">
      {/* Offline and Network Sync Banner */}
      <OfflineBanner />

      <div className="flex-1 flex flex-col md:flex-row pb-16 md:pb-0 min-w-0">
        {/* Desktop Sidebar navigation */}
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => setCurrentView(view)}
          userRole={currentUser.role}
          userName={currentUser.name}
          onLogout={handleLogout}
          showInstallBtn={showInstallBtn}
          onInstall={handleInstallApp}
          userPhotoURL={currentUser.photoURL}
          onOpenScanner={() => setIsScannerModalOpen(true)}
        />

        {/* Main content body */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Mobile Top Header (hidden on desktop) */}
          <header className="md:hidden soft-bg text-slate-800 p-3.5 flex items-center justify-between shrink-0 select-none sticky top-0 z-30 border-b border-emerald-200/40">
            <div className="flex items-center gap-2.5">
              <img
                src={ypiLogo}
                alt="Logo YPI"
                className="w-8 h-8 object-contain shrink-0 filter drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-[8px] text-emerald-700 font-semibold uppercase tracking-widest leading-none">
                  Arsip YPI
                </p>
                <h1 className="text-xs font-bold text-emerald-950 tracking-wide uppercase leading-tight mt-0.5">
                  YPI RAUDHOTUT THOLIBIN
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  hapticService.trigger('click');
                  setIsNotificationDrawerOpen(true);
                }}
                className="p-2 rounded-xl soft-bg hover:bg-emerald-100 text-emerald-800 relative cursor-pointer"
                title="Notifikasi Mobile"
              >
                <Bell className="w-4 h-4" />
                {notificationService.getUnreadCount() > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 absolute top-1 right-1 ring-2 ring-white animate-pulse" />
                )}
              </button>
              {showInstallBtn && (
                <button
                  onClick={handleInstallApp}
                  className="text-[10px] font-semibold text-emerald-850 border border-emerald-500/25 px-2 py-1 rounded-xl soft-bg hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse shrink-0" /> Unduh
                </button>
              )}
            <button
              onClick={handleLogout}
              className="text-[10px] font-bold text-red-500 border border-red-500/20 px-2.5 py-1 rounded-xl soft-bg/50 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Primary Page Canvas Content area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto pb-20 md:pb-8">
          
          {/* Main Routing Views Controller */}
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentView}
              initial={false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-1 flex flex-col"
            >
              <React.Suspense fallback={
                <div className="flex flex-col items-center justify-center p-16 text-emerald-800 font-bold gap-3 soft-card my-8">
                  <RefreshCw className="w-7 h-7 animate-spin text-emerald-600" />
                  <p className="text-xs uppercase tracking-wider">Memuat Komponen Halaman...</p>
                </div>
              }>
                {currentView === 'home' && renderHomeView()}
                {currentView === 'institution-directory' && <InstitutionDirectory onNavigate={setCurrentView} />}
                {currentView.startsWith('institution-') && currentView !== 'institution-directory' && (
                  <InstitutionProfileView 
                    institutionId={currentView.replace('institution-', '')} 
                    currentUser={currentUser} 
                    onBack={() => setCurrentView('institution-directory')} 
                  />
                )}
                {currentView === 'event-selapanan' && (
                  <EventDetail
                    type="selapanan"
                    currentUser={currentUser || undefined}
                    onLogAction={(act, det) => logAction(currentUser?.username || 'guest', currentUser?.name || 'Tamu', currentUser?.role || 'VIEWER', act as any, det)}
                    onBack={() => setCurrentView('home')}
                  />
                )}
                {currentView === 'event-harlah' && (
                  <EventDetail
                    type="harlah"
                    currentUser={currentUser || undefined}
                    onLogAction={(act, det) => logAction(currentUser?.username || 'guest', currentUser?.name || 'Tamu', currentUser?.role || 'VIEWER', act as any, det)}
                    onBack={() => setCurrentView('home')}
                  />
                )}
                {currentView === 'dashboard' && renderDashboardView()}
                {currentView === 'archive' && renderArchiveView()}
                {currentView === 'search' && renderSearchView()}
                {currentView === 'upload' && renderUploadView()}
                {currentView === 'favorites' && renderFavoritesView()}
                {currentView === 'announcements' && renderAnnouncementsView()}
                {currentView === 'announcement-detail' && selectedAnnDetail && (
                  <AnnouncementDetailView
                    announcement={selectedAnnDetail}
                    users={users}
                    onBack={() => setCurrentView(annDetailBackView)}
                  />
                )}
                {currentView === 'attendance-scanner' && (
                  <ScannerPage
                    operatorId={currentUser.id}
                    operatorName={currentUser.name}
                    onClose={() => setCurrentView('attendance-dashboard')}
                  />
                )}
                {currentView === 'attendance-dashboard' && (
                  <AttendanceDashboardPage currentUser={currentUser} />
                )}
                {currentView === 'attendance-staff' && (
                  <StaffManagementPage currentUser={currentUser} onClose={() => setCurrentView('attendance-dashboard')} />
                )}
                {currentView === 'users' && currentUser.role === 'SUPER_ADMIN' && (
                  <UserManagementView
                    users={users}
                    onAddUser={async (nu) => {
                      const uEntry: User = {
                        ...nu,
                        id: 'u-' + Date.now()
                      };
                      await dbSaveUser(uEntry);
                      await logAction(currentUser.username, currentUser.name, currentUser.role, 'CREATE_USER', `Membuat user baru: @${uEntry.username} (${uEntry.role})`);
                    }}
                    onUpdateUser={async (id, fields) => {
                      const tgt = users.find((u) => u.id === id);
                      if (tgt) {
                        const updatedUser = { ...tgt, ...fields };
                        await dbSaveUser(updatedUser);
                        const details = fields.passwordHash ? `Reset kata sandi` : `Memperbarui info profil: ${JSON.stringify(fields)}`;
                        await logAction(currentUser.username, currentUser.name, currentUser.role, fields.passwordHash ? 'RESET_PASSWORD' : 'EDIT_USER', `Akun @${tgt.username}: ${details}`);
                      }
                    }}
                    onDeleteUser={async (id) => {
                      const tgt = users.find((u) => u.id === id);
                      await dbDeleteUser(id);
                      if (tgt) {
                        await logAction(currentUser.username, currentUser.name, currentUser.role, 'DELETE', `Menghapus akun user: @${tgt.username}`);
                      }
                    }}
                  />
                )}
                {currentView === 'audit' && currentUser.role === 'SUPER_ADMIN' && (
                  <AuditLogView
                    logs={auditLogs}
                    documents={documents}
                    onClearLogs={async () => {
                      await dbClearAuditLogs();
                      await logAction(currentUser.username, currentUser.name, currentUser.role, 'DELETE', 'Membersihkan semua catatan audit log');
                    }}
                  />
                )}
                {currentView === 'settings' && renderSettingsView()}
                {currentView === 'profile' && renderProfileView()}
                {currentView === 'reporting-center' && (
                  <ReportingCenter
                    currentUser={currentUser}
                    users={users}
                    onLogAction={async (action, details) => {
                      await logAction(currentUser.username, currentUser.name, currentUser.role, action, details);
                    }}
                  />
                )}
              </React.Suspense>
            </motion.div>
          </AnimatePresence>

        </main>

      </div>
    </div>

      {/* Mobile bottom navigation bar */}
      <BottomNav
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        userRole={currentUser.role}
        userPhotoURL={currentUser.photoURL}
      />

      {/* Overlaid simulated PDF preview modal */}
      {selectedDocForView && (
        <PdfViewer
          document={selectedDocForView}
          onClose={() => setSelectedDocForView(null)}
          onDownload={() => {
            handleDownloadDocument(selectedDocForView);
          }}
        />
      )}

      {/* Slide-up detailed document modal */}
      <AnimatePresence>
        {selectedDocForDetails && (
          <DocDetailsModal
            document={selectedDocForDetails}
            isOpen={!!selectedDocForDetails}
            onClose={() => setSelectedDocForDetails(null)}
            onOpenPdf={handleOpenPdf}
            onDownload={handleDownloadDocument}
            onDelete={currentUser?.role !== 'VIEWER' ? handleDeleteDocument : undefined}
            isViewer={currentUser?.role === 'VIEWER'}
            isFavorite={favoriteIds.includes(selectedDocForDetails.id)}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </AnimatePresence>


      {/* Camera Document Scanner Modal */}
      <DocumentScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        currentUser={currentUser}
        onSuccess={(title) => {
          alert(`Dokumen "${title}" telah berhasil dipindai dan disimpan ke antrean upload.`);
          setSyncTrigger((prev) => prev + 1);
        }}
        onLogAction={async (action, details) => {
          await logAction(currentUser.username, currentUser.name, currentUser.role, action as any, details);
        }}
      />

      {/* Persistent Background Sync Status Bar */}
      <BackgroundSyncStatusBar />

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        isDanger={confirmDialog.isDanger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Mobile Push Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
      />

      {/* PWA Version Update Prompt Dialog */}
      <PwaUpdateDialog />

    </div>
  );
}
