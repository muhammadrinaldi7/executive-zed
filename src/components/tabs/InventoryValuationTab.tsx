import React, { useState, useEffect, useCallback } from 'react';
import { useFilter } from '../../context/FilterContext';
import { executiveApi } from '../../api/executive';
import type { InventoryValuationData } from '../../types';
import { InventoryHeaderSyncBar } from '../inventory/InventoryHeaderSyncBar';
import { InventoryKpiGrid } from '../inventory/InventoryKpiGrid';
import { BranchValuationBreakdown } from '../inventory/BranchValuationBreakdown';
import { CategoryBrandCompositionCard } from '../inventory/CategoryBrandCompositionCard';
import { TopValuationItemsCard } from '../inventory/TopValuationItemsCard';
import { AlertCircle } from 'lucide-react';

export const InventoryValuationTab: React.FC = () => {
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

  return (
    <div className="space-y-6">
      {/* 1. Sync & Verification Header */}
      <InventoryHeaderSyncBar
        businessUnitName={data?.business_unit || 'GSK / ZED Group'}
        asOfDate={data?.as_of_date || asOfDate}
        lastSyncedAt={data?.last_synced_at}
        glAccount={data?.gl_account}
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
      <InventoryKpiGrid data={data} isLoading={isLoading} />

      {/* 3. Branch / Warehouse Stock Breakdown Table */}
      <BranchValuationBreakdown
        branches={data?.branch_breakdown || []}
        totalValuation={data?.total_valuation || 0}
        isLoading={isLoading}
      />

      {/* 4. Portfolio Allocation by Category and Brand */}
      <CategoryBrandCompositionCard
        categories={data?.category_breakdown || []}
        brands={data?.brand_breakdown || []}
        totalValuation={data?.total_valuation || 0}
        isLoading={isLoading}
      />

      {/* 5. Top Valuation SKU & Depreciation Risk Alert */}
      <TopValuationItemsCard
        items={data?.top_valuation_items || []}
        isLoading={isLoading}
      />
    </div>
  );
};
