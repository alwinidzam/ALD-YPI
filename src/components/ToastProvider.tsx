import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Loader2, X } from 'lucide-react';
import { toast as toastManager, ToastOptions } from '../lib/toastManager';

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  useEffect(() => {
    return toastManager.subscribe((newToasts) => {
      setToasts(newToasts);
    });
  }, []);

  return (
    <div 
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-[90%] sm:max-w-md"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => toast.id && toastManager.hide(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastOptions, onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';
  const isSuccess = toast.type === 'success' || toast.type === 'complete';
  const isLoading = toast.persistent;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className={`pointer-events-auto flex items-center gap-3 p-3.5 pr-10 rounded-xl shadow-lg border backdrop-blur-md relative overflow-hidden \${
        isError ? 'bg-red-950/90 border-red-500/30 text-red-50' :
        isWarning ? 'bg-amber-950/90 border-amber-500/30 text-amber-50' :
        isSuccess ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-50' :
        'bg-slate-900/90 border-slate-700/50 text-slate-50'
      }`}
      role="alert"
      aria-live={isError ? "assertive" : "polite"}
    >
      <div className="shrink-0">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        ) : isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : isWarning ? (
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        ) : isError ? (
          <XCircle className="w-5 h-5 text-red-400" />
        ) : (
          <Info className="w-5 h-5 text-sky-400" />
        )}
      </div>
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
      
      {!toast.persistent && (
        <button 
          onClick={onDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};
