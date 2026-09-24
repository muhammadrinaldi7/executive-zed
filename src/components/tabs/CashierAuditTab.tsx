import React, { useEffect, useState } from 'react';
import { useFilter } from '../../context/FilterContext';
import { executiveApi } from '../../api/executive';
import type { CashierAuditData, PiutangReportData, PiutangTransactionDetail } from '../../types';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import {
  ShieldAlert,
  AlertTriangle,
  FileWarning,
  Smartphone,
  TrendingDown,
  UserX,
  CheckCircle2,
  Filter,
  CreditCard,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  Search,
} from 'lucide-react';

export const CashierAuditTab: React.FC = () => {
  const { filters, refreshKey } = useFilter();
  const [auditData, setAuditData] = useState<CashierAuditData | null>(null);
  const [piutangData, setPiutangData] = useState<PiutangReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-tabs: 'piutang' | 'cancellations' | 'sell_phone'
  const [subTab, setSubTab] = useState<'piutang' | 'cancellations' | 'sell_phone'>('piutang');
  const [onlyOverpay, setOnlyOverpay] = useState<boolean>(false);

  // Piutang filters
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [auditRes, piutangRes] = await Promise.all([
          executiveApi.getCashierAudit(filters),
          executiveApi.getPiutangReport(filters),
        ]);

        if (isMounted) {
          if (auditRes.success && auditRes.data) {
            setAuditData(auditRes.data);
          }
          if (piutangRes.success && piutangRes.data) {
            setPiutangData(piutangRes.data);
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Gagal memuat data audit dan piutang.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [filters, refreshKey]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="h-44 bg-slate-900/60 rounded-2xl border border-slate-800" />
        <div className="h-96 bg-slate-900/60 rounded-2xl border border-slate-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
        <p className="font-semibold">Terjadi kesalahan:</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const cancelAudit = auditData?.cancellation_audit || {
    total_cancellations: 0,
    total_cancelled_amount: 0,
    cashier_leaderboard: [],
    recent_logs: [],
  };

  const sellAudit = auditData?.sell_phone_audit || {
    total_bought_units: 0,
    total_bought_amount: 0,
    total_system_amount: 0,
    total_overpay_units: 0,
    total_overpay_amount: 0,
    cashier_overpay_leaderboard: [],
    recent_logs: [],
  };

  const piutangSummary = piutangData?.summary || {
    total_piutang: 0,
    total_sisa: 0,
    total_piutang_toko: 0,
    total_finance_pending: 0,
    outstanding_orders_count: 0,
    aging_summary: {
      under_7_days: 0,
      days_7_to_14: 0,
      days_15_to_30: 0,
      over_30_days: 0,
    },
  };

  const filteredSellLogs = onlyOverpay
    ? sellAudit.recent_logs.filter((log) => log.is_overpay)
    : sellAudit.recent_logs;

  // Filter piutang details
  const filteredPiutangDetails = (piutangData?.details || []).filter((item: PiutangTransactionDetail) => {
    if (selectedMethod !== 'ALL' && item.payment_method !== selectedMethod) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchNo = item.order_number.toLowerCase().includes(q);
      const matchCust = item.customer_name.toLowerCase().includes(q);
      const matchBranch = item.branch.toLowerCase().includes(q);
      const matchCashier = item.cashier_name.toLowerCase().includes(q);
      return matchNo || matchCust || matchBranch || matchCashier;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Alert Banner / Executive Warning */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Sistem Pengawasan & Audit Operasional Tokopon Zed
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoring transaksi <span className="text-amber-400 font-semibold">Piutang & Leasing Pending</span> (standar Dashboard Direksi), pembatalan kasir (void), dan audit overpay pembelian HP bekas.
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation Pill */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSubTab('piutang')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'piutang'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Transaksi Piutang</span>
            {piutangSummary.total_sisa > 0 && (
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                subTab === 'piutang' ? 'bg-slate-950/30 text-slate-950' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {piutangSummary.outstanding_orders_count}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('cancellations')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'cancellations'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileWarning className="w-3.5 h-3.5" />
            <span>Void Kasir</span>
            {cancelAudit.total_cancellations > 0 && (
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                subTab === 'cancellations' ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {cancelAudit.total_cancellations}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('sell_phone')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'sell_phone'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Beli HP Bekas</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      {subTab === 'piutang' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Sisa Piutang Berjalan */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">Sisa Tagihan (Outstanding)</p>
              <h4 className="text-xl font-bold text-rose-400 mt-0.5 truncate">
                {formatCurrency(piutangSummary.total_sisa)}
              </h4>
              <p className="text-[11px] text-rose-300/80 mt-0.5 truncate">
                {formatNumber(piutangSummary.outstanding_orders_count)} transaksi belum masuk kas
              </p>
            </div>
          </div>

          {/* Card 2: Piutang Toko */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">Piutang Toko (Customer)</p>
              <h4 className="text-xl font-bold text-white mt-0.5 truncate">
                {formatCurrency(piutangSummary.total_piutang_toko)}
              </h4>
              <p className="text-[11px] text-orange-400 font-medium mt-0.5">
                Langsung ke pelanggan toko
              </p>
            </div>
          </div>

          {/* Card 3: Piutang Leasing Pending */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">Leasing Pending (Belum Cair)</p>
              <h4 className="text-xl font-bold text-white mt-0.5 truncate">
                {formatCurrency(piutangSummary.total_finance_pending)}
              </h4>
              <p className="text-[11px] text-blue-300 font-medium mt-0.5 truncate">
                Kredivo, Akulaku, Samsung dll
              </p>
            </div>
          </div>

          {/* Card 4: Total Piutang Portofolio */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">Total Portofolio Tercatat</p>
              <h4 className="text-xl font-bold text-white mt-0.5 truncate">
                {formatCurrency(piutangSummary.total_piutang)}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Lunas & Outstanding periode ini
              </p>
            </div>
          </div>
        </div>
      ) : subTab === 'cancellations' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
              <FileWarning className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">Total Pembatalan (Void)</p>
              <h4 className="text-xl font-bold text-rose-400 mt-0.5 truncate">
                {formatNumber(cancelAudit.total_cancellations)} kasus
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Nota dibatalkan kasir</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">Total Nilai Void Kasir</p>
              <h4 className="text-xl font-bold text-white mt-0.5 truncate">
                {formatCurrency(cancelAudit.total_cancelled_amount)}
              </h4>
              <p className="text-[11px] text-amber-300 mt-0.5">Potensi omset batal</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <UserX className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">Kasir Terbanyak Void</p>
              <h4 className="text-base font-bold text-white mt-0.5 truncate">
                {cancelAudit.cashier_leaderboard[0]?.cashier_name || '-'}
              </h4>
              <p className="text-[11px] text-indigo-300 mt-0.5">
                {cancelAudit.cashier_leaderboard[0]?.cancellation_count || 0} kali pembatalan
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">Status Approval</p>
              <h4 className="text-xl font-bold text-white mt-0.5 truncate">100% Tercatat</h4>
              <p className="text-[11px] text-emerald-300 mt-0.5">Audit log aktif</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">Total Overpay Beli HP</p>
              <h4 className="text-xl font-bold text-rose-400 mt-0.5 truncate">
                {formatCurrency(sellAudit.total_overpay_amount)}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {formatNumber(sellAudit.total_overpay_units)} kasus di atas sistem
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">HP Bekas Diterima Toko</p>
              <h4 className="text-xl font-bold text-white mt-0.5 truncate">
                {formatNumber(sellAudit.total_bought_units)} unit
              </h4>
              <p className="text-[11px] text-cyan-300 mt-0.5 truncate">
                Nilai: {formatCurrency(sellAudit.total_bought_amount)}
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <FileWarning className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">Nilai Taksiran Sistem</p>
              <h4 className="text-xl font-bold text-white mt-0.5 truncate">
                {formatCurrency(sellAudit.total_system_amount)}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Standar harga appraisal</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 truncate">Tingkat Kepatuhan</p>
              <h4 className="text-xl font-bold text-emerald-400 mt-0.5 truncate">
                {sellAudit.total_bought_units > 0
                  ? `${(
                      ((sellAudit.total_bought_units - sellAudit.total_overpay_units) /
                        sellAudit.total_bought_units) *
                      100
                    ).toFixed(1)}%`
                  : '100%'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Sesuai SOP taksiran</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Content Views */}
      {subTab === 'piutang' ? (
        <div className="space-y-6">
          {/* Aging Summary Badges */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Klasifikasi Umur Tagihan (Aging Matrix):</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
                &lt; 7 Hari: <b>{piutangSummary.aging_summary.under_7_days}</b>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 font-medium">
                7 - 14 Hari: <b>{piutangSummary.aging_summary.days_7_to_14}</b>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                15 - 30 Hari: <b>{piutangSummary.aging_summary.days_15_to_30}</b>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold">
                &gt; 30 Hari (Kritis): <b>{piutangSummary.aging_summary.over_30_days}</b>
              </span>
            </div>
          </div>

          {/* CORE TABLE: Identical to dashboard.blade.php */}
          <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  Rekapitulasi Portofolio Piutang per Metode
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Format resmi Dashboard Direksi: memetakan Piutang Toko langsung dan Piutang Multi-Finance (Leasing).
                </p>
              </div>

              {selectedMethod !== 'ALL' && (
                <button
                  onClick={() => setSelectedMethod('ALL')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Tampilkan Semua Metode
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Metode (Jenis Piutang)</th>
                    <th className="py-3.5 px-6 text-center">Total Transaksi</th>
                    <th className="py-3.5 px-6 text-right">Total Piutang</th>
                    <th className="py-3.5 px-6 text-right">Sisa Tagihan / Utang</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(piutangData?.piutang_transactions || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Tidak ada transaksi piutang (Outstanding) pada rentang waktu ini.
                      </td>
                    </tr>
                  ) : (
                    (piutangData?.piutang_transactions || []).map((row) => {
                      const isToko = row.type === 'toko' || row.payment_method === 'Piutang Toko';
                      const isSelected = selectedMethod === row.payment_method;

                      return (
                        <tr
                          key={row.payment_method}
                          onClick={() => setSelectedMethod(isSelected ? 'ALL' : row.payment_method)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                                isToko
                                  ? 'border-orange-500/40 bg-orange-500/10 text-orange-400'
                                  : 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                              }`}
                            >
                              {row.payment_method}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-2">
                              {isToko ? '(Pelanggan Langsung)' : '(Leasing / Kredit)'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center font-medium text-slate-300">
                            {row.count_total} transaksi
                            {row.count_pending > 0 && (
                              <span className="text-rose-400 text-[10px] block font-semibold">
                                ({row.count_pending} belum cair)
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-white">
                            {formatCurrency(row.total)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span
                              className={`font-bold text-sm ${
                                row.sisa > 0 ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {formatCurrency(row.sisa)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {row.sisa > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                                Outstanding
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                Sudah Cair / Lunas
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DETAILED TRANSACTION DRILL-DOWN */}
          <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Rincian Nota Transaksi Piutang & Umur Jatuh Tempo
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedMethod === 'ALL'
                    ? 'Menampilkan semua transaksi piutang dan tagihan'
                    : `Menampilkan khusus metode: ${selectedMethod}`}
                </p>
              </div>

              {/* Search Bar inside Drilldown */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nota, pelanggan, cabang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Tgl & Umur</th>
                    <th className="py-3.5 px-4">No. Order / Nota</th>
                    <th className="py-3.5 px-4">Cabang</th>
                    <th className="py-3.5 px-4">Pelanggan</th>
                    <th className="py-3.5 px-4">Kasir / Sales</th>
                    <th className="py-3.5 px-4">Metode</th>
                    <th className="py-3.5 px-4 text-right">Nilai Piutang</th>
                    <th className="py-3.5 px-4 text-center">Status Pencairan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredPiutangDetails.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Tidak ada transaksi piutang yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredPiutangDetails.map((item) => (
                      <tr key={item.order_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-white font-semibold">{formatDate(item.order_date)}</span>
                          <span className={`block text-[10px] font-bold ${
                            item.aging_days > 30 ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {item.aging_days} hari lalu
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-white">
                          {item.order_number}
                          {item.invoice_no && item.invoice_no !== '-' && (
                            <span className="text-[10px] text-slate-500 block">
                              Inv: {item.invoice_no}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {item.branch}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-white font-semibold">{item.customer_name}</span>
                          {item.customer_phone && item.customer_phone !== '-' && (
                            <span className="text-[10px] text-slate-500 block">
                              {item.customer_phone}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          <span>{item.cashier_name}</span>
                          {item.sales_name && item.sales_name !== '-' && (
                            <span className="text-[10px] text-slate-500 block">
                              Sales: {item.sales_name}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.type === 'toko'
                              ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
                              : 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                          }`}>
                            {item.payment_method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-white">
                          <span className={item.is_outstanding ? 'text-rose-400' : 'text-slate-200'}>
                            {formatCurrency(item.net_amount)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.is_outstanding ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              PENDING (Belum Cair)
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              PAID (Sudah Cair)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : subTab === 'sell_phone' ? (
        <div className="space-y-6">
          {/* Sell Phone Audit Table */}
          <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden">
            <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  Log Audit Pembelian HP Bekas (Appraisal vs Kasir)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Membandingkan harga taksiran sistem dengan realisasi harga yang disetujui kasir
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOnlyOverpay(!onlyOverpay)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    onlyOverpay
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Hanya Kasus Overpay</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Tipe HP Bekas</th>
                    <th className="py-3.5 px-4">Cabang</th>
                    <th className="py-3.5 px-4">Kasir Penilai</th>
                    <th className="py-3.5 px-4 text-right">Taksiran Sistem</th>
                    <th className="py-3.5 px-4 text-right">Harga Disepakati</th>
                    <th className="py-3.5 px-4 text-right">Selisih</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Alasan Overpay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredSellLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        Tidak ada riwayat transaksi beli HP bekas pada periode ini
                      </td>
                    </tr>
                  ) : (
                    filteredSellLogs.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {formatDate(row.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-white block">{row.model}</span>
                          <span className="text-[10px] text-slate-500">{row.ram_storage || '-'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{row.branch}</td>
                        <td className="py-3.5 px-4 font-semibold text-white">{row.cashier_name}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-300">
                          {formatCurrency(row.system_price)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-white">
                          {formatCurrency(row.final_price)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold">
                          <span
                            className={
                              row.diff_amount > 0
                                ? 'text-rose-400'
                                : row.diff_amount < 0
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                            }
                          >
                            {row.diff_amount > 0 ? `+${formatCurrency(row.diff_amount)}` : formatCurrency(row.diff_amount)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {row.diff_pct > 0 ? `+${row.diff_pct}%` : `${row.diff_pct}%`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {row.is_overpay ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              OVERPAY
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Sesuai / Untung
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate" title={row.reason}>
                          {row.reason || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cancellation Leaderboard by Cashier */}
          <div className="glass-card rounded-2xl border border-slate-800/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserX className="w-4 h-4 text-amber-400" />
                  Klasemen Kasir dengan Frekuensi Pembatalan Nota Terbanyak
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar kasir yang meminta approval pembatalan transaksi (order void / cancellation)
                </p>
              </div>
            </div>

            {cancelAudit.cashier_leaderboard.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/60">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                Tidak ada riwayat pembatalan transaksi pada periode filter yang dipilih.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cancelAudit.cashier_leaderboard.map((item, idx) => (
                  <div
                    key={item.cashier_id || idx}
                    className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400">
                          #{idx + 1} Pembatalan Terbanyak
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.cancellation_count} Void
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1.5">{item.cashier_name}</h4>
                      <p className="text-xs text-slate-400">Kasir Pelaksana</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-slate-400">Total Nominal Dibatalkan</p>
                        <p className="text-sm font-bold text-amber-400">
                          {formatCurrency(item.total_amount)}
                        </p>
                      </div>
                      {item.reasons.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                          Alasan: {item.reasons.slice(0, 2).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cancellation Log Table */}
          <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden">
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Log Rincian Pembatalan Transaksi</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar riwayat nota transaksi yang dibatalkan oleh kasir beserta alasan pembatalan
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">No. Order / Nota</th>
                    <th className="py-3.5 px-4">Kasir Pelaksana</th>
                    <th className="py-3.5 px-4">Cabang</th>
                    <th className="py-3.5 px-4 text-right">Nominal Void</th>
                    <th className="py-3.5 px-4">Alasan Kesalahan / Batal</th>
                    <th className="py-3.5 px-4 text-center">Status Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {cancelAudit.recent_logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Tidak ada catatan pembatalan nota
                      </td>
                    </tr>
                  ) : (
                    cancelAudit.recent_logs.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {formatDate(row.date)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-white">
                          {row.order_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {row.cashier_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{row.branch}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                          {formatCurrency(row.grand_total)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-sm">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                            {row.reason}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
