import React, { useState, useEffect, useCallback } from 'react';
import { useFilter } from '../../context/FilterContext';
import { executiveApi } from '../../api/executive';
import type {
  FinancialArApSummary,
  CashBankReport,
  FinancialInvoiceItem,
} from '../../types';
import { FinancialHeaderSyncBar } from '../financial/FinancialHeaderSyncBar';
import { ArApOverviewCards } from '../financial/ArApOverviewCards';
import { ArAgingCard } from '../financial/ArAgingCard';
import { ApAgingCard } from '../financial/ApAgingCard';
import { CashBankGrid } from '../financial/CashBankGrid';
import { InvoiceDrilldownModal } from '../financial/InvoiceDrilldownModal';
import { AlertCircle } from 'lucide-react';

export const AccurateFinancialTab: React.FC = () => {
  const { filters, refreshKey } = useFilter();

  const [summary, setSummary] = useState<FinancialArApSummary | null>(null);
  const [cashBank, setCashBank] = useState<CashBankReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drilldown modal state
  const [modalType, setModalType] = useState<'AR' | 'AP' | null>(null);
  const [modalInvoices, setModalInvoices] = useState<FinancialInvoiceItem[]>([]);

  const asOfDate = filters.end_date || undefined;

  const loadFinancialData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [sumRes, cbRes] = await Promise.all([
        executiveApi.getFinancialSummary({
          business_unit_id: filters.business_unit_id,
          as_of_date: asOfDate,
          force_refresh: forceRefresh,
        }),
        executiveApi.getFinancialCashBank({
          business_unit_id: filters.business_unit_id,
          as_of_date: asOfDate,
          force_refresh: forceRefresh,
        }),
      ]);

      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
      if (cbRes.success && cbRes.data) {
        setCashBank(cbRes.data);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        axiosErr.response?.data?.message ||
          'Gagal memuat data keuangan Accurate. Pastikan koneksi backend dan token Accurate aktif.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters.business_unit_id, asOfDate]);

  useEffect(() => {
    loadFinancialData(false);
  }, [loadFinancialData, refreshKey]);

  // Handle manual sync button
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await executiveApi.syncFinancial({
        as_of_date: asOfDate,
      });
      await loadFinancialData(true);
    } catch (err) {
      console.error('Failed to sync financial data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Open modal and fetch full invoice list
  const handleOpenModal = async (type: 'AR' | 'AP') => {
    setModalType(type);
    try {
      if (type === 'AR') {
        const res = await executiveApi.getFinancialReceivables({
          business_unit_id: filters.business_unit_id,
          as_of_date: asOfDate,
        });
        if (res.success && res.data) {
          setModalInvoices(res.data.invoices || []);
        }
      } else {
        const res = await executiveApi.getFinancialPayables({
          business_unit_id: filters.business_unit_id,
          as_of_date: asOfDate,
        });
        if (res.success && res.data) {
          setModalInvoices(res.data.invoices || []);
        }
      }
    } catch (err) {
      console.error('Failed to load drilldown invoices:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Accurate Verification and Sync Trigger */}
      <FinancialHeaderSyncBar
        businessUnitName={summary?.business_unit || 'GSK / ZED Group'}
        asOfDate={summary?.as_of_date || asOfDate}
        lastSyncedAt={summary?.last_synced_at}
        isSyncing={isSyncing}
        onSync={handleForceSync}
      />

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold block">Kesalahan Koneksi Accurate Online:</span>
              {errorMessage}
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadFinancialData(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-medium text-rose-200 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* 2. Overview Working Capital & Liquidity Cards */}
      <ArApOverviewCards
        summary={summary}
        cashBank={cashBank}
        isLoading={isLoading}
        onOpenReceivablesModal={() => handleOpenModal('AR')}
        onOpenPayablesModal={() => handleOpenModal('AP')}
      />

      {/* 3. 2-Column Schedule: AR Aging vs AP Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ArAgingCard
          aging={summary?.receivables?.aging}
          topDebtors={summary?.receivables?.top_debtors}
          totalReceivables={summary?.receivables?.total_amount || 0}
          isLoading={isLoading}
          onOpenModal={() => handleOpenModal('AR')}
        />

        <ApAgingCard
          aging={summary?.payables?.aging}
          topVendors={summary?.payables?.top_vendors}
          totalPayables={summary?.payables?.total_amount || 0}
          isLoading={isLoading}
          onOpenModal={() => handleOpenModal('AP')}
        />
      </div>

      {/* 4. Real Cash & Bank Accounts (Accurate GL) */}
      <CashBankGrid cashBank={cashBank} isLoading={isLoading} />

      {/* 5. Invoices Drilldown Modal */}
      <InvoiceDrilldownModal
        isOpen={modalType !== null}
        type={modalType || 'AR'}
        invoices={modalInvoices}
        onClose={() => setModalType(null)}
      />
    </div>
  );
};
