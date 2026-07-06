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
  User,
  Sparkles,
  Home
} from 'lucide-react';
import { UserRole } from '../types';

interface BottomNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userRole: UserRole;
  userPhotoURL?: string;
}

export default function BottomNav({ currentView, onViewChange, userRole, userPhotoURL }: BottomNavProps) {
  const isViewer = userRole === 'VIEWER';

  return (
    <nav
      id="mobile_bottom_nav"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-[0_-6px_24px_rgba(165,180,169,0.15)] px-4 py-2 flex items-center justify-around z-40 select-none pb-safe"
    >
      {/* Home Button */}
      <button
        onClick={() => onViewChange('home')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
          currentView === 'home'
            ? 'text-emerald-600 font-extrabold'
            : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <Home className={`w-5 h-5 ${currentView === 'home' ? 'stroke-[2.5] text-emerald-600' : 'stroke-[1.8]'}`} />
        <span className="text-[9px] font-bold tracking-tight mt-0.5">Home</span>
      </button>

      {/* Search Button */}
      <button
        onClick={() => onViewChange('search')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
          currentView === 'search'
            ? 'text-emerald-600 font-extrabold'
            : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <Search className={`w-5 h-5 ${currentView === 'search' ? 'stroke-[2.5] text-emerald-600' : 'stroke-[1.8]'}`} />
        <span className="text-[9px] font-bold tracking-tight mt-0.5">Cari</span>
      </button>

      {/* Archive Button */}
      <button
        onClick={() => onViewChange('archive')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
          currentView === 'archive'
            ? 'text-emerald-600 font-extrabold'
            : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <Archive className={`w-5 h-5 ${currentView === 'archive' ? 'stroke-[2.5] text-emerald-600' : 'stroke-[1.8]'}`} />
        <span className="text-[9px] font-bold tracking-tight mt-0.5">Arsip</span>
      </button>

      {/* Dynamic Button (Dashboard for admin, Favorite for viewer) */}
      {!isViewer ? (
        <button
          onClick={() => onViewChange('dashboard')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            currentView === 'dashboard'
              ? 'text-emerald-700 font-extrabold'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className="p-1.5 bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white rounded-lg shadow-md shadow-emerald-500/20 -mt-3.5 transform scale-110 border-2 border-white">
            <LayoutDashboard className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-bold tracking-tight mt-0.5">Dashboard</span>
        </button>
      ) : (
        <button
          onClick={() => onViewChange('favorites')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            currentView === 'favorites'
              ? 'text-emerald-600 font-extrabold'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${currentView === 'favorites' ? 'stroke-[2.5] text-yellow-500' : 'stroke-[1.8]'}`} />
          <span className="text-[9px] font-bold tracking-tight mt-0.5">Favorit</span>
        </button>
      )}

      {/* Profile Button */}
      <button
        onClick={() => onViewChange('profile')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
          currentView === 'profile'
            ? 'text-emerald-600 font-extrabold'
            : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        {userPhotoURL ? (
          <img
            src={userPhotoURL}
            alt="Profil"
            className={`w-5 h-5 rounded-full object-cover border ${
              currentView === 'profile' ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-stone-300'
            }`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <User className={`w-5 h-5 ${currentView === 'profile' ? 'stroke-[2.5] text-emerald-600' : 'stroke-[1.8]'}`} />
        )}
        <span className="text-[9px] font-bold tracking-tight mt-0.5">Profil</span>
      </button>
    </nav>
  );
}
