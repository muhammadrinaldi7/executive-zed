import React, { useState, useEffect } from 'react';
import { 
  X, 
  Store, 
  Search, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  User, 
  UserCheck, 
  ShoppingBag, 
  AlertCircle,
  Hash,
  Clock
} from 'lucide-react';
import { executiveApi } from '../../api/executive';
import type { 
  BranchTransactionsResponse, 
  FilterParams 
} from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface BranchTransactionsModalProps {
  branch: string | null;
  filterParams?: FilterParams;
  onClose: () => void;
}

export const BranchTransactionsModal: React.FC<BranchTransactionsModalProps> = ({
  branch,
  filterParams,
  onClose,
}) => {
  const [data, setData] = useState<BranchTransactionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch transactions when branch, filterParams, or debouncedSearch changes
  useEffect(() => {
    if (!branch) return;

    let isMounted = true;
    setIsLoading(true);

    executiveApi
      .getBranchTransactions({
        ...filterParams,
        branch,
        search: debouncedSearch || undefined,
      })
      .then((res) => {
        if (isMounted && res.data) {
          setData(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load branch transactions:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [branch, filterParams, debouncedSearch]);

  // Export transactions to CSV
  const handleExportCsv = () => {
    if (!data || data.transactions.length === 0) return;

    const headers = [
      'No Order POS',
      'No Faktur Accurate',
      'Tanggal',
      'Jam',
      'Cabang',
      'Kasir',
      'Sales',
      'Pelanggan',
      'No HP',
      'Status',
      'Total Qty',
      'Gross Sales',
      'Diskon',
      'Grand Total',
      'MDR',
      'Net Sales',
      'Metode Bayar',
      'Daftar Barang',
    ];

    const rows = data.transactions.map((t) => {
      const itemsStr = t.items
        .map((i) => `${i.product_name} (x${i.qty})${i.serial_number ? ' [SN: ' + i.serial_number + ']' : ''}`)
        .join('; ');
      const paymentsStr = t.payment_methods.map((p) => p.name).join(', ');

      return [
        t.order_number,
        t.invoice_no,
        t.date,
        t.time,
        t.branch,
        t.cashier_name,
        t.sales_name,
        t.customer_name,
        t.customer_phone,
        t.status,
        t.total_qty,
        t.gross_sales,
        t.discount,
        t.grand_total,
        t.mdr,
        t.net_sales,
        paymentsStr,
        itemsStr,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `faktur_cabang_${(branch || 'semua').toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!branch) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 truncate">
                <span>Detail Faktur: {branch}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar transaksi penjualan riil cabang pada periode yang dipilih
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={!data || data.transactions.length === 0}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
              title="Unduh data sebagai CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Metric Summaries */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <div className="text-slate-400 font-medium">Total Faktur</div>
              <div className="text-base sm:text-lg font-bold text-white mt-1 tabular-nums">
                {data.summary.total_orders} Transaksi
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <div className="text-slate-400 font-medium">Omset Faktur</div>
              <div className="text-base sm:text-lg font-bold text-indigo-400 mt-1 tabular-nums">
                {formatCurrency(data.summary.total_grand_total)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <div className="text-slate-400 font-medium">Barang Terjual</div>
              <div className="text-base sm:text-lg font-bold text-white mt-1 tabular-nums">
                {data.summary.total_qty} pcs
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <div className="text-slate-400 font-medium">Potongan MDR</div>
              <div className="text-base sm:text-lg font-bold text-rose-400 mt-1 tabular-nums">
                {formatCurrency(data.summary.total_mdr)}
              </div>
            </div>
          </div>
        )}

        {/* Search Toolbar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no faktur, nama customer, sales, kasir, barang..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            Menampilkan <span className="font-semibold text-white">{data?.transactions.length ?? 0}</span> faktur
          </div>
        </div>

        {/* Modal Body / Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {isLoading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-20 bg-slate-800/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !data || data.transactions.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">Tidak ada transaksi ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">
                {search ? 'Coba ubah kata kunci pencarian Anda' : 'Belum ada transaksi di cabang ini pada periode aktif'}
              </p>
            </div>
          ) : (
            data.transactions.map((tx) => {
              const isExpanded = expandedOrderId === tx.order_id;
              return (
                <div
                  key={tx.order_id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700/80 transition-all overflow-hidden"
                >
                  {/* Card Header Row */}
                  <div
                    onClick={() => setExpandedOrderId(isExpanded ? null : tx.order_id)}
                    className="p-3.5 sm:p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    {/* Left: Invoice numbers & date */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Hash className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm tracking-tight">{tx.order_number}</span>
                          {tx.invoice_no && tx.invoice_no !== '-' && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
                              Accurate: {tx.invoice_no}
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border ${
                              tx.status === 'COMPLETED'
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {tx.date} • {tx.time}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500" />
                            Customer: <strong className="text-slate-300 font-medium">{tx.customer_name}</strong>
                          </span>
                          {tx.sales_name && tx.sales_name !== '-' && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-indigo-400" />
                                Sales: <strong className="text-slate-300 font-medium">{tx.sales_name}</strong>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Payment & Total Amount */}
                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                      <div className="text-left md:text-right">
                        <div className="text-sm font-extrabold text-white tabular-nums">
                          {formatCurrency(tx.grand_total)}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 md:justify-end mt-0.5">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          <span>
                            {tx.payment_methods.length > 0
                              ? tx.payment_methods.map((p) => p.name).join(', ')
                              : 'Pembayaran Lunas'}
                          </span>
                        </div>
                      </div>

                      <div className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Items Drawer */}
                  {isExpanded && (
                    <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 animate-in slide-in-from-top-1 duration-150">
                      <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Rincian Barang Belanja ({tx.items.length} item)</span>
                      </div>

                      <div className="divide-y divide-slate-800/60 border border-slate-800/60 rounded-lg overflow-hidden bg-slate-900/60">
                        {tx.items.map((it, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <div className="font-semibold text-white flex items-center gap-2 flex-wrap">
                                <span>{it.product_name}</span>
                                {it.sku && it.sku !== '-' && (
                                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1 rounded">
                                    {it.sku}
                                  </span>
                                )}
                              </div>
                              {it.serial_number && (
                                <div className="text-[11px] text-indigo-300 font-mono mt-0.5">
                                  IMEI/SN: {it.serial_number}
                                </div>
                              )}
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {it.qty} pcs x {formatCurrency(it.price)}
                                {it.discount > 0 && (
                                  <span className="text-rose-400 ml-1.5 font-medium">
                                    (Hemat -{formatCurrency(it.discount)})
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right font-bold text-white tabular-nums shrink-0">
                              {formatCurrency(it.subtotal)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Cashier & Notes Footer */}
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/40">
                        <div>
                          Kasir: <span className="text-slate-300 font-medium">{tx.cashier_name}</span>
                          {tx.notes && <span className="ml-3 italic text-slate-400">"{tx.notes}"</span>}
                        </div>
                        {tx.mdr > 0 && (
                          <div className="text-rose-400/90 font-medium">
                            Potongan MDR: -{formatCurrency(tx.mdr)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
