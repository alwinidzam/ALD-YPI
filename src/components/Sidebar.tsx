/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Search,
  Archive,
  UploadCloud,
  Users,
  History,
  Settings,
  LogOut,
  Bell,
  Sparkles,
  Home,
  ChevronRight,
  User,
  QrCode,
  ShieldAlert,
  Camera
} from 'lucide-react';
import { UserRole } from '../types';
import { LazyImage } from './LazyImage';
const ypiLogo = 'https://lh3.googleusercontent.com/d/1_Bu-223XZeb0XfAb9hon6QITM_45br3X';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userRole: UserRole;
  userName: string;
  onLogout: () => void;
  showInstallBtn?: boolean;
  onInstall?: () => void;
  userPhotoURL?: string;
  onOpenScanner?: () => void;
}

export default function Sidebar({
  currentView,
  onViewChange,
  userRole,
  userName,
  onLogout,
  showInstallBtn = false,
  onInstall,
  userPhotoURL,
  onOpenScanner
}: SidebarProps) {
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isViewer = userRole === 'VIEWER';
  const isKepalaSekolah = userRole.startsWith('KEPALA_');
  const isGuruOrStaff = userRole === 'GURU' || userRole === 'STAFF' || userRole.startsWith('GURU_');

  let menuItems = [];

  if (isGuruOrStaff) {
    menuItems = [
      { id: 'announcements', label: 'Pengumuman', icon: Bell },
      { id: 'reporting-center', label: 'Reporting Center', icon: ShieldAlert }
    ];
  } else {
    menuItems = [
      { id: 'home', label: 'Home', icon: Home },
    ];

    if (!isViewer && !isKepalaSekolah) {
      menuItems.push({ id: 'dashboard', label: 'Dashboard Workspace', icon: LayoutDashboard });
    }

    menuItems.push(
      { id: 'archive', label: 'Arsip Explorer', icon: Archive },
      { id: 'search', label: 'Pencarian Cepat', icon: Search },
      { id: 'attendance-dashboard', label: 'Dashboard Kehadiran', icon: Users },
      { id: 'attendance-scanner', label: 'Scanner Absensi', icon: QrCode },
      { id: 'announcements', label: 'Pengumuman', icon: Bell },
      { id: 'reporting-center', label: 'Reporting Center', icon: ShieldAlert }
    );

    if (isViewer || isKepalaSekolah) {
      menuItems.push({ id: 'favorites', label: 'Berkas Favorit', icon: Sparkles });
    }
  }

  // Super Admin exclusive controls
  const adminItems = [
    { id: 'users', label: 'Manajemen User', icon: Users, reqSuper: true },
    { id: 'audit', label: 'Audit System Log', icon: History, reqSuper: true },
  ];

  const bottomItems = isGuruOrStaff ? [] : [
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const handleItemClick = (id: string) => {
    onViewChange(id);
  };

  return (
    <aside
      id="desktop_sidebar"
      className="hidden md:flex flex-col w-[280px] soft-bg text-slate-700 border-r border-white/40 shrink-0 sticky top-0 h-screen select-none font-sans shadow-sm"
    >
      {/* Brand Logo Header */}
      <div className="p-5 border-b border-white/40 bg-transparent">
        <div className="flex items-center gap-3.5">
          <div className="soft-inset p-2 rounded-2xl shrink-0 group flex items-center justify-center">
            <img
              src={ypiLogo}
              alt="Logo YPI"
              className="w-9 h-9 object-contain transform group-hover:scale-105 transition-transform duration-300 filter drop-shadow-sm"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="soft-badge soft-badge-emerald text-[9px] font-extrabold tracking-widest uppercase mb-1">
              Arsip YPI
            </span>
            <h1 className="text-xs font-black text-slate-800 tracking-wide uppercase leading-snug break-words font-sans">
              YPI RAUDHOTUT THOLIBIN
            </h1>
          </div>
        </div>
      </div>

      {/* User Card */}
      <div className="px-4 py-3.5 border-b border-white/40">
        <div
          onClick={() => onViewChange('profile')}
          className={`soft-card soft-card-hover p-3 rounded-2xl flex items-center gap-3 cursor-pointer border border-white/60 transition-all group duration-300 ${
            currentView === 'profile'
              ? 'ring-2 ring-emerald-500/30 bg-emerald-50/40 border-emerald-400/50'
              : ''
          }`}
          title="Lihat & Edit Profil"
        >
          <div className="relative shrink-0">
            {userPhotoURL ? (
              <LazyImage
                src={userPhotoURL}
                alt="Avatar"
                className="w-10 h-10 rounded-xl object-cover border border-emerald-500/20 shadow-inner group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl soft-button-primary flex items-center justify-center font-extrabold text-xs uppercase shadow-inner">
                {userName ? userName.charAt(0) : 'U'}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-extrabold text-slate-800 truncate leading-tight group-hover:text-emerald-700 transition-colors">
              {userName}
            </h3>
            <span className="soft-badge soft-badge-emerald text-[8.5px] font-extrabold tracking-widest uppercase mt-1 truncate max-w-full">
              {userRole.replace('_', ' ')}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-all duration-300 transform group-hover:translate-x-0.5 shrink-0" />
        </div>
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto custom-scrollbar">
        {/* Camera Scanner Quick Trigger */}
        {onOpenScanner && !isViewer && (
          <button
            onClick={onOpenScanner}
            className="soft-button-primary w-full p-3.5 rounded-2xl flex items-center justify-between group shadow-sm hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/15 text-amber-300 shadow-inner shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold leading-tight">Pindai Dokumen</span>
                <span className="block text-[10px] text-emerald-100/90 font-medium">Auto-Crop & PDF</span>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform shrink-0" />
          </button>
        )}

        {/* Menu Utama */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-900/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Menu Utama
            </span>
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? 'soft-button-primary text-white scale-[1.01] shadow-md'
                    : 'hover:soft-card text-slate-700 hover:text-emerald-950 hover:translate-x-1'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white/20 text-white shadow-inner'
                      : 'soft-inset text-emerald-800/80 group-hover:scale-105'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? 'scale-105 stroke-[2.5]' : ''}`} />
                </div>
                <span className="flex-1 text-left tracking-wide">{item.label}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-sm animate-pulse shrink-0"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Admin/Super Admin Section */}
        {!isViewer && !isGuruOrStaff && (
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-900/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                Administrasi
              </span>
            </div>
            {adminItems.map((item) => {
              if (item.reqSuper && !isSuperAdmin) return null;
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? 'soft-button-primary text-white scale-[1.01] shadow-md'
                      : 'hover:soft-card text-slate-700 hover:text-emerald-950 hover:translate-x-1'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-white/20 text-white shadow-inner'
                        : 'soft-inset text-emerald-800/80 group-hover:scale-105'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? 'scale-105 stroke-[2.5]' : ''}`} />
                  </div>
                  <span className="flex-1 text-left tracking-wide">{item.label}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-sm animate-pulse shrink-0"></div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Core Settings */}
        {!isGuruOrStaff && (
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-900/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
                Lainnya
              </span>
            </div>
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? 'soft-button-primary text-white scale-[1.01] shadow-md'
                      : 'hover:soft-card text-slate-700 hover:text-emerald-950 hover:translate-x-1'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-white/20 text-white shadow-inner'
                        : 'soft-inset text-emerald-800/80 group-hover:scale-105'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? 'scale-105 stroke-[2.5]' : ''}`} />
                  </div>
                  <span className="flex-1 text-left tracking-wide">{item.label}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-sm animate-pulse shrink-0"></div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* PWA Install Promo Box inside Sidebar */}
      {showInstallBtn && onInstall && (
        <div className="mx-4 mb-3">
          <button
            onClick={onInstall}
            className="w-full soft-card soft-card-hover p-3 rounded-2xl border border-amber-300/40 text-slate-800 text-xs font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 group-hover:rotate-12 transition-transform" />
            <span>Pasang Aplikasi Arsip YPI</span>
          </button>
        </div>
      )}

      {/* Sidebar Footer / Logout */}
      <div className="p-4 border-t border-white/40 bg-transparent shrink-0 space-y-3">
        <button
          onClick={onLogout}
          className="w-full soft-card p-3 rounded-xl hover:bg-rose-50/80 text-rose-600 font-bold border border-rose-100 hover:border-rose-200 active:scale-[0.97] transition-all duration-200 cursor-pointer flex items-center gap-3"
        >
          <div className="soft-inset p-1.5 rounded-lg text-rose-500">
            <LogOut className="w-4 h-4 shrink-0 stroke-[2.5]" />
          </div>
          <span className="text-xs">Keluar Sistem</span>
        </button>

        {/* Credits */}
        <div className="soft-inset p-2 rounded-xl flex items-center justify-between select-none">
          <p className="text-[10px] text-slate-500 font-semibold tracking-wide">
            Developed By
          </p>
          <span className="px-2 py-0.5 soft-button-primary text-[10px] font-black uppercase tracking-widest rounded-lg">
            wiu
          </span>
        </div>
      </div>
    </aside>
  );
}
