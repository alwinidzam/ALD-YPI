import React from 'react';
import { CalendarDays, MapPin, Clock, Users, ArrowLeft, Info, FileText } from 'lucide-react';

interface EventDetailProps {
  type: 'selapanan' | 'harlah';
  onBack: () => void;
}

export function EventDetail({ type, onBack }: EventDetailProps) {
  const isSelapanan = type === 'selapanan';

  const title = isSelapanan ? 'Pengajian Selapanan' : 'Harlah Tahunan Yayasan';
  const description = isSelapanan 
    ? 'Agenda rutin silaturahmi bulanan (selapanan) pengurus, alumni, dan simpatisan Yayasan Pendidikan Islam Raudhotut Tholibin yang diadakan setiap Ahad Kliwon.'
    : 'Peringatan Hari Lahir (Harlah) Yayasan Pendidikan Islam Raudhotut Tholibin, dirangkaikan dengan haul muassis dan khataman Al-Quran.';
  
  const schedule = isSelapanan ? 'Ahad Kliwon, Setiap Bulan' : 'Bulan Sya\'ban';
  const time = isSelapanan ? '08:00 WIB - Selesai' : '07:30 WIB - Selesai';
  const location = 'Kompleks Yayasan Pusat';
  const color = isSelapanan ? 'from-[#015e2a] to-[#023a1a]' : 'from-amber-600 to-amber-800';
  const accentColor = isSelapanan ? 'text-[#015e2a]' : 'text-amber-600';
  const bgAccent = isSelapanan ? 'bg-[#015e2a]' : 'bg-amber-600';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-emerald-800 font-bold text-sm bg-white border border-emerald-100 px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className={`bg-gradient-to-r ${color} rounded-[32px] p-8 sm:p-10 text-white relative overflow-hidden shadow-lg`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase mb-6">
            <CalendarDays className="w-4 h-4" /> Event Resmi
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 leading-tight">
            {title}
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-3xl leading-relaxed font-medium">
            {description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-emerald-100/60 rounded-[24px] p-6 shadow-sm">
            <h2 className={`text-xl font-black ${accentColor} mb-6 flex items-center gap-2`}>
              <Info className="w-5 h-5" /> Informasi Kegiatan
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#f4f7f5] border border-emerald-50">
                <div className={`p-3 rounded-xl ${bgAccent}/10 ${accentColor}`}>
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800/50 mb-1">Jadwal</p>
                  <p className="font-bold text-emerald-950">{schedule}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#f4f7f5] border border-emerald-50">
                <div className={`p-3 rounded-xl ${bgAccent}/10 ${accentColor}`}>
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800/50 mb-1">Waktu</p>
                  <p className="font-bold text-emerald-950">{time}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#f4f7f5] border border-emerald-50">
                <div className={`p-3 rounded-xl ${bgAccent}/10 ${accentColor}`}>
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800/50 mb-1">Lokasi</p>
                  <p className="font-bold text-emerald-950">{location}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#f4f7f5] border border-emerald-50">
                <div className={`p-3 rounded-xl ${bgAccent}/10 ${accentColor}`}>
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800/50 mb-1">Peserta</p>
                  <p className="font-bold text-emerald-950">Umum & Alumni</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-emerald-100/60 rounded-[24px] p-6 shadow-sm">
             <h2 className={`text-xl font-black ${accentColor} mb-4 flex items-center gap-2`}>
              <FileText className="w-5 h-5" /> Arsip Terkait
            </h2>
            <p className="text-emerald-800/70 text-sm font-medium mb-6">
              Arsip dokumen kepanitiaan, laporan kegiatan, dan undangan terkait event ini dapat diakses melalui menu arsip.
            </p>
            <button className={`w-full py-4 rounded-xl ${bgAccent} text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}>
              <FileText className="w-5 h-5" /> Cari Arsip {isSelapanan ? 'Selapanan' : 'Harlah'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#015e2a]/5 border border-[#015e2a]/10 rounded-[24px] p-6">
            <h3 className="text-sm font-black text-[#015e2a] uppercase tracking-wider mb-4">Kontak Panitia</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100">
                <div className="w-10 h-10 rounded-full bg-[#015e2a]/10 flex items-center justify-center text-[#015e2a] font-bold">P1</div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">Panitia Pusat</p>
                  <p className="text-[10px] text-emerald-800/60">0812-XXXX-XXXX</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
