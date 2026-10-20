import React from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck, Calendar, Info } from 'lucide-react';

interface FinancialHeaderSyncBarProps {
  businessUnitName?: string;
  asOfDate?: string;
  lastSyncedAt?: string;
  isSyncing: boolean;
  onSync: () => void;
}

export const FinancialHeaderSyncBar: React.FC<FinancialHeaderSyncBarProps> = ({
  businessUnitName = 'GSK / ZED Group',
  asOfDate,
  lastSyncedAt,
  isSyncing,
  onSync,
}) => {
  const formatTime = (iso?: string) => {
    if (!iso) return 'Baru saja';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    } catch {
      return iso;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-4 sm:p-5 shadow-xl">
      {/* Background glow decorative */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Source & Status Badge */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Data Resmi Accurate Online (Buku Besar)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Posisi Kumulatif Per: <strong className="text-white ml-0.5">{asOfDate || 'Hari Ini'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">{businessUnitName}</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Terakhir diperbarui: <span className="text-slate-300 font-mono ml-0.5">{formatTime(lastSyncedAt)}</span>
            </span>
          </div>
        </div>

        {/* Right: Info Tooltip & Sync Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-xs max-w-xs bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Mencakup seluruh nota belum lunas sejak awal database sampai tanggal acuan.</span>
          </div>

          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-white' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Accurate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
