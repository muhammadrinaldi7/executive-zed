import React, { useState, useEffect, useRef } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { executiveApi } from '../api/executive';
import { useFilter } from '../context/FilterContext';
import type { AiChatMessage, DashboardOverviewData } from '../types';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface AiAssistantDrawerProps {
  overviewData?: DashboardOverviewData | null;
}

interface QuickPromptItem {
  id: string;
  label: string;
  category: 'stok' | 'audit' | 'finansial';
  prompt: string;
  isTemplate?: boolean;
}

const CATEGORIES = [
  { id: 'all', label: '✨ Semua Shortcut' },
  { id: 'stok', label: '📦 Stok & Cabang' },
  { id: 'audit', label: '🚨 Audit & Risiko' },
  { id: 'finansial', label: '📊 Finansial' },
] as const;

const QUICK_PROMPTS: QuickPromptItem[] = [
  // 📦 Stok & Operasional Toko
  {
    id: 'stok-second',
    label: '📦 Stok HP Second (GSK)',
    category: 'stok',
    prompt: 'Cek stok iPhone & HP second yang tersedia di seluruh cabang GSK saat ini dan berapa harganya?',
  },
  {
    id: 'stok-baru',
    label: '🏬 Stok HP Baru (Syihab)',
    category: 'stok',
    prompt: 'Cek ketersediaan dan sebaran stok iPhone baru di cabang-cabang Syihab.',
  },
  {
    id: 'dead-stock',
    label: '⏳ Dead Stock (>30 Hari)',
    category: 'stok',
    prompt: 'Apakah ada unit HP second yang sudah mengendap lebih dari 30 hari di toko belum laku?',
  },
  {
    id: 'imei-track',
    label: '🔍 Lacak Fisik IMEI/SN',
    category: 'stok',
    prompt: 'Lacak IMEI [masukkan nomor seri/IMEI] ada di toko mana dan berapa harganya?',
    isTemplate: true,
  },
  // 🚨 Audit & Kontrol Risiko
  {
    id: 'void-kasir',
    label: '🚨 Audit Void Kasir',
    category: 'audit',
    prompt: 'Kasir mana yang paling banyak membatalkan nota (void), di cabang mana, dan berapa nominalnya?',
  },
  {
    id: 'piutang-aktif',
    label: '📋 Monitoring Piutang',
    category: 'audit',
    prompt: 'Berapa total piutang yang belum terbayar dan transaksi piutang mana saja yang perlu segera ditagih?',
  },
  {
    id: 'mdr-eval',
    label: '💳 Evaluasi Biaya MDR',
    category: 'audit',
    prompt: 'Metode pembayaran dan mesin EDC apa yang memakan biaya MDR paling besar pada periode ini?',
  },
  // 📊 Kinerja Finansial Cabang
  {
    id: 'margin-tipis',
    label: '📉 Cabang Margin Rendah',
    category: 'finansial',
    prompt: 'Cabang mana yang performa margin laba kotornya paling tipis di bawah target perusahaan?',
  },
  {
    id: 'top-sales',
    label: '🏆 Top Salesperson',
    category: 'finansial',
    prompt: 'Siapa salesperson dengan pencapaian omset dan unit penjualan tertinggi saat ini?',
  },
  {
    id: 'omset-laba',
    label: '💰 Omset & Laba Kotor',
    category: 'finansial',
    prompt: 'Berapa total omset faktur dan laba kotor pada periode ini?',
  },
];

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({ overviewData }) => {
  const { filters } = useFilter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'stok' | 'audit' | 'finansial'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = 'exec-drawer-session';

  const loadHistory = async () => {
    try {
      const res = await executiveApi.getAiHistory(sessionId);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setMessages(res.data);
      } else {
        // Welcome message if no past history
        setMessages([
          {
            role: 'assistant',
            message:
              'Halo Bapak/Ibu Direksi! Saya **Zed Executive Intelligence AI**.\n\nSaya telah terhubung langsung dengan **database inventaris realtime, stok fisik cabang, IMEI, serta metrik keuangan Tokopon Zed**.\n\nAnda dapat menanyakan hal strategis (omset, margin, kasir void) maupun operasional toko fisik (stok HP baru/second, sebaran cabang, atau lacak IMEI).',
          },
        ]);
      }
    } catch {
      // Fallback greeting if fetch fails
      setMessages([
        {
          role: 'assistant',
          message:
            'Halo Bapak/Ibu Direksi! Silakan ajukan pertanyaan seputar analisis omset, laba kotor, performa cabang, atau cek stok barang Tokopon Zed.',
        },
      ]);
    }
  };

  // Load chat history when drawer is opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputValue).trim();
    if (!message || isLoading) return;

    // Optimistically append user message
    const userMsg: AiChatMessage = {
      role: 'user',
      message,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Package active dashboard context data
      const contextData = {
        period: overviewData?.kpi?.period || { range: filters.date_range },
        summary: overviewData?.kpi?.summary,
        branches: overviewData?.branches,
        top_products: overviewData?.top_products,
        active_filters: filters,
      };

      const res = await executiveApi.sendAiChat(message, sessionId, contextData);

      if (res.success && res.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            message: res.data.reply,
            created_at: res.data.created_at,
          },
        ]);
      } else {
        throw new Error(res.message || 'Gagal memproses pesan.');
      }
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errMsg =
        errObj.response?.data?.message || errObj.message || 'Terjadi kesalahan pada AI gateway.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          message: `⚠️ **Gagal terhubung:** ${errMsg}\n\n*Catatan: Pastikan NINEROUTER_API_KEY sudah diisi pada file .env backend.*`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (item: QuickPromptItem) => {
    if (item.isTemplate) {
      setInputValue(item.prompt);
      setTimeout(() => {
        inputRef.current?.focus();
        const start = item.prompt.indexOf('[');
        const end = item.prompt.indexOf(']') + 1;
        if (start !== -1 && end > start) {
          inputRef.current?.setSelectionRange(start, end);
        }
      }, 50);
    } else {
      handleSendMessage(item.prompt);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Bersihkan riwayat percakapan sesi ini?')) return;
    try {
      await executiveApi.clearAiHistory(sessionId);
      setMessages([
        {
          role: 'assistant',
          message: 'Riwayat percakapan telah dibersihkan. Silakan ajukan pertanyaan baru!',
        },
      ]);
    } catch {
      alert('Gagal membersihkan riwayat chat.');
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const activePeriodLabel = filters.date_range?.replace('_', ' ').toUpperCase() || 'BULAN INI';
  const activeBranchLabel = filters.branch || 'Semua Cabang';

  const filteredPrompts = activeCategory === 'all'
    ? QUICK_PROMPTS
    : QUICK_PROMPTS.filter((p) => p.category === activeCategory);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`no-print fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-2xl shadow-indigo-600/40 border border-indigo-400/40 transition-all duration-300 hover:scale-105 cursor-pointer group ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
        </div>
        <span className="tracking-wide">AI Eksekutif & Operasional</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
      </button>

      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="no-print fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 lg:hidden transition-opacity"
        />
      )}

      {/* Slide-over Drawer */}
      <div
        className={`no-print fixed top-0 right-0 h-full w-full ${isExpanded ? 'sm:w-[780px] md:w-[860px]' : 'sm:w-[480px]'} max-w-full bg-slate-950/95 transition-all duration-300 border-l border-slate-800/90 backdrop-blur-2xl z-50 flex flex-col shadow-2xl overflow-hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Zed Executive Intelligence AI
                </h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live Sync
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Laporan Strategis & Inventaris Fisik Cabang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Perkecil ukuran drawer" : "Perlebar ukuran drawer"}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClearHistory}
              title="Bersihkan riwayat percakapan"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Context Strip */}
        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Zap className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="truncate">
              Konteks: <strong className="text-slate-200">{activePeriodLabel}</strong> • {activeBranchLabel}
            </span>
          </div>
          <button
            onClick={() => loadHistory()}
            title="Muat ulang chat"
            className="p-1 hover:text-indigo-400 text-slate-500 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`${
                    isUser
                      ? 'max-w-[85%] bg-indigo-600 text-white shadow-md shadow-indigo-600/20 rounded-br-none break-words [overflow-wrap:anywhere]'
                      : 'flex-1 min-w-0 max-w-full bg-slate-900/90 text-slate-200 border border-slate-800/90 rounded-bl-none overflow-hidden'
                  } rounded-2xl p-3.5 relative group`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">{msg.message}</p>
                  ) : (
                    <MarkdownRenderer content={msg.message} />
                  )}

                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.message, idx)}
                      title="Salin jawaban AI"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-opacity cursor-pointer"
                    >
                      {copiedIdx === idx ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none p-3 text-xs text-slate-300 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] text-slate-400">Menganalisis data & inventaris realtime...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompts with Smart Categories */}
        <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-900/60">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Prompt Action Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full min-w-0">
            {filteredPrompts.map((item) => {
              const themeClass =
                item.category === 'stok'
                  ? 'bg-emerald-950/40 hover:bg-emerald-600/90 text-emerald-300 hover:text-white border-emerald-700/40'
                  : item.category === 'audit'
                  ? 'bg-amber-950/40 hover:bg-amber-600/90 text-amber-300 hover:text-white border-amber-700/40'
                  : 'bg-indigo-950/40 hover:bg-indigo-600/90 text-indigo-300 hover:text-white border-indigo-700/40';

              return (
                <button
                  key={item.id}
                  onClick={() => handleChipClick(item)}
                  disabled={isLoading}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium shrink-0 transition-all cursor-pointer disabled:opacity-50 ${themeClass}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Form */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tanyakan stok HP, lacak IMEI, atau analisis omset cabang..."
              disabled={isLoading}
              className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
