import React from 'react';
import { Flame, Clock, ShieldAlert } from 'lucide-react';
import type { InventoryTopValuationItem } from '../../types';

interface TopValuationItemsCardProps {
  items: InventoryTopValuationItem[];
  isLoading: boolean;
}

export const TopValuationItemsCard: React.FC<TopValuationItemsCardProps> = ({
  items,
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

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 animate-pulse space-y-4">
        <div className="h-6 w-56 bg-slate-800 rounded" />
        <div className="h-44 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  const getRiskBadge = (status: string, days: number) => {
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <ShieldAlert className="w-3 h-3" />
            Kritis ({days} Hari)
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Clock className="w-3 h-3" />
            Tinggi ({days} Hari)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            Sedang ({days} Hari)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Sehat ({days} Hari)
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-950 border border-slate-800 p-5 sm:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Top Produk dengan Modal Tertahan Terbesar
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Daftar SKU yang menyerap modal paling tinggi dan memerlukan monitoring perputaran (turnover)
          </p>
        </div>
        <span className="text-xs text-slate-400 font-medium bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 self-start sm:self-auto">
          Top {items.length} SKU Modal Terbesar
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar scrollbar-none rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
            <tr>
              <th scope="col" className="py-3 px-4">
                SKU / Nama Produk
              </th>
              <th scope="col" className="py-3 px-3">
                Kategori
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                Stok Fisik
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                HPP Satuan
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Total Modal Tertahan
              </th>
              <th scope="col" className="py-3 px-3 text-center">
                Risiko Depresiasi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Tidak ada produk dengan modal tertahan untuk filter yang dipilih.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr
                  key={it.sku}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {it.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 flex-wrap">
                    <span>SKU: {it.sku}</span>
                    <span>&bull;</span>
                    <span>Brand: {it.brand}</span>
                    {it.warehouse_name && (
                      <>
                        <span>&bull;</span>
                        <span className="text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded text-[10px] border border-cyan-800/40">
                          {it.warehouse_name}
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-normal bg-slate-800 text-slate-300 border border-slate-700/60">
                    {it.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                  {formatNumber(it.stock_qty)}{' '}
                  <span className="text-[10px] text-slate-400 font-sans">Unit</span>
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-300">
                  {formatRupiah(it.unit_cost)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-cyan-300 text-sm">
                  {formatRupiah(it.total_valuation)}
                </td>
                <td className="py-3 px-3 text-center">
                  {getRiskBadge(it.risk_status, it.days_in_inventory)}
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
};
