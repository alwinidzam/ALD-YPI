/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle,
  FileText,
  Trash2,
  Lock,
  UserPlus,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  HardDrive,
  Database,
  Building2,
  AlertTriangle,
  X,
  Sparkles,
  ShieldAlert,
  Info
} from 'lucide-react';
import { AuditLog, AuditAction, DocumentMetadata, InstitutionType } from '../types';

interface AuditLogViewProps {
  logs: AuditLog[];
  documents?: DocumentMetadata[];
  onClearLogs?: () => void;
}

export default function AuditLogView({ logs, documents = [], onClearLogs }: AuditLogViewProps) {
  const [activeTab, setActiveTab] = useState<'logs' | 'storage'>('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  
  // Custom High Security Confirmation States
  const [showConfirm, setShowConfirm] = useState(false);
  const [understandChecked, setUnderstandChecked] = useState(false);
  const [verificationText, setVerificationText] = useState('');

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);

    const matchesAction = actionFilter === 'ALL' ? true : log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action: AuditAction) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'LOGOUT':
        return 'bg-stone-100 text-stone-600 border-stone-200/60';
      case 'UPLOAD':
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case 'DELETE':
        return 'bg-red-50 text-red-700 border-red-200/60';
      case 'DOWNLOAD':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
      case 'SEARCH':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      case 'VIEW_PDF':
        return 'bg-purple-50 text-purple-700 border-purple-200/60';
      case 'CREATE_USER':
        return 'bg-teal-50 text-teal-700 border-teal-200/60';
      case 'RESET_PASSWORD':
        return 'bg-orange-50 text-orange-700 border-orange-200/60';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200/60';
    }
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'LOGIN':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'UPLOAD':
        return <FileText className="w-3.5 h-3.5" />;
      case 'DELETE':
        return <Trash2 className="w-3.5 h-3.5" />;
      case 'RESET_PASSWORD':
        return <Lock className="w-3.5 h-3.5" />;
      case 'CREATE_USER':
        return <UserPlus className="w-3.5 h-3.5" />;
      default:
        return <History className="w-3.5 h-3.5" />;
    }
  };

  // --- STORAGE STATS COMPUTATIONS ---
  const instStats = [
    { type: 'YPI' as InstitutionType, label: 'Kantor Pusat Yayasan (YPI)', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { type: 'SMA' as InstitutionType, label: 'SMA Raudhotut Tholibin', color: 'text-blue-700 bg-blue-50 border-blue-100' },
    { type: 'MTS' as InstitutionType, label: 'MTs Raudhotut Tholibin', color: 'text-sky-700 bg-sky-50 border-sky-100' },
    { type: 'MADIN' as InstitutionType, label: 'Madrasah Diniyah (MADIN)', color: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
    { type: 'TK' as InstitutionType, label: 'TK Raudhotut Tholibin / RA', color: 'text-amber-700 bg-amber-50 border-amber-100' },
    { type: 'PESANTREN' as InstitutionType, label: 'Pondok Pesantren / Selapanan', color: 'text-pink-700 bg-pink-50 border-pink-100' },
  ].map((inst) => {
    const instDocs = (documents || []).filter((d) => d.institution === inst.type);
    const count = instDocs.length;
    
    const sizeMB = instDocs.reduce((acc, d) => {
      const sizeStr = d.fileSize || '0';
      const parsed = parseFloat(sizeStr);
      if (isNaN(parsed)) return acc;
      if (sizeStr.toUpperCase().includes('KB')) {
        return acc + (parsed / 1024);
      } else if (sizeStr.toUpperCase().includes('GB')) {
        return acc + (parsed * 1024);
      } else {
        return acc + parsed;
      }
    }, 0);
    
    return {
      ...inst,
      count,
      sizeMB,
      sizeDisplay: sizeMB >= 1024 ? `${(sizeMB / 1024).toFixed(3)} GB` : `${sizeMB.toFixed(2)} MB`
    };
  });

  const totalMB = instStats.reduce((acc, item) => acc + item.sizeMB, 0);
  const totalGB = totalMB / 1024;
  const quotaGB = 50.0;
  const storagePercentage = Math.min((totalGB / quotaGB) * 100, 100);

  const triggerOpenConfirm = () => {
    setUnderstandChecked(false);
    setVerificationText('');
    setShowConfirm(true);
  };

  const handleConfirmClear = () => {
    if (understandChecked && verificationText.trim().toUpperCase() === 'KONFIRMASI') {
      if (onClearLogs) {
        onClearLogs();
      }
      setShowConfirm(false);
      setUnderstandChecked(false);
      setVerificationText('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-emerald-950 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" /> Audit & Manajemen Penyimpanan
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Analisis penggunaan ruang kearsipan digital serta histori aktivitas sistem yang tercatat otomatis.
          </p>
        </div>
        {onClearLogs && activeTab === 'logs' && (
          <button
            onClick={triggerOpenConfirm}
            className="text-xs font-bold text-red-600 hover:text-red-750 bg-red-50 hover:bg-red-100/80 px-4 py-2.5 rounded-xl border border-red-200/40 transition-all self-end sm:self-auto active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Bersihkan Log
          </button>
        )}
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-emerald-100/50 gap-6">
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'text-emerald-950 font-bold'
              : 'text-stone-400 hover:text-emerald-800'
          }`}
        >
          <History className={`w-4 h-4 ${activeTab === 'logs' ? 'text-emerald-600' : 'text-stone-400'}`} />
          Log Aktivitas Sistem
          {activeTab === 'logs' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'storage'
              ? 'text-emerald-950 font-bold'
              : 'text-stone-400 hover:text-emerald-800'
          }`}
        >
          <HardDrive className={`w-4 h-4 ${activeTab === 'storage' ? 'text-emerald-600' : 'text-stone-400'}`} />
          Manajemen Penyimpanan & Riwayat
          {activeTab === 'storage' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'logs' ? (
        <>
          {/* SEARCH AND FILTERS */}
          <div className="soft-card p-6 flex flex-col md:flex-row items-center gap-4">
            {/* Search */}
            <div className="relative w-full md:flex-1">
              <Search className="w-4 h-4 text-emerald-600/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, username, log detail, atau IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="soft-input pl-10"
              />
            </div>

            {/* Action filter dropdown */}
            <div className="soft-input flex items-center gap-2 w-full md:w-auto shrink-0">
              <Filter className="w-3.5 h-3.5 text-emerald-600/60" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-emerald-950 outline-none cursor-pointer w-full focus:ring-0"
              >
                <option value="ALL">Semua Jenis Aktivitas</option>
                <option value="LOGIN">Autentikasi: LOGIN</option>
                <option value="LOGOUT">Autentikasi: LOGOUT</option>
                <option value="UPLOAD">Berkas: UPLOAD PDF</option>
                <option value="DELETE">Berkas: DELETE PDF</option>
                <option value="DOWNLOAD">Berkas: DOWNLOAD PDF</option>
                <option value="VIEW_PDF">Berkas: LIHAT PDF</option>
                <option value="CREATE_USER">User: TAMBAH USER</option>
                <option value="RESET_PASSWORD">User: RESET PASSWORD</option>
              </select>
            </div>
          </div>

          {/* LOGS LIST (Desktop Table) */}
          <div className="soft-card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-700 font-semibold border-b border-slate-100">
                    <th className="p-4 w-[160px]">Waktu Kejadian</th>
                    <th className="p-4">Pengguna</th>
                    <th className="p-4 w-[120px]">Jenis Kegiatan</th>
                    <th className="p-4">Keterangan / Detail Laporan</th>
                    <th className="p-4 w-[110px] text-right">Alamat IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50/50">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-emerald-50/20 transition-colors">
                      {/* Timestamp */}
                      <td className="p-4 text-stone-500 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600/50 shrink-0" />
                          <span>
                            {new Date(log.timestamp).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-[10px] text-stone-300">|</span>
                          <span className="font-mono text-emerald-900/80 font-semibold">
                            {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* User Profile info */}
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-semibold text-[10px] uppercase border border-emerald-200/40">
                            {log.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 truncate">{log.name}</p>
                            <p className="text-[10px] font-mono text-stone-400 truncate">
                              @{log.username} • <span className="font-sans font-bold tracking-widest text-[8px] uppercase text-yellow-600">{log.role.replace('ADMIN_', '')}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${getActionBadgeColor(log.action)}`}>
                          {getActionIcon(log.action)}
                          <span>{log.action}</span>
                        </span>
                      </td>

                      {/* Details info */}
                      <td className="p-4 font-semibold text-stone-700 max-w-sm break-words">
                        {log.details}
                      </td>

                      {/* IP Address */}
                      <td className="p-4 font-mono text-[10px] text-emerald-800/60 font-bold text-right">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}

                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-stone-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                        <p className="text-xs font-bold">Tidak ada log audit yang cocok dengan filter pencarian.</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">Coba gunakan kata kunci pencarian yang lain.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LOGS LIST (Mobile Cards) */}
          <div className="space-y-3 block md:hidden">
            {filteredLogs.map((log) => (
              <div key={log.id} className="soft-card p-4 rounded-2xl border border-emerald-100/60 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-[10px] uppercase border border-emerald-200/40 shrink-0">
                      {log.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-xs">{log.name}</h4>
                      <p className="text-[10px] font-mono text-stone-400">@{log.username}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-semibold ${getActionBadgeColor(log.action)}`}>
                    {getActionIcon(log.action)}
                    <span>{log.action}</span>
                  </span>
                </div>

                <p className="text-xs text-stone-700 font-medium leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  {log.details}
                </p>

                <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600/50" />
                    <span>
                      {new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="font-mono text-emerald-800/60 font-semibold">{log.ipAddress}</span>
                </div>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div className="p-8 text-center text-stone-400 bg-white rounded-2xl border border-slate-100">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                <p className="text-xs font-bold">Tidak ada log audit yang cocok dengan filter pencarian.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* STORAGE MANAGEMENT PANEL */
        <div className="space-y-6">
          
          {/* TOP OVERVIEW CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Storage metric */}
            <div className="soft-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">Ruang Penyimpanan (Storage)</span>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <HardDrive className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-2xl font-bold text-emerald-950">{totalGB.toFixed(4)} GB</p>
                <div className="flex items-center justify-between text-[10px] text-stone-400 font-semibold">
                  <span>Terpakai</span>
                  <span>Kuota Maks: {quotaGB.toFixed(1)} GB</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 soft-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Total Documents */}
            <div className="soft-card p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">Total File Laporan</span>
                <p className="text-2xl font-bold text-emerald-950">{documents.length}</p>
                <p className="text-[10px] text-stone-400 font-bold">Berkas fisik PDF terarsip</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            {/* Total Logs */}
            <div className="soft-card p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">Total Baris Catatan</span>
                <p className="text-2xl font-bold text-emerald-950">{logs.length}</p>
                <p className="text-[10px] text-stone-400 font-bold">Baris histori log aktivitas</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                <History className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* DETAILED BREAKDOWN BY INSTITUTION */}
          <div className="soft-card p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" /> Distribusi Ukuran Arsip per Unit Kerja
              </h3>
              <p className="text-[11px] text-stone-400 font-semibold mt-0.5">
                Rincian jumlah berkas dan total alokasi penyimpanan cloud storage untuk tiap-tiap unit lembaga pendidikan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {instStats.map((item) => (
                <div 
                  key={item.type}
                  className="flex items-center justify-between p-4 soft-bg border border-emerald-100/40 rounded-xl hover:border-emerald-300 hover:soft-bg transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-semibold text-sm ${item.color}`}>
                      {item.type}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">{item.label}</p>
                      <p className="text-[10px] text-stone-400 font-bold">
                        {item.count} berkas terunggah
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-950 font-mono">
                      {item.sizeDisplay}
                    </span>
                    <p className="text-[8px] font-semibold uppercase tracking-widest text-emerald-600 mt-0.5">
                      {((item.sizeMB / (totalMB || 1)) * 100).toFixed(1)}% porsi
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DANGER DELETION ZONE */}
          {onClearLogs && (
            <div className="bg-red-50/40 border border-red-200 rounded-xl p-6 space-y-4">
              <div className="flex gap-3">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl h-fit">
                  <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-950 uppercase tracking-wide">
                    Zona Bahaya: Pembersihan Riwayat Sistem (Clear All Logs)
                  </h4>
                  <p className="text-xs text-red-900/80 font-bold leading-relaxed mt-1">
                    Pembersihan ini akan mengosongkan seluruh histori aktivitas pengguna dan logs audit sistem selamanya. 
                    Tindakan ini sangat disarankan hanya jika ukuran database sudah mendekati batas kuota atau saat pergantian tahun ajaran baru. 
                    <strong className="text-red-950"> Harap dicatat bahwa dokumen fisik PDF yang telah diarsipkan TIDAK akan ikut terhapus.</strong>
                  </p>
                </div>
              </div>

              <div className="border-t border-red-200/50 pt-4 flex items-center justify-between flex-wrap gap-4">
                <div className="text-xs font-semibold text-red-900/60">
                  ⚠️ Tindakan ini bersifat permanen dan tidak dapat dibatalkan (irreversible).
                </div>
                <button
                  type="button"
                  onClick={triggerOpenConfirm}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Bersihkan Seluruh Riwayat Log (Clear All)
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* HIGH SECURITY CUSTOM WARNING MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div 
            className="soft-bg border border-red-100 rounded-xl w-full max-w-md p-6 relative overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Close */}
            <button 
              onClick={() => setShowConfirm(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1 rounded-xl hover:bg-stone-50 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="p-3.5 rounded-xl bg-red-50 text-red-600 animate-bounce">
                <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-red-950 uppercase tracking-wider">
                  ⚠️ KONFIRMASI PEMBERSIHAN RIWAYAT SISTEM
                </h4>
                <p className="text-xs text-stone-500 font-bold leading-relaxed px-1">
                  Anda akan menghapus seluruh data log audit sebanyak <span className="text-red-600 font-bold font-mono bg-red-50 px-1.5 py-0.5 rounded">{logs.length} baris</span> catatan secara permanen dari Cloud Firestore.
                </p>
              </div>

              {/* Security Multi-check list */}
              <div className="w-full text-left bg-stone-50 border border-stone-200/50 rounded-xl p-4 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={understandChecked}
                    onChange={(e) => setUnderstandChecked(e.target.checked)}
                    className="mt-0.5 accent-red-600 w-4 h-4 rounded"
                  />
                  <span className="text-xs font-bold text-stone-700 leading-tight">
                    Saya memahami bahwa semua catatan log aktivitas di masa lampau akan hilang selamanya dan tidak dapat dipulihkan.
                  </span>
                </label>

                <div className="space-y-1.5 pt-1.5 border-t border-stone-200/50">
                  <label className="text-[10px] font-bold uppercase text-stone-500 block">
                    Ketik Kata Kunci Konfirmasi
                  </label>
                  <p className="text-[9.5px] text-stone-400 font-semibold mb-1">
                    Silakan ketik kata <span className="font-mono font-bold text-red-600">KONFIRMASI</span> di bawah ini untuk mengaktifkan tombol:
                  </p>
                  <input 
                    type="text"
                    value={verificationText}
                    onChange={(e) => setVerificationText(e.target.value)}
                    placeholder="Contoh: KONFIRMASI"
                    className="w-full soft-bg border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-red-600 placeholder-stone-300 focus:outline-none focus:border-red-500 transition-all uppercase"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-800 bg-stone-50 hover:bg-stone-100/80 border border-stone-200/40 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  disabled={!understandChecked || verificationText.trim().toUpperCase() !== 'KONFIRMASI'}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer ${
                    understandChecked && verificationText.trim().toUpperCase() === 'KONFIRMASI'
                      ? 'bg-red-600 hover:bg-red-500 shadow-red-200' 
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed border-none shadow-none'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Ya, Bersihkan Semua
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

