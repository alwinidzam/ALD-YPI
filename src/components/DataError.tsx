import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface DataErrorProps {
  title?: string;
  message: string;
  onRetry: () => void;
}

export function DataError({ title = 'Koneksi Database Gagal', message, onRetry }: DataErrorProps) {
  return (
    <div className="relative overflow-hidden bg-red-50/50 border border-red-100 rounded-xl p-6 sm:p-8 text-center flex flex-col items-center justify-center">
      <AlertCircle className="w-10 h-10 text-red-600 mb-2" />
      <h4 className="text-xs sm:text-sm font-bold text-red-950 uppercase tracking-wide">{title}</h4>
      <p className="text-[11px] text-red-800/60 font-semibold mt-1 max-w-md">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="mt-4 bg-red-650 hover:bg-red-700 text-white font-semibold px-4.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
        style={{ backgroundColor: '#dc2626' }}
      >
        <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
      </button>
    </div>
  );
}
