import React from 'react';
import { Users, UserCheck, Clock, CheckSquare, Briefcase, Shield, Activity, XOctagon } from 'lucide-react';
import { DashboardStats } from '../../hooks/useAttendanceDashboard';

export const DashboardWidgets: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* Attendance Stats Row */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Statistik Kehadiran Hari Ini</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard 
            title="Hadir Hari Ini" 
            value={stats.totalPresent} 
            icon={<UserCheck className="w-5 h-5 text-emerald-500" />} 
            trend="Total aktivitas hari ini"
            colorClass="bg-emerald-50 border-emerald-100"
          />
          <SummaryCard 
            title="Selesai (Check Out)" 
            value={stats.totalCheckedOut} 
            icon={<CheckSquare className="w-5 h-5 text-blue-500" />} 
            trend="Sudah pulang"
            colorClass="bg-blue-50 border-blue-100"
          />
          <SummaryCard 
            title="Input Manual" 
            value={stats.totalManual} 
            icon={<Clock className="w-5 h-5 text-amber-500" />} 
            trend="Entri tanpa scanner"
            colorClass="bg-amber-50 border-amber-100"
          />
          <SummaryCard 
            title="Belum Hadir" 
            value={Math.max(0, stats.totalStaff - stats.totalPresent)} 
            icon={<Clock className="w-5 h-5 text-red-500" />} 
            trend="Belum ada aktivitas"
            colorClass="bg-red-50 border-red-100"
          />
        </div>
      </div>

      {/* Staff Master Directory Stats Row */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Statistik Kepegawaian (Master)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MiniCard 
            title="Total Staf" 
            value={stats.totalStaff} 
            icon={<Users className="w-4 h-4 text-indigo-500" />} 
          />
          <MiniCard 
            title="Guru / Pengajar" 
            value={stats.totalTeachers} 
            icon={<Briefcase className="w-4 h-4 text-emerald-500" />} 
          />
          <MiniCard 
            title="Kepala Sekolah" 
            value={stats.totalPrincipals} 
            icon={<Shield className="w-4 h-4 text-purple-500" />} 
          />
          <MiniCard 
            title="Staf Aktif" 
            value={stats.activeStaff} 
            icon={<Activity className="w-4 h-4 text-blue-500" />} 
          />
          <MiniCard 
            title="Staf Nonaktif" 
            value={stats.inactiveStaff} 
            icon={<XOctagon className="w-4 h-4 text-red-500" />} 
          />
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon, trend, colorClass }: { title: string, value: number | string, icon: React.ReactNode, trend: string, colorClass: string }) => (
  <div className={`p-5 rounded-2xl border ${colorClass} shadow-sm`}>
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-slate-600">{title}</h3>
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
        {icon}
      </div>
    </div>
    <div className="mt-4">
      <span className="text-3xl font-black text-slate-800 tracking-tight">{value}</span>
      <p className="text-xs font-semibold text-slate-500 mt-1">{trend}</p>
    </div>
  </div>
);

const MiniCard = ({ title, value, icon }: { title: string, value: number | string, icon: React.ReactNode }) => (
  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center gap-4">
    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{title}</p>
      <p className="text-lg font-black text-slate-800">{value}</p>
    </div>
  </div>
);
