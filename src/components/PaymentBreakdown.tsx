import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PaymentMethodMetric } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  CreditCard, 
  Wallet, 
  Landmark, 
  Banknote, 
  Smartphone, 
  Coins, 
  Sparkles,
  Search,
  Filter,
  X,
  Layers
} from 'lucide-react';

interface PaymentBreakdownProps {
  payments?: PaymentMethodMetric[] | null;
  isLoading?: boolean;
}

const COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#64748b', // Slate
];

const getPaymentCategory = (pm: PaymentMethodMetric): string => {
  const name = pm.payment_method_name.toLowerCase();
  const bank = (pm.bank_name || '').toLowerCase();

  if (name.includes('tunai') || name.includes('cash') || bank.includes('tunai') || bank.includes('cash')) {
    return 'cash';
  }
  if (name.includes('qris') || name.includes('dana') || name.includes('ovo') || name.includes('gopay') || name.includes('shopeepay')) {
    return 'qris';
  }
  if (name.includes('edc') || name.includes('kartu') || name.includes('debit') || name.includes('credit') || name.includes('kredit') && !name.includes('kreditplus')) {
    return 'edc';
  }
  if (name.includes('leasing') || name.includes('kreditplus') || name.includes('home credit') || name.includes('akulaku') || name.includes('fif') || name.includes('paylater')) {
    return 'leasing';
  }
  if (name.includes('transfer') || name.includes('bca') || name.includes('mandiri') || name.includes('bri') || name.includes('bni') || name.includes('bsi') || name.includes('cimb')) {
    return 'transfer';
  }
  return 'other';
};

const getBankName = (pm: PaymentMethodMetric): string => {
  if (pm.bank_name && pm.bank_name !== '-' && pm.bank_name !== 'Unknown') {
    return pm.bank_name.trim();
  }
  const name = pm.payment_method_name.toUpperCase();
  if (name.includes('BCA')) return 'BCA';
  if (name.includes('MANDIRI')) return 'Mandiri';
  if (name.includes('BRI')) return 'BRI';
  if (name.includes('BNI')) return 'BNI';
  if (name.includes('BSI') || name.includes('SYARIAH')) return 'BSI';
  if (name.includes('CIMB')) return 'CIMB Niaga';
  if (name.includes('PERMATA')) return 'Permata';
  if (name.includes('TUNAI') || name.includes('CASH')) return 'Kas / Tunai';
  if (name.includes('QRIS')) return 'QRIS';
  if (name.includes('KREDITPLUS') || name.includes('HOME CREDIT') || name.includes('AKULAKU')) return 'Leasing';
  return 'Lainnya';
};

const getPaymentIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('tunai') || lower.includes('cash')) {
    return <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }
  if (lower.includes('qris') || lower.includes('dana') || lower.includes('ovo') || lower.includes('gopay') || lower.includes('shopeepay')) {
    return <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
  }
  if (lower.includes('transfer') || lower.includes('bca') || lower.includes('mandiri') || lower.includes('bri') || lower.includes('bni')) {
    return <Landmark className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
  }
  if (lower.includes('kredit') || lower.includes('edc') || lower.includes('kartu') || lower.includes('debit') || lower.includes('visa') || lower.includes('master')) {
    return <CreditCard className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
  }
  if (lower.includes('leasing') || lower.includes('kreditplus') || lower.includes('home credit') || lower.includes('akulaku') || lower.includes('fif') || lower.includes('paylater')) {
    return <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }
  return <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
};

