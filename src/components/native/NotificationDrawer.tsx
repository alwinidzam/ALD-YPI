import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, X, Settings, ShieldCheck, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { notificationService, AppNotification, NotificationCategory } from '../../services/NotificationService';
import { permissionService } from '../../services/PermissionService';
import { hapticService } from '../../services/HapticService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(notificationService.getNotifications());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('prompt');

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    permissionService.checkPermission('notifications').then(setPermissionStatus);
    return () => unsubscribe();
  }, []);

  const handleRequestPermission = async () => {
    hapticService.trigger('click');
    const res = await permissionService.requestNotificationPermission();
    setPermissionStatus(res);
  };

  const handleMarkAsRead = (id: string) => {
    hapticService.trigger('click');
    notificationService.markAsRead(id);
  };

  const handleMarkAllRead = () => {
    hapticService.trigger('softConfirmation');
    notificationService.markAllAsRead();
  };

  const handleNotificationClick = (notif: AppNotification) => {
    notificationService.markAsRead(notif.id);
    if (notif.deepLink && onNavigate) {
      onNavigate(notif.deepLink);
      onClose();
    }
  };

  const filteredNotifications = selectedCategory === 'all'
    ? notifications
    : notifications.filter(n => n.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Notifikasi Mobile</h3>
              <p className="text-xs text-slate-500 font-medium">Real-time Push & System Alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all"
              title="Pengaturan Notifikasi"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Permission Banner if prompt/denied */}
        {permissionStatus === 'prompt' && (
          <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="text-xs text-indigo-900 font-semibold">Aktifkan Notifikasi Push HP</span>
            </div>
            <button
              onClick={handleRequestPermission}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Izinkan
            </button>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white">
          {['all', 'attendance', 'documents', 'system'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                hapticService.trigger('click');
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Semua' : cat === 'attendance' ? 'Absensi' : cat === 'documents' ? 'Dokumen' : 'Sistem'}
            </button>
          ))}
        </div>

        {/* Action bar */}
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {filteredNotifications.length} Notifikasi ({notifications.filter(n => !n.read).length} belum dibaca)
          </span>
          <button
            onClick={handleMarkAllRead}
            className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Tandai Dibaca
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {filteredNotifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Bell className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-semibold">Tidak ada notifikasi dalam kategori ini.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  notif.read
                    ? 'bg-white border-slate-200 opacity-80'
                    : 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                }`}
              >
                {!notif.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute top-4 right-4" />
                )}
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.category === 'attendance'
                      ? 'bg-emerald-100 text-emerald-700'
                      : notif.category === 'documents'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{notif.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.body}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>{new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      {notif.deepLink && (
                        <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                          Buka <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
