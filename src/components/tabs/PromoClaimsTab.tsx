import React, { useEffect, useState, useMemo } from 'react';
import { useFilter } from '../../context/FilterContext';
import { executiveApi } from '../../api/executive';
import type {
  PromoClaimsData,
  PromoLeaderboardItem,
  PromoClaimRowItem,
  BrandSubsidyItem,
  VendorSubsidyItem,
} from '../../types';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import {
  BadgePercent,
  Gift,
  ShoppingBag,
  Building2,
  CheckCircle2,
  Filter,
  Layers,
  Search,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const PromoClaimsTab: React.FC = () => {
  const { filters, refreshKey } = useFilter();
  const [data, setData] = useState<PromoClaimsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-view mode: 'vendor' (Penagihan per Vendor), 'brand' (Subsidi per Brand), 'promo' (Klasemen Promo)
  const [activeView, setActiveView] = useState<'vendor' | 'brand' | 'promo'>('vendor');

  // Interactive table filters
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await executiveApi.getPromoClaims(filters);
        if (isMounted && res.success && res.data) {
          setData(res.data);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Gagal memuat laporan klaim promo.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [filters, refreshKey]);

  const summary = data?.summary || {
    total_discount_amount: 0,
    orders_with_promo_count: 0,
    total_promo_claims_count: 0,
    avg_discount_per_order: 0,
    total_brands_count: 0,
    total_vendors_count: 0,
  };

  const leaderboard: PromoLeaderboardItem[] = data?.promo_leaderboard || [];
  const brandBreakdown: BrandSubsidyItem[] = data?.brand_breakdown || [];
  const vendorBreakdown: VendorSubsidyItem[] = data?.vendor_breakdown || [];
  const rawClaims: PromoClaimRowItem[] = data?.recent_claims || [];

  // Available brand & vendor options for filtering
  const availableBrands = useMemo(() => {
    const list = Array.from(new Set(rawClaims.map((c) => c.brand).filter(Boolean)));
    return list.sort();
  }, [rawClaims]);

  const availableVendors = useMemo(() => {
    const list = Array.from(new Set(rawClaims.map((c) => c.vendor_name).filter(Boolean)));
    return list.sort();
  }, [rawClaims]);

  // Filtered claims for table display
  const filteredClaims = useMemo(() => {
    return rawClaims.filter((row) => {
      const matchBrand = selectedBrand === 'all' || row.brand.toLowerCase() === selectedBrand.toLowerCase();
      const matchVendor = selectedVendor === 'all' || row.vendor_name.toLowerCase() === selectedVendor.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        row.order_number.toLowerCase().includes(query) ||
        row.product_name.toLowerCase().includes(query) ||
        row.promo_name.toLowerCase().includes(query) ||
        row.brand.toLowerCase().includes(query) ||
        row.vendor_name.toLowerCase().includes(query) ||
        row.branch.toLowerCase().includes(query);

      return matchBrand && matchVendor && matchSearch;
    });
  }, [rawClaims, selectedBrand, selectedVendor, searchQuery]);

  const handleSelectVendorFilter = (vendorName: string) => {
    setSelectedVendor(vendorName);
    setSelectedBrand('all');
    const tableEl = document.getElementById('promo-claims-table');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectBrandFilter = (brandName: string) => {
    setSelectedBrand(brandName);
    setSelectedVendor('all');
    const tableEl = document.getElementById('promo-claims-table');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const resetTableFilters = () => {
    setSelectedBrand('all');
    setSelectedVendor('all');
    setSearchQuery('');
  };

  const getBrandBadgeColor = (brand: string) => {
    const b = (brand || '').toLowerCase();
    if (b.includes('apple') || b.includes('iphone')) {
      return 'bg-zinc-800 text-zinc-100 border-zinc-600';
    }
    if (b.includes('samsung')) {
      return 'bg-blue-950/80 text-blue-300 border-blue-700/50';
    }
    if (b.includes('oppo')) {
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50';
    }
    if (b.includes('xiaomi') || b.includes('redmi')) {
      return 'bg-amber-950/80 text-amber-300 border-amber-700/50';
    }
    if (b.includes('vivo')) {
      return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50';
    }
    if (b.includes('realme')) {
      return 'bg-yellow-950/80 text-yellow-300 border-yellow-700/50';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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

  return (
    <div className="space-y-6">
      {/* 1. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <BadgePercent className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 truncate">Total Subsidi & Diskon</p>
            <h4 className="text-xl font-bold text-indigo-300 mt-0.5 truncate">
              {formatCurrency(summary.total_discount_amount)}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Potongan harga terdistribusi</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 truncate">Transaksi dg Promo</p>
            <h4 className="text-xl font-bold text-white mt-0.5 truncate">
              {formatNumber(summary.orders_with_promo_count)}{' '}
              <span className="text-xs font-normal text-slate-400">orders</span>
            </h4>
            <p className="text-[11px] text-cyan-300 mt-0.5">Memanfaatkan diskon/promo</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 truncate">Brand Terklaim</p>
            <h4 className="text-xl font-bold text-purple-300 mt-0.5 truncate">
              {formatNumber(summary.total_brands_count || brandBreakdown.length)}{' '}
              <span className="text-xs font-normal text-slate-400">Brand</span>
            </h4>
            <p className="text-[11px] text-purple-300/80 mt-0.5">Apple, Samsung, Oppo, dll</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 truncate">Vendor Ditagihkan</p>
            <h4 className="text-xl font-bold text-emerald-300 mt-0.5 truncate">
              {formatNumber(summary.total_vendors_count || vendorBreakdown.length)}{' '}
              <span className="text-xs font-normal text-slate-400">Distributor</span>
            </h4>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">TAM, GDN, BMU, dll</p>
          </div>
        </div>
      </div>

      {/* 2. Sub-View Selector (Penagihan per Vendor vs Subsidi per Brand vs Program Promo) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2 bg-slate-900/60 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('vendor')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'vendor'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Rekap Tagihan per Vendor ({vendorBreakdown.length})
          </button>
          <button
            onClick={() => setActiveView('brand')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'brand'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            Subsidi per Brand ({brandBreakdown.length})
          </button>
          <button
            onClick={() => setActiveView('promo')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'promo'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Gift className="w-4 h-4" />
            Program Promo ({leaderboard.length})
          </button>
        </div>

        <div className="text-xs text-slate-400 px-3">
          {activeView === 'vendor' && 'Daftar penagihan piutang subsidi promosi langsung ke masing-masing distributor/vendor (TAM, GDN, BMU, dll).'}
          {activeView === 'brand' && 'Rincian alokasi subsidi dari prinsipal/brand beserta distributor penyalur yang menanggungnya.'}
          {activeView === 'promo' && 'Tingkat adopsi dan efektivitas masing-masing program diskon toko.'}
        </div>
      </div>

      {/* 3. Sub-View Panels */}

      {/* PANEL A: REKAP TAGIHAN PER VENDOR */}
      {activeView === 'vendor' && (
        <div className="glass-card rounded-2xl border border-slate-800/80 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Daftar Tagihan Klaim Subsidi Distributor / Vendor
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total nominal diskon promosi yang dapat ditagihkan/diklaim ke distributor rekanan resmi
              </p>
            </div>
          </div>

          {vendorBreakdown.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/60">
              <CheckCircle2 className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              Tidak ada data penagihan vendor pada periode ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendorBreakdown.map((vendor, idx) => (
                <div
                  key={vendor.vendor_name || idx}
                  className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Distributor Rekanan #{idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1 break-words">
                          {vendor.vendor_name}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                        {formatNumber(vendor.claims_count)} Klaim
                      </span>
                    </div>

                    {vendor.brands && vendor.brands.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {vendor.brands.map((b) => (
                          <span
                            key={b}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getBrandBadgeColor(b)}`}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400">Total Piutang Tagihan</p>
                      <p className="text-base font-bold text-emerald-400 mt-0.5">
                        {formatCurrency(vendor.total_subsidy)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectVendorFilter(vendor.vendor_name)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition-all"
                    >
                      Filter Log
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PANEL B: SUBSIDI PER BRAND */}
      {activeView === 'brand' && (
        <div className="glass-card rounded-2xl border border-slate-800/80 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Rekap Alokasi Subsidi Menurut Brand / Merek
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total kontribusi potongan harga per brand dan distributor yang menanggung subsidinya
              </p>
            </div>
          </div>

          {brandBreakdown.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/60">
              <CheckCircle2 className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              Tidak ada data subsidi brand pada periode ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brandBreakdown.map((brandItem, idx) => (
                <div
                  key={brandItem.brand || idx}
                  className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/30 hover:border-purple-500/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getBrandBadgeColor(brandItem.brand)}`}>
                        {brandItem.brand}
                      </span>
                      <span className="text-xs font-semibold text-purple-300">
                        {formatNumber(brandItem.claims_count)} Klaim
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-[10px] text-slate-400">Total Subsidi Brand</p>
                      <p className="text-xl font-bold text-purple-300 mt-0.5">
                        {formatCurrency(brandItem.total_subsidy)}
                      </p>
                    </div>

                    {/* Breakdown per vendor under this brand */}
                    {brandItem.vendors && brandItem.vendors.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase text-slate-400">
                          Rincian Distributor Penanggung:
                        </p>
                        {brandItem.vendors.slice(0, 3).map((v) => (
                          <div
                            key={v.vendor_name}
                            className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/40 p-1.5 rounded border border-slate-800/50"
                          >
                            <span className="truncate pr-2">{v.vendor_name}</span>
                            <span className="font-semibold text-emerald-400 shrink-0">
                              {formatCurrency(v.total_subsidy)}
                            </span>
                          </div>
                        ))}
                        {brandItem.vendors.length > 3 && (
                          <p className="text-[10px] text-slate-500 italic text-right">
                            +{brandItem.vendors.length - 3} distributor lainnya
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => handleSelectBrandFilter(brandItem.brand)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 transition-all"
                    >
                      Filter Log Brand Ini
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PANEL C: KLASEMEN PROGRAM PROMO */}
      {activeView === 'promo' && (
        <div className="glass-card rounded-2xl border border-slate-800/80 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-indigo-400" />
                Klasemen Program Promo & Efektivitas Diskon
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar program promo yang paling banyak digunakan konsumen dan total nilai pemotongan harga
              </p>
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/60">
              <CheckCircle2 className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              Tidak ada program promo atau voucher yang diklaim pada periode ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaderboard.map((promo, idx) => (
                <div
                  key={promo.promo_name || idx}
                  className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 hover:border-indigo-500/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400">
                        #{idx + 1} Terpopuler
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {formatNumber(promo.times_used)}x Digunakan
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-2">{promo.promo_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {promo.brand && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getBrandBadgeColor(promo.brand)}`}>
                          {promo.brand}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 truncate">
                        {promo.top_vendor || 'Distributor Resmi'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400">Total Potongan / Subsidi</p>
                      <p className="text-sm font-bold text-indigo-300 mt-0.5">
                        {formatCurrency(promo.total_discount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Rata-rata/Pakai</p>
                      <p className="text-xs font-semibold text-slate-300 mt-0.5">
                        {formatCurrency(
                          promo.times_used > 0 ? promo.total_discount / promo.times_used : 0
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Detailed Claims Log Table with Brand & Vendor Filtering */}
      <div id="promo-claims-table" className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden max-w-full">
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Log Rincian Klaim Promo & Subsidi Vendor
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rincian item produk yang mendapatkan diskon, nama brand, dan vendor penanggung subsidi penagihan
            </p>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nota, produk, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Brand Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Semua Brand ({availableBrands.length})</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor Dropdown */}
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 max-w-[200px] truncate"
            >
              <option value="all">Semua Vendor ({availableVendors.length})</option>
              {availableVendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {/* Reset Filter Button */}
            {(selectedBrand !== 'all' || selectedVendor !== 'all' || searchQuery !== '') && (
              <button
                onClick={resetTableFilters}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all text-xs flex items-center gap-1"
                title="Reset Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Indicator Active */}
        {(selectedBrand !== 'all' || selectedVendor !== 'all') && (
          <div className="px-5 py-2.5 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between text-xs">
            <span className="text-indigo-300">
              Filter Aktif: {selectedBrand !== 'all' && <b>Brand: {selectedBrand} </b>}
              {selectedVendor !== 'all' && <b>Vendor: {selectedVendor}</b>}
              {' '}({filteredClaims.length} transaksi)
            </span>
            <button
              onClick={resetTableFilters}
              className="text-xs text-indigo-400 hover:text-indigo-200 underline font-semibold"
            >
              Hapus Filter
            </button>
          </div>
        )}

        <div className="overflow-x-auto w-full min-w-0">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">No. Order / Nota</th>
                <th className="py-3.5 px-4">Cabang</th>
                <th className="py-3.5 px-4">Brand</th>
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4">Nama Promo / Program</th>
                <th className="py-3.5 px-4">Vendor Penanggung</th>
                <th className="py-3.5 px-4 text-right">Nilai Klaim Subsidi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    Tidak ada catatan klaim promo yang sesuai dengan filter yang dipilih
                  </td>
                </tr>
              ) : (
                filteredClaims.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {row.order_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{row.branch}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${getBrandBadgeColor(row.brand)}`}
                      >
                        {row.brand}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate" title={row.product_name}>
                      {row.product_name}
                    </td>
                    <td className="py-3.5 px-4 text-indigo-300 font-semibold">
                      {row.promo_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-emerald-300 truncate max-w-[200px]" title={row.vendor_name}>
                          {row.vendor_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400 whitespace-nowrap">
                      {formatCurrency(row.claim_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
