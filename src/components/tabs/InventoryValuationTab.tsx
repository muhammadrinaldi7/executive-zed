import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFilter } from '../../context/FilterContext';
import { executiveApi } from '../../api/executive';
import type {
  InventoryValuationData,
  FilterOptions,
} from '../../types';
import { InventoryHeaderSyncBar } from '../inventory/InventoryHeaderSyncBar';
import { InventoryKpiGrid } from '../inventory/InventoryKpiGrid';
import { BranchValuationBreakdown } from '../inventory/BranchValuationBreakdown';
import { CategoryBrandCompositionCard } from '../inventory/CategoryBrandCompositionCard';
import { TopValuationItemsCard } from '../inventory/TopValuationItemsCard';
import { AlertCircle } from 'lucide-react';

interface InventoryValuationTabProps {
  filterOptions?: FilterOptions | null;
}

export const InventoryValuationTab: React.FC<InventoryValuationTabProps> = ({ filterOptions }) => {
  const { filters, refreshKey } = useFilter();

  const [data, setData] = useState<InventoryValuationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const asOfDate = filters.end_date || undefined;

  const loadInventoryData = useCallback(
    async (forceRefresh = false) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await executiveApi.getInventoryValuation({
          business_unit_id: filters.business_unit_id,
          branch: filters.branch,
          category: filters.category,
          as_of_date: asOfDate,
          force_refresh: forceRefresh,
        });

        if (res.success && res.data) {
          setData(res.data);
        } else {
          setErrorMessage(res.message || 'Gagal memuat data valuasi persediaan.');
        }
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setErrorMessage(
          axiosErr.response?.data?.message ||
            'Gagal menghubungi backend API untuk data stok & valuasi Accurate. Pastikan server aktif.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [filters.business_unit_id, filters.branch, filters.category, asOfDate]
  );

  useEffect(() => {
    loadInventoryData(false);
  }, [loadInventoryData, refreshKey]);

  // Handle manual sync button
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await executiveApi.syncInventory({
        business_unit_id: filters.business_unit_id,
        as_of_date: asOfDate,
      });
      await loadInventoryData(true);
    } catch (err) {
      console.error('Failed to sync inventory data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Resolve Business Unit Name for badge & titles
  const activeBuName = useMemo(() => {
    if (
      filters.business_unit_id !== null &&
      filters.business_unit_id !== undefined &&
      filters.business_unit_id !== ''
    ) {
      const bu = filterOptions?.business_units?.find(
        (u) => String(u.id) === String(filters.business_unit_id)
      );
      if (bu) return bu.name;
      if (String(filters.business_unit_id) === '1') return 'Syihab Store';
      if (String(filters.business_unit_id) === '2') return 'GSK Second';
      return `Unit Bisnis #${filters.business_unit_id}`;
    }
    return data?.business_unit || 'Semua Unit Bisnis';
  }, [filters.business_unit_id, filterOptions?.business_units, data?.business_unit]);

  // Reactive Client-Side Filter Computation (Dual-layer filter guarantee)
  // Directly use live backend API data which is reactively queried and filtered by SQL in backend
  const filteredData = useMemo<InventoryValuationData | null>(() => {
    if (!data) return null;

    const totalValuation = data.total_valuation || 0;
    const totalUnits = data.total_units || 0;
    const averageUnitCost =
      totalUnits > 0 ? Math.round(totalValuation / totalUnits) : (data.average_unit_cost || 0);

    return {
      ...data,
      business_unit: activeBuName,
      total_valuation: totalValuation,
      total_units: totalUnits,
      average_unit_cost: averageUnitCost,
      slow_moving: data.slow_moving || {
        threshold_days: 60,
        total_valuation: 0,
        total_qty: 0,
        percentage_of_inventory: 0,
      },
      branch_breakdown: data.branch_breakdown || [],
      category_breakdown: data.category_breakdown || [],
      brand_breakdown: data.brand_breakdown || [],
      top_valuation_items: data.top_valuation_items || [],
    };
  }, [data, activeBuName]);

  return (
    <div className="space-y-6">
      {/* 1. Sync & Verification Header with Active Filter Badges */}
      <InventoryHeaderSyncBar
        businessUnitName={activeBuName}
        asOfDate={filteredData?.as_of_date || asOfDate}
        lastSyncedAt={filteredData?.last_synced_at}
        glAccount={filteredData?.gl_account}
        branchFilter={filters.branch}
        categoryFilter={filters.category}
        isSyncing={isSyncing}
        onSync={handleForceSync}
      />

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold block">Kesalahan Data Persediaan Accurate:</span>
              {errorMessage}
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadInventoryData(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-medium text-rose-200 transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* 2. Key Inventory KPI Cards */}
      <InventoryKpiGrid data={filteredData} isLoading={isLoading} />

      {/* 3. Branch / Warehouse Stock Breakdown Table */}
      <BranchValuationBreakdown
        branches={filteredData?.branch_breakdown || []}
        totalValuation={filteredData?.total_valuation || 0}
        isLoading={isLoading}
      />

      {/* 4. Portfolio Allocation by Category and Brand */}
      <CategoryBrandCompositionCard
        categories={filteredData?.category_breakdown || []}
        brands={filteredData?.brand_breakdown || []}
        totalValuation={filteredData?.total_valuation || 0}
        isLoading={isLoading}
      />

      {/* 5. Top Valuation SKU & Depreciation Risk Alert */}
      <TopValuationItemsCard
        items={filteredData?.top_valuation_items || []}
        isLoading={isLoading}
      />
    </div>
  );
};

