import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ShieldAlert, Clock, User, Briefcase, MapPin } from 'lucide-react';
import { Attendance, Staff } from '../../../types';
import { FirestoreStaffRepository } from '../../../repositories/FirestoreStaffRepository';

const staffRepo = new FirestoreStaffRepository();

export interface ScanResultProps {
  status: 'SUCCESS' | 'ERROR';
  attendance?: Attendance;
  error?: Error;
  timestamp: Date;
}

export const StaffResultPanel: React.FC<{ scan: ScanResultProps | null }> = ({ scan }) => {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scan?.status === 'SUCCESS' && scan.attendance?.staffId) {
      setLoading(true);
      staffRepo.findById(scan.attendance.staffId).then((data) => {
        setStaff(data);
        setLoading(false);
      }).catch(console.error);
    } else {
      setStaff(null);
    }
  }, [scan]);

  if (!scan) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <User className="w-24 h-24 mb-4 text-slate-100" />
        <h3 className="text-xl font-bold text-slate-300">Siap Memindai</h3>
        <p className="text-sm font-medium mt-2">Hasil pindai akan muncul di sini.</p>
      </div>
    );
  }

  const isSuccess = scan.status === 'SUCCESS';
  const timeStr = scan.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      key={scan.timestamp.getTime()}
      className={`bg-white rounded-3xl p-8 border-2 shadow-xl relative overflow-hidden ${
        isSuccess ? 'border-emerald-500 shadow-emerald-500/10' : 'border-red-500 shadow-red-500/10'
      }`}
    >
      {/* Background Decor */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 opacity-20 pointer-events-none ${
        isSuccess ? 'bg-emerald-500' : 'bg-red-500'
      }`} />

      {/* Header Result */}
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
          isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
        }`}>
          {isSuccess ? <CheckCircle2 className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
        </div>
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${isSuccess ? 'text-emerald-700' : 'text-red-700'}`}>
            {isSuccess ? (scan.attendance?.status === 'CHECKED_IN' ? 'CHECK IN SUKSES' : 'CHECK OUT SUKSES') : 'PINDAI GAGAL'}
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" /> {timeStr}
          </p>
        </div>
      </div>

      {!isSuccess ? (
        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl relative z-10">
          <p className="text-lg font-bold text-red-700">{scan.error?.message || 'Token tidak valid'}</p>
          <p className="text-sm text-red-600/80 mt-2 font-medium">Pastikan barcode yang dipindai aktif dan terdaftar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-8 relative z-10">
          {/* Photo */}
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-2xl bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
              {loading ? (
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <User className="w-20 h-20 text-slate-300" />
              )}
            </div>
            <div className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold ${
              scan.attendance?.status === 'CHECKED_IN' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {scan.attendance?.status === 'CHECKED_IN' ? 'MASUK' : 'PULANG'}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">
                {staff ? staff.fullName : (loading ? 'Memuat...' : scan.attendance?.staffId)}
              </h3>
              <div className="flex items-center gap-2 text-base font-semibold text-indigo-600">
                <MapPin className="w-4 h-4" />
                {scan.attendance?.institutionNameSnapshot || '-'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Peran</span>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  {staff ? staff.role : '-'}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Posisi</span>
                <span className="text-sm font-bold text-slate-700 truncate block">
                  {staff ? staff.position : '-'}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe Pegawai</span>
                <span className="text-sm font-bold text-slate-700">
                  {staff ? staff.employmentType : '-'}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Waktu Check-In</span>
                <span className="text-sm font-bold text-slate-700">
                  {scan.attendance?.checkIn 
                    ? (scan.attendance.checkIn instanceof Date ? scan.attendance.checkIn : new Date(scan.attendance.checkIn)).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
