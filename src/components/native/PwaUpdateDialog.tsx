import React, { useState, useEffect } from 'react';
import { DownloadCloud, Sparkles, X } from 'lucide-react';
import { hapticService } from '../../services/HapticService';

export const PwaUpdateDialog: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        setSwRegistration(reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                hapticService.trigger('notification');
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    hapticService.trigger('confirmation');
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-50 bg-slate-900 text-white p-5 rounded-2xl border border-emerald-500/30 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            Versi Baru Tersedia!
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Pembaruan aplikasi ADMIN YPI telah siap. Perbarui sekarang untuk performa dan fitur terbaru.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <DownloadCloud className="w-4 h-4" />
              Update Sekarang
            </button>
            <button
              onClick={() => setUpdateAvailable(false)}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-semibold transition-all"
            >
              Nanti
            </button>
          </div>
        </div>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
