/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="soft-bg border border-emerald-100/50 rounded-xl w-full max-w-sm p-6 relative overflow-hidden shadow-2xl"
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
          <div className={`p-3.5 rounded-xl ${isDanger ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>

          {/* Title & Description */}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
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
              className="soft-button-secondary flex-1 font-semibold uppercase tracking-wider"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`soft-button-primary flex-1 font-semibold uppercase tracking-wider ${
                isDanger 
                  ? '!bg-red-600 hover:!bg-red-500' 
                  : ''
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
    )}
  </AnimatePresence>
  );
}
