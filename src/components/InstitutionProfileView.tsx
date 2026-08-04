import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Edit2, Trash2, User, Users, BookOpen, 
  Phone, Save, X, GraduationCap, Calendar, Shield, Check, FileText
} from 'lucide-react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, dbAddAuditLog } from '../firebase';
import { User as AppUser, InstitutionProfile, Teacher, CommitteeMember, ClassDetail } from '../types';
import { getRoleInstitution } from '../data';
import { FirestoreStaffRepository } from '../domains/attendance/repositories/FirestoreStaffRepository';
const staffRepo = new FirestoreStaffRepository();
import ConfirmDialog from './ConfirmDialog';
import { motion } from 'motion/react';

// Default initial data for seeding or local fallback
export const DEFAULT_PROFILES: Record<string, InstitutionProfile> = {
  sma: {
    id: 'sma',
    name: 'SMA Raudhotut Tholibin',
    type: 'SMA',
    leader: 'Ahmad Muthohar',
    totalStudents: 342,
    totalTeachers: 28,
    totalClasses: 4,
    teachersList: [
      { id: 't-sma-1', name: 'Ahmad Muthohar, S.Pd.', nip: '198205122010121003', role: 'Kepala Sekolah', subject: 'Pendidikan Agama Islam', contact: '081234567801' },
      { id: 't-sma-2', name: 'Drs. H. Abdul Kholiq', nip: '196704151995031002', role: 'Guru Senior', subject: 'Fisika', contact: '081234567802' },
      { id: 't-sma-3', name: 'Siti Aminah, S.Si.', nip: '198808242015042001', role: 'Wali Kelas X-A', subject: 'Matematika', contact: '081234567803' },
      { id: 't-sma-4', name: 'Zainal Arifin, M.Pd.', nip: '198411032012121001', role: 'Guru Mapel', subject: 'Bahasa Indonesia', contact: '081234567804' }
    ],
    committeeList: [
      { id: 'c-sma-1', name: 'K.H. Ahmad Mubarok', role: 'Ketua Komite', contact: '081333444555' },
      { id: 'c-sma-2', name: 'H. Abdul Kholiq', role: 'Bendahara', contact: '081333444666' },
      { id: 'c-sma-3', name: 'Muhammad Alwi', role: 'Sekretaris', contact: '081333444777' }
    ],
    classList: [
      { id: 'cl-sma-1', className: 'Kelas X-A', studentCount: 32, waliKelas: 'Siti Aminah, S.Si.', parentCount: 32 },
      { id: 'cl-sma-2', className: 'Kelas X-B', studentCount: 30, waliKelas: 'Zainal Arifin, M.Pd.', parentCount: 28 },
      { id: 'cl-sma-3', className: 'Kelas XI-IPA', studentCount: 35, waliKelas: 'Siti Aminah, S.Si.', parentCount: 35 },
      { id: 'cl-sma-4', className: 'Kelas XII-IPS', studentCount: 38, waliKelas: 'Zainal Arifin, M.Pd.', parentCount: 36 }
    ]
  },
  mts: {
    id: 'mts',
    name: 'MTs Raudhotut Tholibin',
    type: 'MTS',
    leader: 'Kurdi Abdul Jalil',
    totalStudents: 485,
    totalTeachers: 35,
    totalClasses: 3,
    teachersList: [
      { id: 't-mts-1', name: 'Kurdi Abdul Jalil, S.Ag.', nip: '197509182005011002', role: 'Kepala Madrasah', subject: 'Akidah Akhlak', contact: '081234567901' },
      { id: 't-mts-2', name: 'Hj. Siti Romlah, S.Pd.', nip: '198006202008122001', role: 'Wali Kelas VII-A', subject: 'Bahasa Inggris', contact: '081234567902' },
      { id: 't-mts-3', name: 'Ust. M. Ridwan, S.H.I.', nip: '', role: 'Guru Mapel', subject: 'Fiqih', contact: '081234567903' }
    ],
    committeeList: [
      { id: 'c-mts-1', name: 'K.H. Nasiruddin', role: 'Ketua Komite', contact: '081344555666' },
      { id: 'c-mts-2', name: 'Kurdi Abdul Jalil', role: 'Sekretaris', contact: '081344555777' }
    ],
    classList: [
      { id: 'cl-mts-1', className: 'Kelas VII-A', studentCount: 34, waliKelas: 'Hj. Siti Romlah, S.Pd.', parentCount: 34 },
      { id: 'cl-mts-2', className: 'Kelas VII-B', studentCount: 32, waliKelas: 'Ust. M. Ridwan', parentCount: 31 },
      { id: 'cl-mts-3', className: 'Kelas VIII-A', studentCount: 36, waliKelas: 'Hj. Siti Romlah, S.Pd.', parentCount: 36 }
    ]
  },
  madin: {
    id: 'madin',
    name: 'Madrasah Diniyah',
    type: 'MADIN',
    leader: 'Ust. Muhammad Zidni',
    totalStudents: 620,
    totalTeachers: 42,
    totalClasses: 3,
    teachersList: [
      { id: 't-madin-1', name: 'Ust. Muhammad Zidni', role: 'Kepala Madrasah', subject: 'Tauhid & Fathul Qorib', contact: '081234567101' },
      { id: 't-madin-2', name: 'Ust. Sholahuddin', role: 'Wali Kelas Ula 1', subject: 'Shorof', contact: '081234567102' },
      { id: 't-madin-3', name: 'Ust. Ahmad Ghazali', role: 'Guru Kelas', subject: 'Nahwu (Jurumiyah)', contact: '081234567103' }
    ],
    committeeList: [
      { id: 'c-madin-1', name: 'Ust. Muhammad Zidni', role: 'Ketua Pengurus', contact: '081355666777' }
    ],
    classList: [
      { id: 'cl-madin-1', className: 'Ula Kelas 1', studentCount: 45, waliKelas: 'Ust. Sholahuddin', parentCount: 42 },
      { id: 'cl-madin-2', className: 'Ula Kelas 2', studentCount: 42, waliKelas: 'Ust. Ahmad Ghazali', parentCount: 40 },
      { id: 'cl-madin-3', className: 'Wustho Kelas 1', studentCount: 38, waliKelas: 'Ust. Nur Hadi', parentCount: 38 }
    ]
  },
  tk: {
    id: 'tk',
    name: 'TK Raudhotut Tholibin',
    type: 'TK',
    leader: 'Junaedah',
    totalStudents: 125,
    totalTeachers: 12,
    totalClasses: 2,
    teachersList: [
      { id: 't-tk-1', name: 'Junaedah, S.Pd.AUD', role: 'Kepala TK', subject: 'Pendidikan Anak Usia Dini', contact: '081234567201' },
      { id: 't-tk-2', name: 'Siti Rahma, S.Pd.', role: 'Guru Kelas A', subject: 'Kreativitas & Bermain', contact: '081234567202' },
      { id: 't-tk-3', name: 'Anisah, S.Pd.', role: 'Guru Kelas B', subject: 'Membaca & Berhitung Dasar', contact: '081234567203' }
    ],
    committeeList: [
      { id: 'c-tk-1', name: 'Junaedah', role: 'Ketua Pengelola', contact: '081366777888' }
    ],
    classList: [
      { id: 'cl-tk-1', className: 'Kelompok A (Kecil)', studentCount: 22, waliKelas: 'Siti Rahma, S.Pd.', parentCount: 22 },
      { id: 'cl-tk-2', className: 'Kelompok B (Besar)', studentCount: 25, waliKelas: 'Anisah, S.Pd.', parentCount: 25 }
    ]
  },
  pesantren: {
    id: 'pesantren',
    name: 'Pondok Pesantren',
    type: 'PESANTREN',
    leader: 'Atsna',
    totalStudents: 850,
    totalTeachers: 65,
    totalClasses: 3,
    teachersList: [
      { id: 't-pes-1', name: 'K.H. Atsna', role: 'Pengasuh Pesantren', subject: 'Kitab Ihya Ulumuddin', contact: '081234567301' },
      { id: 't-pes-2', name: 'Ust. Bashori', role: 'Lurah Pondok', subject: 'Kitab Alfiyah Ibn Malik', contact: '081234567302' },
      { id: 't-pes-3', name: 'Ust. Musthofa', role: 'Kepala Keamanan', subject: 'Kajian Fiqih Kontemporer', contact: '081234567303' }
    ],
    committeeList: [
      { id: 'c-pes-1', name: 'K.H. Atsna', role: 'Dewan Pengasuh', contact: '081377888999' },
      { id: 'c-pes-2', name: 'Ust. Bashori', role: 'Sekretariat Utama', contact: '081377888000' }
    ],
    classList: [
      { id: 'cl-pes-1', className: 'Asrama Putra Al-Ghozali', studentCount: 150, waliKelas: 'Ust. Bashori', parentCount: 150 },
      { id: 'cl-pes-2', className: 'Asrama Putri Fatimah', studentCount: 180, waliKelas: 'Ust. Bashori', parentCount: 180 },
      { id: 'cl-pes-3', className: 'Kajian Sorogan Sore', studentCount: 300, waliKelas: 'K.H. Atsna', parentCount: 300 }
    ]
  }
};

