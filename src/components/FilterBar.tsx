import React, { useState, useMemo, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';
import type { FilterOptions } from '../types';
import { Calendar, Store, RotateCcw, Building2, Layers, SlidersHorizontal } from 'lucide-react';
import { SearchableSelect, type SelectOption } from './SearchableSelect';

interface FilterBarProps {
  filterOptions?: FilterOptions | null;
}

const PRESET_PILLS = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: 'last_7_days', label: '7 Hari' },
  { value: 'this_month', label: 'Bulan Ini' },
  { value: 'last_month', label: 'Bulan Lalu' },
  { value: 'this_quarter', label: 'Kuartal Ini' },
  { value: 'this_year', label: 'Tahun Ini' },
  { value: 'custom', label: 'Kustom' },
];

export const FilterBar: React.FC<FilterBarProps> = ({ filterOptions }) => {
  const {
    filters,
    setDateRange,
    setCustomDateRange,
    setBranch,
    setBusinessUnitId,
    setCategory,
  } = useFilter();

  const [customStart, setCustomStart] = useState<string>(filters.start_date || '');
  const [customEnd, setCustomEnd] = useState<string>(filters.end_date || '');

  const handleApplyCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setCustomDateRange(customStart, customEnd);
    }
  };

  const handleResetFilters = () => {
    setDateRange('this_month');
    setBranch(null);
    setBusinessUnitId(null);
    setCategory(null);
    setCustomStart('');
    setCustomEnd('');
  };

  const hasBranchFilter = Boolean(
    filters.branch &&
      (Array.isArray(filters.branch) ? filters.branch.length > 0 : true)
  );
  const hasCategoryFilter = Boolean(
    filters.category &&
      (Array.isArray(filters.category) ? filters.category.length > 0 : true)
  );

  const isFiltered =
    filters.date_range !== 'this_month' ||
    hasBranchFilter ||
    filters.business_unit_id !== null ||
    hasCategoryFilter;

  // Selected Business Unit ID (numeric or null)
  const selectedBuId = useMemo(() => {
    if (
      filters.business_unit_id === null ||
      filters.business_unit_id === undefined ||
      filters.business_unit_id === ''
    ) {
      return null;
    }
    return Number(filters.business_unit_id);
  }, [filters.business_unit_id]);

  const selectedBu = useMemo(() => {
    if (!selectedBuId || !filterOptions?.business_units) return null;
    return filterOptions.business_units.find((u) => u.id === selectedBuId) || null;
  }, [filterOptions?.business_units, selectedBuId]);

  // 1. Business Unit Options for SearchableSelect
  const buOptions: SelectOption[] = useMemo(() => {
    if (!filterOptions?.business_units) return [];
    return filterOptions.business_units.map((bu) => ({
      value: bu.id,
      label: bu.name,
      subLabel: `Kode: ${bu.code}`,
      badge: `BU #${bu.id}`,
    }));
  }, [filterOptions?.business_units]);

  // 2. Branch Options for SearchableSelect (Cascaded by selected BU)
  const branchOptions: SelectOption[] = useMemo(() => {
    if (!filterOptions) return [];

    const rawBranches =
      filterOptions.branches && filterOptions.branches.length > 0
        ? filterOptions.branches
        : (filterOptions.order_stores || []).map((name) => ({
            id: name,
            name,
            business_unit_id: 1,
          }));

    // Filter branches belonging to the selected BU
    const filtered = rawBranches.filter((b) => {
      if (selectedBuId === null) return true;
      return Number(b.business_unit_id) === selectedBuId;
    });

    return filtered.map((b) => {
      const bu = filterOptions.business_units?.find(
        (u) => u.id === Number(b.business_unit_id)
      );
      return {
        value: b.name,
        label: b.name,
        subLabel: bu ? `Unit: ${bu.name}` : undefined,
        badge: bu ? bu.code : undefined,
      };
    });
  }, [filterOptions, selectedBuId]);

  // Auto-reset branch if currently selected branch does not exist in active BU
  useEffect(() => {
    if (filters.branch && branchOptions.length > 0) {
      if (Array.isArray(filters.branch)) {
        const validBranches = filters.branch.filter((b) =>
          branchOptions.some((opt) => String(opt.value) === String(b))
        );
        if (validBranches.length !== filters.branch.length) {
          setBranch(validBranches.length > 0 ? validBranches : null);
        }
      } else {
        const isValid = branchOptions.some(
          (opt) => String(opt.value) === String(filters.branch)
        );
        if (!isValid) {
          setBranch(null);
        }
      }
    }
  }, [branchOptions, filters.branch, setBranch]);

  // 3. Category Options for SearchableSelect (Cascaded by selected BU)
  const categoryOptions: SelectOption[] = useMemo(() => {
    if (!filterOptions) return [];

    const rawCategories =
      filterOptions.categories && filterOptions.categories.length > 0
        ? filterOptions.categories
        : (filterOptions.category_names || []).map((name) => ({
            name,
            business_unit_id: null,
            business_unit_ids: [] as number[],
            is_all_bu: true,
          }));

    const totalBuCount = filterOptions.business_units?.length || 2;

    // Normalizing categories
    const normalized = rawCategories.map((cat) => {
      if (typeof cat === 'string') {
        const upper = cat.toUpperCase();
        if (upper.includes('SECOND') || upper.includes('BEKAS')) {
          return {
            name: cat,
            business_unit_id: 2,
            business_unit_ids: [2],
            is_all_bu: false,
          };
        }
        if (upper.includes('NEW') || upper.includes('BARU')) {
          return {
            name: cat,
            business_unit_id: 1,
            business_unit_ids: [1],
            is_all_bu: false,
          };
        }
        return {
          name: cat,
          business_unit_id: null,
          business_unit_ids: [] as number[],
          is_all_bu: true,
        };
      }
      return cat;
    });

    // Group by category name to merge multi-BU occurrences
    const groupedMap = new Map<
      string,
      {
        name: string;
        business_unit_id?: number | null;
        business_unit_ids: number[];
        is_all_bu: boolean;
      }
    >();

    normalized.forEach((c) => {
      const trimmed = c.name.trim();
      if (!trimmed) return;

      if (!groupedMap.has(trimmed)) {
        groupedMap.set(trimmed, {
          name: trimmed,
          business_unit_id: c.business_unit_id,
          business_unit_ids: [],
          is_all_bu: Boolean(c.is_all_bu),
        });
      }

      const entry = groupedMap.get(trimmed)!;

      if (c.is_all_bu) {
        entry.is_all_bu = true;
      }

      if (c.business_unit_ids && Array.isArray(c.business_unit_ids) && c.business_unit_ids.length > 0) {
        c.business_unit_ids.forEach((id) => {
          if (!entry.business_unit_ids.includes(Number(id))) {
            entry.business_unit_ids.push(Number(id));
          }
        });
      } else if (c.business_unit_id) {
        const id = Number(c.business_unit_id);
        if (!entry.business_unit_ids.includes(id)) {
          entry.business_unit_ids.push(id);
        }
      }
    });

    // Safe fallback if category list is empty
    if (groupedMap.size === 0) {
      ['Aksesoris', 'Smartphone', 'iPhone Baru', 'iPhone Second'].forEach((name) => {
        groupedMap.set(name, {
          name,
          business_unit_id: name.includes('Baru') ? 1 : name.includes('Second') ? 2 : null,
          business_unit_ids: name.includes('Baru') ? [1] : name.includes('Second') ? [2] : [1, 2],
          is_all_bu: !name.includes('Baru') && !name.includes('Second'),
        });
      });
    }

    // Filter categories based on selected BU
    const filteredCategories = Array.from(groupedMap.values()).filter((c) => {
      if (selectedBuId === null) return true;
      if (c.is_all_bu) return true;
      if (c.business_unit_ids.length === 0) return true;
      return c.business_unit_ids.includes(selectedBuId);
    });

    return filteredCategories.map((c) => {
      const isMultiBu =
        c.is_all_bu ||
        c.business_unit_ids.length >= totalBuCount ||
        (c.business_unit_ids.length === 0 && !c.business_unit_id);

      if (isMultiBu) {
        return {
          value: c.name,
          label: c.name,
          subLabel: 'Tersedia di 2 Unit: Syihab & GSK Second',
          badge: '2 BU',
          badgeClassName: 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60 font-semibold',
        };
      }

      const buId = c.business_unit_ids[0] || (c.business_unit_id ? Number(c.business_unit_id) : 1);
      const bu = filterOptions.business_units?.find((u) => u.id === buId);

      return {
        value: c.name,
        label: c.name,
        subLabel: bu ? `Khusus Unit: ${bu.name}` : undefined,
        badge: bu ? bu.code : '1 BU',
        badgeClassName: 'bg-slate-800 text-slate-300 border-slate-700 font-medium',
      };
    });
  }, [filterOptions, selectedBuId]);

  // Auto-reset category if currently selected category does not exist in active BU
  useEffect(() => {
    if (filters.category && categoryOptions.length > 0) {
      if (Array.isArray(filters.category)) {
        const validCategories = filters.category.filter((c) =>
          categoryOptions.some((opt) => String(opt.value) === String(c))
        );
        if (validCategories.length !== filters.category.length) {
          setCategory(validCategories.length > 0 ? validCategories : null);
        }
      } else {
        const isValid = categoryOptions.some(
          (opt) => String(opt.value) === String(filters.category)
        );
        if (!isValid) {
          setCategory(null);
        }
      }
    }
  }, [categoryOptions, filters.category, setCategory]);

  return (
    <div className="no-print w-full bg-slate-900/90 border-b border-slate-800/80 py-3 px-3 sm:px-6 lg:px-8 backdrop-blur-md relative z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5 w-full min-w-0">
        
        {/* ROW 1: Periode Waktu Preset & Custom Date Form */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full min-w-0">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar scrollbar-none touch-pan-x min-w-0">
            <div className="flex items-center text-slate-400 text-xs mr-1 shrink-0 font-semibold">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              <span>Periode:</span>
            </div>

            {PRESET_PILLS.map((pill) => {
              const isActive = filters.date_range === pill.value;
              return (
                <button
                  key={pill.value}
                  onClick={() => setDateRange(pill.value)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Popover/Inputs */}
          {filters.date_range === 'custom' && (
            <form onSubmit={handleApplyCustomDate} className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-slate-500 text-xs font-bold">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
              >
                Terapkan
              </button>
            </form>
          )}
        </div>

        {/* THIN DIVIDER BETWEEN ROW 1 & ROW 2 */}
        <div className="w-full border-t border-slate-800/70 my-0.5" />

        {/* ROW 2: Filter Dimensi Bisnis (Unit Bisnis, Cabang, Kategori, Reset) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-1 min-w-0">
            <div className="hidden lg:flex items-center text-xs font-semibold text-slate-400 gap-1.5 mr-1 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filter:</span>
            </div>

            {/* 1. Business Unit Filter (Searchable Select) */}
            {filterOptions?.business_units && filterOptions.business_units.length > 1 && (
              <div className="w-full sm:w-[210px] md:w-[230px] shrink-0">
                <SearchableSelect
                  value={filters.business_unit_id}
                  onChange={(val) => setBusinessUnitId(val)}
                  options={buOptions}
                  allOptionLabel="Semua Unit Bisnis"
                  placeholder="Unit Bisnis..."
                  icon={<Building2 className="w-3.5 h-3.5" />}
                />
              </div>
            )}

            {/* 2. Branch Filter (Multi-Select Searchable, Cascaded by BU) */}
            <div className="w-full sm:w-[230px] md:w-[260px] shrink-0">
              <SearchableSelect
                isMulti={true}
                value={filters.branch}
                onChange={(val) => setBranch(val)}
                options={branchOptions}
                allOptionLabel={
                  selectedBu
                    ? `Semua Cabang (${selectedBu.code})`
                    : 'Semua Cabang / Toko'
                }
                placeholder="Pilih Cabang..."
                icon={<Store className="w-3.5 h-3.5" />}
              />
            </div>

            {/* 3. Product Category Filter (Multi-Select Searchable, Cascaded by BU) */}
            <div className="w-full sm:w-[210px] md:w-[230px] shrink-0">
              <SearchableSelect
                isMulti={true}
                value={filters.category}
                onChange={(val) => setCategory(val)}
                options={categoryOptions}
                allOptionLabel="Semua Kategori"
                placeholder="Pilih Kategori..."
                icon={<Layers className="w-3.5 h-3.5" />}
              />
            </div>

            {/* Reset Filters Button */}
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                title="Kembalikan filter ke Bulan Ini (Semua BU, Cabang & Kategori)"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Active Filter Helper Badge (Right side of Row 2) */}
          {isFiltered && (
            <div className="hidden xl:flex items-center gap-2 text-[11px] text-indigo-300 bg-indigo-950/50 border border-indigo-800/50 px-3 py-1 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              <span className="truncate max-w-[320px]">
                {selectedBu ? selectedBu.name : 'Semua BU'}
                {filters.branch
                  ? ` • ${
                      Array.isArray(filters.branch)
                        ? `${filters.branch.length} Cabang`
                        : filters.branch
                    }`
                  : ''}
                {filters.category
                  ? ` • ${
                      Array.isArray(filters.category)
                        ? `${filters.category.length} Kategori`
                        : filters.category
                    }`
                  : ''}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
