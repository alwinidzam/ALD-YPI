import React from 'react';
import { ArrowLeft, Calendar, User, FileText, Image, Download, Bell, AlertCircle, ExternalLink } from 'lucide-react';
import { Announcement, User as UserType } from '../types';
import { motion } from 'motion/react';

interface AnnouncementDetailViewProps {
  announcement: Announcement;
  users: UserType[];
  onBack: () => void;
}

export default function AnnouncementDetailView({ announcement, users, onBack }: AnnouncementDetailViewProps) {
  const creator = users.find((u) => u.username === announcement.createdByUsername) || 
                  users.find((u) => u.role === 'SUPER_ADMIN') || 
                  users.find((u) => u.username === 'admin');
  const creatorName = creator ? creator.name : (announcement.createdBy || 'Muhammad Alwi Nidzam');

  const priorityColors = {
    URGENT: {
      bg: 'bg-red-50 text-red-800 border-red-200/60',
      badge: 'bg-red-500 text-white',
      accent: 'border-red-500'
    },
    HIGH: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200/60',
      badge: 'bg-amber-500 text-amber-950',
      accent: 'border-amber-500'
    },
    NORMAL: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-100/60',
      badge: 'bg-emerald-600 text-white',
      accent: 'border-emerald-500'
    },
    LOW: {
      bg: 'bg-slate-50 text-slate-800 border-slate-200/60',
      badge: 'bg-slate-500 text-white',
      accent: 'border-slate-400'
    }
  };

  const currentColors = priorityColors[announcement.priority] || priorityColors.NORMAL;

  // Handle downloading attachment
  const handleDownloadAttachment = () => {
    if (!announcement.attachment || !announcement.attachment.fileData) return;
    
    const link = document.createElement('a');
    link.href = announcement.attachment.fileData;
    link.download = announcement.attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-2 sm:py-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-xs font-bold text-emerald-850 hover:text-emerald-950 soft-bg border border-emerald-100/80 hover:border-emerald-200 px-3.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Kembali ke Beranda
        </button>

        <span className="text-[10px] font-bold tracking-widest text-emerald-800/40 uppercase">
          Detail Pengumuman Resmi
        </span>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`soft-bg border-l-4 ${currentColors.accent} border-y border-r border-emerald-100/60 rounded-xl p-6 sm:p-8 space-y-6 overflow-hidden relative`}
      >
        {/* Top Status & Date Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold tracking-widest px-3 py-1 rounded-lg uppercase border ${currentColors.bg}`}>
              Prioritas: {announcement.priority}
            </span>
            <span className="bg-emerald-50 text-emerald-800 font-bold tracking-widest text-[10px] px-3 py-1 rounded-lg uppercase border border-emerald-100/40">
              Penerima: {announcement.targetRole === 'ALL' ? 'Semua Unit Lembaga' : announcement.targetRole}
            </span>
            <span className={`text-[10px] font-bold tracking-widest px-3 py-1 rounded-lg uppercase border ${
              announcement.visibility === 'PRIVATE'
                ? 'bg-purple-50 text-purple-800 border-purple-200/50'
                : 'bg-sky-50 text-sky-800 border-sky-100/50'
            }`}>
              Visibilitas: {announcement.visibility === 'PRIVATE' ? 'Privat' : 'Publik'}
            </span>
          </div>

          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide flex items-center gap-1.5 bg-stone-50 px-3 py-1 rounded-lg border border-stone-100">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            Aktif: {announcement.startDate} s.d {announcement.endDate}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-950 tracking-wide uppercase leading-snug">
            {announcement.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-800/50 font-bold border-b border-emerald-50 pb-4">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600/60" /> 
              Oleh: <span className="text-emerald-950 font-bold">{creatorName}</span>
            </span>
            <span>•</span>
            <span>
              Dibuat: <span className="text-emerald-900 font-semibold">{announcement.createdAt ? new Date(announcement.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).replace(/:/g, '.') : '-'}</span>
            </span>
            {announcement.updatedAt && (
              <>
                <span>•</span>
                <span className="text-amber-800">
                  Diedit terakhir: <span className="font-semibold">{new Date(announcement.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).replace(/:/g, '.')}</span> oleh {announcement.updatedBy}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="text-sm text-stone-750 font-medium leading-relaxed whitespace-pre-wrap py-2 pr-1 select-text">
          {announcement.content}
        </div>

        {/* Attached File Section */}
        {announcement.attachment ? (
          <div className="border border-emerald-100/80 rounded-xl p-4 soft-bg space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-emerald-50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl ${announcement.attachment.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} shrink-0`}>
                  {announcement.attachment.type === 'pdf' ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <Image className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-emerald-950 truncate max-w-xs sm:max-w-md">
                    {announcement.attachment.name}
                  </h4>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                    {announcement.attachment.type.toUpperCase()} Dokumen Lampiran • {announcement.attachment.fileSize || 'Ukuran Tidak Diketahui'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadAttachment}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-emerald-100"
                title="Unduh Lampiran"
              >
                <Download className="w-4 h-4" /> Unduh
              </button>
            </div>

            {/* In-page preview for attachment */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-widest text-emerald-800/40 uppercase block">
                Pratinjau Lampiran Resmi:
              </span>
              
              {announcement.attachment.type === 'pdf' && announcement.attachment.fileData ? (
                <div className="border border-emerald-100 rounded-xl overflow-hidden h-[450px] bg-stone-100 relative">
                  <iframe
                    src={announcement.attachment.fileData}
                    title={announcement.attachment.name}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : announcement.attachment.fileData ? (
                <div className="border border-emerald-100 rounded-xl p-2 bg-stone-50 flex justify-center items-center overflow-hidden max-h-[400px]">
                  <img
                    src={announcement.attachment.fileData}
                    alt={announcement.attachment.name}
                    className="max-w-full max-h-[380px] object-contain rounded-lg border border-stone-200"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="p-4 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Berkas lampiran tidak dapat ditampilkan secara visual, silakan unduh untuk melihat konten berkas.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-emerald-100 rounded-xl p-4 text-center bg-stone-50/50">
            <p className="text-xs font-bold text-stone-400/80">Pengumuman ini tidak menyertakan berkas lampiran pendukung.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