interface InstitutionProfileViewProps {
  institutionId: string;
  currentUser: AppUser;
  onBack: () => void;
}

export function InstitutionProfileView({ institutionId, currentUser, onBack }: InstitutionProfileViewProps) {
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'guru' | 'pengurus' | 'kelas'>('guru');
  const [realStaffList, setRealStaffList] = useState<any[]>([]);

  useEffect(() => {
    if (institutionId) {
      staffRepo.findAll().then(allStaff => {
        const upperId = institutionId.toUpperCase();
        const instStaff = allStaff.filter(s => (s.institutions || []).map((x: string) => x.toUpperCase()).includes(upperId) || s.primaryInstitution?.toUpperCase() === upperId);
        setRealStaffList(instStaff.map(s => ({
          id: s.id,
          name: s.fullName,
          nip: '',
          role: s.role === 'PRINCIPAL' ? 'Kepala Sekolah/Madrasah' : (s.role === 'ADMIN' ? 'Staf TU/Admin' : 'Guru'),
          subject: s.position || '-',
          contact: '-'
        })));
      });
    }
  }, [institutionId]);
  

  // Modal / Form state
  const [isEditingGeneral, setIsEditingGeneral] = useState<boolean>(false);
  const [generalName, setGeneralName] = useState<string>('');
  const [generalLeader, setGeneralLeader] = useState<string>('');
  const [generalTotalStudents, setGeneralTotalStudents] = useState<number>(0);
  const [generalTotalTeachers, setGeneralTotalTeachers] = useState<number>(0);

  // Teacher modal / form state
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherName, setTeacherName] = useState<string>('');
  const [teacherNip, setTeacherNip] = useState<string>('');
  const [teacherRole, setTeacherRole] = useState<string>('');
  const [teacherSubject, setTeacherSubject] = useState<string>('');
  const [teacherContact, setTeacherContact] = useState<string>('');

  // Committee modal / form state
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState<boolean>(false);
  const [editingCommittee, setEditingCommittee] = useState<CommitteeMember | null>(null);
  const [committeeName, setCommitteeName] = useState<string>('');
  const [committeeRole, setCommitteeRole] = useState<string>('');
  const [committeeContact, setCommitteeContact] = useState<string>('');

  // Class modal / form state
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<ClassDetail | null>(null);
  const [classNameField, setClassNameField] = useState<string>('');
  const [classStudentCount, setClassStudentCount] = useState<number>(0);
  const [classWaliKelas, setClassWaliKelas] = useState<string>('');
  const [classParentCount, setClassParentCount] = useState<number>(0);

  // Delete confirmations
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'guru' | 'pengurus' | 'kelas';
    id: string;
    name: string;
  }>({ isOpen: false, type: 'guru', id: '', name: '' });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Check editing authorization
  const canEdit = currentUser.role === 'SUPER_ADMIN' || getRoleInstitution(currentUser.role) === profile?.type;

  // Sync profile from Firestore
  useEffect(() => {
    setIsLoading(true);
    const profileRef = doc(db, 'institution_profiles', institutionId);

    const unsub = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as InstitutionProfile);
      } else {
        // Seeding initial data from DEFAULT_PROFILES
        const defaultProf = DEFAULT_PROFILES[institutionId] || {
          id: institutionId,
          name: `${institutionId.toUpperCase()} Raudhotut Tholibin`,
          type: institutionId.toUpperCase() as any,
          leader: 'Belum ditentukan',
          totalStudents: 0,
          totalTeachers: 0,
          totalClasses: 0,
          teachersList: [],
          committeeList: [],
          classList: []
        };
        
        setDoc(profileRef, defaultProf)
          .then(() => setProfile(defaultProf))
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, `institution_profiles/${institutionId}`));
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to load institution profile:", error);
      setIsLoading(false);
    });

    return () => unsub();
  }, [institutionId]);

  // Log action helper
  const logProfileActivity = async (actionDetails: string) => {
    try {
      const newLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        username: currentUser.username,
        name: currentUser.name,
        role: currentUser.role,
        action: 'EDIT_PROFILE' as any,
        details: actionDetails,
        ipAddress: '127.0.0.1'
      };
      await dbAddAuditLog(newLog);
    } catch (err) {
      console.error('Audit log failed:', err);
    }
  };

  // Save full profile update helper
  const saveProfileUpdate = async (updatedProfile: InstitutionProfile, actionDesc: string) => {
    try {
      const profileRef = doc(db, 'institution_profiles', institutionId);
      const cleanProfile = {
        ...updatedProfile,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name
      };
      await setDoc(profileRef, cleanProfile);
      await logProfileActivity(actionDesc);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `institution_profiles/${institutionId}`);
    }
  };

  // General profile details update handler
  const handleOpenGeneralEdit = () => {
    if (!profile) return;
    setValidationError(null);
    setGeneralName(profile.name);
    setGeneralLeader(profile.leader);
    setGeneralTotalStudents(profile.totalStudents);
    setGeneralTotalTeachers(realStaffList.length);
    setIsEditingGeneral(true);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setValidationError(null);

    if (generalName.trim().length < 3) {
      setValidationError("Nama lembaga harus minimal 3 karakter.");
      return;
    }
    if (generalLeader.trim().length < 3) {
      setValidationError("Nama pimpinan/kepala unit harus minimal 3 karakter.");
      return;
    }
    if (Number(generalTotalStudents) < 0) {
      setValidationError("Jumlah total siswa tidak boleh kurang dari 0.");
      return;
    }
    if (Number(generalTotalTeachers) < 0) {
      setValidationError("Jumlah total pengajar tidak boleh kurang dari 0.");
      return;
    }

    const updated: InstitutionProfile = {
      ...profile,
      name: generalName.trim(),
      leader: generalLeader.trim(),
      totalStudents: Number(generalTotalStudents),
      totalTeachers: Number(generalTotalTeachers)
    };

    setIsEditingGeneral(false);
    await saveProfileUpdate(updated, `Mengedit detail umum lembaga: ${profile.name}`);
  };

  // Teacher handlers
  const handleOpenTeacherModal = (teacher: Teacher | null = null) => {
    setValidationError(null);
    if (teacher) {
      setEditingTeacher(teacher);
      setTeacherName(teacher.name);
      setTeacherNip(teacher.nip || '');
      setTeacherRole(teacher.role);
      setTeacherSubject(teacher.subject || '');
      setTeacherContact(teacher.contact || '');
    } else {
      setEditingTeacher(null);
      setTeacherName('');
      setTeacherNip('');
      setTeacherRole('');
      setTeacherSubject('');
      setTeacherContact('');
    }
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setValidationError(null);

    if (teacherName.trim().length < 3) {
      setValidationError("Nama pengajar/guru harus minimal 3 karakter.");
      return;
    }
    if (teacherRole.trim().length < 2) {
      setValidationError("Jabatan/peran harus minimal 2 karakter.");
      return;
    }
    if (teacherContact.trim()) {
      const phoneRegex = /^[0-9+ \-()]{9,18}$/;
      if (!phoneRegex.test(teacherContact.trim())) {
        setValidationError("Nomor kontak tidak valid (harus 9-18 digit angka, spasi, atau tanda tambah).");
        return;
      }
    }

    let updatedList = [...profile.teachersList];
    let actionDesc = '';

    if (editingTeacher) {
      // Edit existing
      updatedList = updatedList.map(t => t.id === editingTeacher.id ? {
        ...t,
        name: teacherName.trim(),
        nip: teacherNip.trim(),
        role: teacherRole.trim(),
        subject: teacherSubject.trim(),
        contact: teacherContact.trim()
      } : t);
      actionDesc = `Mengubah data pengajar/guru: ${teacherName} di ${profile.name}`;
    } else {
      // Create new
      const newTeacher: Teacher = {
        id: 't-' + Date.now(),
        name: teacherName.trim(),
        nip: teacherNip.trim(),
        role: teacherRole.trim(),
        subject: teacherSubject.trim(),
        contact: teacherContact.trim()
      };
      updatedList.push(newTeacher);
      actionDesc = `Menambahkan pengajar/guru baru: ${teacherName} di ${profile.name}`;
    }

    const updatedProfile: InstitutionProfile = {
      ...profile,
      teachersList: updatedList,
      totalTeachers: updatedList.length
    };

    setIsTeacherModalOpen(false);
    await saveProfileUpdate(updatedProfile, actionDesc);
  };

  // Committee handlers
  const handleOpenCommitteeModal = (member: CommitteeMember | null = null) => {
    setValidationError(null);
    if (member) {
      setEditingCommittee(member);
      setCommitteeName(member.name);
      setCommitteeRole(member.role);
      setCommitteeContact(member.contact || '');
    } else {
      setEditingCommittee(null);
      setCommitteeName('');
      setCommitteeRole('');
      setCommitteeContact('');
    }
    setIsCommitteeModalOpen(true);
  };

  const handleSaveCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setValidationError(null);

    if (committeeName.trim().length < 3) {
      setValidationError("Nama pengurus harus minimal 3 karakter.");
      return;
    }
    if (committeeRole.trim().length < 2) {
      setValidationError("Jabatan pengurus harus minimal 2 karakter.");
      return;
    }
    if (committeeContact.trim()) {
      const phoneRegex = /^[0-9+ \-()]{9,18}$/;
      if (!phoneRegex.test(committeeContact.trim())) {
        setValidationError("Nomor kontak tidak valid (harus 9-18 digit angka, spasi, atau tanda tambah).");
        return;
      }
    }

    let updatedList = [...profile.committeeList];
    let actionDesc = '';

    if (editingCommittee) {
      updatedList = updatedList.map(c => c.id === editingCommittee.id ? {
        ...c,
        name: committeeName.trim(),
        role: committeeRole.trim(),
        contact: committeeContact.trim()
      } : c);
      actionDesc = `Mengubah susunan pengurus: ${committeeName} sebagai ${committeeRole} di ${profile.name}`;
    } else {
      const newMember: CommitteeMember = {
        id: 'c-' + Date.now(),
        name: committeeName.trim(),
        role: committeeRole.trim(),
        contact: committeeContact.trim()
      };
      updatedList.push(newMember);
      actionDesc = `Menambahkan pengurus baru: ${committeeName} sebagai ${committeeRole} di ${profile.name}`;
    }

    const updatedProfile: InstitutionProfile = {
      ...profile,
      committeeList: updatedList
    };

    setIsCommitteeModalOpen(false);
    await saveProfileUpdate(updatedProfile, actionDesc);
  };

  // Class handlers
  const handleOpenClassModal = (cls: ClassDetail | null = null) => {
    setValidationError(null);
    if (cls) {
      setEditingClass(cls);
      setClassNameField(cls.className);
      setClassStudentCount(cls.studentCount);
      setClassWaliKelas(cls.waliKelas || '');
      setClassParentCount(cls.parentCount || 0);
    } else {
      setEditingClass(null);
      setClassNameField('');
      setClassStudentCount(0);
      setClassWaliKelas('');
      setClassParentCount(0);
    }
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setValidationError(null);

    if (classNameField.trim().length < 2) {
      setValidationError("Nama kelas harus minimal 2 karakter.");
      return;
    }
    if (!classWaliKelas) {
      setValidationError("Silakan tentukan atau pilih wali kelas.");
      return;
    }
    if (Number(classStudentCount) <= 0) {
      setValidationError("Jumlah siswa harus lebih besar dari 0.");
      return;
    }
    if (Number(classParentCount) < 0) {
      setValidationError("Jumlah kontak wali murid tidak boleh kurang dari 0.");
      return;
    }

    let updatedList = [...profile.classList];
    let actionDesc = '';

    if (editingClass) {
      updatedList = updatedList.map(c => c.id === editingClass.id ? {
        ...c,
        className: classNameField.trim(),
        studentCount: Number(classStudentCount),
        waliKelas: classWaliKelas,
        parentCount: Number(classParentCount)
      } : c);
      actionDesc = `Mengubah data kelas: ${classNameField} di ${profile.name}`;
    } else {
      const newClass: ClassDetail = {
        id: 'cl-' + Date.now(),
        className: classNameField.trim(),
        studentCount: Number(classStudentCount),
        waliKelas: classWaliKelas,
        parentCount: Number(classParentCount)
      };
      updatedList.push(newClass);
      actionDesc = `Menambahkan kelas baru: ${classNameField} di ${profile.name}`;
    }

    // Auto calculate total students from class distribution
    const computedStudents = updatedList.reduce((sum, c) => sum + c.studentCount, 0);

    const updatedProfile: InstitutionProfile = {
      ...profile,
      classList: updatedList,
      totalClasses: updatedList.length,
      totalStudents: computedStudents
    };

    setIsClassModalOpen(false);
    await saveProfileUpdate(updatedProfile, actionDesc);
  };

  // Delete triggering and handling
  const triggerDelete = (type: 'guru' | 'pengurus' | 'kelas', id: string, name: string) => {
    setDeleteDialog({ isOpen: true, type, id, name });
  };

  const handleConfirmDelete = async () => {
    if (!profile) return;
    const { type, id, name } = deleteDialog;
    setDeleteDialog(prev => ({ ...prev, isOpen: false }));

    let actionDesc = '';
    let updatedProfile = { ...profile };

    if (type === 'guru') {
      const filtered = profile.teachersList.filter(t => t.id !== id);
      updatedProfile.teachersList = filtered;
      updatedProfile.totalTeachers = filtered.length;
      actionDesc = `Menghapus pengajar/guru: ${name} dari ${profile.name}`;
    } else if (type === 'pengurus') {
      const filtered = profile.committeeList.filter(c => c.id !== id);
      updatedProfile.committeeList = filtered;
      actionDesc = `Menghapus pengurus: ${name} dari ${profile.name}`;
    } else if (type === 'kelas') {
      const filtered = profile.classList.filter(c => c.id !== id);
      updatedProfile.classList = filtered;
      updatedProfile.totalClasses = filtered.length;
      updatedProfile.totalStudents = filtered.reduce((sum, c) => sum + c.studentCount, 0);
      actionDesc = `Menghapus kelas: ${name} dari ${profile.name}`;
    }

    await saveProfileUpdate(updatedProfile, actionDesc);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        <p className="text-stone-500 font-bold text-sm animate-pulse">Memuat Profil Lembaga...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6 text-center space-y-4">
        <h3 className="font-semibold uppercase text-lg">Gagal Memuat Profil</h3>
        <p className="text-sm font-bold">Profil lembaga tidak ditemukan atau koneksi bermasalah.</p>
        <button onClick={onBack} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all">
          Kembali ke Direktori
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Upper Navigation & Mode Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 soft-bg border border-emerald-100 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer max-w-max"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Kembali
        </button>

        {canEdit ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4 text-emerald-600" /> Mode Operator: Akses Sunting Terbuka
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-stone-100 border border-stone-250 text-stone-600 rounded-xl text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4 text-stone-400" /> Mode Peninjau: Hanya Dapat Membaca
          </div>
        )}
      </div>

      {/* Main Beautiful Header Banner */}
      <div className="soft-gradient-dark rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden border border-white/10 shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 text-xs font-semibold bg-emerald-500/30 border border-emerald-400/40 text-emerald-100 rounded-full">
                {profile.type}
              </span>
              {profile.updatedAt && (
                <span className="text-[10px] text-emerald-300/80 font-bold">
                  Diperbarui: {new Date(profile.updatedAt).toLocaleDateString('id-ID')} oleh {profile.updatedBy || 'Sistem'}
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-wide leading-tight">
                {profile.name}
              </h1>
              <p className="text-emerald-100/85 text-sm sm:text-base font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" /> 
                Pimpinan: <span className="text-white">{profile.leader}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 soft-bg/5 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center w-full sm:w-auto">
            <div className="px-2">
              <span className="block text-2xl font-bold text-white">{profile.totalStudents}</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-300 mt-1">Siswa/Santri</span>
            </div>
            <div className="border-x border-white/10 px-2">
              <span className="block text-2xl font-bold text-white">{realStaffList.length}</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-300 mt-1">Pengajar</span>
            </div>
            <div className="px-2">
              <span className="block text-2xl font-bold text-white">{profile.totalClasses}</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-300 mt-1">Kelas</span>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
            <button 
              onClick={handleOpenGeneralEdit}
              className="flex items-center gap-2 px-4 py-2 soft-bg/10 hover:soft-bg/20 border border-white/20 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" /> Sunting Informasi Utama
            </button>
          </div>
        )}
      </div>

      {/* Main General Information Editing Panel Inline */}
      {isEditingGeneral && (
        <div className="soft-card p-6 space-y-4 animate-in slide-in-from-top-3 duration-250">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Sunting Detail Utama Lembaga</h3>
            <button onClick={() => setIsEditingGeneral(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold leading-relaxed">
              {validationError}
            </div>
          )}
          <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Nama Lembaga</label>
              <input 
                type="text" 
                value={generalName}
                onChange={(e) => setGeneralName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Nama Pimpinan / Kepala Unit</label>
              <input 
                type="text" 
                value={generalLeader}
                onChange={(e) => setGeneralLeader(e.target.value)}
                required
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Estimasi Pengajar (Manual Override)</label>
              <input 
                type="number" 
                value={generalTotalTeachers}
                onChange={(e) => setGeneralTotalTeachers(Number(e.target.value))}
                required
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Estimasi Total Siswa/Santri (Manual Override)</label>
              <input 
                type="number" 
                value={generalTotalStudents}
                onChange={(e) => setGeneralTotalStudents(Number(e.target.value))}
                required
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsEditingGeneral(false)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold rounded-xl uppercase tracking-wider transition-all"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 soft-button-primary text-xs font-bold rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200/65 overflow-x-auto select-none no-scrollbar">
        <button
          onClick={() => setActiveTab('guru')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 min-w-max ${
            activeTab === 'guru' 
              ? 'border-emerald-600 text-emerald-800' 
              : 'border-transparent text-stone-500 hover:text-stone-850'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Daftar Guru & Pengajar ({realStaffList.length})
        </button>
        <button
          onClick={() => setActiveTab('pengurus')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 min-w-max ${
            activeTab === 'pengurus' 
              ? 'border-emerald-600 text-emerald-800' 
              : 'border-transparent text-stone-500 hover:text-stone-850'
          }`}
        >
          <Users className="w-4 h-4" /> Susunan Pengurus ({profile.committeeList.length})
        </button>
        <button
          onClick={() => setActiveTab('kelas')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 min-w-max ${
            activeTab === 'kelas' 
              ? 'border-emerald-600 text-emerald-800' 
              : 'border-transparent text-stone-500 hover:text-stone-850'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Kelas & Wali Murid ({profile.classList.length})
        </button>
      </div>

      {/* RENDER ACTIVE TAB VIEW */}
      
      {/* 1. TEACHER LIST TAB */}
      {activeTab === 'guru' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-emerald-950 uppercase tracking-wide">Daftar Guru & Pengajar</h2>
              <p className="text-xs text-stone-500 font-bold">Pengajar aktif terdaftar di unit {profile.name}.</p>
            </div>
            {canEdit && (
              <button 
                onClick={() => handleOpenTeacherModal(null)}
                className="px-4 py-2.5 soft-button-primary rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Tambah Guru
              </button>
            )}
          </div>

          {realStaffList.length === 0 ? (
            <div className="soft-card p-6 text-center flex flex-col items-center justify-center space-y-3">
              <GraduationCap className="w-12 h-12 text-stone-300" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-700 uppercase">Belum Ada Daftar Guru</p>
                <p className="text-xs text-stone-500 font-bold">Mulai tambahkan pengajar baru ke dalam direktori lembaga ini.</p>
              </div>
            </div>
          ) : (
            <div className="soft-card overflow-hidden">
              <div className="px-6 py-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-3"><Shield className="w-4 h-4 text-emerald-600" /><p className="text-xs text-emerald-800 font-bold">Data guru & pengajar ditampilkan secara live dari Master Database Kepegawaian. Untuk menambah atau mengubah data, silakan gunakan modul Kepegawaian.</p></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-150 select-none">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-500">Nama Lengkap</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-500">NIP / Kode</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-500">Jabatan / Peran</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-500">Mata Pelajaran</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-500">Kontak</th>
                      
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {realStaffList.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-stone-50/50 transition-all font-bold text-xs text-stone-800">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold uppercase">
                              {teacher.fullName.charAt(0)}
                            </div>
                            <span className="text-stone-900 font-semibold">{teacher.fullName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-stone-500">{teacher.nip || '-'}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg">
                            {teacher.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-stone-600">{teacher.subject || '-'}</td>
                        <td className="px-6 py-4">
                          {teacher.contact ? (
                            <a href={`tel:${teacher.contact}`} className="flex items-center gap-1 text-emerald-700 hover:underline">
                              <Phone className="w-3.5 h-3.5" /> {teacher.contact}
                            </a>
                          ) : '-'}
                        </td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. COMMITTEE LIST TAB */}
      {activeTab === 'pengurus' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-emerald-950 uppercase tracking-wide">Susunan Pengurus & Komite</h2>
              <p className="text-xs text-stone-500 font-bold">Struktur organisasi dan pengurus komite saat ini.</p>
            </div>
            {canEdit && (
              <button 
                onClick={() => handleOpenCommitteeModal(null)}
                className="px-4 py-2.5 soft-button-primary rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Tambah Pengurus
              </button>
            )}
          </div>

          {profile.committeeList.length === 0 ? (
            <div className="soft-card p-6 text-center flex flex-col items-center justify-center space-y-3">
              <Users className="w-12 h-12 text-stone-300" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-700 uppercase">Belum Ada Struktur Pengurus</p>
                <p className="text-xs text-stone-500 font-bold">Mulai rancang susunan pengurus untuk mempermudah koordinasi.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.committeeList.map((member) => (
                <div key={member.id} className="soft-card p-6 flex items-start justify-between  transition-all group">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-stone-900 leading-tight">{member.name}</h4>
                      <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">{member.role}</p>
                      {member.contact && (
                        <p className="text-xs font-bold text-stone-500 flex items-center gap-1 mt-1">
                          <Phone className="w-3.5 h-3.5" /> {member.contact}
                        </p>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleOpenCommitteeModal(member)}
                        className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => triggerDelete('pengurus', member.id, member.name)}
                        className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. CLASSES LIST TAB */}
      {activeTab === 'kelas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-emerald-950 uppercase tracking-wide">Data Kelas & Wali Murid</h2>
              <p className="text-xs text-stone-500 font-bold">Statistik murid per kelas beserta data pendamping/wali murid.</p>
            </div>
            {canEdit && (
              <button 
                onClick={() => handleOpenClassModal(null)}
                className="px-4 py-2.5 soft-button-primary rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Tambah Kelas
              </button>
            )}
          </div>

          {profile.classList.length === 0 ? (
            <div className="soft-card p-6 text-center flex flex-col items-center justify-center space-y-3">
              <BookOpen className="w-12 h-12 text-stone-300" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-700 uppercase">Belum Ada Data Kelas</p>
                <p className="text-xs text-stone-500 font-bold">Mulai daftarkan pembagian kelas dan wali murid unit pendidikan ini.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.classList.map((cls) => (
                <div key={cls.id} className="soft-bg border border-emerald-100/40 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between  transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <span className="text-sm font-semibold text-stone-900">{cls.className}</span>
                      {canEdit && (
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleOpenClassModal(cls)}
                            className="p-1 text-stone-400 hover:text-emerald-700 rounded-lg hover:bg-stone-50 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => triggerDelete('kelas', cls.id, cls.className)}
                            className="p-1 text-stone-400 hover:text-red-700 rounded-lg hover:bg-stone-50 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 font-bold text-xs">
                      <div className="flex justify-between items-center text-stone-600">
                        <span>Wali Kelas:</span>
                        <span className="text-stone-950 font-semibold">{cls.waliKelas || 'Belum ditentukan'}</span>
                      </div>
                      <div className="flex justify-between items-center text-stone-600">
                        <span>Jumlah Murid:</span>
                        <span className="text-emerald-800 font-bold">{cls.studentCount} Orang</span>
                      </div>
                      <div className="flex justify-between items-center text-stone-600">
                        <span>Terdaftar Wali Murid:</span>
                        <span className="text-stone-950 font-semibold">{cls.parentCount || 0} Kontak</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-50 flex items-center justify-between text-[10px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Tahun Ajaran: 2026/2027
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded-md uppercase">
                      Aktif
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODALS / FORMS FOR ADDING AND EDITING ITEMS
          ========================================================================= */}

      {/* A. TEACHER ADD/EDIT MODAL */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="soft-bg border border-emerald-100 rounded-xl w-full max-w-md p-6 relative overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsTeacherModalOpen(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
            <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wide mb-4">
              {editingTeacher ? 'Ubah Data Guru' : 'Tambah Guru Baru'}
            </h4>
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold leading-relaxed mb-1">
                {validationError}
              </div>
            )}
            <form onSubmit={handleSaveTeacher} className="space-y-4 font-bold text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-500">Nama Lengkap & Gelar</label>
                <input 
                  type="text" 
                  value={teacherName} 
                  onChange={(e) => setTeacherName(e.target.value)}
                  required 
                  placeholder="Contoh: Ahmad Khoirul, S.Pd."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-950 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-500">NIP / Kode Guru (Opsional)</label>
                <input 
                  type="text" 
                  value={teacherNip} 
                  onChange={(e) => setTeacherNip(e.target.value)}
                  placeholder="NIP / No Sertifikasi jika ada"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-950 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-500">Jabatan / Tugas Tambahan</label>
                <input 
                  type="text" 
                  value={teacherRole} 
                  onChange={(e) => setTeacherRole(e.target.value)}
                  required 
                  placeholder="Contoh: Kepala Sekolah, Wali Kelas X, Guru Kelas"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-950 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-500">Mata Pelajaran (Opsional)</label>
                <input 
                  type="text" 
                  value={teacherSubject} 
                  onChange={(e) => setTeacherSubject(e.target.value)}
                  placeholder="Contoh: Fiqih, Matematika, Kimia"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-950 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-500">No. Kontak WhatsApp (Opsional)</label>
                <input 
                  type="text" 
                  value={teacherContact} 
                  onChange={(e) => setTeacherContact(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-950 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-stone-100">
                <button 
                  type="button" 
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 text-stone-600 hover:bg-stone-250 rounded-xl uppercase tracking-wider"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. COMMITTEE MEMBER ADD/EDIT MODAL */}
      {isCommitteeModalOpen && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="soft-bg border border-emerald-100 rounded-xl w-full max-w-md p-6 relative overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCommitteeModalOpen(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
            <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wide mb-4">
              {editingCommittee ? 'Ubah Data Pengurus' : 'Tambah Pengurus / Komite Baru'}
            </h4>
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold leading-relaxed mb-1">
                {validationError}
              </div>
            )}
            <form onSubmit={handleSaveCommittee} className="space-y-4 font-bold text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-500">Nama Pengurus</label>
                <input 
                  type="text" 
                  value={committeeName} 
                  onChange={(e) => setCommitteeName(e.target.value)}
                  required 
                  placeholder="Contoh: K.H. Ahmad Mubarok"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-950 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-500">Jabatan Struktur</label>
                <input 
                  type="text" 
                  value={committeeRole} 
                  onChange={(e) => setCommitteeRole(e.target.value)}
                  required 
                  placeholder="Contoh: Ketua Komite, Bendahara Komite, Penasehat"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-950 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-500">No. Kontak WhatsApp (Opsional)</label>
                <input 
                  type="text" 
                  value={committeeContact} 
                  onChange={(e) => setCommitteeContact(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-950 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-stone-100">
                <button 
                  type="button" 
                  onClick={() => setIsCommitteeModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 text-stone-600 hover:bg-stone-250 rounded-xl uppercase tracking-wider"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. CLASS ADD/EDIT MODAL */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="soft-bg border border-emerald-100 rounded-xl w-full max-w-md p-6 relative overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsClassModalOpen(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
            <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wide mb-4">
              {editingClass ? 'Ubah Data Kelas' : 'Tambah Kelas Baru'}
            </h4>
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold leading-relaxed mb-1">
                {validationError}
              </div>
            )}
            <form onSubmit={handleSaveClass} className="space-y-4 font-bold text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-500">Nama Kelas</label>
                <input 
                  type="text" 
                  value={classNameField} 
                  onChange={(e) => setClassNameField(e.target.value)}
                  required 
                  placeholder="Contoh: Kelas X-A, Kelas VII-B"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-950 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-500">Wali Kelas</label>
                <select 
                  value={classWaliKelas}
                  onChange={(e) => setClassWaliKelas(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-950 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all appearance-none"
                >
                  <option value="">Pilih Wali Kelas dari Pengajar</option>
                  {realStaffList.map((t) => (
                    <option key={t.id} value={t.fullName}>{t.fullName} ({t.role})</option>
                  ))}
                  <option value="Lainnya">Lainnya / Manual Entry</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Jumlah Siswa</label>
                  <input 
                    type="number" 
                    value={classStudentCount} 
                    onChange={(e) => setClassStudentCount(Number(e.target.value))}
                    required 
                    min="1"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-950 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-stone-500">Jumlah Kontak Wali Murid</label>
                  <input 
                    type="number" 
                    value={classParentCount} 
                    onChange={(e) => setClassParentCount(Number(e.target.value))}
                    required 
                    min="0"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-950 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-stone-100">
                <button 
                  type="button" 
                  onClick={() => setIsClassModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 text-stone-600 hover:bg-stone-250 rounded-xl uppercase tracking-wider"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. CONFIRM DELETE DIALOG */}
      <ConfirmDialog 
        isOpen={deleteDialog.isOpen}
        title={`Hapus Data ${deleteDialog.type === 'guru' ? 'Guru/Pengajar' : deleteDialog.type === 'pengurus' ? 'Pengurus' : 'Kelas'}`}
        message={`Apakah Anda yakin ingin menghapus "${deleteDialog.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
