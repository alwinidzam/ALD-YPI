import React, { useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { DashboardWidgets } from './components/DashboardWidgets';
import { AttendanceTable } from './components/AttendanceTable';
import { useAttendanceDashboard } from '../hooks/useAttendanceDashboard';
import { ManualAttendanceDialog } from '../manual/ManualAttendanceDialog';
import { AttendanceService } from '../../services/AttendanceService';
import { FirestoreAttendanceRepository } from '../../repositories/FirestoreAttendanceRepository';
import { FirestoreAttendanceTransactionService } from '../../services/FirestoreAttendanceTransactionService';
import { FirestoreStaffRepository } from '../../repositories/FirestoreStaffRepository';
import { FirestoreBarcodeRepository } from '../../repositories/FirestoreBarcodeRepository';

// Initialize service for Manual Dialog
// In production, this should be provided via React Context
const attendanceService = new AttendanceService(
  new FirestoreAttendanceRepository(),
  new FirestoreAttendanceTransactionService(),
  new FirestoreStaffRepository(),
  new FirestoreBarcodeRepository(),
  undefined
);

export const AttendanceDashboardPage: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  const { attendances, stats, staffData } = useAttendanceDashboard(currentUser);
  const [showManualDialog, setShowManualDialog] = useState(false);

  // Mock operator data - in real app get from AuthContext
  const operatorId = "OP-123";
  const operatorName = "Admin System";

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-6 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Kehadiran</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Pantau dan kelola data kehadiran staf secara real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('ald-navigate', { detail: 'attendance-staff' }))}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold text-sm transition-all shadow-sm"
            >
              Manajemen Staf
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold text-sm transition-all shadow-sm">
              <Download className="w-4 h-4" />
              Ekspor Data
            </button>
            <button 
              onClick={() => setShowManualDialog(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Input Manual
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        <DashboardWidgets stats={stats} />
        <AttendanceTable attendances={attendances} staffList={staffData} />
      </div>

      <ManualAttendanceDialog 
        isOpen={showManualDialog}
        onClose={() => setShowManualDialog(false)}
        attendanceService={attendanceService}
        operatorId={operatorId}
        operatorName={operatorName}
      />
    </div>
  );
};
