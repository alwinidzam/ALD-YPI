/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { toast } from '../lib/toastManager';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  Search,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  UserCheck,
  UserX,
  ShieldAlert,
  FileText,
  Download
} from 'lucide-react';
import { User, UserRole } from '../types';
import { hashPassword } from '../data';
import { FirestoreStaffRepository } from '../domains/attendance/repositories/FirestoreStaffRepository';
const staffRepo = new FirestoreStaffRepository();
import ConfirmDialog from './ConfirmDialog';
import { LazyImage } from './LazyImage';
import { generateUsersPdf } from '../lib/pdfAccountGenerator';

interface UserManagementViewProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (id: string, updated: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

export default function UserManagementView({ users, onAddUser, onUpdateUser, onDeleteUser }: UserManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allStaff, setAllStaff] = useState<any[]>([]);
  React.useEffect(() => {
    staffRepo.findAll().then(setAllStaff);
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Form states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ADMIN_SMA');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [newPassword, setNewPassword] = useState('');
  const [contact, setContact] = useState('');

  // Filtering users
  
  // Merge users and staff
  const mergedUsers = React.useMemo(() => {
    const list: any[] = [];
    const usedUserIds = new Set();

    allStaff.forEach(staff => {
      const matchingUser = users.find(u => u.name.toLowerCase() === staff.fullName.toLowerCase());
      if (matchingUser) {
        usedUserIds.add(matchingUser.id);
        list.push({ ...matchingUser, staffId: staff.id, noAccount: false, fullName: staff.fullName, position: staff.position });
      } else {
        list.push({
          id: 'staff-' + staff.id,
          username: '-',
          name: staff.fullName,
          role: staff.role === 'PRINCIPAL' ? 'GUEST' : 'TEACHER',
          institution: staff.primaryInstitution,
          noAccount: true,
          position: staff.position,
          staffId: staff.id
        });
      }
    });

    users.forEach(u => {
      if (!usedUserIds.has(u.id)) {
        list.push({ ...u, noAccount: false });
      }
    });

    return list;
  }, [users, allStaff]);

  const filteredUsers = (mergedUsers as any[]).filter(u => {
    return (
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });


  const handleOpenAddModal = () => {
    setName('');
    setUsername('');
    setPassword('');
    setRole('ADMIN_SMA');
    setStatus('ACTIVE');
    setContact('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setName(user.name);
    setUsername(user.username);
    setRole(user.role);
    setStatus(user.status);
    setContact(user.contact || '');
    setShowEditModal(true);
  };

  const handleOpenResetModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowResetModal(true);
  };

  const handleSaveNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      alert('Harap isi seluruh field bertanda bintang (*)!');
      return;
    }

    // Check if username already exists
    const exists = users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      alert('Username sudah terdaftar! Harap gunakan username lain.');
      return;
    }

    setIsSubmitting(true);
    await onAddUser({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      role,
      status,
      passwordHash: hashPassword(password.trim()),
      contact: contact.trim()
    });

    setShowAddModal(false);
    setIsSubmitting(false);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!name.trim() || !username.trim()) {
      alert('Nama dan Username tidak boleh kosong!');
      return;
    }

    // Check username unique except current user
    const exists = users.some(
      (u) => u.id !== selectedUser.id && u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (exists) {
      alert('Username sudah digunakan oleh akun lain!');
      return;
    }

    setIsSubmitting(true);
    await setIsSubmitting(true);
    await onUpdateUser(selectedUser.id, {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      role,
      status,
      contact: contact.trim()
    });

    setShowEditModal(false);
    setIsSubmitting(false);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword.trim()) return;

    onUpdateUser(selectedUser.id, {
      passwordHash: hashPassword(newPassword.trim())
    });

    alert(`Sandi untuk akun @${selectedUser.username} berhasil di-reset.`);
    setShowResetModal(false);
    setIsSubmitting(false);
  };

  const toggleUserStatus = (user: User) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    onUpdateUser(user.id, { status: nextStatus });
  };

  const handleDeleteClick = (user: User) => {
    if (user.role === 'SUPER_ADMIN') {
      alert('Akun Super Administrator utama tidak dapat dihapus untuk mencegah kegagalan sistem.');
      return;
    }
    setDeleteConfirm({
      isOpen: true,
      user
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER ACTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-emerald-950 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Manajemen Pengguna (User)
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Daftar operator, admin unit lembaga, serta viewer eksternal dengan hak akses terkontrol.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={async () => {
              const toastId = toast.loading('Sedang menghasilkan dokumen PDF Akun...');
              try {
                await generateUsersPdf(users);
                toast.completeLoading(toastId, 'Dokumen PDF berhasil diunduh.', 'success');
              } catch (e) {
                console.error("PDF generation error:", e);
                toast.completeLoading(toastId, 'Gagal mengunduh dokumen PDF', 'error');
              }
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200/80 hover:bg-emerald-100 transition-all active:scale-95 cursor-pointer"
            title="Cetak Laporan Daftar Akun Pengguna (PDF)"
          >
            <Download className="w-4 h-4 text-emerald-700" /> Cetak PDF Akun
          </button>

          <button
            onClick={handleOpenAddModal}
            className="soft-button-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" /> Tambah User Baru
          </button>
        </div>
      </div>

      {/* SEARCH FIELD */}
      <div className="relative">
        <Search className="w-4 h-4 text-emerald-600/60 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama, username, atau jenis wewenang..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="soft-input pl-11"
        />
      </div>

      {/* USERS LIST TABLE (Desktop & Tablet) */}
      <div className="soft-card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-700 font-semibold border-b border-slate-100">
                <th className="p-4">Nama Pengguna</th>
                <th className="p-4">Username</th>
                <th className="p-4">Wewenang / Lembaga</th>
                <th className="p-4">No. Kontak</th>
                <th className="p-4 w-[110px]">Status Akun</th>
                <th className="p-4 w-[180px] text-right">Menu Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50/50">
              {filteredUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-emerald-50/20 transition-colors">
                  
                  {/* Name Card */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {u.photoURL ? (
                        <LazyImage
                          src={u.photoURL}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-emerald-200/50 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-semibold text-xs uppercase border border-emerald-200/40">
                          {u.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-stone-900">{u.name}</p>
                        {u.lastLogin && (
                          <p className="text-[10px] text-stone-400 font-medium">
                            Login terakhir: {new Date(u.lastLogin).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Username font-mono */}
                  <td className="p-4 font-mono text-emerald-800 font-bold">
                    {u.noAccount ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 font-sans">No Login Account</span>
                    ) : (
                      <>@{u.username}</>
                    )}
                  </td>

                  {/* Role */}
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-semibold tracking-wider bg-emerald-50/60 text-emerald-700 border border-emerald-200/30 uppercase">
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Kontak */}
                  <td className="p-4 text-stone-600 font-bold font-mono">
                    {u.contact || <span className="text-stone-300 font-sans font-medium italic">Belum diisi</span>}
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    {u.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                        <CheckCircle2 className="w-3 h-3" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100">
                        <XCircle className="w-3 h-3" /> Nonaktif
                      </span>
                    )}
                  </td>

                  {/* Menu actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      
                      {/* Toggle Status block */}
                      {u.role !== 'SUPER_ADMIN' ? (
                        <button
                          onClick={() => toggleUserStatus(u)}
                          className={`p-2 rounded-xl border transition-all ${
                            u.status === 'ACTIVE'
                              ? 'bg-amber-50 border-amber-200/60 text-amber-700 hover:bg-amber-100/80 '
                              : 'bg-emerald-50 border-emerald-200/60 text-emerald-700 hover:bg-emerald-100/80 '
                          }`}
                          title={u.status === 'ACTIVE' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          {u.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <span className="p-2 opacity-20 cursor-not-allowed text-stone-300">
                          <UserX className="w-3.5 h-3.5" />
                        </span>
                      )}

                      {/* Reset Pass button */}
                      <button
                        onClick={() => handleOpenResetModal(u)}
                        className="p-2 rounded-xl border border-yellow-200 bg-yellow-50/50 hover:bg-yellow-100 text-yellow-700 transition-all "
                        title="Reset Sandi"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="p-2 rounded-xl border border-emerald-100 soft-bg hover:bg-emerald-50 text-emerald-700 transition-all "
                        title="Edit Profil"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteClick(u)}
                        disabled={u.role === 'SUPER_ADMIN'}
                        className="p-2 rounded-xl border border-red-100 soft-bg hover:bg-red-50 text-red-600 disabled:opacity-20 disabled:hover:soft-bg disabled:hover:text-red-600 transition-all "
                        title="Hapus Akun"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-stone-400">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="text-xs font-bold">Tidak ada pengguna yang terdaftar atau cocok dengan pencarian.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USERS MOBILE CARDS (Mobile & Small Screens) */}
      <div className="space-y-3 block md:hidden">
        {filteredUsers.map((u: any) => (
          <div key={u.id} className="soft-card p-4 rounded-2xl border border-emerald-100/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {u.photoURL ? (
                  <LazyImage
                    src={u.photoURL}
                    alt={u.name}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-200/50 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm uppercase border border-emerald-200/40">
                    {u.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{u.name}</h4>
                  <p className="font-mono text-emerald-800 text-xs font-semibold">@{u.username}</p>
                </div>
              </div>
              <div>
                {u.status === 'ACTIVE' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                    <CheckCircle2 className="w-3 h-3" /> Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100">
                    <XCircle className="w-3 h-3" /> Nonaktif
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wider bg-emerald-50/60 text-emerald-700 border border-emerald-200/30 uppercase">
                {u.role.replace(/_/g, ' ')}
              </span>
              <span className="text-stone-600 font-bold font-mono text-[11px]">
                {u.contact || <span className="text-stone-300 font-sans font-normal italic">Kontak (-)</span>}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {u.role !== 'SUPER_ADMIN' && (
                <button
                  onClick={() => toggleUserStatus(u)}
                  className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1 ${
                    u.status === 'ACTIVE'
                      ? 'bg-amber-50 border-amber-200/60 text-amber-700'
                      : 'bg-emerald-50 border-emerald-200/60 text-emerald-700'
                  }`}
                >
                  {u.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-semibold">{u.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}</span>
                </button>
              )}
              <button
                onClick={() => handleOpenResetModal(u)}
                className="p-2 rounded-xl border border-yellow-200 bg-yellow-50/50 text-yellow-700 text-xs flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold">Reset</span>
              </button>
              <button
                onClick={() => handleOpenEditModal(u)}
                className="p-2 rounded-xl border border-emerald-100 bg-white text-emerald-700 text-xs flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold">Edit</span>
              </button>
              <button
                onClick={() => handleDeleteClick(u)}
                disabled={u.role === 'SUPER_ADMIN'}
                className="p-2 rounded-xl border border-red-100 bg-white text-red-600 disabled:opacity-20 text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-stone-400 bg-white rounded-2xl border border-slate-100">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p className="text-xs font-bold">Tidak ada pengguna yang terdaftar atau cocok dengan pencarian.</p>
          </div>
        )}
      </div>

      {/* --- ADD USER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#07140b]/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="soft-card w-full max-w-md p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-emerald-50 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-emerald-950 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" /> Daftarkan Pengguna Baru
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewUser} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1">Nama Pengguna *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alwi Nidzam, S.Kom."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="soft-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1">Username Unik *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. adminsma (huruf kecil)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="soft-input font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1">Kata Sandi Awal *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="soft-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1">Kontak / No. Telepon</label>
                <input
                  type="text"
                  placeholder="e.g. 081234567890"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="soft-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1">Wewenang / Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="soft-input font-bold cursor-pointer"
                  >
                    <option value="VIEWER">VIEWER</option>
                    <option value="KEPALA_SMA">KEPALA SEKOLAH SMA</option>
                    <option value="KEPALA_MTS">KEPALA SEKOLAH MTS</option>
                    <option value="KEPALA_TK">KEPALA SEKOLAH TK</option>
                    <option value="KEPALA_MADIN">KEPALA MADIN</option>
                    <option value="KEPALA_PESANTREN">KEPALA PESANTREN</option>
                    <option value="GURU_SMA">GURU SMA</option>
                    <option value="GURU_MTS">GURU MTS</option>
                    <option value="GURU_TK">GURU TK</option>
                    <option value="GURU_MADIN">GURU MADIN</option>
                    <option value="GURU_PESANTREN">GURU PESANTREN</option>
                    <option value="GURU">GURU (UMUM)</option>
                    <option value="STAFF">STAFF (STAF/PEGAWAI)</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                    <option value="ADMIN_SMA">ADMIN SMA</option>
                    <option value="ADMIN_MTS">ADMIN MTS</option>
                    <option value="ADMIN_MADIN">ADMIN MADIN</option>
                    <option value="ADMIN_TK">ADMIN TK</option>
                    <option value="ADMIN_PESANTREN">ADMIN PESANTREN</option>
                    <option value="ADMIN_SELAPANAN">ADMIN SELAPANAN</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1">Status Akun</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="soft-input font-bold cursor-pointer"
                  >
                    <option value="ACTIVE">AKTIF</option>
                    <option value="INACTIVE">NON-AKTIF</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-emerald-50 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-emerald-100 hover:bg-emerald-50/50 rounded-xl text-xs font-bold text-emerald-800 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="soft-button-primary px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-[#07140b]/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="soft-card w-full max-w-md p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-emerald-50 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-emerald-950 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" /> Edit Detail Pengguna
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1">Nama Pengguna *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alwi Nidzam, S.Kom."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="soft-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1">Username Unik</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. adminsma"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="soft-input font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1">Kontak / No. Telepon</label>
                <input
                  type="text"
                  placeholder="e.g. 081234567890"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="soft-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1">Wewenang / Role</label>
                  <select
                    value={role}
                    disabled={selectedUser.role === 'SUPER_ADMIN'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 disabled:opacity-50 focus:outline-none focus:border-emerald-500 focus:soft-bg transition-all cursor-pointer"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                    <option value="VIEWER">VIEWER</option>
                    <option value="KEPALA_SMA">KEPALA SEKOLAH SMA</option>
                    <option value="KEPALA_MTS">KEPALA SEKOLAH MTS</option>
                    <option value="KEPALA_TK">KEPALA SEKOLAH TK</option>
                    <option value="KEPALA_MADIN">KEPALA MADIN</option>
                    <option value="KEPALA_PESANTREN">KEPALA PESANTREN</option>
                    <option value="GURU_SMA">GURU SMA</option>
                    <option value="GURU_MTS">GURU MTS</option>
                    <option value="GURU_TK">GURU TK</option>
                    <option value="GURU_MADIN">GURU MADIN</option>
                    <option value="GURU_PESANTREN">GURU PESANTREN</option>
                    <option value="GURU">GURU (UMUM)</option>
                    <option value="STAFF">STAFF (STAF/PEGAWAI)</option>
                    <option value="ADMIN_SMA">ADMIN SMA</option>
                    <option value="ADMIN_MTS">ADMIN MTS</option>
                    <option value="ADMIN_MADIN">ADMIN MADIN</option>
                    <option value="ADMIN_TK">ADMIN TK</option>
                    <option value="ADMIN_PESANTREN">ADMIN PESANTREN</option>
                    <option value="ADMIN_SELAPANAN">ADMIN SELAPANAN</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1">Status Akun</label>
                  <select
                    value={status}
                    disabled={selectedUser.role === 'SUPER_ADMIN'}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 disabled:opacity-50 focus:outline-none focus:border-emerald-500 focus:soft-bg transition-all cursor-pointer"
                  >
                    <option value="ACTIVE">AKTIF</option>
                    <option value="INACTIVE">NON-AKTIF</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-emerald-50 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-emerald-100 hover:bg-emerald-50/50 rounded-xl text-xs font-bold text-emerald-800 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="soft-button-primary px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RESET PASSWORD MODAL --- */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-[#07140b]/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="soft-bg border border-yellow-100 rounded-xl w-full max-w-sm p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-yellow-50 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-yellow-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-yellow-600" /> Reset Kata Sandi User
              </h3>
              <button onClick={() => setShowResetModal(false)} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-yellow-50/60 border border-yellow-100 text-yellow-800 rounded-xl p-4 text-xs mb-4 flex gap-2.5 items-start font-medium leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-950">Perhatian Keamanan</p>
                <p className="mt-1 text-[11px] leading-relaxed text-yellow-900">
                  Tindakan ini akan menimpa sandi lama milik @<strong className="font-bold text-[#0c2214]">{selectedUser.username}</strong> dengan sandi baru di bawah ini.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-yellow-800 block mb-1">Kata Sandi Baru *</label>
                <input
                  type="password"
                  required
                  placeholder="Isi sandi baru minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-yellow-50/20 border border-yellow-100/70 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-yellow-500 focus:soft-bg transition-all"
                />
              </div>

              <div className="border-t border-yellow-50 pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 border border-yellow-100/50 hover:bg-yellow-50/40 rounded-xl text-xs font-bold text-yellow-850 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="soft-button-primary bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  Reset Sandi Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Hapus Pengguna"
        message={deleteConfirm.user ? `Apakah Anda yakin ingin menghapus user "${deleteConfirm.user.name}" (@${deleteConfirm.user.username})? Seluruh data session miliknya akan langsung hangus.` : ''}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isDanger={true}
        onConfirm={() => {
          if (deleteConfirm.user) {
            onDeleteUser(deleteConfirm.user.id);
          }
          setDeleteConfirm({ isOpen: false, user: null });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, user: null })}
      />

    </div>
  );
}
