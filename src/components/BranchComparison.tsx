import React, { useState } from 'react';
import type { BranchMetric, FilterParams } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Store, Trophy, Receipt, ExternalLink } from 'lucide-react';
import { useFilter } from '../context/FilterContext';
import { BranchTransactionsModal } from './modals/BranchTransactionsModal';

interface BranchComparisonProps {
  branches?: BranchMetric[] | null;
  isLoading?: boolean;
  filterParams?: FilterParams;
}

export const BranchComparison: React.FC<BranchComparisonProps> = ({ 
  branches, 
  isLoading,
  filterParams: propFilters,
}) => {
  const { filters: contextFilters } = useFilter();
  const activeFilters = propFilters || contextFilters;

  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  if (isLoading || !branches) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800 animate-pulse h-96 flex flex-col justify-between">
        <div className="h-5 bg-slate-800 rounded w-44" />
        <div className="space-y-4 my-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-slate-900/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800 text-center py-12">
        <Store className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">Tidak ada data cabang</h4>
        <p className="text-xs text-slate-500 mt-1">
          Tidak ada data transaksi cabang pada periode dan filter yang dipilih.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800/90 max-w-full overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-400" />
              Performa Cabang Toko
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Komparasi omset, laba kotor, dan kontribusi terhadap pendapatan
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
            {branches.length} Cabang Aktif
          </span>
        </div>

        <div className="space-y-3 mt-4">
          {branches.map((branch, idx) => {
            const isTop = idx === 0 && branch.net_sales > 0;
            return (
              <div
                key={branch.branch_name}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isTop
                    ? 'bg-gradient-to-r from-indigo-950/40 via-slate-900/90 to-slate-900/90 border-indigo-500/40 shadow-lg shadow-indigo-950/30'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 sm:mt-0 ${
                        idx === 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                          : idx === 1
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-500 border border-amber-600/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx === 0 ? (
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        `#${idx + 1}`
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span className="truncate">{branch.branch_name}</span>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                              Juara Omset
                            </span>
                          )}
                        </h4>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-x-2 gap-y-1 mt-1 flex-wrap">
                        {/* Interactive Clickable Invoices Count Button */}
                        <button
                          onClick={() => setSelectedBranch(branch.branch_name)}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-all hover:scale-[1.02] cursor-pointer group shadow-sm shadow-indigo-950/40"
                          title={`Klik untuk melihat detail ${branch.orders_count} faktur transaksi ${branch.branch_name}`}
                        >
                          <Receipt className="w-3 h-3 text-indigo-400 group-hover:text-indigo-300" />
                          <span>{branch.orders_count} Transaksi</span>
                          <ExternalLink className="w-2.5 h-2.5 text-indigo-400/70 group-hover:text-indigo-300 ml-0.5" />
                        </button>
                        <span>•</span>
                        <span>{branch.total_qty} pcs</span>
                        <span>•</span>
                        <span>AOV: {formatCurrency(branch.average_order_value)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right flex sm:flex-col justify-between sm:justify-start items-baseline sm:items-end gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 min-w-0">
                    <div className="text-sm font-extrabold text-white tabular-nums">
                      {formatCurrency(branch.net_sales)}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-400 mt-0.5 tabular-nums flex items-center justify-end gap-1.5 flex-wrap">
                      <span>Laba: {formatCurrency(branch.gross_profit)}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          branch.margin_percentage >= 25
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            : branch.margin_percentage >= 15
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        }`}
                        title={`Margin Cabang: ${branch.margin_percentage.toFixed(1)}%`}
                      >
                        {branch.margin_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Contribution Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-medium">
                    <span>Pangsa Kontribusi</span>
                    <span className="text-white font-bold">{branch.contribution_percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTop
                          ? 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.max(branch.contribution_percentage, 1)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drill-down Invoices Modal */}
      {selectedBranch && (
        <BranchTransactionsModal
          branch={selectedBranch}
          filterParams={activeFilters}
          onClose={() => setSelectedBranch(null)}
        />
      )}
    </>
  );
};
