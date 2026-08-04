import React from 'react';
import {
  LayoutDashboard,
  Search,
  Archive,
  User,
  Sparkles,
  Home,
  QrCode,
  Bell,
  ShieldAlert
} from 'lucide-react';
import { UserRole } from '../types';
import { hapticService } from '../services/HapticService';

interface BottomNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userRole: UserRole;
  userPhotoURL?: string;
}

export default function BottomNav({ currentView, onViewChange, userRole, userPhotoURL }: BottomNavProps) {
  const isViewer = userRole === 'VIEWER';
  const isKepalaSekolah = userRole.startsWith('KEPALA_');
  const isGuruOrStaff = userRole === 'GURU' || userRole === 'STAFF' || userRole.startsWith('GURU_');

  const NavItem = ({ id, icon: Icon, label, customActive }: { id: string, icon: any, label: string, customActive?: boolean, key?: string }) => {
    const isActive = currentView === id || customActive;
    return (
      <button
        onClick={() => {
          hapticService.trigger('click');
          onViewChange(id);
        }}
        className="flex flex-col items-center justify-center w-[48px] h-[48px] relative group active:scale-95 transition-all duration-200 cursor-pointer"
      >
        <div className={`flex items-center justify-center transition-all duration-300 ${
          isActive ? 'text-emerald-600 scale-110' : 'text-slate-400 group-hover:text-slate-600'
        }`}>
          <Icon className={`w-[22px] h-[22px] transition-all duration-300 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.7]'}`} />
        </div>
        <span className={`text-[9px] mt-1 transition-all duration-300 ${
          isActive ? 'font-bold text-emerald-700' : 'font-medium text-slate-500'
        }`}>
          {label}
        </span>
      </button>
    );
  };

  const ProfileItem = () => {
    const isActive = currentView === 'profile';
    return (
      <button
        onClick={() => {
          hapticService.trigger('click');
          onViewChange('profile');
        }}
        className="flex flex-col items-center justify-center w-[48px] h-[48px] relative group active:scale-95 transition-all duration-200 cursor-pointer"
      >
        <div className={`flex items-center justify-center transition-all duration-300 ${
          isActive ? 'scale-110' : ''
        }`}>
          {userPhotoURL ? (
            <img
              src={userPhotoURL}
              alt="Profil"
              className={`w-6 h-6 rounded-full object-cover transition-all duration-300 ${
                isActive 
                  ? 'border-2 border-emerald-500 shadow-sm' 
                  : 'border border-slate-300 opacity-80 group-hover:opacity-100'
              }`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className={`w-[22px] h-[22px] transition-all duration-300 ${
              isActive ? 'text-emerald-600 stroke-[2.5]' : 'text-slate-400 stroke-[1.7] group-hover:text-slate-600'
            }`} />
          )}
        </div>
        <span className={`text-[9px] mt-1 transition-all duration-300 ${
          isActive ? 'font-bold text-emerald-700' : 'font-medium text-slate-500'
        }`}>
          Profil
        </span>
      </button>
    );
  };

  // Determine Items based on role
  let leftItems = [];
  let rightItems = [];

  if (isGuruOrStaff) {
    leftItems = [
      <NavItem key="announcements" id="announcements" icon={Bell} label="Informasi" />,
      <NavItem key="reporting-center" id="reporting-center" icon={ShieldAlert} label="Laporan" />
    ];
    rightItems = [
      <NavItem key="search" id="search" icon={Search} label="Cari" />,
      <ProfileItem key="profile" />
    ];
  } else {
    // Admins, Viewers, Kepala Sekolah
    leftItems = [
      <NavItem key="home" id="home" icon={Home} label="Home" />,
      <NavItem key="search" id="search" icon={Search} label="Cari" />
    ];
    
    // Determine the 4th item (Archive vs Dashboard vs Favorites)
    let fourthItem = <NavItem key="archive" id="archive" icon={Archive} label="Arsip" />;
    if (!isViewer && !isKepalaSekolah) {
      fourthItem = <NavItem key="dashboard" id="dashboard" icon={LayoutDashboard} label="Admin" />;
    } else if (isViewer || isKepalaSekolah) {
      fourthItem = <NavItem key="favorites" id="favorites" icon={Sparkles} label="Favorit" />;
    }

    rightItems = [
      fourthItem,
      <ProfileItem key="profile" />
    ];
  }

  return (
    <nav
      id="mobile_bottom_nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] pb-safe pointer-events-none"
    >
      <div className="bg-white/95 backdrop-blur-2xl border-t border-slate-200/50 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] pointer-events-auto flex items-center justify-between px-2 h-[64px] relative">
        <div className="flex flex-1 items-center justify-evenly">
          {leftItems}
        </div>
        
        <div className="flex flex-1 items-center justify-evenly">
          {rightItems}
        </div>
      </div>
    </nav>
  );
}
