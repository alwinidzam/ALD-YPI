import React, { useState } from 'react';
import { 
  Building2, Users, FileText, ChevronRight, User, BookOpen, 
  Search, Grid, List, Compass, Target, Phone, MapPin, Sparkles, HelpCircle 
} from 'lucide-react';
import { InstitutionType } from '../types';
import { FirestoreStaffRepository } from '../domains/attendance/repositories/FirestoreStaffRepository';
const staffRepo = new FirestoreStaffRepository();
import { motion, AnimatePresence } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      stiffness: 120, 
      damping: 14 
    } 
  }
};

interface InstitutionCardProps {
  id: string;
  name: string;
  type: InstitutionType;
  category: 'FORMAL' | 'NON_FORMAL' | 'PESANTREN';
  leader: string;
  tagline: string;
  vision: string;
  mission: string[];
  contact: string;
  location: string;
  stats: {
    students: number;
    teachers: number;
    documents: number;
  };
  color: string;
  bgLight: string;
  icon: React.ReactNode;
}

const institutions: InstitutionCardProps[] = [
  {
    id: 'sma',
    name: 'SMA Raudhotut Tholibin',
    type: 'SMA',
    category: 'FORMAL',
    leader: 'Ahmad Muthohar, S.Pd.',
    tagline: 'Unggul dalam Prestasi, Anggun dalam Akhlak, Berdaya Saing Global',
    vision: 'Mencetak generasi cerdas akademis yang berakar kuat pada nilai salafiah Ahlussunnah wal Jama\'ah.',
    mission: [
      'Menyelenggarakan pendidikan formal berkualitas berbasis kompetensi abad 21.',
      'Mengintegrasikan kurikulum nasional dengan pembiasaan nilai akhlakul karimah.',
      'Mengembangkan minat bakat sains dan teknologi santri.'
    ],
    contact: '0812-3456-7801',
    location: 'Gedung Utara, Lt. 1 & 2',
    stats: { students: 342, teachers: 28, documents: 156 },
    color: '#1d4ed8', // blue-700
    bgLight: 'bg-blue-50',
    icon: <Building2 className="w-8 h-8 text-blue-600" />,
  },
  {
    id: 'mts',
    name: 'MTs Raudhotut Tholibin',
    type: 'MTS',
    category: 'FORMAL',
    leader: 'Kurdi Abdul Jalil, S.Ag.',
    tagline: 'Membentuk Karakter Islami yang Disiplin, Cerdas, dan Kreatif',
    vision: 'Menjadi madrasah percontohan yang melahirkan lulusan berilmu luas dan berbudi pekerti luhur.',
    mission: [
      'Menanamkan dasar akidah Islamiyah dan fiqih harian secara intensif.',
      'Menyelenggarakan pembelajaran saintifik yang kreatif dan interaktif.',
      'Mengaktifkan ekstrakurikuler kepramukaan dan seni rebana.'
    ],
    contact: '0812-3456-7901',
    location: 'Gedung Barat, Sayap Kiri',
    stats: { students: 485, teachers: 35, documents: 210 },
    color: '#047857', // emerald-700
    bgLight: 'bg-emerald-50',
    icon: <BookOpen className="w-8 h-8 text-emerald-600" />,
  },
  {
    id: 'madin',
    name: 'Madrasah Diniyah',
    type: 'MADIN',
    category: 'NON_FORMAL',
    leader: 'Ust. Muhammad Zidni',
    tagline: 'Menggali Khazanah Kitab Kuning, Menjaga Tradisi Salaf',
    vision: 'Melestarikan sanad keilmuan Islam klasik melalui sistem madrasah berjenjang.',
    mission: [
      'Mengajarkan ilmu nahwu, shorof, tauhid, dan fiqih ibadah secara sistematis.',
      'Membiasakan muhafadhoh (hafalan nazhom) imrithi dan alfiyah.',
      'Menyelenggarakan musyawarah (bahtsul masa\'il) santri.'
    ],
    contact: '0812-3456-7101',
    location: 'Masjid Jami\' & Kompleks Aula Barat',
    stats: { students: 620, teachers: 42, documents: 89 },
    color: '#6d28d9', // purple-700
    bgLight: 'bg-purple-50',
    icon: <Users className="w-8 h-8 text-purple-600" />,
  },
  {
    id: 'tk',
    name: 'TK Raudhotut Tholibin',
    type: 'TK',
    category: 'FORMAL',
    leader: 'Ibu Junaedah, S.Pd.',
    tagline: 'Belajar Sambil Bermain, Menanamkan Karakter Mulia Sejak Dini',
    vision: 'Mewujudkan anak didik yang religius, mandiri, ceria, dan gemar bersosialisasi.',
    mission: [
      'Mengenalkan huruf hijaiyah dan doa-doa harian secara menyenangkan.',
      'Melatih motorik halus dan kasar melalui permainan edukatif.',
      'Membangun rasa percaya diri melalui ekspresi seni anak.'
    ],
    contact: '0812-3456-7201',
    location: 'Paviliun Kidul, Dekat Taman Bermain',
    stats: { students: 125, teachers: 12, documents: 45 },
    color: '#b45309', // amber-700
    bgLight: 'bg-amber-50',
    icon: <Building2 className="w-8 h-8 text-amber-600" />,
  },
  {
    id: 'pesantren',
    name: 'Pondok Pesantren',
    type: 'PESANTREN',
    category: 'PESANTREN',
    leader: 'K.H. Atsna',
    tagline: 'Tafaqquh Fiddin, Khidmah Lil Ummah, Luhur Budi',
    vision: 'Mencetak ulama-intelektual yang menguasai syariah dan berintegritas tinggi untuk mengabdi kepada umat.',
    mission: [
      'Melaksanakan pengajian sorogan, bandongan, dan khotmil kitab secara konsisten.',
      'Mengasuh akhlak santri melalui keteladanan (uswah hasanah) kyai.',
      'Membekali keterampilan kemandirian dan wirausaha santri.'
    ],
    contact: '0812-3456-7301',
    location: 'Kompleks Asrama Putra & Putri Pusat',
    stats: { students: 850, teachers: 65, documents: 320 },
    color: '#015e2a', // deep green
    bgLight: 'soft-gradient-dark/5',
    icon: <Building2 className="w-8 h-8 text-[#015e2a]" />,
  }
];

