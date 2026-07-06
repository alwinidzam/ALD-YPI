/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { User, UserRole } from '../types';
import { hashPassword } from '../data';
import ConfirmDialog from './ConfirmDialog';

interface UserManagementViewProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (id: string, updated: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

export default function UserManagementView({ users, onAddUser, onUpdateUser, onDeleteUser }: UserManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
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
  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSaveNewUser = (e: React.FormEvent) => {
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

    onAddUser({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      role,
      status,
      passwordHash: hashPassword(password.trim()),
      contact: contact.trim()
    });

    setShowAddModal(false);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
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

    onUpdateUser(selectedUser.id, {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      role,
      status,
      contact: contact.trim()
    });

    setShowEditModal(false);
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword.trim()) return;

    onUpdateUser(selectedUser.id, {
      passwordHash: hashPassword(newPassword.trim())
    });

    alert(`Sandi untuk akun @${selectedUser.username} berhasil di-reset.`);
    setShowResetModal(false);
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
          <h2 className="text-xl font-extrabold tracking-tight text-emerald-950 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Manajemen Pengguna (User)
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Daftar operator, admin unit lembaga, serta viewer eksternal dengan hak akses terkontrol.
          </p>
        </div>
        
        <button
          onClick={handleOpenAddModal}
          className="soft-button-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 self-end sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" /> Tambah User Baru
        </button>
      </div>

      {/* SEARCH FIELD */}
      <div className="relative bg-white border border-emerald-100/50 rounded-2xl p-3 shadow-[4px_4px_16px_rgba(165,180,169,0.08)]">
        <Search className="w-4 h-4 text-emerald-600/60 absolute left-6 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama, username, atau jenis wewenang..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-emerald-50/30 border border-emerald-100/80 rounded-xl pl-11 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder-stone-400"
        />
      </div>

      {/* USERS LIST TABLE */}
      <div className="bg-white border border-emerald-100/60 rounded-2xl overflow-hidden shadow-[6px_6px_20px_rgba(165,180,169,0.12)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-50/40 to-white text-emerald-900 font-bold border-b border-emerald-100/50">
                <th className="p-4">Nama Pengguna</th>
                <th className="p-4">Username</th>
                <th className="p-4">Wewenang / Lembaga</th>
                <th className="p-4">No. Kontak</th>
                <th className="p-4 w-[110px]">Status Akun</th>
                <th className="p-4 w-[180px] text-right">Menu Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50/50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-emerald-50/20 transition-colors">
                  
                  {/* Name Card */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-emerald-200/50 shadow-sm shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-emerald-800 flex items-center justify-center font-extrabold text-xs uppercase border border-emerald-200/40">
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
                    @{u.username}
                  </td>

                  {/* Role */}
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-extrabold tracking-wider bg-emerald-50/60 text-emerald-700 border border-emerald-200/30 uppercase">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Kontak */}
                  <td className="p-4 text-stone-600 font-bold font-mono">
                    {u.contact || <span className="text-stone-300 font-sans font-medium italic">Belum diisi</span>}
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    {u.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/50 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-100 shadow-sm">
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
                              ? 'bg-amber-50 border-amber-200/60 text-amber-700 hover:bg-amber-100/80 hover:shadow-sm'
                              : 'bg-emerald-50 border-emerald-200/60 text-emerald-700 hover:bg-emerald-100/80 hover:shadow-sm'
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

                      {/* Reset Pass button (Yellow sweetener!) */}
                      <button
                        onClick={() => handleOpenResetModal(u)}
                        className="p-2 rounded-xl border border-yellow-200 bg-yellow-50/50 hover:bg-yellow-100 text-yellow-700 transition-all hover:shadow-sm"
                        title="Reset Sandi"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="p-2 rounded-xl border border-emerald-100 bg-white hover:bg-emerald-50 text-emerald-700 transition-all hover:shadow-sm"
                        title="Edit Profil"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteClick(u)}
                        disabled={u.role === 'SUPER_ADMIN'}
                        className="p-2 rounded-xl border border-red-100 bg-white hover:bg-red-50 text-red-600 disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-red-600 transition-all hover:shadow-sm"
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

      {/* --- ADD USER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#07140b]/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-emerald-100/55 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-emerald-50 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" /> Daftarkan Pengguna Baru
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewUser} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">Nama Pengguna *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alwi Nidzam, S.Kom."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">Username Unik *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. adminsma (huruf kecil)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">Kata Sandi Awal *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">Kontak / No. Telepon</label>
                <input
                  type="text"
                  placeholder="e.g. 081234567890"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">Wewenang / Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="VIEWER">VIEWER</option>
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
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">Status Akun</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
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
          <div className="bg-white border border-emerald-100/55 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-emerald-50 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" /> Edit Detail Pengguna
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">Nama Pengguna *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alwi Nidzam, S.Kom."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">Username Unik</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. adminsma"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">Kontak / No. Telepon</label>
                <input
                  type="text"
                  placeholder="e.g. 081234567890"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">Wewenang / Role</label>
                  <select
                    value={role}
                    disabled={selectedUser.role === 'SUPER_ADMIN'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 disabled:opacity-50 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                    <option value="VIEWER">VIEWER</option>
                    <option value="ADMIN_SMA">ADMIN SMA</option>
                    <option value="ADMIN_MTS">ADMIN MTS</option>
                    <option value="ADMIN_MADIN">ADMIN MADIN</option>
                    <option value="ADMIN_TK">ADMIN TK</option>
                    <option value="ADMIN_PESANTREN">ADMIN PESANTREN</option>
                    <option value="ADMIN_SELAPANAN">ADMIN SELAPANAN</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">Status Akun</label>
                  <select
                    value={status}
                    disabled={selectedUser.role === 'SUPER_ADMIN'}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-emerald-50/20 border border-emerald-100/70 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-950 disabled:opacity-50 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
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
          <div className="bg-white border border-yellow-100 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-yellow-50 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-yellow-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-yellow-600" /> Reset Kata Sandi User
              </h3>
              <button onClick={() => setShowResetModal(false)} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-yellow-50/60 border border-yellow-100 text-yellow-800 rounded-2xl p-4 text-xs mb-4 flex gap-2.5 items-start font-medium leading-relaxed shadow-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-extrabold text-yellow-950">Perhatian Keamanan</p>
                <p className="mt-1 text-[11px] leading-relaxed text-yellow-900">
                  Tindakan ini akan menimpa sandi lama milik @<strong className="font-bold text-[#0c2214]">{selectedUser.username}</strong> dengan sandi baru di bawah ini.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-yellow-800 block mb-1">Kata Sandi Baru *</label>
                <input
                  type="password"
                  required
                  placeholder="Isi sandi baru minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-yellow-50/20 border border-yellow-100/70 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-yellow-500 focus:bg-white transition-all"
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
                  className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-yellow-500/10 cursor-pointer"
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
