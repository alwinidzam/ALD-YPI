/**
 * Background Sync Status Bar Component
 * Displays persistent upload status and pending offline queue sync progress
 * with retry actions for document uploads.
 */

import React, { useState, useEffect } from 'react';
import { toast } from '../lib/toastManager';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Trash2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  getUploadQueue,
  processUploadQueue,
  clearCompletedQueue,
  removeQueueItem,
  QueuedUploadItem
} from '../lib/uploadSyncQueue';

export function BackgroundSyncStatusBar() {
  const [queue, setQueue] = useState<QueuedUploadItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const refresh = () => {
    setQueue(getUploadQueue());
  };

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    
    const handleOnline = () => {
      toast.success('Koneksi kembali pulih. Sinkronisasi latar belakang dilanjutkan.');
      refresh();
    };
    
    const handleOffline = () => {
      toast.warning('Koneksi terputus. Anda sedang Offline. Pekerjaan akan disinkronkan nanti.');
      refresh();
    };
    window.addEventListener('ald_upload_queue_updated', handleUpdate);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('ald_upload_queue_updated', handleUpdate);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    await processUploadQueue();
    setIsSyncing(false);
    refresh();
    const currentQueue = getUploadQueue();
    const failed = currentQueue.filter(q => q.status === 'FAILED');
    if (failed.length === 0 && currentQueue.length > 0) {
      toast.success('Semua antrean berkas berhasil disinkronkan.');
    } else if (failed.length > 0) {
      toast.error(`Gagal mensinkronkan ${failed.length} berkas. Pastikan koneksi stabil.`);
    }
  };

  if (queue.length === 0) return null;

  const pendingCount = queue.filter((q) => q.status === 'PENDING' || q.status === 'UPLOADING').length;
  const failedCount = queue.filter((q) => q.status === 'FAILED').length;
  const isOffline = !navigator.onLine;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 max-w-sm w-full animate-fade-in select-none">
      <div className="bg-[#031c10] border border-emerald-500/30 rounded-xl overflow-hidden backdrop-blur-xl text-white">
        {/* Compact Banner */}
        <div
          onClick={() => setIsExpanded((v) => !v)}
          className="p-3 bg-gradient-to-r from-[#013518] to-[#022410] flex items-center justify-between cursor-pointer hover:bg-emerald-900/30 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
              failedCount > 0
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : isOffline
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isOffline ? (
                <WifiOff className="w-4 h-4 animate-pulse" />
              ) : isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#ffb300]" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  {isOffline ? 'Offline - Antrean Upload' : 'Sinkronisasi Latar Belakang'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {queue.length} Berkas
                </span>
              </div>
              <p className="text-[10px] text-emerald-200/70 font-medium mt-0.5">
                {isOffline
                  ? 'Pengunggahan ditangguhkan sementara hingga koneksi pulih.'
                  : pendingCount > 0
                  ? `Sedang mengunggah ${pendingCount} berkas ke database server...`
                  : failedCount > 0
                  ? `${failedCount} berkas gagal diunggah. Klik untuk mencoba lagi.`
                  : 'Semua berkas tersimpan aman.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="p-1 hover:soft-bg/10 rounded-lg text-emerald-300 transition-all"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Expanded Queue List */}
        {isExpanded && (
          <div className="p-3 border-t border-emerald-500/20 bg-[#02130a] space-y-2.5 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
              <span>Daftar Berkas Terantre</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleForceSync}
                  disabled={isSyncing || isOffline}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  Proses Sekarang
                </button>
                <button
                  onClick={() => {
                    clearCompletedQueue();
                    refresh();
                  }}
                  className="px-2 py-1 soft-bg/5 hover:soft-bg/10 text-emerald-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  Bersihkan
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 soft-bg/5 rounded-xl border border-emerald-500/15 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-[11px] truncate">{item.docMeta.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-emerald-200/70 mt-0.5">
                      <span>{item.docMeta.institution}</span>
                      <span>•</span>
                      <span>{item.docMeta.fileSize || 'PDF'}</span>
                      {item.lastError && (
                        <span className="text-red-400 font-medium truncate max-w-[120px]">
                          ({item.lastError})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                      item.status === 'UPLOADING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : item.status === 'FAILED'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : item.status === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                    }`}>
                      {item.status === 'UPLOADING' ? 'Mengunggah' : item.status === 'FAILED' ? 'Gagal' : item.status}
                    </span>

                    <button
                      onClick={() => {
                        removeQueueItem(item.id);
                        refresh();
                      }}
                      className="p-1 hover:bg-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer"
                      title="Hapus dari antrean"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
