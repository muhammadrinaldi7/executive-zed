import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale, Wallet } from 'lucide-react';
import type { FinancialArApSummary, CashBankReport } from '../../types';

interface ArApOverviewCardsProps {
  summary: FinancialArApSummary | null;
  cashBank: CashBankReport | null;
  isLoading: boolean;
  onOpenReceivablesModal: () => void;
  onOpenPayablesModal: () => void;
}

export const ArApOverviewCards: React.FC<ArApOverviewCardsProps> = ({
  summary,
  cashBank,
  isLoading,
  onOpenReceivablesModal,
  onOpenPayablesModal,
}) => {
  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const totalAr = summary?.receivables?.total_amount ?? 0;
  const countAr = summary?.receivables?.invoice_count ?? 0;

  const totalAp = summary?.payables?.total_amount ?? 0;
  const countAp = summary?.payables?.invoice_count ?? 0;

  const netWorkingCapital = summary?.net_working_capital ?? (totalAr - totalAp);
  const totalLiquidCash = cashBank?.total_liquid_cash ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. PIUTANG REAL ACCURATE (AR) */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-blue-500/20 p-5 shadow-lg group hover:border-blue-500/40 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
            {countAr} Faktur Belum Lunas
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-400">Total Piutang Riil (AR)</div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
            {isLoading ? (
              <div className="h-7 w-32 bg-slate-800 rounded animate-pulse" />
            ) : (
              formatRupiah(totalAr)
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Tagihan Pelanggan & Mitra</span>
          <button
            type="button"
            onClick={onOpenReceivablesModal}
            className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            Lihat Faktur &rarr;
          </button>
        </div>
      </div>

      {/* 2. HUTANG SUPPLIER (AP) */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-amber-500/20 p-5 shadow-lg group hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            {countAp} Faktur Pembelian
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-400">Total Hutang Supplier (AP)</div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-amber-200 font-mono">
            {isLoading ? (
              <div className="h-7 w-32 bg-slate-800 rounded animate-pulse" />
            ) : (
              formatRupiah(totalAp)
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Kewajiban Tempo Supplier</span>
          <button
            type="button"
            onClick={onOpenPayablesModal}
            className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            Lihat Tagihan &rarr;
          </button>
        </div>
      </div>

      {/* 3. MODAL KERJA BERSIH (NET WORKING CAPITAL: AR - AP) */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-purple-500/20 p-5 shadow-lg group hover:border-purple-500/40 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Scale className="w-5 h-5" />
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${netWorkingCapital >= 0 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'}`}>
            {netWorkingCapital >= 0 ? 'Surplus' : 'Defisit Tempo'}
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-400">Modal Kerja (Piutang - Hutang)</div>
          <div className={`text-xl sm:text-2xl font-bold tracking-tight font-mono ${netWorkingCapital >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isLoading ? (
              <div className="h-7 w-32 bg-slate-800 rounded animate-pulse" />
            ) : (
              formatRupiah(netWorkingCapital)
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Rasio Likuiditas AP</span>
          <span className="font-mono text-slate-300">
            {totalAp > 0 ? ((totalAr / totalAp) * 100).toFixed(1) + '%' : '100%'}
          </span>
        </div>
      </div>

      {/* 4. TOTAL KAS & BANK LIKUID */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-emerald-500/20 p-5 shadow-lg group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Kas & Bank Aktif
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-400">Total Kas & Bank Likuid</div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-300 font-mono">
            {isLoading ? (
              <div className="h-7 w-32 bg-slate-800 rounded animate-pulse" />
            ) : (
              formatRupiah(totalLiquidCash)
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>{cashBank?.bank_accounts?.length || 0} Rekening Bank</span>
          <span className="text-slate-300">{cashBank?.cash_registers?.length || 0} Kas Toko</span>
        </div>
      </div>
    </div>
  );
};
