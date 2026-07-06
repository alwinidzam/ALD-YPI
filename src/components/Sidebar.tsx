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
  Home
} from 'lucide-react';
import { UserRole } from '../types';
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
}

export default function Sidebar({
  currentView,
  onViewChange,
  userRole,
  userName,
  onLogout,
  showInstallBtn = false,
  onInstall,
  userPhotoURL
}: SidebarProps) {
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isViewer = userRole === 'VIEWER';

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
  ];

  if (!isViewer) {
    menuItems.push({ id: 'dashboard', label: 'Dashboard Workspace', icon: LayoutDashboard });
  }

  menuItems.push(
    { id: 'archive', label: 'Arsip Explorer', icon: Archive },
    { id: 'search', label: 'Pencarian Cepat', icon: Search }
  );

  if (isViewer) {
    menuItems.push({ id: 'favorites', label: 'Berkas Favorit', icon: Sparkles });
  }

  // Super Admin exclusive controls
  const adminItems = [
    { id: 'users', label: 'Manajemen User', icon: Users, reqSuper: true },
    { id: 'audit', label: 'Audit System Log', icon: History, reqSuper: true },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const handleItemClick = (id: string) => {
    onViewChange(id);
  };

  return (
    <aside
      id="desktop_sidebar"
      className="hidden md:flex flex-col w-66 bg-gradient-to-b from-[#e8f3ec] via-[#f4f9f6] to-[#e8f3ec] text-slate-800 border-r border-emerald-200/40 shrink-0 sticky top-0 h-screen select-none shadow-[4px_0_24px_rgba(16,185,129,0.04)] font-sans"
    >
      {/* Brand Logo Header */}
      <div className="p-5 border-b border-emerald-200/30 bg-white/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-md"></div>
            <img
              src={ypiLogo}
              alt="Logo YPI"
              className="relative w-11 h-11 object-contain shrink-0 filter drop-shadow-[0_4px_10px_rgba(16,185,129,0.15)]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-emerald-700 font-extrabold uppercase tracking-widest leading-none">
              Arsip Laporan Digital
            </p>
            <h1 className="text-xs font-black text-emerald-950 tracking-wide uppercase leading-snug mt-1.5 break-words font-sans">
              YPI RAUDHOTUT THOLIBIN
            </h1>
          </div>
        </div>
      </div>

      {/* User Card */}
      <div className="px-4 py-3.5 border-b border-emerald-200/20 bg-emerald-50/30">
        <div
          onClick={() => onViewChange('profile')}
          className={`flex items-center gap-3 p-3 rounded-2xl bg-white/70 border border-emerald-100/40 shadow-[0_2px_12px_rgba(165,180,169,0.05)] cursor-pointer hover:bg-white hover:border-emerald-300 transition-all group duration-200 ${currentView === 'profile' ? 'ring-2 ring-emerald-500 bg-white border-emerald-300' : ''}`}
          title="Lihat & Edit Profil"
        >
          {userPhotoURL ? (
            <img
              src={userPhotoURL}
              alt="Avatar"
              className="w-9 h-9 rounded-xl object-cover border border-emerald-200/50 shadow-inner shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center font-black text-sm uppercase shadow-[0_4px_12px_rgba(16,185,129,0.15)] shrink-0">
              {userName ? userName.charAt(0) : 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-black text-emerald-950 truncate leading-tight group-hover:text-emerald-800 transition-colors">
              {userName}
            </h3>
            <span className="text-[9px] font-extrabold tracking-wider uppercase text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10 inline-block mt-1 truncate">
              {userRole.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-1 px-4 py-5 space-y-6 overflow-y-auto custom-scrollbar">
        <div className="space-y-1.5">
          <span className="px-3 text-[9px] font-extrabold uppercase tracking-widest text-emerald-800/50 block mb-2">
            Menu Utama
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white text-emerald-900 shadow-[0_4px_16px_rgba(16,185,129,0.1)] border border-emerald-200/40 scale-[1.02]'
                    : 'hover:bg-emerald-500/10 hover:text-emerald-950 text-emerald-800/80 hover:scale-[1.01]'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-700' : 'text-emerald-800/50'}`}>
                  <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.5]' : ''}`} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Admin/Super Admin Section */}
        {(!isViewer) && (
          <div className="space-y-1.5">
            <span className="px-3 text-[9px] font-extrabold uppercase tracking-widest text-emerald-800/50 block mb-2">
              Administrasi
            </span>
            {adminItems.map((item) => {
              if (item.reqSuper && !isSuperAdmin) return null;
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-900 shadow-[0_4px_16px_rgba(16,185,129,0.1)] border border-emerald-200/40 scale-[1.02]'
                      : 'hover:bg-emerald-500/10 hover:text-emerald-950 text-emerald-800/80 hover:scale-[1.01]'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-700' : 'text-emerald-800/50'}`}>
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.5]' : ''}`} />
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Core Settings */}
        <div className="space-y-1.5">
          <span className="px-3 text-[9px] font-extrabold uppercase tracking-widest text-emerald-800/50 block mb-2">
            Lainnya
          </span>
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white text-emerald-900 shadow-[0_4px_16px_rgba(16,185,129,0.1)] border border-emerald-200/40 scale-[1.02]'
                    : 'hover:bg-emerald-500/10 hover:text-emerald-950 text-emerald-800/80 hover:scale-[1.01]'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-700' : 'text-emerald-800/50'}`}>
                  <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.5]' : ''}`} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* PWA Install Promo Card inside Sidebar */}
      {showInstallBtn && onInstall && (
        <div className="mx-4 mb-3 p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-200/30 rounded-2xl shadow-[0_2px_10px_rgba(16,185,129,0.03)] text-center">
          <button
            onClick={onInstall}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-[10.5px] font-extrabold py-2.5 rounded-xl transition-all active:scale-[0.97] shadow-sm cursor-pointer"
          >
            Pasang Aplikasi ALD
          </button>
        </div>
      )}

      {/* Sidebar Footer / Logout */}
      <div className="p-4 border-t border-emerald-100/60 bg-emerald-50/10 shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/5 hover:text-red-600 transition-all active:scale-95 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0 stroke-[2.5] text-red-400" />
          <span>Keluar Sistem</span>
        </button>
        
        {/* Credits */}
        <div className="mt-4 pt-3 border-t border-emerald-100/40 text-center">
          <p className="text-[10px] text-slate-400 font-medium select-none tracking-wide">
            Developed By : <span className="font-extrabold text-emerald-600">wiuu/code</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
