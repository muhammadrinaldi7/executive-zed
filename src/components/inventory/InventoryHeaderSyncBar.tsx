import React from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck, Calendar, Layers } from 'lucide-react';
import type { InventoryGlAccount } from '../../types';

interface InventoryHeaderSyncBarProps {
  businessUnitName?: string;
  asOfDate?: string;
  lastSyncedAt?: string;
  glAccount?: InventoryGlAccount | null;
  isSyncing: boolean;
  onSync: () => void;
}

export const InventoryHeaderSyncBar: React.FC<InventoryHeaderSyncBarProps> = ({
  businessUnitName = 'GSK / ZED Group',
  asOfDate,
  lastSyncedAt,
  glAccount,
  isSyncing,
  onSync,
}) => {
  const formatTime = (iso?: string) => {
    if (!iso) return 'Baru saja';
    try {
      const d = new Date(iso);
      return (
        d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    } catch {
      return iso;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/20 p-4 sm:p-5 shadow-xl">
      {/* Background glow decorative */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Source & Status Badge */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Data Resmi Stok & HPP Accurate Online
            </span>
            {glAccount && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                GL: {glAccount.account_no} ({glAccount.account_name})
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Posisi Stok Per: <strong className="text-white ml-0.5">{asOfDate || 'Hari Ini'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">{businessUnitName}</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Terakhir sinkronisasi: <span className="text-slate-300 font-mono ml-0.5">{formatTime(lastSyncedAt)}</span>
            </span>
          </div>
        </div>

        {/* Right: Sync Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 active:from-cyan-700 active:to-indigo-700 text-white shadow-lg shadow-cyan-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isSyncing ? 'animate-spin text-white' : 'group-hover:rotate-180 transition-transform duration-500'
              }`}
            />
            <span>{isSyncing ? 'Menyinkronkan Stok...' : 'Sinkronkan dari Accurate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
