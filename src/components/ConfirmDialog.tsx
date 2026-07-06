/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  isDanger = true,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div 
        className="bg-white border border-emerald-100/50 rounded-[28px] w-full max-w-sm p-6 shadow-2xl relative overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1 rounded-xl hover:bg-stone-50 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          {/* Warning Icon */}
          <div className={`p-3.5 rounded-2xl ${isDanger ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>

          {/* Title & Description */}
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-stone-900 uppercase tracking-wide">
              {title}
            </h4>
            <p className="text-xs text-stone-500 font-bold leading-relaxed px-1">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-black text-stone-600 hover:text-stone-800 bg-stone-50 hover:bg-stone-100/80 border border-stone-200/40 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black text-white transition-all active:scale-95 cursor-pointer uppercase tracking-wider shadow-sm ${
                isDanger 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-650 shadow-red-200' 
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-650 shadow-emerald-250'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
