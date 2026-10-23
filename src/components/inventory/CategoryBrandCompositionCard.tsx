import React from 'react';
import { Tag, Smartphone } from 'lucide-react';
import type {
  InventoryCategoryValuation,
  InventoryBrandValuation,
} from '../../types';

interface CategoryBrandCompositionCardProps {
  categories: InventoryCategoryValuation[];
  brands: InventoryBrandValuation[];
  totalValuation: number;
  isLoading: boolean;
}

export const CategoryBrandCompositionCard: React.FC<CategoryBrandCompositionCardProps> = ({
  categories,
  brands,
  totalValuation,
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-6" />
        <div className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-6" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Komposisi Modal per Kategori Produk */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-950 border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Alokasi Modal per Kategori
              </h3>
            </div>
            <span className="text-xs text-slate-400">{categories.length} Kategori</span>
          </div>

          <div className="space-y-4">
            {categories.map((cat) => {
              const pct = totalValuation > 0 ? (cat.total_valuation / totalValuation) * 100 : cat.percentage;

              return (
                <div key={cat.category_name} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {cat.category_name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono text-[11px]">
                        {formatNumber(cat.total_qty)} unit
                      </span>
                      <span className="font-bold font-mono text-white">
                        {formatRupiah(cat.total_valuation)}
                      </span>
                      <span className="font-bold text-indigo-400 w-11 text-right">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: cat.color || '#6366f1',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>iPhone Baru & Second mendominasi</span>
          <span className="font-bold text-slate-200">
            {(
              (categories.find((c) => c.category_name.toLowerCase().includes('hp new') || c.category_name.toLowerCase().includes('baru'))?.percentage || 0) +
              (categories.find((c) => c.category_name.toLowerCase().includes('hp second') || c.category_name.toLowerCase().includes('second'))?.percentage || 0)
            ).toFixed(1)}
            % dari Total Modal
          </span>
        </div>
      </div>

      {/* 2. Komposisi Modal per Brand */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-950 border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Tag className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Alokasi Modal per Merk / Brand
              </h3>
            </div>
            <span className="text-xs text-slate-400">Portofolio Brand</span>
          </div>

          <div className="space-y-4">
            {brands.map((b) => {
              const pct = totalValuation > 0 ? (b.total_valuation / totalValuation) * 100 : b.percentage;

              return (
                <div key={b.brand_name} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {b.brand_name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono text-[11px]">
                        {formatNumber(b.total_qty)} unit
                      </span>
                      <span className="font-bold font-mono text-white">
                        {formatRupiah(b.total_valuation)}
                      </span>
                      <span className="font-bold text-cyan-400 w-11 text-right">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Brand dengan Nilai Tertinggi</span>
          <span className="font-bold text-cyan-300">Apple Inc. (77.0%)</span>
        </div>
      </div>
    </div>
  );
};
