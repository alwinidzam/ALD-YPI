import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, MapPin, Clock, Users, ArrowLeft, Info, FileText, 
  Send, Heart, Check, MessageSquare, Timer, Sparkles, Clipboard, 
  User as UserIcon, Bookmark, HelpCircle, Award, Volume2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, query, where, onSnapshot, addDoc, 
  orderBy, limit 
} from 'firebase/firestore';
import { db } from '../firebase';

import { User } from '../types';
import { SelapananManagementView } from './events/SelapananManagementView';
import { HarlahManagementView } from './events/HarlahManagementView';

interface EventDetailProps {
  type: 'selapanan' | 'harlah';
  currentUser?: User;
  onBack: () => void;
  onLogAction?: (action: string, details: string) => void;
}

interface RSVP {
  id: string;
  name: string;
  category: string;
  status: 'ATTENDING' | 'EXCUSED' | 'NOT_ATTENDING';
  prayer: string;
  timestamp: any;
}

export function EventDetail({ type, currentUser, onBack, onLogAction }: EventDetailProps) {
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const defaultUser: User = currentUser || {
    id: 'guest',
    username: 'guest',
    name: 'Tamu / Umum',
    role: 'VIEWER',
    status: 'ACTIVE',
    passwordHash: ''
  };

  const isSelapanan = type === 'selapanan';
  const title = isSelapanan ? 'Pengajian Selapanan' : 'Harlah Tahunan Yayasan';
  const description = isSelapanan 
    ? 'Agenda rutin silaturahmi bulanan (selapanan) pengurus, alumni, dan simpatisan Yayasan Pendidikan Islam Raudhotut Tholibin yang diadakan setiap Ahad Kliwon.'
    : 'Peringatan Hari Lahir (Harlah) Yayasan Pendidikan Islam Raudhotut Tholibin, dirangkaikan dengan haul muassis dan khataman Al-Quran.';
  
  const schedule = isSelapanan ? 'Ahad Kliwon, Setiap Bulan' : 'Bulan Sya\'ban (Tahunan)';
  const time = isSelapanan ? '08:00 WIB - Selesai' : '07:30 WIB - Selesai';
  const location = 'Kompleks Yayasan Pusat (Masjid Jami\' & Aula Serbaguna)';
  const color = isSelapanan ? 'from-[#015e2a] to-[#023a1a]' : 'from-amber-600 to-amber-800';
  const accentColor = isSelapanan ? 'text-[#015e2a]' : 'text-amber-600';
  const bgAccent = isSelapanan ? 'soft-gradient-dark' : 'bg-amber-600';
  const borderAccent = isSelapanan ? 'border-emerald-100' : 'border-amber-100';

  // --- COUNTDOWN LOGIC ---
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const getTargetDate = () => {
      if (isSelapanan) {
        // Base Ahad Kliwon known date: July 5, 2026. Cycle is every 35 days.
        const baseDate = new Date('2026-07-05T08:00:00');
        const now = new Date();
        const diffMs = now.getTime() - baseDate.getTime();
        const daysDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        let cycles = Math.ceil(daysDiff / 35);
        if (cycles < 0) cycles = 0;
        
        let nextDate = new Date(baseDate.getTime() + (cycles * 35 * 24 * 60 * 60 * 1000));
        // If event was today and it's already 13:00, move to the next cycle
        if (nextDate.getTime() < now.getTime() - (5 * 60 * 60 * 1000)) {
          nextDate = new Date(nextDate.getTime() + (35 * 24 * 60 * 60 * 1000));
        }
        return nextDate;
      } else {
        // Next Harlah is approx mid-February 2027 (Sya'ban 1448H)
        const targetDate = new Date('2027-02-15T08:00:00');
        const now = new Date();
        if (now.getTime() > targetDate.getTime()) {
          return new Date('2028-02-04T08:00:00');
        }
        return targetDate;
      }
    };

    const targetDate = getTargetDate();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSelapanan]);

  // --- RSVP FORM & WALL LOGIC ---
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Alumni');
  const [status, setStatus] = useState<'ATTENDING' | 'EXCUSED' | 'NOT_ATTENDING'>('ATTENDING');
  const [prayer, setPrayer] = useState('');
  const [loadingRSVP, setLoadingRSVP] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  // Fallback function for loading local RSVPs
  const loadLocalRSVPs = React.useCallback(() => {
    const key = `local_rsvp_${type}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setRsvps(JSON.parse(stored));
      } catch {
        setRsvps([]);
      }
    } else {
      // Mock some friendly starter messages
      const sampleRSVPs: RSVP[] = [
        {
          id: '1',
          name: 'H. Ahmad Syukron',
          category: 'Pengurus',
          status: 'ATTENDING',
          prayer: 'Insya Allah hadir bersama rombongan MWC. Semoga acara berjalan lancar dan penuh keberkahan.',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Siti Aminah, S.Pd.',
          category: 'Alumni',
          status: 'ATTENDING',
          prayer: 'Alhamdulillah kangen sanget kalih suasana pondok. Nderek hadir sekalian silaturahmi.',
          timestamp: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Ust. M. Ridwan',
          category: 'Simpatisan',
          status: 'EXCUSED',
          prayer: 'Nyuwun pangapunten mboten saget rawuh amargi wonten tugas luar kota. Mugi-mugi berkah khidmahipun.',
          timestamp: new Date().toISOString()
        }
      ];
      setRsvps(sampleRSVPs);
      localStorage.setItem(key, JSON.stringify(sampleRSVPs));
    }
  }, [type]);

  // Firestore sync for RSVPs with local storage fallback
  useEffect(() => {
    let unsubscribe: any = () => {};

    try {
      const q = query(
        collection(db, 'event_rsvps'),
        where('eventType', '==', type),
        limit(30)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const list: RSVP[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as RSVP);
        });
        // Sort client-side by timestamp descending
        list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setRsvps(list.slice(0, 15));
      }, (err) => {
        console.warn("Firestore listen failed. Using localStorage backup for RSVP Wall:", err);
        loadLocalRSVPs();
      });
    } catch (e) {
      console.warn("Error starting Firestore listener. Using localStorage backup:", e);
      loadLocalRSVPs();
    }

    return () => unsubscribe();
  }, [type, loadLocalRSVPs]);

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    const newRSVPData = {
      eventType: type,
      name,
      category,
      status,
      prayer: prayer.trim() || 'Semoga barokah untuk seluruh santri & pendiri.',
      timestamp: new Date().toISOString()
    };

    try {
      // Try writing to Firestore
      await addDoc(collection(db, 'event_rsvps'), newRSVPData);
      
      // Also update local storage fallback
      const key = `local_rsvp_${type}`;
      const stored = localStorage.getItem(key);
      const list = stored ? JSON.parse(stored) : [];
      const updatedList = [{ id: Math.random().toString(), ...newRSVPData }, ...list];
      localStorage.setItem(key, JSON.stringify(updatedList.slice(0, 50)));

      // If we are offline/sandbox-isolated, manually update state
      if (rsvps.length === 0 || rsvps.some(r => r.id === '1' || r.id === '2')) {
        setRsvps(prev => [{ id: Math.random().toString(), ...newRSVPData } as RSVP, ...prev]);
      }
    } catch (err) {
      console.warn("Firestore save failed, saving to localStorage only:", err);
      const key = `local_rsvp_${type}`;
      const stored = localStorage.getItem(key);
      const list = stored ? JSON.parse(stored) : [];
      const updatedList = [{ id: Math.random().toString(), ...newRSVPData }, ...list];
      localStorage.setItem(key, JSON.stringify(updatedList.slice(0, 50)));
      setRsvps(updatedList as RSVP[]);
    }

    setName('');
    setPrayer('');
    setSubmitting(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 4000);
  };

  const copyBankInfo = () => {
    navigator.clipboard.writeText('123-456-7890 (Bank Syariah Indonesia a.n Yayasan Raudhotut Tholibin)');
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // --- RUNDOWN / TIMELINE DATA ---
  const rundowns = isSelapanan 
    ? [
        { time: '08:00 - 08:30 WIB', title: 'Pembukaan & Fatihah', desc: 'Pembukaan pengajian selapanan serta pembacaan fatihah khusushon lil muassis.' },
        { time: '08:30 - 09:30 WIB', title: 'Istighosah & Yasin/Tahlil', desc: 'Dzikir akbar istighosah untuk keselamatan umat, disusul tahlil jamai.' },
        { time: '09:30 - 10:30 WIB', title: 'Pembacaan Sholawat', desc: 'Gema sholawat maulid Simtudduror bersama tim rebana santri putra.' },
        { time: '10:30 - 11:30 WIB', title: 'Mauidhoh Hasanah', desc: 'Kajian kitab kuning (Ihya Ulumiddin / Riyadhus Sholihin) dipimpin oleh Pengasuh Utama.' },
        { time: '11:30 - Selesai', title: 'Doa Penutup & Musafahah', desc: 'Doa penutup, ramah tamah (makan bersama nampan), dan bersalam-salaman.' }
      ]
    : [
        { time: '07:30 - 10:00 WIB', title: 'Khotmil Qur\'an Bil Ghoib', desc: 'Simaan Al-Qur\'an 30 juz oleh para hafidz-hafidzah alumni pondok.' },
        { time: '10:00 - 11:30 WIB', title: 'Ziarah Makam Muassis', desc: 'Ziarah makam pendiri yayasan diikuti pengurus, dewan guru, dan seluruh santri.' },
        { time: '11:30 - 13:00 WIB', title: 'Istirahat & Sholat Dzuhur', desc: 'Istirahat, ibadah, dan persiapan pengkondisian tamu luar kota.' },
        { time: '13:00 - 15:30 WIB', title: 'Temu Alumni Akbar', desc: 'Silaturahmi lintas generasi alumni & sarasehan kontribusi kemandirian yayasan.' },
        { time: '19:30 - Selesai', title: 'Pengajian Akbar & Sholawat', desc: 'Puncak harlah diisi ceramah umum oleh tokoh nasional dan sholawat kolosal.' }
      ];

  if (isManagementOpen) {
    if (type === 'selapanan') {
      return (
        <SelapananManagementView
          currentUser={defaultUser}
          onBack={() => setIsManagementOpen(false)}
          onLogAction={onLogAction || (() => {})}
        />
      );
    } else {
      return (
        <HarlahManagementView
          currentUser={defaultUser}
          onBack={() => setIsManagementOpen(false)}
          onLogAction={onLogAction || (() => {})}
        />
      );
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        id="btn-back-event"
        className="flex items-center gap-2 text-emerald-800 font-bold text-xs soft-bg border border-emerald-150 px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-all cursor-pointer active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </button>

      {/* Main Beautiful Banner */}
      <div className={`bg-gradient-to-r ${color} rounded-xl p-8 sm:p-10 text-white relative overflow-hidden`}>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full soft-bg/20 backdrop-blur-md border border-white/20 text-[10px] font-bold tracking-widest uppercase">
              <CalendarDays className="w-4 h-4 text-amber-300" /> Agenda Resmi Yayasan
            </div>

            <button
              onClick={() => setIsManagementOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl soft-bg text-slate-900 font-semibold text-xs hover:bg-amber-100 transition-all cursor-pointer active:scale-95"
            >
              <Award className="w-4 h-4 text-amber-600" />
              Kelola Panitia, Undangan, Rundown, Keuangan & LPJ (Admin)
            </button>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif leading-tight">
            {title}
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-3xl leading-relaxed font-semibold">
            {description}
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: INFORMATION & RUNDOWN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Information Bento Cards */}
          <div className="soft-card p-6 space-y-6">
            <h2 className={`text-lg font-bold ${accentColor} flex items-center gap-2 uppercase tracking-wide`}>
              <Info className="w-5 h-5" /> Informasi & Detail Kegiatan
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`p-3 rounded-xl ${bgAccent}/10 ${accentColor} shrink-0`}>
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">Hari & Jadwal</p>
                  <p className="font-bold text-xs text-slate-800 leading-snug">{schedule}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`p-3 rounded-xl ${bgAccent}/10 ${accentColor} shrink-0`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">Durasi Waktu</p>
                  <p className="font-bold text-xs text-slate-800 leading-snug">{time}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                <div className={`p-3 rounded-xl ${bgAccent}/10 ${accentColor} shrink-0`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">Titik Lokasi</p>
                  <p className="font-bold text-xs text-slate-800 leading-snug">{location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Rundown Timeline */}
          <div className="soft-card p-6">
            <h2 className={`text-lg font-bold ${accentColor} mb-6 flex items-center gap-2 uppercase tracking-wide`}>
              <Bookmark className="w-5 h-5" /> Rundown & Struktur Susunan Acara
            </h2>

            <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6">
              {rundowns.map((r, idx) => (
                <div key={idx} className="relative group">
                  {/* Point accent indicator */}
                  <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-white transition-colors duration-300 ${bgAccent}`} />
                  
                  <div className="space-y-1">
                    <span className={`inline-block text-[10px] font-bold ${accentColor} uppercase tracking-wider`}>
                      {r.time}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-emerald-900 transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      {r.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sponsoring / Donation support */}
          <div className="soft-gradient-dark text-white rounded-2xl p-6 relative overflow-hidden border border-white/10 shadow-lg">
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-widest uppercase">
                  <Award className="w-3.5 h-3.5" /> Khidmah & Dukungan
                </div>
                <h3 className="text-lg font-bold font-serif">Kontribusi Kelancaran {isSelapanan ? 'Selapanan' : 'Harlah'}</h3>
                <p className="text-slate-300 text-xs font-semibold max-w-lg leading-relaxed">
                  Bagi alumni, simpatisan, atau donatur yang berniat menyumbang konsumsi, akomodasi, atau dana operasional kegiatan, silakan transfer ke rekening resmi panitia.
                </p>
              </div>

              <div className="shrink-0 space-y-2">
                <button 
                  onClick={copyBankInfo}
                  className="w-full sm:w-auto px-5 py-3 soft-button-primary active:scale-95 transition-all rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedBank ? <Check className="w-4 h-4 text-emerald-200" /> : <Clipboard className="w-4 h-4" />}
                  {copiedBank ? 'Tersalin!' : 'Salin Rekening'}
                </button>
                <span className="block text-[10px] text-center text-slate-400 font-semibold uppercase tracking-wide">BSI: 123-456-7890</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: COUNTDOWN, RSVP FORM, LIVE PRESENCE WALL */}
        <div className="space-y-6">
          
          {/* Countdown Clock Panel */}
          <div className="soft-card p-6 text-center space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Timer className="w-4 h-4 text-amber-500 animate-pulse" /> Waktu Mundur Menuju Acara
            </h3>

            <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <span className={`block text-xl sm:text-2xl font-serif font-bold ${accentColor}`}>{timeLeft.days}</span>
                <span className="block text-[8px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Hari</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <span className={`block text-xl sm:text-2xl font-serif font-bold ${accentColor}`}>{timeLeft.hours}</span>
                <span className="block text-[8px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Jam</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <span className={`block text-xl sm:text-2xl font-serif font-bold ${accentColor}`}>{timeLeft.minutes}</span>
                <span className="block text-[8px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Menit</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <span className={`block text-xl sm:text-2xl font-serif font-bold ${accentColor}`}>{timeLeft.seconds}</span>
                <span className="block text-[8px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Detik</span>
              </div>
            </div>
          </div>

          {/* Interactive RSVP Registration Form */}
          <div className="soft-card p-6 space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare className="w-4.5 h-4.5 text-emerald-600" /> Konfirmasi Kehadiran & Doa
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">Nyatakan kehadiran Anda dan kirimkan doa restu.</p>
            </div>

            <form onSubmit={handleRSVPSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nama Lengkap</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama Anda..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                  >
                    <option value="Alumni">Alumni</option>
                    <option value="Pengurus">Pengurus</option>
                    <option value="Santri">Santri</option>
                    <option value="Wali Santri">Wali Santri</option>
                    <option value="Simpatisan">Simpatisan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status Rawuh</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all"
                  >
                    <option value="ATTENDING">Hadir</option>
                    <option value="EXCUSED">Izin / Absen</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Doa & Pesan Baik</label>
                <textarea 
                  rows={3}
                  value={prayer}
                  onChange={(e) => setPrayer(e.target.value)}
                  placeholder="Kirim ucapan selamat, barokah, doa untuk kyai, santri, atau panitia..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:soft-bg transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${bgAccent} hover:opacity-90 disabled:opacity-50`}
              >
                <Send className="w-3.5 h-3.5" /> {submitting ? 'Mengirim...' : 'Kirim Kehadiran'}
              </button>
            </form>

            <AnimatePresence>
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-[11px] font-bold text-emerald-800"
                >
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>RSVP Berhasil dikirimkan ke Buku Tamu! Terima kasih atas partisipasinya.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Presence Guest Wall Feed */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Dinding Kehadiran & Doa</h4>
              <span className="text-[10px] font-semibold text-emerald-800 soft-bg border border-emerald-100 px-2 py-0.5 rounded-full">
                {rsvps.length} Terdaftar
              </span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {rsvps.map((r) => (
                <div key={r.id} className="soft-card p-6 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-[10px] text-emerald-700 font-semibold shrink-0">
                        {r.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">{r.name}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">{r.category}</p>
                      </div>
                    </div>

                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      r.status === 'ATTENDING' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {r.status === 'ATTENDING' ? 'Rawuh' : 'Izin'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-600 leading-normal italic bg-slate-50 p-2.5 rounded-lg border border-slate-100/40">
                    "{r.prayer}"
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