export const PaymentBreakdown: React.FC<PaymentBreakdownProps> = ({ payments, isLoading }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique banks available in the dataset (Hooks must be called unconditionally before early returns)
  const availableBanks = useMemo(() => {
    if (!payments) return [];
    const set = new Set<string>();
    payments.forEach((p) => {
      const b = getBankName(p);
      if (b && b !== '-') set.add(b);
    });
    return Array.from(set).sort();
  }, [payments]);

  // Apply filters unconditionally
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter((pm) => {
      // 1. Category filter
      if (selectedCategory !== 'all') {
        const cat = getPaymentCategory(pm);
        if (cat !== selectedCategory) return false;
      }

      // 2. Bank filter
      if (selectedBank !== 'all') {
        const bank = getBankName(pm);
        if (bank.toLowerCase() !== selectedBank.toLowerCase()) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = pm.payment_method_name.toLowerCase().includes(q);
        const matchesBank = (pm.bank_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBank) return false;
      }

      return true;
    });
  }, [payments, selectedCategory, selectedBank, searchQuery]);

  if (isLoading || !payments) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800 animate-pulse h-full min-h-[520px] flex flex-col justify-between">
        <div className="h-5 bg-slate-800 rounded w-48" />
        <div className="h-44 w-44 rounded-full bg-slate-800 mx-auto my-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-900/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800 text-center py-16 h-full flex flex-col items-center justify-center">
        <Wallet className="w-12 h-12 text-slate-600 mb-3" />
        <h4 className="text-sm font-semibold text-slate-300">Tidak ada transaksi pembayaran</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Belum ada catatan pembayaran pada periode dan filter yang dipilih.
        </p>
      </div>
    );
  }

  const hasActiveFilters = selectedCategory !== 'all' || selectedBank !== 'all' || searchQuery.trim() !== '';

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedBank('all');
    setSearchQuery('');
  };

  const totalPayments = filteredPayments.reduce((acc, curr) => acc + curr.total_amount, 0);
  const totalMdr = filteredPayments.reduce((acc, curr) => acc + curr.total_mdr, 0);
  const totalNetAmount = filteredPayments.reduce((acc, curr) => acc + curr.net_amount, 0);
  const totalTransactions = filteredPayments.reduce((acc, curr) => acc + curr.transactions_count, 0);
  const effectiveOverallRate = totalPayments > 0 ? (totalMdr / totalPayments) * 100 : 0;

  const chartData = filteredPayments.map((pm) => ({
    name: pm.payment_method_name,
    value: pm.total_amount,
    count: pm.transactions_count,
    mdr: pm.total_mdr,
    net: pm.net_amount,
    share: totalPayments > 0 ? Number(((pm.total_amount / totalPayments) * 100).toFixed(1)) : 0,
  }));

  const categories = [
    { id: 'all', label: 'Semua' },
    { id: 'transfer', label: 'Transfer Bank' },
    { id: 'qris', label: 'QRIS / E-Wallet' },
    { id: 'edc', label: 'EDC / Kartu' },
    { id: 'cash', label: 'Tunai' },
    { id: 'leasing', label: 'Leasing' },
  ];

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800/90 max-w-full overflow-hidden flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              Distribusi Metode Bayar & MDR
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Komposisi kas masuk, non-tunai, dan pemotongan biaya fee merchant
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Total MDR</div>
              <div className="text-xs font-bold text-rose-400 tabular-nums">
                {formatCurrency(totalMdr)}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Net Settlement</div>
              <div className="text-xs font-bold text-emerald-400 tabular-nums">
                {formatCurrency(totalNetAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Filter Toolbar */}
        <div className="mb-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
          {/* Row 1: Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Layers className="w-3 h-3 text-indigo-400" />
              Kategori:
            </span>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Row 2: Bank Selector Dropdown & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-slate-800/60">
            {/* Bank Dropdown */}
            <div className="flex items-center gap-2 flex-1 min-w-[160px]">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Semua Bank / Mitra ({availableBanks.length})</option>
                {availableBanks.map((bank) => (
                  <option key={bank} value={bank}>
                    Bank / Mitra: {bank}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Search */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari saluran atau bank..."
                className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors flex items-center justify-center gap-1 shrink-0"
                title="Reset filter pembayaran"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Alert Banner */}
        {hasActiveFilters && (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300 animate-in fade-in">
            <span className="truncate">
              Menampilkan <strong>{filteredPayments.length}</strong> metode bayar{' '}
              {selectedBank !== 'all' && <>untuk <strong>{selectedBank}</strong> </>}
              {selectedCategory !== 'all' && <>kategori <strong>{categories.find(c => c.id === selectedCategory)?.label}</strong></>}
            </span>
            <button
              onClick={resetFilters}
              className="text-[11px] underline hover:text-white ml-2 shrink-0 font-medium"
            >
              Tampilkan Semua
            </button>
          </div>
        )}

        {/* Content: Donut Chart & Legend Side-by-Side */}
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl my-4 text-slate-500">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-xs font-semibold text-slate-400">Tidak ada metode bayar yang cocok</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Silakan sesuaikan pilihan bank atau kategori filter</p>
            <button
              onClick={resetFilters}
              className="mt-3 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-2 min-w-0 pb-4 border-b border-slate-800/80">
              {/* Donut Chart */}
              <div className="h-52 relative flex items-center justify-center min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="#0f172a"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div className="glass-panel p-2.5 rounded-xl shadow-xl text-xs border border-slate-700">
                            <div className="font-bold text-white mb-1">{item.name}</div>
                            <div className="text-indigo-300 font-bold tabular-nums">
                              {formatCurrency(item.value)} ({item.share}%)
                            </div>
                            <div className="text-slate-400 text-[10px] mt-0.5">
                              {item.count} transaksi • MDR: {formatCurrency(item.mdr)}
                            </div>
                            <div className="text-emerald-400 text-[10px] font-semibold mt-0.5">
                              Net Bersih: {formatCurrency(item.net)}
                            </div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Summary */}
                <div className="absolute text-center pointer-events-none">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Total Bruto
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-white tabular-nums">
                    {formatCurrency(totalPayments)}
                  </span>
                </div>
              </div>

              {/* Legend / Metrics List */}
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {filteredPayments.map((pm, idx) => (
                  <div
                    key={pm.payment_method_id ?? idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200 truncate max-w-[140px] flex items-center gap-1.5" title={pm.payment_method_name}>
                          {pm.payment_method_name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {pm.transactions_count} transaksi • {totalPayments > 0 ? ((pm.total_amount / totalPayments) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-white tabular-nums">
                        {formatCurrency(pm.total_amount)}
                      </div>
                      {pm.total_mdr > 0 ? (
                        <div className="text-[10px] text-rose-400/90 tabular-nums">
                          MDR: -{formatCurrency(pm.total_mdr)}
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-400/80 font-medium">
                          Bebas MDR (0%)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Section: Detailed Financial Table */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-200 tracking-tight flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rincian Rekonsiliasi & Settlement Bank</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">
                  Rate rata-rata: <strong className="text-slate-200 font-semibold">{effectiveOverallRate.toFixed(2)}%</strong>
                </span>
              </div>

              <div className="border border-slate-800/90 rounded-xl overflow-hidden bg-slate-950/40">
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 text-[11px] sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Metode Bayar</th>
                        <th className="py-2.5 px-2 text-center">Trs</th>
                        <th className="py-2.5 px-3 text-right">Bruto Masuk</th>
                        <th className="py-2.5 px-3 text-right">Fee MDR</th>
                        <th className="py-2.5 px-3 text-right">Net Settlement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredPayments.map((pm, idx) => {
                        const effectiveRate = pm.total_amount > 0 ? (pm.total_mdr / pm.total_amount) * 100 : 0;
                        return (
                          <tr 
                            key={pm.payment_method_id ?? idx}
                            className="hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                              {getPaymentIcon(pm.payment_method_name)}
                              <div className="min-w-0">
                                <div className="truncate max-w-[130px] sm:max-w-[170px]" title={pm.payment_method_name}>
                                  {pm.payment_method_name}
                                </div>
                                <div className="text-[10px] text-slate-500 font-normal">
                                  {getBankName(pm)}
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-400 tabular-nums">
                              {pm.transactions_count}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-200 tabular-nums font-semibold">
                              {formatCurrency(pm.total_amount)}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums">
                              {pm.total_mdr > 0 ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-rose-400 font-medium">-{formatCurrency(pm.total_mdr)}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">({effectiveRate.toFixed(2)}%)</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 font-mono text-[11px]">- (0%)</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-400 font-bold tabular-nums">
                              {formatCurrency(pm.net_amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-900/90 font-bold border-t border-slate-800 text-[11px] text-white">
                      <tr>
                        <td className="py-2.5 px-3">Total {hasActiveFilters ? '(Filter)' : 'Seluruhnya'}</td>
                        <td className="py-2.5 px-2 text-center text-slate-300 tabular-nums">{totalTransactions}</td>
                        <td className="py-2.5 px-3 text-right text-slate-100 tabular-nums">{formatCurrency(totalPayments)}</td>
                        <td className="py-2.5 px-3 text-right text-rose-400 tabular-nums">-{formatCurrency(totalMdr)}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-300 tabular-nums font-extrabold">{formatCurrency(totalNetAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mini Insight Banner at the very bottom */}
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-slate-900/80 border border-indigo-500/20 flex items-start gap-2.5 text-xs">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 leading-relaxed">
          <span className="font-semibold text-white">Insight Keuangan Eksekutif: </span>
          {totalMdr > 0 ? (
            <>
              Dari total transaksi <strong className="text-white">{formatCurrency(totalPayments)}</strong>
              {hasActiveFilters && ' (sesuai filter aktif)'}, 
              estimasi dana bersih yang cair ke rekening bank adalah <strong className="text-emerald-400">{formatCurrency(totalNetAmount)}</strong>. 
              Beban fee merchant (MDR) tercatat sebesar <strong className="text-rose-400">{formatCurrency(totalMdr)}</strong> ({effectiveOverallRate.toFixed(2)}%).
            </>
          ) : (
            <>
              Seluruh transaksi tercatat bebas dari potongan fee merchant bank (MDR 0%). Seluruh kas senilai <strong className="text-emerald-400">{formatCurrency(totalNetAmount)}</strong> cair penuh ke rekening.
            </>
          )}
        </div>
      </div>
    </div>
  );
};