export function InstitutionDirectory({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [allStaff, setAllStaff] = React.useState<any[]>([]);
  React.useEffect(() => {
    staffRepo.findAll().then(setAllStaff);
  }, []);

  const getTeacherCount = (instId: string, fallback: number) => {
    if (allStaff.length === 0) return fallback;
    const upperId = instId.toUpperCase();
    return allStaff.filter(s => s.institutions?.includes(upperId as any) || s.primaryInstitution === upperId).length;
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'FORMAL' | 'NON_FORMAL' | 'PESANTREN'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Filter institutions
  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = 
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.leader.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'ALL' || inst.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (cat: 'FORMAL' | 'NON_FORMAL' | 'PESANTREN') => {
    switch (cat) {
      case 'FORMAL': return 'Sekolah Formal';
      case 'NON_FORMAL': return 'Madrasah Non-Formal';
      case 'PESANTREN': return 'Pondok Pesantren';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Dynamic Header Banner */}
      <div className="soft-gradient-dark rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden border border-white/10 shadow-lg">
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 soft-bg/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Sinergi Unit Pendidikan
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-wide leading-tight">
              Direktori Lembaga Pendidikan
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
              Informasi lengkap visi, misi, pimpinan, lokasi taktis, dan statistik mutakhir dari seluruh unit di bawah naungan Yayasan Pendidikan Islam Raudhotut Tholibin.
            </p>
          </div>
          
          <div className="shrink-0 soft-bg/5 backdrop-blur-md p-4 rounded-xl border border-white/15 text-center hidden sm:block">
            <span className="block text-2xl font-serif font-bold text-amber-300">{institutions.length}</span>
            <span className="block text-xs font-medium text-emerald-100 mt-1">Total Unit Lembaga</span>
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="soft-inset p-5 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-3.5 justify-between">
          
          {/* Elegant Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-800/40" />
            <input
              type="text"
              placeholder="Cari lembaga, pimpinan, atau visi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="soft-input pl-11"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'GRID' 
                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' 
                  : 'soft-bg hover:bg-slate-50 border border-slate-200 text-slate-400'
              }`}
              title="Tampilan Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'LIST' 
                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' 
                  : 'soft-bg hover:bg-slate-50 border border-slate-200 text-slate-400'
              }`}
              title="Tampilan List Ringkas"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {(['ALL', 'FORMAL', 'NON_FORMAL', 'PESANTREN'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-700 border-transparent text-white font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/70 text-slate-600'
              }`}
            >
              {cat === 'ALL' ? 'Semua Unit' : getCategoryLabel(cat as any)}
            </button>
          ))}
        </div>
      </div>

      {/* No Results Fallback */}
      {filteredInstitutions.length === 0 && (
        <div className="soft-card py-16 text-center max-w-lg mx-auto space-y-4">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-700 uppercase">Unit Lembaga Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
              Kami tidak dapat menemukan lembaga dengan pencarian "{searchQuery}". Periksa kembali kata kunci Anda.
            </p>
          </div>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
            className="soft-button-secondary px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'GRID' ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredInstitutions.map((inst) => (
            <motion.div 
              key={inst.id}
              variants={itemVariants}
              className="soft-card soft-card-hover p-6 transition-all flex flex-col justify-between group relative overflow-hidden h-[385px] w-full"
            >
              {/* Corner Accent Graphic */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full ${inst.bgLight} opacity-50 -z-0`} />
              
              <div className="relative z-10 space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 rounded-xl ${inst.bgLight} flex items-center justify-center border border-white`}>
                    {inst.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${inst.bgLight} border border-white`} style={{ color: inst.color }}>
                      {inst.type}
                    </span>
                    <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wide">
                      {getCategoryLabel(inst.category)}
                    </span>
                  </div>
                </div>
                
                {/* Titles */}
                <div>
                  <h3 className="text-lg font-serif font-bold text-emerald-950 group-hover:text-emerald-900 transition-colors">{inst.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold italic mt-0.5 leading-snug">"{inst.tagline}"</p>
                </div>
                
                {/* Leader & Location */}
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inst.leader}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inst.location}</span>
                  </div>
                </div>

                {/* Statistics Bento */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="text-center p-2 rounded-xl soft-bg border border-emerald-100/40 hover:bg-emerald-50/50 transition-colors">
                    <span className="block text-base font-bold text-emerald-900">{inst.stats.students}</span>
                    <span className="block text-[8px] font-semibold uppercase tracking-wider text-emerald-800/50 mt-0.5">Siswa/i</span>
                  </div>
                  <div className="text-center p-2 rounded-xl soft-bg border border-emerald-100/40 hover:bg-emerald-50/50 transition-colors">
                    <span className="block text-base font-bold text-emerald-900">{getTeacherCount(inst.id, inst.stats.teachers)}</span>
                    <span className="block text-[8px] font-semibold uppercase tracking-wider text-emerald-800/50 mt-0.5">Guru</span>
                  </div>
                  <div className="text-center p-2 rounded-xl soft-bg border border-emerald-100/40 hover:bg-emerald-50/50 transition-colors">
                    <span className="block text-base font-bold text-emerald-900">{inst.stats.documents}</span>
                    <span className="block text-[8px] font-semibold uppercase tracking-wider text-emerald-800/50 mt-0.5">Arsip</span>
                  </div>
                </div>

                {/* Expandable Vision & Mission Statement */}
                <div className="border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setExpandedCard(expandedCard === inst.id ? null : inst.id)}
                    className="w-full flex items-center justify-between text-[10px] text-[#015e2a] hover:text-emerald-800 font-semibold tracking-wide uppercase transition-all"
                  >
                    <span>Visi & Misi Unit</span>
                    <span className="text-xs">{expandedCard === inst.id ? 'Tutup ▲' : 'Buka ▼'}</span>
                  </button>

                  <AnimatePresence>
                    {expandedCard === inst.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2.5 pt-3 text-left">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Compass className="w-3 h-3 text-[#015e2a]" /> Visi
                            </p>
                            <p className="text-[11px] font-semibold text-slate-600 leading-normal bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              {inst.vision}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Target className="w-3 h-3 text-[#015e2a]" /> Misi Utama
                            </p>
                            <ul className="space-y-1 pl-2">
                              {inst.mission.map((m, idx) => (
                                <li key={idx} className="text-[10px] font-semibold text-slate-600 list-disc list-outside leading-normal pl-1 ml-2">
                                  {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {/* View Profile Action Link */}
              <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between gap-3 relative z-10">
                <a href={`tel:${inst.contact}`} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-700 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> {inst.contact}
                </a>

                <button 
                  onClick={() => onNavigate(`institution-${inst.id}`)}
                  className="px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all border active:scale-95 cursor-pointer"
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
                  Profil Lengkap <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* COMPACT LIST VIEW */
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filteredInstitutions.map((inst) => (
            <motion.div
              key={inst.id}
              variants={itemVariants}
              className="soft-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-emerald-300 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-xl ${inst.bgLight} flex items-center justify-center shrink-0`}>
                  {inst.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800 leading-tight">{inst.name}</h3>
                    <span className={`text-[8px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${inst.bgLight}`} style={{ color: inst.color }}>
                      {inst.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5 mt-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pimpinan: {inst.leader}</span>
                    <span className="text-slate-300">•</span>
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inst.location}</span>
                  </p>
                </div>
              </div>

              {/* Statistics & Button combo */}
              <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-0 pt-3 sm:pt-0">
                <div className="flex items-center gap-4 text-center">
                  <div>
                    <span className="block text-xs font-bold text-slate-800">{inst.stats.students}</span>
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Siswa</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800">{getTeacherCount(inst.id, inst.stats.teachers)}</span>
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Guru</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800">{inst.stats.documents}</span>
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Arsip</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(`institution-${inst.id}`)}
                  className="soft-button-secondary px-4 py-2 text-xs font-semibold flex items-center gap-1"
                >
                  Detail <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

