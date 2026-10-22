import React, { useState, useMemo } from 'react';
import {
  Building2,
  ArrowUpDown,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { InventoryBranchValuation } from '../../types';

interface BranchValuationBreakdownProps {
  branches: InventoryBranchValuation[];
  totalValuation: number;
  isLoading: boolean;
}

export const BranchValuationBreakdown: React.FC<BranchValuationBreakdownProps> = ({
  branches,
  totalValuation,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'valuation' | 'qty' | 'name'>('valuation');
  const [sortAsc, setSortAsc] = useState(false);

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

  const filteredBranches = useMemo(() => {
    let result = [...branches];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b.warehouse_name.toLowerCase().includes(q) ||
          b.branch_name.toLowerCase().includes(q) ||
          b.type.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'valuation') {
        diff = b.total_valuation - a.total_valuation;
      } else if (sortBy === 'qty') {
        diff = b.total_qty - a.total_qty;
      } else {
        diff = a.warehouse_name.localeCompare(b.warehouse_name);
      }
      return sortAsc ? -diff : diff;
    });

    return result;
  }, [branches, searchTerm, sortBy, sortAsc]);

  const handleSort = (field: 'valuation' | 'qty' | 'name') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-slate-800 rounded" />
        <div className="h-40 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-950 border border-slate-800 p-5 sm:p-6 shadow-xl">
      {/* Header with Title and Search/Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Persebaran Stok & Modal per Cabang / Gudang
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total {branches.length} lokasi penyimpanan barang resmi tercatat di Accurate
          </p>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari cabang / gudang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/60 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-56 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table of Branches */}
      <div className="overflow-x-auto no-scrollbar scrollbar-none rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
            <tr>
              <th
                scope="col"
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Nama Gudang / Cabang</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th scope="col" className="py-3 px-3">
                Tipe Lokasi
              </th>
              <th
                scope="col"
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('qty')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Kuantitas Fisik</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                scope="col"
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('valuation')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Nilai Modal Mengendap</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th scope="col" className="py-3 px-4 text-center">
                Porsi Modal
              </th>
              <th scope="col" className="py-3 px-3 text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredBranches.map((b) => {
              const pct = totalValuation > 0 ? (b.total_valuation / totalValuation) * 100 : b.percentage;

              return (
                <tr
                  key={b.warehouse_name}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {b.warehouse_name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Rata-rata HPP: {formatRupiah(b.average_unit_cost)} / unit
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-normal bg-slate-800 text-slate-300 border border-slate-700/60">
                      {b.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                    {formatNumber(b.total_qty)}{' '}
                    <span className="text-[10px] text-slate-400 font-sans">Unit</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-cyan-300">
                    {formatRupiah(b.total_valuation)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-28 mx-auto space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(pct * 2.5, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {b.status === 'OPTIMAL' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Optimal
                      </span>
                    ) : b.status === 'ALERT' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        Perhatian
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
