import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { connectivityService } from '../../services/ConnectivityService';
import { getUploadQueue, processUploadQueue } from '../../lib/uploadSyncQueue';
import { hapticService } from '../../services/HapticService';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(connectivityService.isOnline());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justReconnected, setJustReconnected] = useState<boolean>(false);
  const [queuedUploads, setQueuedUploads] = useState<number>(0);

  useEffect(() => {
    let wasOffline = !isOnline;

    const unsubscribe = connectivityService.subscribe((online) => {
      setIsOnline(online);
      if (online && wasOffline) {
        setJustReconnected(true);
        hapticService.trigger('confirmation');
        handleSync();
        setTimeout(() => setJustReconnected(false), 4000);
      }
      wasOffline = !online;
    });

    const checkQueue = () => {
      try {
        const items = getUploadQueue();
        setQueuedUploads(items.length);
      } catch (e) {}
    };

    checkQueue();
    const interval = setInterval(checkQueue, 4000);
    window.addEventListener('ald_upload_queue_updated', checkQueue);

    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener('ald_upload_queue_updated', checkQueue);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await processUploadQueue();
      const remaining = getUploadQueue();
      setQueuedUploads(remaining.length);
      connectivityService.markSyncCompleted();
    } catch (e) {
      console.error('Offline queue sync failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const totalQueued = queuedUploads;

  if (isOnline && !justReconnected && totalQueued === 0) {
    return null;
  }

  return (
    <div className="w-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-white/10 shadow-md transition-all z-50">
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="text-amber-200">
              Moda Offline — {totalQueued > 0 ? `${totalQueued} item tersimpan lokal` : 'Data akan disinkronkan saat online'}
            </span>
          </>
        ) : justReconnected ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-emerald-300">Koneksi Terhubung Kembali — Sinkronisasi Otomatis</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-slate-300">{totalQueued} antrean data menunggu sinkronisasi</span>
          </>
        )}
      </div>

      {isOnline && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg text-[11px] font-bold text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron Sekarang'}</span>
        </button>
      )}
    </div>
  );
};
