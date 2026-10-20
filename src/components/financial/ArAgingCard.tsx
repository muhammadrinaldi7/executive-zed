import React from 'react';
import { Users, ArrowDownLeft, ExternalLink } from 'lucide-react';
import type { FinancialAgingSummary, FinancialDebtor } from '../../types';

interface ArAgingCardProps {
  aging?: FinancialAgingSummary;
  topDebtors?: FinancialDebtor[];
  totalReceivables: number;
  isLoading: boolean;
  onOpenModal: () => void;
}

export const ArAgingCard: React.FC<ArAgingCardProps> = ({
  aging,
  topDebtors = [],
  totalReceivables,
  isLoading,
  onOpenModal,
}) => {
  const formatRupiah = (val?: number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const buckets = [
    { key: 'days_0_7', label: '0 - 7 Hari (Lancar)', color: 'bg-emerald-500', textColor: 'text-emerald-400', badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    { key: 'days_8_14', label: '8 - 14 Hari (Perhatian)', color: 'bg-blue-500', textColor: 'text-blue-400', badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
    { key: 'days_15_30', label: '15 - 30 Hari (Mendesak)', color: 'bg-amber-500', textColor: 'text-amber-400', badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
    { key: 'days_over_30', label: '> 30 Hari (Overdue)', color: 'bg-rose-500', textColor: 'text-rose-400', badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
  ] as const;

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl flex flex-col justify-between space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Umur Piutang (AR Aging Schedule)</h3>
            <p className="text-[11px] text-slate-400">Klasifikasi keterlambatan pelunasan faktur pelanggan</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
        >
          <span>Daftar Faktur</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Aging Grid / Progress Bars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {buckets.map((b) => {
          const item = aging?.[b.key] || { amount: 0, count: 0 };
          const pct = totalReceivables > 0 ? (item.amount / totalReceivables) * 100 : 0;
          return (
            <div key={b.key} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium truncate">{b.label}</div>
                <div className="text-xs font-bold text-white mt-1 font-mono">
                  {isLoading ? '...' : formatRupiah(item.amount)}
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>{item.count} faktur</span>
                  <span>{pct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${b.color} transition-all duration-500`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Debtors Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Top Mitra Finance & Pelanggan Penunggak Terbesar</span>
          </div>
          <span className="text-[11px] text-slate-500 font-normal">Diurutkan berdasarkan sisa piutang</span>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-950/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : topDebtors.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">Tidak ada piutang outstanding.</div>
          ) : (
            topDebtors.slice(0, 5).map((debtor, idx) => {
              const sharePct = totalReceivables > 0 ? (debtor.total_owing / totalReceivables) * 100 : 0;
              return (
                <div
                  key={debtor.customer_name + idx}
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/80 transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-400 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200 truncate">{debtor.customer_name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>{debtor.invoice_count} faktur aktif</span>
                        <span>&bull;</span>
                        <span>Porsi: {sharePct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-blue-300 font-mono">
                      {formatRupiah(debtor.total_owing)}
                    </div>
                    <div className="w-20 bg-slate-800 rounded-full h-1 mt-1 ml-auto overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, sharePct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
