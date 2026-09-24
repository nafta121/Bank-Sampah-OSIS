import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Recycle,
  LayoutDashboard,
  Scale,
  Award,
  FileSpreadsheet,
  Bell,
  Wifi,
  WifiOff,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'entry' | 'points' | 'reports';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOnline: boolean;
  offlineQueueCount: number;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isOnline,
  offlineQueueCount,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenLoginModal,
}) => {
  const { currentUser, logout, accessToken } = useAuth();

  const navItems: { tab: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      tab: 'dashboard',
      label: 'Dasbor',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      tab: 'entry',
      label: 'Setor Sampah',
      icon: <Scale className="w-4 h-4" />,
    },
    {
      tab: 'points',
      label: 'Poin & Reward',
      icon: <Award className="w-4 h-4" />,
    },
    {
      tab: 'reports',
      label: 'Laporan Bulanan',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl text-white shadow-md shadow-emerald-500/20">
              <Recycle className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight">
                  Bank Sampah OSIS
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md">
                  Smart Eco
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium hidden sm:block">
                Operasional Daur Ulang & Kas Kelas Sekolah
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/50">
            {navItems.map((item) => {
              const isActive = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => onSelectTab(item.tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online / Offline status badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-300 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>
                    Offline {offlineQueueCount > 0 && `(${offlineQueueCount})`}
                  </span>
                </>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-xs">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* User Session Profile Button */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {currentUser.role === 'class_rep' ? 'K' : 'O'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-bold text-gray-900 truncate max-w-[130px]">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {currentUser.role === 'class_rep' ? 'Perwakilan Kelas' : 'Pengurus OSIS'}
                  </div>
                </div>
              </button>

              <button
                onClick={logout}
                title="Keluar / Ganti Akun"
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Subnavigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-gray-100 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => onSelectTab(item.tab)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-bold transition ${
                  isActive
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
