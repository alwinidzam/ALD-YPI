import React, { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';
import { Staff } from '../../types';
import { FirestoreStaffRepository } from '../../repositories/FirestoreStaffRepository';
import { AttendanceService } from '../../services/AttendanceService';

const staffRepo = new FirestoreStaffRepository();

interface ManualAttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceService: AttendanceService;
  operatorId: string;
  operatorName: string;
}

export const ManualAttendanceDialog: React.FC<ManualAttendanceDialogProps> = ({ 
  isOpen, onClose, attendanceService, operatorId, operatorName 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  
  const [action, setAction] = useState<'CHECK_IN' | 'CHECK_OUT' | 'BOTH'>('CHECK_IN');
  const [checkInTime, setCheckInTime] = useState<string>('07:00');
  const [checkOutTime, setCheckOutTime] = useState<string>('16:00');
  const [reason, setReason] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load some staff for selection
      staffRepo.findAll({ limit: 20 }).then(setStaffList).catch(console.error);
    }
  }, [isOpen]);

  const filteredStaff = staffList.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toLocaleDateString('en-CA');
      
      let checkInDate: Date | null = null;
      let checkOutDate: Date | null = null;
      
      if (action === 'CHECK_IN' || action === 'BOTH') {
        checkInDate = new Date(`${today}T${checkInTime}:00`);
      }
      if (action === 'CHECK_OUT' || action === 'BOTH') {
        checkOutDate = new Date(`${today}T${checkOutTime}:00`);
      }

      await attendanceService.processManualAttendance(
        selectedStaff.id,
        today,
        checkInDate,
        checkOutDate,
        reason,
        operatorId,
        operatorName
      );
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses data.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-full overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Input Kehadiran Manual</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Hanya gunakan jika scanner bermasalah atau staf lupa scan.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form id="manual-attendance-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Staff Selection */}
            <section>
              <h3 className="text-sm font-bold text-slate-700 mb-3">1. Pilih Staf</h3>
              {!selectedStaff ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari nama atau ID staf..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50/50">
                    {filteredStaff.map(staff => (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => setSelectedStaff(staff)}
                        className="w-full flex items-center justify-between p-3 hover:bg-white border-b border-slate-100 last:border-0 transition-colors text-left"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">{staff.name}</p>
                          <p className="text-xs font-medium text-slate-500">{staff.role} • {staff.institutionId}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-indigo-900">{selectedStaff.fullName}</p>
                    <p className="text-xs font-medium text-indigo-700/80">{selectedStaff.role} • ID: {selectedStaff.id}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedStaff(null)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    Ganti
                  </button>
                </div>
              )}
            </section>

            {/* Action Selection */}
            <section>
              <h3 className="text-sm font-bold text-slate-700 mb-3">2. Jenis Kehadiran</h3>
              <div className="grid grid-cols-3 gap-3">
                {(['CHECK_IN', 'CHECK_OUT', 'BOTH'] as const).map(act => (
                  <label 
                    key={act}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      action === act 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="action" 
                      className="sr-only"
                      checked={action === act}
                      onChange={() => setAction(act)}
                    />
                    <span className="text-sm font-bold">
                      {act === 'CHECK_IN' ? 'Check In Saja' : act === 'CHECK_OUT' ? 'Check Out Saja' : 'Keduanya'}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* Time Input */}
            <section className="grid grid-cols-2 gap-4">
              <div className={action === 'CHECK_OUT' ? 'opacity-50 pointer-events-none' : ''}>
                <label className="block text-sm font-bold text-slate-700 mb-2">Waktu Check In</label>
                <input 
                  type="time" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  value={checkInTime}
                  onChange={e => setCheckInTime(e.target.value)}
                  required={action !== 'CHECK_OUT'}
                />
              </div>
              <div className={action === 'CHECK_IN' ? 'opacity-50 pointer-events-none' : ''}>
                <label className="block text-sm font-bold text-slate-700 mb-2">Waktu Check Out</label>
                <input 
                  type="time" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  value={checkOutTime}
                  onChange={e => setCheckOutTime(e.target.value)}
                  required={action !== 'CHECK_IN'}
                />
              </div>
            </section>

            {/* Mandatory Reason */}
            <section>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Alasan Manual <span className="text-red-500">*</span>
              </label>
              <textarea 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 resize-none"
                rows={3}
                placeholder="Contoh: Lupa bawa kartu absen, scanner error, dll..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
              />
            </section>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button 
            form="manual-attendance-form"
            type="submit"
            disabled={!selectedStaff || !reason || isLoading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Simpan Manual
          </button>
        </div>
      </div>
    </div>
  );
};
