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
  AlertCircle
} from 'lucide-react';
import { AuditLog, AuditAction } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface AuditLogViewProps {
  logs: AuditLog[];
  onClearLogs?: () => void;
}

export default function AuditLogView({ logs, onClearLogs }: AuditLogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [showConfirm, setShowConfirm] = useState(false);

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

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-emerald-950 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" /> Audit System Logs
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Histori aktivitas sistem, autentikasi, serta pengunggahan dokumen yang tercatat otomatis.
          </p>
        </div>
        {onClearLogs && (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-4 py-2.5 rounded-xl border border-red-200/40 transition-all self-end sm:self-auto shadow-sm active:scale-95 cursor-pointer"
          >
            Bersihkan Log
          </button>
        )}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white border border-emerald-100/50 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-[4px_4px_16px_rgba(165,180,169,0.08)]">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-emerald-600/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, username, log detail, atau IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-emerald-50/30 border border-emerald-100/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder-stone-400"
          />
        </div>

        {/* Action filter dropdown */}
        <div className="flex items-center gap-2 bg-emerald-50/30 border border-emerald-100/80 rounded-xl px-3 py-2.5 w-full md:w-auto shrink-0">
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

      {/* LOGS LIST */}
      <div className="bg-white border border-emerald-100/60 rounded-2xl overflow-hidden shadow-[6px_6px_20px_rgba(165,180,169,0.12)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-50/40 to-white text-emerald-900 font-bold border-b border-emerald-100/50">
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
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-emerald-800 flex items-center justify-center font-extrabold text-[10px] uppercase border border-emerald-200/40">
                        {log.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 truncate">{log.name}</p>
                        <p className="text-[10px] font-mono text-stone-400 truncate">
                          @{log.username} • <span className="font-sans font-black tracking-widest text-[8px] uppercase text-yellow-600">{log.role.replace('ADMIN_', '')}</span>
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Action Badge */}
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-extrabold shadow-sm ${getActionBadgeColor(log.action)}`}>
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

      <ConfirmDialog
        isOpen={showConfirm}
        title="Bersihkan Semua Log"
        message="Apakah Anda yakin ingin mengosongkan semua log audit? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Bersihkan"
        cancelText="Batal"
        isDanger={true}
        onConfirm={() => {
          if (onClearLogs) {
            onClearLogs();
          }
          setShowConfirm(false);
        }}
        onCancel={() => setShowConfirm(false)}
      />

    </div>
  );
}
