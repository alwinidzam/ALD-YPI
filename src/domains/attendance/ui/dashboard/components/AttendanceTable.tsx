import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, SearchX, Clock, MapPin, Activity } from 'lucide-react';
import { Attendance } from '../../../types';

export const AttendanceTable: React.FC<{ attendances: Attendance[], staffList: any[] }> = ({ attendances, staffList }) => {
  const getStaffName = (id: string) => {
    if (!staffList) return id;
    const s = staffList.find(x => x.id === id);
    return s ? s.fullName : id;
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    return attendances.filter(att => {
      const matchSearch = (getStaffName(att.staffId).toLowerCase().includes(searchQuery.toLowerCase()) || att.staffId.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          att.institutionNameSnapshot.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || att.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [attendances, searchQuery, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Check In</span>;
      case 'CHECKED_OUT':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Check Out</span>;
      case 'MANUAL':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Manual</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const formatTime = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return '-';
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari ID staf atau instansi..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">Semua Status</option>
            <option value="CHECKED_IN">Check In</option>
            <option value="CHECKED_OUT">Check Out</option>
            <option value="MANUAL">Manual</option>
          </select>
          <button className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all" title="Filter Tambahan">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Staf</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Instansi</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Waktu Terakhir</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check In / Out</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Sumber</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <SearchX className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-base font-bold text-slate-700">Tidak ada data ditemukan</h3>
                    <p className="text-sm mt-1">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">{getStaffName(att.staffId)}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{att.id.slice(-6)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {att.institutionNameSnapshot}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatTime(att.updatedAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-medium text-slate-500 space-y-1">
                      <div><span className="text-slate-400 w-6 inline-block">In:</span> {formatTime(att.checkIn)}</div>
                      <div><span className="text-slate-400 w-6 inline-block">Out:</span> {formatTime(att.checkOut)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(att.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <Activity className="w-3.5 h-3.5" />
                      {att.source}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <p className="text-sm font-medium text-slate-500">
          Menampilkan {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} hasil
        </p>
        <div className="flex items-center gap-1">
          <button 
            className="p-2 text-slate-500 hover:bg-white hover:text-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 text-sm font-semibold text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button 
            className="p-2 text-slate-500 hover:bg-white hover:text-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
