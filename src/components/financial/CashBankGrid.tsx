import React from 'react';
import { Landmark, Store, CreditCard, Building2, CheckCircle2 } from 'lucide-react';
import type { CashBankReport } from '../../types';

interface CashBankGridProps {
  cashBank: CashBankReport | null;
  isLoading: boolean;
}

export const CashBankGrid: React.FC<CashBankGridProps> = ({
  cashBank,
  isLoading,
}) => {
  const formatRupiah = (val?: number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const bankAccounts = cashBank?.bank_accounts || [];
  const cashRegisters = cashBank?.cash_registers || [];
  const totalBank = bankAccounts.reduce((sum, b) => sum + b.balance, 0);
  const totalRegisters = cashRegisters.reduce((sum, r) => sum + r.balance, 0);

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Posisi Saldo Kas & Rekening Bank (Accurate GL)</h3>
            <p className="text-[11px] text-slate-400">Verifikasi saldo likuid akun perbankan dan kas fisik toko</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Bank:</span>
            <span className="font-bold text-white font-mono">{formatRupiah(totalBank)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Kas Fisik:</span>
            <span className="font-bold text-white font-mono">{formatRupiah(totalRegisters)}</span>
          </div>
        </div>
      </div>

      {/* Grid: Left Bank Accounts, Right Store Registers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bank Accounts */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Rekening Bank Operasional & QRIS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-950/60 animate-pulse" />
              ))
            ) : bankAccounts.length === 0 ? (
              <div className="col-span-2 text-center py-6 text-xs text-slate-500">
                Tidak ada rekening bank terdaftar.
              </div>
            ) : (
              bankAccounts.map((acc) => {
                const isZero = acc.balance === 0;
                return (
                  <div
                    key={acc.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      isZero
                        ? 'bg-slate-950/30 border-slate-900/60 opacity-60'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">{acc.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{acc.account_no}</div>
                      </div>
                      {!isZero && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="text-sm font-bold text-white mt-2 font-mono">
                      {formatRupiah(acc.balance)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Store Registers */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kasir & Brankas Toko (Store Petty Cash)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-950/60 animate-pulse" />
              ))
            ) : cashRegisters.length === 0 ? (
              <div className="col-span-2 text-center py-6 text-xs text-slate-500">
                Tidak ada kas toko terdaftar.
              </div>
            ) : (
              cashRegisters.map((reg) => {
                const isZero = reg.balance === 0;
                return (
                  <div
                    key={reg.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      isZero
                        ? 'bg-slate-950/30 border-slate-900/60 opacity-60'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">{reg.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{reg.account_no}</div>
                      </div>
                      {!isZero && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="text-sm font-bold text-emerald-300 mt-2 font-mono">
                      {formatRupiah(reg.balance)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
