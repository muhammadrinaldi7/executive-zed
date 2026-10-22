import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useFilter } from '../context/FilterContext';
import type { FilterOptions, DashboardOverviewData } from '../types';
import { ZedLogo } from './ZedLogo';
import { RefreshCw, LogOut } from 'lucide-react';

interface HeaderProps {
  filterOptions?: FilterOptions | null;
  isLoading?: boolean;
  overview?: DashboardOverviewData | null;
}

export const Header: React.FC<HeaderProps> = ({ isLoading }) => {
  const { user, logout } = useAuth();
  const {
    lastRefreshed,
    refreshData,
    isAutoRefresh,
    setIsAutoRefresh,
  } = useFilter();

  const timeString = lastRefreshed.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand Identity & Intelligence Badge */}
          <div className="flex items-center gap-3">
            <ZedLogo size="md" withGlow={true} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  ZED <span className="text-indigo-400 font-black">Executive</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Sync Status, Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Auto-Refresh Toggle Pill */}
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              title="Toggle auto-refresh setiap 60 detik"
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isAutoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAutoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
              <span>Live 60s</span>
            </button>

            {/* Instant Refresh Button */}
            <button
              onClick={refreshData}
              disabled={isLoading}
              title={`Diperbarui pukul ${timeString}. Klik untuk reload.`}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline tabular-nums">{timeString}</span>
            </button>

            {/* User Profile Chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                {user?.name?.charAt(0) || 'D'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-white leading-tight">
                  {user?.name}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {user?.roles?.join(', ') || 'Direksi'}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Keluar dari sesi Direksi"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
