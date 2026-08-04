import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit, Ban, Key, Trash2, CheckCircle } from 'lucide-react';
import { Staff } from '../../types';
import { FirestoreStaffRepository } from '../../repositories/FirestoreStaffRepository';
import { BarcodeManagementModal } from '../barcode/BarcodeManagementModal';
import { BarcodeService } from '../../services/BarcodeService';
import { FirestoreBarcodeRepository } from '../../repositories/FirestoreBarcodeRepository';
const barcodeService = new BarcodeService(new FirestoreBarcodeRepository());
import { StaffFormModal } from './StaffFormModal';

const staffRepo = new FirestoreStaffRepository();

export const StaffManagementPage: React.FC<{
  currentUser: any;
  onClose: () => void;
}> = ({ currentUser, onClose }) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStaffForBarcode, setSelectedStaffForBarcode] = useState<Staff | null>(null);

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await staffRepo.findAll();
      
      // Auto-generate barcodes for any staff missing them
      let needsReload = false;
      for (const s of data) {
        if (!s.barcodeToken) {
          try {
            await barcodeService.generateForStaff(s.id, 'SYSTEM_AUTO');
            needsReload = true;
          } catch(e) {
            console.error("Auto barcode gen failed for", s.id, e);
          }
        }
      }
      
      if (needsReload) {
        const updatedData = await staffRepo.findAll();
        setStaffList(updatedData);
      } else {
        setStaffList(data);
      }
      setStaffList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    setEditingStaff(null);
    setIsFormOpen(true);
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (staff: Staff) => {
    const newStatus = staff.employmentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const actionLabel = newStatus === 'SUSPENDED' ? 'menangguhkan (suspend)' : 'mengaktifkan kembali';
    if (!window.confirm(`Apakah Anda yakin ingin ${actionLabel} staf ${staff.fullName}?`)) return;

    try {
      await staffRepo.update(staff.id, {
        employmentStatus: newStatus,
        updatedBy: 'OP-SYSTEM',
      });
      await loadStaff();
    } catch (err) {
      console.error('Failed to update staff employmentStatus:', err);
      alert('Gagal memperbarui status staf.');
    }
  };

  const handleDeleteStaff = async (staff: Staff) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data staf ${staff.fullName}? Data dapat dikembalikan dari arsip jika diperlukan.`)) return;

    try {
      await staffRepo.softDelete(staff.id, 'OP-SYSTEM');
      await loadStaff();
    } catch (err) {
      console.error('Failed to soft delete staff:', err);
      alert('Gagal menghapus data staf.');
    }
  };

  const allowedInstitution = currentUser?.role?.startsWith('ADMIN_') ? currentUser.role.replace('ADMIN_', '') : null;
  const adminFilteredStaff = allowedInstitution && currentUser.role !== 'SUPER_ADMIN'
    ? staffList.filter(s => (s.institutions || []).map((i:any) => i.toUpperCase()).includes(allowedInstitution) || s.primaryInstitution?.toUpperCase() === allowedInstitution)
    : staffList;

  const filtered = adminFilteredStaff.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.position && s.position.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-6 shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Staf & Guru</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Kelola data tenaga pendidik, staf, dan kartu barcode kehadiran.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors">
            Kembali
          </button>
          <button 
            onClick={handleAddStaff}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Staf
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama, ID, atau jabatan staf..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Staf</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Instansi</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jabatan & Peran</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Barcode</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm font-semibold">Memuat data staf...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm font-semibold">
                      Belum ada staf terdaftar. Klik tombol <span className="font-bold text-indigo-600">Tambah Staf</span> untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  filtered.map(staff => (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-800">{staff.fullName}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{staff.id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {staff.institutions?.join(", ") || staff.primaryInstitution}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-700">{staff.position}</div>
                        <div className="text-xs text-slate-500">{staff.role} • {staff.employmentType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          staff.employmentStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          staff.employmentStatus === 'SUSPENDED' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {staff.employmentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedStaffForBarcode(staff)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            staff.barcodeToken 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <Key className="w-3.5 h-3.5" />
                          {staff.barcodeToken ? 'Kelola Barcode' : 'Buat Barcode'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEditStaff(staff)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                            title="Edit Staf"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(staff)}
                            className={`p-2 rounded-lg transition-colors ${
                              staff.employmentStatus === 'SUSPENDED' 
                                ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50' 
                                : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                            }`} 
                            title={staff.employmentStatus === 'SUSPENDED' ? 'Aktifkan Staf' : 'Suspend Staf'}
                          >
                            {staff.employmentStatus === 'SUSPENDED' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteStaff(staff)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Hapus Staf"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <StaffFormModal
        currentUser={currentUser}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        staff={editingStaff}
        onSuccess={() => loadStaff()}
      />

      <BarcodeManagementModal 
        isOpen={!!selectedStaffForBarcode}
        onClose={() => {
          setSelectedStaffForBarcode(null);
          loadStaff(); // Reload to get updated barcode status
        }}
        staff={selectedStaffForBarcode}
      />
    </div>
  );
};
