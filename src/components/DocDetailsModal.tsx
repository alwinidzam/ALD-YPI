/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useDragControls } from 'motion/react';
import {
  X,
  FileText,
  Download,
  Eye,
  Trash2,
  Calendar,
  Lock,
  Globe,
  Building,
  User as UserIcon,
  Bookmark,
  Info,
  Clock,
  HardDrive
} from 'lucide-react';
import { DocumentMetadata, User } from '../types';

interface DocDetailsModalProps {
  document: DocumentMetadata;
  isOpen: boolean;
  onClose: () => void;
  onOpenPdf: (doc: DocumentMetadata) => void;
  onDownload: (doc: DocumentMetadata) => void;
  onDelete?: (docId: string) => void;
  isViewer: boolean;
  isFavorite: boolean;
  onToggleFavorite: (docId: string) => void;
}

export const DocDetailsModal: React.FC<DocDetailsModalProps> = ({
  document,
  isOpen,
  onClose,
  onOpenPdf,
  onDownload,
  onDelete,
  isViewer,
  isFavorite,
  onToggleFavorite
}) => {
  if (!isOpen) return null;

  // Category specific coloring
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'KEUANGAN':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/50',
          dot: 'bg-emerald-500',
          glow: 'rgba(16,185,129,0.12)',
          gradient: 'from-emerald-400 to-teal-500'
        };
      case 'KEGIATAN':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200/50',
          dot: 'bg-indigo-500',
          glow: 'rgba(99,102,241,0.12)',
          gradient: 'from-indigo-400 to-blue-500'
        };
      case 'SURAT':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200/50',
          dot: 'bg-amber-500',
          glow: 'rgba(245,158,11,0.12)',
          gradient: 'from-amber-400 to-orange-500'
        };
      case 'DOKUMEN':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200/50',
          dot: 'bg-rose-500',
          glow: 'rgba(244,63,94,0.12)',
          gradient: 'from-rose-400 to-pink-500'
        };
      case 'SELAPANAN':
        return {
          bg: 'bg-violet-50 text-violet-800 border-violet-200/50',
          dot: 'bg-violet-500',
          glow: 'rgba(139,92,246,0.12)',
          gradient: 'from-violet-400 to-fuchsia-500'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-800 border-slate-200/50',
          dot: 'bg-slate-500',
          glow: 'rgba(100,116,139,0.12)',
          gradient: 'from-slate-400 to-slate-500'
        };
    }
  };

  const theme = getCategoryTheme(document.category);
  const dragControls = useDragControls();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-emerald-950/40 backdrop-blur-xs"
      />

      {/* Sheet Panel */}
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.85 }}
        onDragEnd={(event, info) => {
          if (info.offset.y > 110 || info.velocity.y > 320) {
            onClose();
          }
        }}
        initial={{ y: '100%', scale: 1 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="relative soft-bg w-full max-w-lg sm:rounded-xl rounded-t-[32px] flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden border border-emerald-100/30 z-10"
      >
        {/* Mobile Swipe Handle Drag Indicator */}
        <div 
          className="sm:hidden w-full pt-3 pb-3 flex justify-center cursor-row-resize select-none touch-none" 
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-14 h-1.5 bg-emerald-100/80 rounded-full hover:bg-emerald-200 transition-colors animate-pulse" />
        </div>

        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b border-emerald-100/30 select-none touch-none cursor-row-resize sm:cursor-default"
          onPointerDown={(e) => {
            if (window.innerWidth < 640) {
              dragControls.start(e);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
              Rincian Arsip Berkas
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-emerald-50 text-emerald-800/60 hover:text-emerald-950 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          {/* Main Visual Title Frame */}
          <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-[#fbfdfc] to-[#f4f8f5] rounded-xl border border-emerald-100/20">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white mb-4 soft-card`}>
              <FileText className="w-8 h-8 stroke-[1.8]" />
            </div>
            
            <h3 className="text-sm font-bold text-emerald-950 leading-snug tracking-tight max-w-xs break-words px-2">
              {document.fileName}
            </h3>

            {/* Visibility Badge */}
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border ${
                document.visibility === 'PRIVATE'
                  ? 'bg-purple-50 text-purple-800 border-purple-200/50'
                  : 'bg-sky-50 text-sky-800 border-sky-200/50'
              }`}>
                {document.visibility === 'PRIVATE' ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                {document.visibility === 'PRIVATE' ? 'Privat' : 'Publik'}
              </span>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase ${theme.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></span>
                {document.category}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold tracking-wider border border-emerald-100/30">
                <Building className="w-2.5 h-2.5" />
                {document.institution}
              </span>
            </div>
          </div>

          {/* Uraian Deskripsi */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-emerald-800/60 block">Deskripsi Berkas</h4>
            <div className="bg-[#fafbfb] border border-emerald-500/5 rounded-xl px-4 py-3.5 italic text-xs font-semibold text-emerald-900/80 leading-relaxed">
              "{document.description || 'Tidak ada uraian deskripsi tambahan yang disematkan pada dokumen pertanggungjawaban ini.'}"
            </div>
          </div>

          {/* Detail Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-emerald-800/60 block">Informasi Tambahan</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="soft-bg border border-emerald-100/20 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-emerald-500 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/40">Tahun Buku</span>
                </div>
                <span className="text-xs font-bold text-emerald-950 font-mono">
                  {document.month} {document.year}
                </span>
              </div>

              <div className="soft-bg border border-emerald-100/20 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-emerald-500 mb-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/40">Ukuran File</span>
                </div>
                <span className="text-xs font-bold text-emerald-950 font-mono">
                  {document.fileSize}
                </span>
              </div>

              <div className="soft-bg border border-emerald-100/20 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-emerald-500 mb-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/40">Tanggal Unggah</span>
                </div>
                <span className="text-xs font-bold text-emerald-950 font-mono">
                  {document.uploadDate}
                </span>
              </div>

              <div className="soft-bg border border-emerald-100/20 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-emerald-500 mb-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/40">Jumlah Unduhan</span>
                </div>
                <span className="text-xs font-bold text-emerald-950 font-mono">
                  {document.downloadCount || 0} Kali
                </span>
              </div>
            </div>
          </div>

          {/* Pengunggah Section */}
          <div className="bg-emerald-500/5 border border-emerald-100/20 rounded-xl p-4 flex items-center gap-3.5">
            <div className="p-2.5 soft-bg text-emerald-800 rounded-xl border border-emerald-100/40 shrink-0">
              <UserIcon className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[8px] text-emerald-800/40 block font-bold uppercase tracking-wider leading-none">Pengunggah Berkas</span>
              <span className="text-xs font-bold text-emerald-950 truncate block mt-1" title={document.uploader}>
                {document.uploader}
              </span>
            </div>
          </div>

        </div>

        {/* Footer Action Bar */}
        <div className="bg-[#fafbfb] border-t border-emerald-100/30 px-6 py-4 flex flex-col gap-2.5">
          {/* Secondary favorite toggle if viewer */}
          <div className="flex items-center justify-between gap-3">
            {isViewer && (
              <button
                onClick={() => onToggleFavorite(document.id)}
                className="flex items-center gap-1.5 px-3 py-2 soft-bg hover:bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
              >
                <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-500' : 'text-emerald-600'}`} />
                <span>{isFavorite ? 'Hapus dari Favorit' : 'Jadikan Favorit'}</span>
              </button>
            )}

            {/* Delete button if Administrator */}
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(document.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors ml-auto"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Hapus Berkas</span>
              </button>
            )}
          </div>

          {/* Primary Action Row */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onOpenPdf(document);
                onClose();
              }}
              className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Buka Berkas</span>
            </button>

            <button
              onClick={() => {
                onDownload(document);
              }}
              className="flex-1 soft-bg hover:bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold py-3 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-800" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
