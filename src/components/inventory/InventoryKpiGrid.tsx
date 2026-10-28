import React from 'react';
import {
  Boxes,
  CircleDollarSign,
  TrendingDown,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import type { InventoryValuationData } from '../../types';

interface InventoryKpiGridProps {
  data: InventoryValuationData | null;
  isLoading: boolean;
}

export const InventoryKpiGrid: React.FC<InventoryKpiGridProps> = ({
  data,
  isLoading,
}) => {
  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatNumber = (val?: number) => {
    if (val === undefined || val === null) return '0';
    return new Intl.NumberFormat('id-ID').format(val);
  };

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800/80 animate-pulse p-5 flex flex-col justify-between"
          >
            <div className="h-4 w-28 bg-slate-800 rounded" />
            <div className="h-8 w-44 bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const {
    total_valuation,
    total_units,
    average_unit_cost,
    slow_moving,
  } = data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Nilai Modal Persediaan */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900 to-cyan-950/20 border border-cyan-500/30 p-5 shadow-lg group hover:border-cyan-400/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500" />
        <div className="relative z-10 flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Total Nilai Modal Persediaan
          </span>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <CircleDollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="relative z-10">
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {formatRupiah(total_valuation)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>Valuasi Stok Fisik Accurate (Stok × HPP)</span>
          </div>
        </div>
      </div>

      {/* 2. Total Kuantitas Fisik Unit */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900 to-indigo-950/20 border border-indigo-500/30 p-5 shadow-lg group hover:border-indigo-400/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />
        <div className="relative z-10 flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Total Fisik Unit Stok
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
        <div className="relative z-10">
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {formatNumber(total_units)} <span className="text-sm font-semibold text-slate-400">Unit</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span>Tersebar di {data.branch_breakdown.length} cabang & gudang</span>
          </div>
        </div>
      </div>

      {/* 3. Rata-rata HPP per Unit */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900 to-purple-950/20 border border-purple-500/30 p-5 shadow-lg group hover:border-purple-400/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500" />
        <div className="relative z-10 flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
            Rata-rata Modal / Unit
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="relative z-10">
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {formatRupiah(average_unit_cost)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span>Average Cost (HPP) per barang</span>
          </div>
        </div>
      </div>

      {/* 4. Modal Berisiko / Slow-Moving (> 60 Hari) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900 to-amber-950/20 border border-amber-500/30 p-5 shadow-lg group hover:border-amber-400/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />
        <div className="relative z-10 flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Modal Kritis (&gt;60 Hari)
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="relative z-10">
          <div className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
            {formatRupiah(slow_moving.total_valuation)}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-slate-400">{formatNumber(slow_moving.total_qty)} Unit mengendap</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
              {slow_moving.percentage_of_inventory}% Modal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
