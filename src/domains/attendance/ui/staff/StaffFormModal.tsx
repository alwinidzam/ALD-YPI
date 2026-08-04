import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Staff, StaffRole, EmploymentType, StaffStatus } from '../../types';
import { InstitutionType } from '../../../../types';
import { FirestoreStaffRepository } from '../../repositories/FirestoreStaffRepository';

const staffRepo = new FirestoreStaffRepository();

interface StaffFormModalProps {
  currentUser?: any;
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null; // null = Add Mode, object = Edit Mode
  onSuccess: () => void;
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  staff,
  onSuccess,
}) => {
  const isEdit = !!staff;

  const [name, setName] = useState('');
  const [institutionId, setInstitutionId] = useState<InstitutionType>(currentUser?.role?.startsWith('ADMIN_') && currentUser.role !== 'SUPER_ADMIN' ? (currentUser.role.replace('ADMIN_', '') as InstitutionType) : 'SMA');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState<StaffRole>('TEACHER');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [status, setStatus] = useState<StaffStatus>('ACTIVE');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staff) {
      setName(staff.fullName || '');
      setInstitutionId(staff.primaryInstitution || 'SMA');
      setPosition(staff.position || '');
      setRole(staff.role || 'TEACHER');
      setEmploymentType(staff.employmentType || 'FULL_TIME');
      setStatus(staff.employmentStatus || 'ACTIVE');
    } else {
      setName('');
      setInstitutionId('SMA');
      setPosition('');
      setRole('TEACHER');
      setEmploymentType('FULL_TIME');
      setStatus('ACTIVE');
    }
    setError(null);
  }, [staff, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama staf/guru wajib diisi.');
      return;
    }
    if (!position.trim()) {
      setError('Jabatan wajib diisi.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEdit && staff) {
        await staffRepo.update(staff.id, {
          fullName: name.trim(),
          primaryInstitution: institutionId,
          institutions: [institutionId],
          position: position.trim(),
          role,
          employmentType,
          employmentStatus: status,
          accountStatus: 'NO_ACCOUNT',
          updatedBy: 'OP-SYSTEM',
        });
      } else {
        await staffRepo.create({
          schemaVersion: 1,
          barcodeToken: `YPI-STAFF-${Date.now()}`,
          fullName: name.trim(),
          primaryInstitution: institutionId,
          institutions: [institutionId],
          position: position.trim(),
          role,
          employmentType,
          employmentStatus: status,
          accountStatus: 'NO_ACCOUNT',
          isDeleted: false,
          createdBy: 'OP-SYSTEM',
          updatedBy: 'OP-SYSTEM',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving staff:', err);
      setError(err?.message || 'Gagal menyimpan data staf. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isEdit ? 'Edit Data Staf / Guru' : 'Tambah Staf / Guru Baru'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isEdit ? 'Perbarui informasi data kepegawaian' : 'Isi formulir untuk menambahkan staf ke sistem'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap & Gelar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Drs. H. Ahmad Dahlan, M.Pd"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Instansi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Instansi <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value as InstitutionType)}
              >
                <option value="YPI">YPI (Pusat)</option>
                <option value="SMA">SMA</option>
                <option value="MTS">MTs</option>
                <option value="MADIN">MADIN</option>
              </select>
            </div>

            {/* Jabatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jabatan / Tugas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="misal: Guru PAI / Staf TU"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori Peran
              </label>
              <select
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
              >
                <option value="TEACHER">GURU / TENAGA PENDIDIK</option>
                <option value="ADMIN">ADMIN / STAF TU</option>
                <option value="PRINCIPAL">KEPALA SCHOOL / KEPALA SEKL</option>
                <option value="TREASURER">BENDAHARA</option>
                <option value="OPERATOR">OPERATOR SISTEM</option>
                <option value="SECURITY">KEAMANAN / SATPAM</option>
                <option value="CLEANING">KEBERSIHAN</option>
                <option value="OTHER">LAINNYA</option>
              </select>
            </div>

            {/* Status Kepegawaian */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status Kepegawaian
              </label>
              <select
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              >
                <option value="FULL_TIME">TETAP (FULL-TIME)</option>
                <option value="HONORARY">HONORER</option>
                <option value="CONTRACT">KONTRAK</option>
                <option value="PART_TIME">PARUH WAKTU</option>
              </select>
            </div>
          </div>

          {/* Status Akun */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Status Keaktifan Akun
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('ACTIVE')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  status === 'ACTIVE'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ACTIVE
              </button>
              <button
                type="button"
                onClick={() => setStatus('INACTIVE')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  status === 'INACTIVE'
                    ? 'bg-slate-200 border-slate-300 text-slate-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                INACTIVE
              </button>
              <button
                type="button"
                onClick={() => setStatus('SUSPENDED')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  status === 'SUSPENDED'
                    ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                SUSPENDED
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Simpan Perubahan' : 'Tambah Staf'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
