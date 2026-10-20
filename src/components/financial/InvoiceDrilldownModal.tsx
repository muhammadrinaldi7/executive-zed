import React, { useState } from 'react';
import { X, Search, ArrowDownLeft, ArrowUpRight, AlertCircle } from 'lucide-react';
import type { FinancialInvoiceItem } from '../../types';

interface InvoiceDrilldownModalProps {
  isOpen: boolean;
  type: 'AR' | 'AP';
  invoices: FinancialInvoiceItem[];
  onClose: () => void;
}

export const InvoiceDrilldownModal: React.FC<InvoiceDrilldownModalProps> = ({
  isOpen,
  type,
  invoices,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const isAr = type === 'AR';
  const title = isAr ? 'Rincian Faktur Piutang Pelanggan (AR)' : 'Rincian Faktur Hutang Supplier (AP)';
  const subtitle = isAr
    ? 'Daftar faktur penjualan Accurate yang masih memiliki sisa piutang (primeOwing > 0)'
    : 'Daftar faktur pembelian Accurate yang belum lunas ke vendor/supplier';

  const formatRupiah = (val?: number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filtered = invoices.filter((inv) => {
    const term = search.toLowerCase();
    const entity = (inv.customer_name || inv.vendor_name || '').toLowerCase();
    const no = (inv.invoice_no || '').toLowerCase();
    return entity.includes(term) || no.includes(term);
  });

  const totalFilteredOwing = filtered.reduce((sum, inv) => sum + inv.prime_owing, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isAr
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {isAr ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Summary Toolbar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isAr ? 'Cari no faktur atau customer...' : 'Cari no faktur atau vendor...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-4 text-xs w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-slate-400">
              Menampilkan <strong className="text-white">{filtered.length}</strong> dari {invoices.length} faktur
            </span>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
              <span className="text-slate-400 mr-2">Total Sisa:</span>
              <strong className={isAr ? 'text-blue-300' : 'text-amber-300'}>
                {formatRupiah(totalFilteredOwing)}
              </strong>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Tidak ada faktur yang cocok dengan pencarian &quot;{search}&quot;.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">No. Faktur</th>
                    <th className="py-2.5 px-3">{isAr ? 'Pelanggan / Mitra' : 'Supplier / Vendor'}</th>
                    <th className="py-2.5 px-3">Tgl Faktur</th>
                    <th className="py-2.5 px-3">Jatuh Tempo</th>
                    <th className="py-2.5 px-3">Umur</th>
                    <th className="py-2.5 px-3 text-right">Nilai Faktur</th>
                    <th className="py-2.5 px-3 text-right">Sisa Belum Lunas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filtered.map((inv) => {
                    const name = inv.customer_name || inv.vendor_name || '-';
                    const isCritical = inv.aging_days > 30;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-200">{inv.invoice_no}</td>
                        <td className="py-3 px-3 font-sans font-medium text-slate-300">{name}</td>
                        <td className="py-3 px-3 text-slate-400">{inv.trans_date}</td>
                        <td className="py-3 px-3 text-slate-400">{inv.due_date}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isCritical
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                : inv.aging_days > 14
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {inv.aging_days} hari
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">
                          {formatRupiah(inv.total_amount)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold">
                          <span className={isAr ? 'text-blue-300' : 'text-amber-300'}>
                            {formatRupiah(inv.prime_owing)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Faktur dengan status primeOwing &gt; 0 bersumber langsung dari Accurate Online.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
