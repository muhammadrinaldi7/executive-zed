import { apiClient } from './client';
import type {
  ApiResponse,
  UserProfile,
  DashboardOverviewData,
  KpiResponseData,
  BranchMetric,
  SalesTrend,
  TopProduct,
  PaymentMethodMetric,
  FilterOptions,
  FilterParams,
  AiChatMessage,
  AiChatResponse,
  StaffKpiData,
  BrandAnalyticsData,
  CashierAuditData,
  PromoClaimsData,
  ProjectSalesReportResponse,
  ProjectSalesDetailItem,
  BranchTransactionsResponse,
  PiutangReportData,
  FinancialArApSummary,
  FinancialReceivablesReport,
  FinancialPayablesReport,
  CashBankReport,
  InventoryValuationData,
} from '../types';

export const executiveApi = {
  /**
   * Login executive user and receive token.
   */
  async login(credentials: { email: string; password: string; device_name?: string }) {
    const response = await apiClient.post<ApiResponse<{ token: string; user: UserProfile }>>(
      '/login',
      credentials
    );
    return response.data;
  },

  /**
   * Get current executive user profile.
   */
  async getMe() {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/me');
    return response.data;
  },

  /**
   * Logout current executive session.
   */
  async logout() {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/logout');
    return response.data;
  },

  /**
   * Get all-in-one dashboard payload in a single HTTP request.
   */
  async getOverview(params?: FilterParams) {
    const response = await apiClient.get<ApiResponse<DashboardOverviewData>>('/overview', {
      params,
    });
    return response.data;
  },

  /**
   * Get KPI summary and MTD comparison.
   */
  async getKpiSummary(params?: FilterParams) {
    const response = await apiClient.get<ApiResponse<KpiResponseData>>('/kpi-summary', {
      params,
    });
    return response.data;
  },

  /**
   * Get branch performance comparison.
   */
  async getBranchComparison(params?: FilterParams) {
    const response = await apiClient.get<ApiResponse<BranchMetric[]>>('/branch-comparison', {
      params,
    });
    return response.data;
  },

  /**
   * Get sales & profit timeline trend.
   */
  async getSalesTrend(params?: FilterParams) {
    const response = await apiClient.get<ApiResponse<SalesTrend>>('/sales-trend', {
      params,
    });
    return response.data;
  },

  /**
   * Get top products ranking.
   */
  async getTopProducts(params?: FilterParams) {
    const response = await apiClient.get<ApiResponse<TopProduct[]>>('/top-products', {
      params,
    });
    return response.data;
  },

  /**
   * Get payment methods breakdown.
   */
  async getPaymentBreakdown(params?: FilterParams) {
    const response = await apiClient.get<ApiResponse<PaymentMethodMetric[]>>('/payment-breakdown', {
      params,
    });
    return response.data;
  },

  /**
   * Get available dropdown filters.
   */
  async getFilterOptions() {
    const response = await apiClient.get<ApiResponse<FilterOptions>>('/filters');
    return response.data;
  },

  /**
   * Send prompt to Executive AI Assistant with server-verified active tab & filters.
   */
  async sendAiChat(
    message: string,
    sessionId?: string,
    options?: {
      activeTab?: string;
      activeFilters?: FilterParams | Record<string, unknown>;
      signal?: AbortSignal;
    }
  ) {
    const response = await apiClient.post<ApiResponse<AiChatResponse>>(
      '/ai/chat',
      {
        message,
        session_id: sessionId,
        active_tab: options?.activeTab || 'overview',
        active_filters: options?.activeFilters || {},
      },
      { signal: options?.signal }
    );
    return response.data;
  },

  /**
   * Stream real-time AI Assistant response via SSE (with automatic fallback to standard JSON endpoint).
   */
  async streamAiChat(params: {
    message: string;
    sessionId: string;
    activeTab?: string;
    activeFilters?: FilterParams | Record<string, unknown>;
    signal?: AbortSignal;
    onStatus?: (statusText: string) => void;
    onDelta?: (deltaText: string) => void;
  }): Promise<{ reply: string; created_at?: string; session_id: string }> {
    const baseUrl = (apiClient.defaults.baseURL || '/api/v1/executive').replace(/\/$/, '');
    const token = localStorage.getItem('executive_token');

    try {
      const response = await fetch(`${baseUrl}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream, application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: params.message,
          session_id: params.sessionId,
          active_tab: params.activeTab || 'overview',
          active_filters: params.activeFilters || {},
        }),
        signal: params.signal,
      });

      if (response.status === 401) {
        localStorage.removeItem('executive_token');
        localStorage.removeItem('executive_user');
        window.dispatchEvent(new Event('executive:unauthorized'));
        throw new Error('Sesi autentikasi berakhir. Silakan login kembali.');
      }

      // Fallback seamlessly if server has not yet deployed /ai/chat/stream (404/405)
      if (response.status === 404 || response.status === 405) {
        params.onStatus?.('Memproses analisis terverifikasi server...');
        const fallback = await this.sendAiChat(params.message, params.sessionId, {
          activeTab: params.activeTab,
          activeFilters: params.activeFilters,
          signal: params.signal,
        });
        if (!fallback.success || !fallback.data) {
          throw new Error(fallback.message || 'Layanan Asisten Eksekutif sedang sibuk.');
        }
        params.onDelta?.(fallback.data.reply);
        return fallback.data;
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Batas frekuensi permintaan AI tercapai. Mohon tunggu beberapa detik sebelum mengirim lagi.');
        }
        let errMessage = 'Layanan Asisten Eksekutif sedang sibuk. Silakan coba sesaat lagi.';
        try {
          const errJson = await response.json();
          if (errJson?.message) errMessage = errJson.message;
        } catch {
          // Ignore non-JSON error body
        }
        throw new Error(errMessage);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream') || !response.body) {
        const json = (await response.json()) as ApiResponse<AiChatResponse>;
        if (!json.success || !json.data) {
          throw new Error(json.message || 'Gagal memproses respons AI.');
        }
        params.onDelta?.(json.data.reply);
        return json.data;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedReply = '';
      let finalCreatedAt: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let newlineIdx: number;

        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);

          if (!line.startsWith('data:')) continue;
          const payloadStr = line.slice(5).trim();
          if (!payloadStr || payloadStr === '[DONE]') continue;

          let evt: {
            type?: string;
            text?: string;
            reply?: string;
            message?: string;
            created_at?: string;
          };
          try {
            evt = JSON.parse(payloadStr);
          } catch {
            continue;
          }

          if (evt.type === 'status' && evt.text) {
            params.onStatus?.(evt.text);
          } else if (evt.type === 'delta' && evt.text) {
            accumulatedReply += evt.text;
            params.onDelta?.(evt.text);
          } else if (evt.type === 'done') {
            if (evt.reply) {
              accumulatedReply = evt.reply;
            }
            finalCreatedAt = evt.created_at;
          } else if (evt.type === 'error') {
            throw new Error(evt.message || 'Terjadi gangguan saat memproses analisis AI.');
          }
        }
      }

      return {
        reply: accumulatedReply,
        created_at: finalCreatedAt || new Date().toISOString(),
        session_id: params.sessionId,
      };
    } catch (err) {
      if ((err as Error)?.name === 'AbortError' || params.signal?.aborted) {
        throw err;
      }
      throw err;
    }
  },

  /**
   * Get chat history for specific session.
   */
  async getAiHistory(sessionId?: string, limit = 50) {
    const response = await apiClient.get<ApiResponse<AiChatMessage[]>>('/ai/history', {
      params: { session_id: sessionId, limit },
    });
    return response.data;
  },

  /**
   * Generate 1-click executive summary strictly grounded in active server-side filters.
   */
  async getAiSummary(
    activeFilters: FilterParams | Record<string, unknown>,
    signal?: AbortSignal
  ) {
    const response = await apiClient.post<ApiResponse<AiChatResponse>>(
      '/ai/summarize',
      {
        active_filters: activeFilters,
        context_data: { active_filters: activeFilters },
      },
      { signal }
    );
    return response.data;
  },

  /**
   * Clear chat history for specific session.
   */
  async clearAiHistory(sessionId: string) {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>('/ai/history', {
      data: { session_id: sessionId },
    });
    return response.data;
  },

  /**
   * Get Staff KPI (Cashiers & Salespersons rankings).
   */
  async getStaffKpi(params?: FilterParams) {
    const response = await apiClient.get<ApiResponse<StaffKpiData>>('/staff-kpi', {
      params,
    });
    return response.data;
  },

  /**
   * Get Brand Analytics (revenue, units, margins, market share).
   */
  async getBrandAnalytics(params?: FilterParams) {
    const response = await apiClient.get<ApiResponse<BrandAnalyticsData>>('/brand-analytics', {
      params,
    });
    return response.data;
  },

  /**
   * Get Cashier Audit (order cancellations & SellPhone buyback overpayment).
   */
  async getCashierAudit(params?: FilterParams) {
    const response = await apiClient.get<ApiResponse<CashierAuditData>>('/cashier-audit', {
      params,
    });
    console.log("DAPET", response.data)
    return response.data;
  },

  /**
   * Get Promo Claims & Subsidiaries report.
   */
  async getPromoClaims(params?: FilterParams) {
    const response = await apiClient.get<ApiResponse<PromoClaimsData>>('/promo-claims', {
      params,
    });
    return response.data;
  },
  /**
   * Get Project Sales Matrix & Breakdown report.
   */
  async getProjectSales(params?: FilterParams) {
    const response = await apiClient.get<ApiResponse<ProjectSalesReportResponse>>('/project-sales', {
      params,
    });
    return response.data;
  },

  /**
   * Get Project Sales Drilldown items.
   */
  async getProjectSalesDetail(params: {
    date?: string;
    project?: string;
    search?: string;
    branch?: string | string[] | null;
    business_unit_id?: number | string | null;
  }) {
    const response = await apiClient.get<ApiResponse<ProjectSalesDetailItem[]>>('/project-sales/detail', {
      params,
    });
    return response.data;
  },
  /**
   * Get Branch Detailed Invoices / Transactions.
   */
  async getBranchTransactions(params: FilterParams & { branch: string; search?: string }) {
    const response = await apiClient.get<ApiResponse<BranchTransactionsResponse>>('/branch-transactions', {
      params,
    });
    return response.data;
  },
  /**
   * Get Outstanding Receivables (Piutang) report strictly adhering to Dashboard.php.
   */
  async getPiutangReport(params?: FilterParams) {
    const response = await apiClient.get<ApiResponse<PiutangReportData>>('/piutang', {
      params,
    });
    return response.data;
  },

  /**
   * Get Accurate Real-time Financial AR & AP Summary.
   */
  async getFinancialSummary(params?: {
    database_source?: string;
    as_of_date?: string;
    business_unit_id?: number | string | null;
    force_refresh?: boolean;
  }) {
    const response = await apiClient.get<ApiResponse<FinancialArApSummary>>(
      '/financial/ar-ap-summary',
      { params }
    );
    return response.data;
  },

  /**
   * Get Detailed Outstanding Receivables (Piutang AR) from Accurate.
   */
  async getFinancialReceivables(params?: {
    database_source?: string;
    as_of_date?: string;
    business_unit_id?: number | string | null;
    force_refresh?: boolean;
  }) {
    const response = await apiClient.get<ApiResponse<FinancialReceivablesReport>>(
      '/financial/receivables',
      { params }
    );
    return response.data;
  },

  /**
   * Get Detailed Outstanding Payables (Hutang AP) from Accurate.
   */
  async getFinancialPayables(params?: {
    database_source?: string;
    as_of_date?: string;
    business_unit_id?: number | string | null;
    force_refresh?: boolean;
  }) {
    const response = await apiClient.get<ApiResponse<FinancialPayablesReport>>(
      '/financial/payables',
      { params }
    );
    return response.data;
  },

  /**
   * Get Cash & Bank Balances from Accurate.
   */
  async getFinancialCashBank(params?: {
    database_source?: string;
    as_of_date?: string;
    business_unit_id?: number | string | null;
    force_refresh?: boolean;
  }) {
    const response = await apiClient.get<ApiResponse<CashBankReport>>(
      '/financial/cash-bank',
      { params }
    );
    return response.data;
  },

  /**
   * Force Sync Financial Data from Accurate.
   */
  async syncFinancial(params?: { database_source?: string; as_of_date?: string }) {
    const response = await apiClient.post<
      ApiResponse<{ summary: FinancialArApSummary; cash_bank: CashBankReport; synced_at: string }>
    >('/financial/sync', params);
    return response.data;
  },

  /**
   * Get Complete Inventory Stock & Valuation from Accurate.
   */
  async getInventoryValuation(params?: {
    database_source?: string;
    as_of_date?: string;
    business_unit_id?: number | string | null;
    branch?: string | string[] | null;
    category?: string | string[] | null;
    project?: string | string[] | null;
    force_refresh?: boolean;
  }) {
    const response = await apiClient.get<ApiResponse<InventoryValuationData>>(
      '/inventory/valuation',
      { params }
    );
    return response.data;
  },

  /**
   * Force Sync Inventory Valuation from Accurate.
   */
  async syncInventory(params?: { database_source?: string; as_of_date?: string; business_unit_id?: number | string | null }) {
    const response = await apiClient.post<
      ApiResponse<InventoryValuationData>
    >('/inventory/sync', params);
    return response.data;
  },
};
