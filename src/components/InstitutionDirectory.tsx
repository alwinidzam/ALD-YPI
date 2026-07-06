import React from 'react';
import { Building2, Users, FileText, ChevronRight, User, BookOpen } from 'lucide-react';
import { InstitutionType } from '../types';

interface InstitutionCardProps {
  id: string;
  name: string;
  type: InstitutionType;
  leader: string;
  stats: {
    students: number;
    teachers: number;
    documents: number;
  };
  color: string;
  bgLight: string;
  icon: React.ReactNode;
  onViewProfile: (id: string) => void;
}

const institutions: InstitutionCardProps[] = [
  {
    id: 'sma',
    name: 'SMA Raudhotut Tholibin',
    type: 'SMA',
    leader: 'Ahmad Muthohar',
    stats: { students: 342, teachers: 28, documents: 156 },
    color: '#3b82f6',
    bgLight: 'bg-blue-50',
    icon: <Building2 className="w-8 h-8 text-blue-500" />,
    onViewProfile: () => {}
  },
  {
    id: 'mts',
    name: 'MTs Raudhotut Tholibin',
    type: 'MTS',
    leader: 'Kurdi Abdul Jalil ',
    stats: { students: 485, teachers: 35, documents: 210 },
    color: '#10b981',
    bgLight: 'bg-emerald-50',
    icon: <BookOpen className="w-8 h-8 text-emerald-500" />,
    onViewProfile: () => {}
  },
  {
    id: 'madin',
    name: 'Madrasah Diniyah',
    type: 'MADIN',
    leader: 'Ust. Muhammad Zidni',
    stats: { students: 620, teachers: 42, documents: 89 },
    color: '#8b5cf6',
    bgLight: 'bg-purple-50',
    icon: <Users className="w-8 h-8 text-purple-500" />,
    onViewProfile: () => {}
  },
  {
    id: 'tk',
    name: 'TK Raudhotut Tholibin',
    type: 'TK',
    leader: 'Junaedah',
    stats: { students: 125, teachers: 12, documents: 45 },
    color: '#f59e0b',
    bgLight: 'bg-amber-50',
    icon: <Building2 className="w-8 h-8 text-amber-500" />,
    onViewProfile: () => {}
  },
  {
    id: 'pesantren',
    name: 'Pondok Pesantren',
    type: 'PESANTREN',
    leader: 'Atsna',
    stats: { students: 850, teachers: 65, documents: 320 },
    color: '#015e2a',
    bgLight: 'bg-[#015e2a]/5',
    icon: <Building2 className="w-8 h-8 text-[#015e2a]" />,
    onViewProfile: () => {}
  }
];

export function InstitutionDirectory({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-[#02210a] rounded-[24px] p-6 sm:p-7 text-white relative overflow-hidden shadow-md">
        <div className="absolute top-[-20%] left-[20%] w-72 h-72 bg-emerald-500/25 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide">
            Direktori Lembaga Pendidikan
          </h1>
          <p className="text-emerald-100/80 text-sm font-medium max-w-2xl">
            Informasi lengkap, statistik, dan profil pimpinan unit pendidikan di bawah naungan Yayasan Pendidikan Islam Raudhotut Tholibin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {institutions.map((inst) => (
          <div key={inst.id} className="bg-white border border-emerald-100/60 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full ${inst.bgLight} opacity-50 -z-0`} />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-2xl ${inst.bgLight} flex items-center justify-center border border-white shadow-sm`}>
                  {inst.icon}
                </div>
                <span className={`text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full ${inst.bgLight} border border-white`} style={{ color: inst.color }}>
                  {inst.type}
                </span>
              </div>
              
              <h3 className="text-lg font-black text-emerald-950 mb-1">{inst.name}</h3>
              
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800/70 mb-5">
                <User className="w-4 h-4" />
                <span>{inst.leader}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 rounded-2xl bg-[#f4f7f5] border border-emerald-100/40">
                  <span className="block text-lg font-black text-emerald-900">{inst.stats.students}</span>
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-emerald-800/50 mt-1">Santri/Siswa</span>
                </div>
                <div className="text-center p-3 rounded-2xl bg-[#f4f7f5] border border-emerald-100/40">
                  <span className="block text-lg font-black text-emerald-900">{inst.stats.teachers}</span>
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-emerald-800/50 mt-1">Pengajar</span>
                </div>
                <div className="text-center p-3 rounded-2xl bg-[#f4f7f5] border border-emerald-100/40">
                  <span className="block text-lg font-black text-emerald-900">{inst.stats.documents}</span>
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-emerald-800/50 mt-1">Arsip</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => onNavigate(`institution-${inst.id}`)}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all border group-hover:border-transparent"
              style={{ 
                color: inst.color, 
                borderColor: `${inst.color}40`,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = inst.color;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = inst.color;
              }}
            >
              Lihat Profil <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
