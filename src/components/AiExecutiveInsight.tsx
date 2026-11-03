import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { executiveApi } from '../api/executive';
import { useFilter } from '../context/FilterContext';
import type { KpiResponseData, BranchMetric } from '../types';
import { formatCurrency, formatPercent, formatMarkdownForWhatsApp } from '../utils/formatters';
import { Bot, Sparkles, Lightbulb, ChevronDown, ChevronUp, RefreshCw, Share2, Check, Square } from 'lucide-react';

interface AiExecutiveInsightProps {
  kpi?: KpiResponseData | null;
  branches?: BranchMetric[] | null;
}

export const AiExecutiveInsight: React.FC<AiExecutiveInsightProps> = ({ kpi, branches }) => {
  const { filters } = useFilter();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryFingerprint, setSummaryFingerprint] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopiedWa, setIsCopiedWa] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const currentFingerprint = useMemo(
    () =>
      JSON.stringify({
        filters,
        start: kpi?.period?.start_date,
        end: kpi?.period?.end_date,
        netSales: kpi?.summary?.net_sales,
        orders: kpi?.summary?.total_orders,
      }),
    [filters, kpi?.period?.start_date, kpi?.period?.end_date, kpi?.summary?.net_sales, kpi?.summary?.total_orders]
  );

  // Automatically invalidate old AI summary whenever filters or KPI period/numbers change
  // so stale AI text can never be mixed with new KPI numbers on WhatsApp!
  useEffect(() => {
    if (summaryFingerprint && summaryFingerprint !== currentFingerprint) {
      abortRef.current?.abort();
      setIsGenerating(false);
      setAiSummary(null);
      setSummaryFingerprint(null);
      setIsExpanded(false);
      setIsCopiedWa(false);
    }
  }, [currentFingerprint, summaryFingerprint]);

  if (!kpi) return null;

  const summary = kpi.summary;
  const growth = kpi.mtd_comparison?.growth;
  const topBranch = branches && branches.length > 0 ? branches[0] : null;
  const isSummaryFresh = Boolean(aiSummary && summaryFingerprint === currentFingerprint);

  const handleStopGenerating = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsGenerating(false);
  };

  const handleGenerateSummary = async () => {
    if (isGenerating) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setIsExpanded(true);

    try {
      const res = await executiveApi.getAiSummary(filters, controller.signal);
      if (res.success && res.data) {
        setAiSummary(res.data.reply);
        setSummaryFingerprint(currentFingerprint);
      } else {
        throw new Error(res.message || 'Gagal menghasilkan ringkasan eksekutif.');
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      const cleanMessage =
        errObj.response?.data?.message ||
        'Layanan analisis eksekutif sedang sibuk sementara. Silakan coba beberapa saat lagi.';
      setAiSummary(`⚠️ **Layanan Sedang Sibuk:** ${cleanMessage}`);
      setSummaryFingerprint(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyForWhatsApp = () => {
    if (!aiSummary || !isSummaryFresh) return;

    const dateStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const periodInfo =
      kpi.period?.start_date && kpi.period?.end_date
        ? `${kpi.period.start_date} s/d ${kpi.period.end_date}`
        : filters.date_range?.replace(/_/g, ' ').toUpperCase() || 'Periode Aktif';

    const cleanWaAnalysis = formatMarkdownForWhatsApp(aiSummary);

    const waText = `*ZED EXECUTIVE BRIEFING* 📊
_Laporan Direksi & Intelijen Bisnis C-Level_
📅 Tanggal Cetak: ${dateStr}
🗂️ Periode Data: ${periodInfo}

*Ringkasan Kinerja Terverifikasi:*
• Net Sales: ${formatCurrency(summary.net_sales)}
• Gross Profit: ${formatCurrency(summary.gross_profit)} (Margin: ${summary.profit_margin.toFixed(1)}%)
• Realisasi Kas Lunas: ${formatCurrency(summary.completed_amount || 0)}
• Piutang Berjalan: ${formatCurrency(summary.piutang_amount || 0)}
${topBranch ? `• Cabang Kontributor Utama: ${topBranch.branch_name} (${topBranch.contribution_percentage}%)` : ''}

*Analisis & Rekomendasi Strategis:*
${cleanWaAnalysis}

_Dihasilkan melalui Zed Executive Intelligence Suite_`;

    navigator.clipboard.writeText(waText);
    setIsCopiedWa(true);
    setTimeout(() => setIsCopiedWa(false), 2500);
  };

  return (
    <div className="rounded-2xl p-4 sm:p-6 relative overflow-hidden bg-gradient-to-r from-indigo-950/60 via-purple-950/30 to-slate-900 border border-indigo-500/30 shadow-xl transition-all max-w-full">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                AI Executive Strategic Insight
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                Verified Live Data
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Berdasarkan data performa filter aktif saat ini, pendapatan bersih tercatat sebesar{' '}
              <span className="text-white font-bold">{formatCurrency(summary.net_sales)}</span> dengan margin laba kotor{' '}
              <span className="text-emerald-400 font-bold">{summary.profit_margin.toFixed(1)}%</span>.
              {growth?.net_sales_pct !== undefined && (
                <>
                  {' '}Tren MTD menunjukkan pertumbuhan{' '}
                  <span className={growth.net_sales_pct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {formatPercent(growth.net_sales_pct)}
                  </span>{' '}
                  dibanding periode pembanding bulan lalu.
                </>
              )}
              {topBranch && (
                <>
                  {' '}Cabang <span className="text-indigo-300 font-bold">{topBranch.branch_name}</span> memimpin dengan kontribusi{' '}
                  <span className="text-white font-bold">{topBranch.contribution_percentage}%</span> dari total omset.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {isGenerating ? (
            <button
              onClick={handleStopGenerating}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Hentikan Analisis</span>
            </button>
          ) : (
            <button
              onClick={handleGenerateSummary}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer group"
            >
              {aiSummary ? (
                <>
                  <RefreshCw className="w-4 h-4 text-indigo-200" />
                  <span>Analisis Ulang AI</span>
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4 text-amber-300" />
                  <span>Eksplorasi Rekomendasi AI</span>
                </>
              )}
            </button>
          )}

          {isSummaryFresh && (
            <>
              <button
                onClick={handleCopyForWhatsApp}
                title="Salin format rapi siap kirim ke grup WhatsApp Direksi"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isCopiedWa
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                {isCopiedWa ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Share WA Direksi</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded AI Summary Box */}
      {isExpanded && aiSummary && (
        <div className="mt-5 pt-4 border-t border-slate-800/80 relative z-10">
          <div className="bg-slate-900/90 rounded-xl p-4 border border-indigo-500/30 text-xs text-slate-200 leading-relaxed shadow-inner">
            <div className="font-bold text-white mb-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>Analisis Strategis & Rekomendasi Direksi</span>
              </div>
              {isSummaryFresh && (
                <button
                  onClick={handleCopyForWhatsApp}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Salin Format WhatsApp</span>
                </button>
              )}
            </div>
            <MarkdownRenderer content={aiSummary} />
          </div>
        </div>
      )}
    </div>
  );
};
