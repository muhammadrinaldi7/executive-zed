import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { executiveApi } from '../api/executive';
import { useFilter } from '../context/FilterContext';
import { formatMarkdownForWhatsApp } from '../utils/formatters';
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
  Square,
  MessageSquarePlus,
  Share2,
} from 'lucide-react';

interface AiAssistantDrawerProps {
  overviewData?: DashboardOverviewData | null;
  activeTab?: string;
}

type PromptCategory = 'accurate' | 'stok' | 'audit' | 'finansial';

interface QuickPromptItem {
  id: string;
  label: string;
  category: PromptCategory;
  prompt: string;
  isTemplate?: boolean;
}

const SESSION_STORAGE_KEY = 'exec_ai_active_session_id';

const createFreshSessionId = (): string => `exec-session-${Date.now().toString(36)}`;

const getInitialSessionId = (): string => {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved && saved.trim().length > 4) {
      return saved;
    }
    const fresh = createFreshSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return 'exec-drawer-session';
  }
};

const TAB_LABELS: Record<string, string> = {
  overview: 'Ringkasan Eksekutif',
  financial_accurate: 'Keuangan Accurate',
  inventory_valuation: 'Valuasi Persediaan Accurate',
  staff: 'KPI Staf & Sales',
  brands: 'Performa Brand',
  audit: 'Audit Kasir',
  promos: 'Klaim Promo',
  projects: 'Penjualan Proyek',
};

const CATEGORIES = [
  { id: 'all', label: '✨ Semua' },
  { id: 'accurate', label: '🏦 Accurate Live' },
  { id: 'finansial', label: '📊 Penjualan & KPI' },
  { id: 'stok', label: '📦 Stok & IMEI' },
  { id: 'audit', label: '🚨 Audit & Risiko' },
] as const;

const QUICK_PROMPTS: QuickPromptItem[] = [
  // 🏦 Accurate Online (Single Source of Truth)
  {
    id: 'acc-valuasi',
    label: '🏛️ Valuasi Stok & Gudang Accurate',
    category: 'accurate',
    prompt: 'Berapa total nilai aset modal persediaan dan sebaran stok per gudang Accurate saat ini berdasarkan filter aktif?',
  },
  {
    id: 'acc-kas-bank',
    label: '🏦 Posisi Kas, Bank, AR & AP Accurate',
    category: 'accurate',
    prompt: 'Sajikan posisi saldo Kas & Bank likuid, total Piutang Usaha (AR), Hutang Usaha (AP), serta modal kerja bersih kita dari Accurate Online saat ini.',
  },
  // 📊 Kinerja Penjualan & KPI
  {
    id: 'omset-laba',
    label: '💰 Omset, Margin & Peringkat Cabang',
    category: 'finansial',
    prompt: 'Sajikan analisis omset bersih, laba kotor, margin, dan peringkat kontribusi cabang pada filter & periode aktif saat ini.',
  },
  {
    id: 'top-sales',
    label: '🏆 Top Salesperson',
    category: 'finansial',
    prompt: 'Siapa salesperson dengan pencapaian omset bersih dan unit penjualan tertinggi pada periode dan filter ini?',
  },
  {
    id: 'proyek-brand',
    label: '📱 Evaluasi Brand & Proyek',
    category: 'finansial',
    prompt: 'Bagaimana perbandingan performa penjualan antar Brand dan kategori Proyek (Resmi vs Inter) pada periode ini?',
  },
  // 🚨 Audit & Kontrol Risiko
  {
    id: 'void-kasir',
    label: '🚨 Audit Void & Buyback Kasir',
    category: 'audit',
    prompt: 'Kasir mana yang paling banyak membatalkan nota (void) atau indikasi buyback overpay, di cabang mana, dan berapa total nilainya?',
  },
  {
    id: 'mdr-eval',
    label: '💳 Evaluasi Biaya MDR EDC',
    category: 'audit',
    prompt: 'Metode pembayaran dan mesin EDC bank apa yang memakan potongan biaya MDR paling besar pada periode ini?',
  },
  {
    id: 'piutang-aktif',
    label: '📋 Piutang Toko & Leasing Pending',
    category: 'audit',
    prompt: 'Berapa rincian sisa Piutang Toko vs Piutang Leasing yang masih PENDING belum cair beserta daftar nota menunggak terbesarnya?',
  },
  // 📦 Stok Fisik & IMEI
  {
    id: 'stok-second',
    label: '📦 Rekap Stok HP Second (GSK)',
    category: 'stok',
    prompt: 'Berikan rekapitulasi total unit, nilai modal, dan sebaran stok fisik HP Second di seluruh cabang GSK saat ini beserta SKU teratasnya.',
  },
  {
    id: 'stok-baru',
    label: '🏬 Rekap Stok HP Baru (Syihab)',
    category: 'stok',
    prompt: 'Berikan rekapitulasi ketersediaan stok unit baru iPhone di cabang-cabang Syihab beserta harga jual dan modalnya saat ini.',
  },
  {
    id: 'dead-stock',
    label: '⏳ Peringatan Dead Stock (>30 Hari)',
    category: 'stok',
    prompt: 'Tampilkan daftar peringatan unit yang mengendap lebih dari 30 hari belum terjual (dead stock) beserta lokasi cabang dan nilai modalnya.',
  },
  {
    id: 'imei-track',
    label: '🔍 Lacak Fisik IMEI/SN',
    category: 'stok',
    prompt: 'Lacak status, histori transaksi, dan posisi cabang untuk unit dengan IMEI/SN: [MASUKKAN_IMEI_ATAU_SN]',
    isTemplate: true,
  },
];

const WELCOME_MESSAGE: AiChatMessage = {
  role: 'assistant',
  message:
    'Halo Bapak/Ibu Direksi! Saya **Zed Executive Intelligence AI**.\n\nSeluruh jawaban saya ditarik langsung secara **terverifikasi dari server & Accurate Online** sesuai hak akses serta filter dashboard Anda:\n- **Keuangan & Valuasi Persediaan Accurate** (Kas/Bank, AR, AP, Nilai Modal Gudang)\n- **Kinerja Penjualan, Proyek, Brand & KPI Salesperson**\n- **Audit Void Kasir, Biaya MDR EDC & Piutang Leasing**\n- **Rekap Stok Fisik Cabang, Dead Stock & Pelacakan IMEI/SN**',
};

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({ activeTab = 'overview' }) => {
  const { filters } = useFilter();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>(getInitialSessionId);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState<string>('Menganalisis pertanyaan Direksi...');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedWaIdx, setCopiedWaIdx] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | PromptCategory>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadHistory = async (targetSession = sessionId) => {
    try {
      const res = await executiveApi.getAiHistory(targetSession);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setMessages(res.data);
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
    } catch {
      setMessages([WELCOME_MESSAGE]);
    }
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory(sessionId);
    }
  }, [isOpen]);

  // Automatically highlight the most relevant prompt chip category when Director switches tabs
  useEffect(() => {
    if (activeTab === 'financial_accurate' || activeTab === 'inventory_valuation') {
      setActiveCategory('accurate');
    } else if (activeTab === 'audit') {
      setActiveCategory('audit');
    } else {
      setActiveCategory('all');
    }
  }, [activeTab]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, statusText, isOpen]);

  const handleStopGenerating = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  const handleNewTopic = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    const nextSession = createFreshSessionId();
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, nextSession);
    } catch {
      // Ignore storage quota issues
    }
    setSessionId(nextSession);
    setMessages([
      {
        role: 'assistant',
        message:
          'Topik percakapan baru dimulai dengan konteks bersih sesuai filter aktif Anda saat ini. Silakan ajukan pertanyaan strategis atau operasional baru.',
      },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputValue).trim();
    if (!message || isLoading) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg: AiChatMessage = {
      role: 'user',
      message,
      created_at: new Date().toISOString(),
    };

    // Reserve an assistant streaming message slot
    const streamingMsg: AiChatMessage = {
      role: 'assistant',
      message: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, streamingMsg]);
    setInputValue('');
    setIsLoading(true);
    setStatusText('Memverifikasi filter & konteks data aktif...');

    try {
      const result = await executiveApi.streamAiChat({
        message,
        sessionId,
        activeTab,
        activeFilters: filters,
        signal: controller.signal,
        onStatus: (label) => {
          setStatusText(label);
        },
        onDelta: (deltaChunk) => {
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                message: (updated[lastIdx].message || '') + deltaChunk,
              };
            }
            return updated;
          });
        },
      });

      // Finalize normalized reply from server
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx].role === 'assistant') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            message: result.reply || updated[lastIdx].message,
            created_at: result.created_at || updated[lastIdx].created_at,
          };
        }
        return updated;
      });
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError' || controller.signal.aborted) {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant' && !updated[lastIdx].message.trim()) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              message: '_Permintaan analisis dihentikan oleh pengguna._',
            };
          }
          return updated;
        });
        return;
      }

      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      const safeError =
        errObj.response?.data?.message ||
        errObj.message ||
        'Layanan Asisten Eksekutif sedang sibuk sementara. Silakan coba sesaat lagi.';

      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        const errorBubble: AiChatMessage = {
          role: 'assistant',
          message: `⚠️ **Gangguan Layanan Sementara:** ${safeError}`,
        };
        if (lastIdx >= 0 && updated[lastIdx].role === 'assistant' && !updated[lastIdx].message.trim()) {
          updated[lastIdx] = errorBubble;
          return updated;
        }
        return [...updated, errorBubble];
      });
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
    if (!window.confirm('Bersihkan riwayat percakapan pada topik sesi ini?')) return;
    try {
      await executiveApi.clearAiHistory(sessionId);
      setMessages([
        {
          role: 'assistant',
          message: 'Riwayat percakapan topik ini telah dibersihkan. Silakan ajukan pertanyaan baru.',
        },
      ]);
    } catch {
      alert('Gagal membersihkan riwayat percakapan.');
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyWhatsApp = (text: string, idx: number) => {
    const waFormatted = `*ZED EXECUTIVE AI REPORT* 📊\n\n${formatMarkdownForWhatsApp(text)}\n\n_Zed Executive Intelligence Suite_`;
    navigator.clipboard.writeText(waFormatted);
    setCopiedWaIdx(idx);
    setTimeout(() => setCopiedWaIdx(null), 2200);
  };

  const contextSummaryLabel = useMemo(() => {
    const tabName = TAB_LABELS[activeTab] || 'Ringkasan Eksekutif';
    const periodLabel =
      filters.date_range === 'custom' && filters.start_date && filters.end_date
        ? `${filters.start_date}..${filters.end_date}`
        : filters.date_range?.replace(/_/g, ' ').toUpperCase() || 'BULAN INI';

    const extras: string[] = [];
    if (filters.branch) {
      const b = Array.isArray(filters.branch) ? filters.branch.join(', ') : filters.branch;
      if (b) extras.push(b);
    }
    if (filters.category) {
      const c = Array.isArray(filters.category) ? filters.category.join(', ') : filters.category;
      if (c) extras.push(`Kat: ${c}`);
    }
    if (filters.project) {
      const p = Array.isArray(filters.project) ? filters.project.join(', ') : filters.project;
      if (p) extras.push(`Proyek: ${p}`);
    }

    return {
      tabName,
      periodLabel,
      filterSuffix: extras.length > 0 ? extras.join(' • ') : 'Semua Cabang & Kategori',
    };
  }, [activeTab, filters]);

  const filteredPrompts =
    activeCategory === 'all'
      ? QUICK_PROMPTS
      : QUICK_PROMPTS.filter((p) => p.category === activeCategory);

  const lastMessage = messages[messages.length - 1];
  const showStandaloneStatusBubble =
    isLoading && (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.message);

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
        <span className="tracking-wide">AI Eksekutif & Accurate</span>
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
        className={`no-print fixed top-0 right-0 h-full w-full ${
          isExpanded ? 'sm:w-[780px] md:w-[880px]' : 'sm:w-[490px]'
        } max-w-full bg-slate-950/95 transition-all duration-300 border-l border-slate-800/90 backdrop-blur-2xl z-50 flex flex-col shadow-2xl overflow-hidden ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight truncate">
                  Zed Executive Intelligence AI
                </h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 uppercase shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Verified Sync
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Terhubung ke POS, Gudang Cabang & Accurate Online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleNewTopic}
              title="Mulai Topik Baru (Sesi Bersih)"
              className="px-2 py-1.5 rounded-lg text-[10px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-600/80 border border-indigo-500/30 transition-colors cursor-pointer flex items-center gap-1"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Topik Baru</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Perkecil ukuran drawer' : 'Perlebar ukuran drawer'}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClearHistory}
              title="Bersihkan riwayat topik ini"
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
        <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800/60 flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <Zap className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="truncate">
              <strong className="text-indigo-300">{contextSummaryLabel.tabName}</strong> •{' '}
              <strong className="text-slate-200">{contextSummaryLabel.periodLabel}</strong> •{' '}
              {contextSummaryLabel.filterSuffix}
            </span>
          </div>
          <button
            onClick={() => loadHistory(sessionId)}
            title="Muat ulang percakapan"
            className="p-1 hover:text-indigo-400 text-slate-500 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            if (!isUser && !msg.message && isLoading && idx === messages.length - 1) {
              return null;
            }

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
                      : 'flex-1 min-w-0 max-w-full bg-slate-900/90 text-slate-200 border border-slate-800/90 rounded-bl-none overflow-hidden pb-8'
                  } rounded-2xl p-3.5 relative group`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">
                      {msg.message}
                    </p>
                  ) : (
                    <MarkdownRenderer content={msg.message} />
                  )}

                  {!isUser && msg.message && (
                    <div className="absolute bottom-1.5 right-2 flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopyWhatsApp(msg.message, idx)}
                        title="Salin format rapi untuk WhatsApp Direksi"
                        className="px-1.5 py-0.5 rounded bg-slate-800/90 hover:bg-emerald-600/80 text-[10px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedWaIdx === idx ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            <span>WA Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span>WA</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(msg.message, idx)}
                        title="Salin teks asli"
                        className="p-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedIdx === idx ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Live Tool / Streaming Status Indicator */}
          {showStandaloneStatusBubble && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl rounded-bl-none p-3 text-xs text-slate-300 flex items-center gap-2.5 shadow-sm">
                <div className="flex gap-1 shrink-0">
                  <span
                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-[11px] text-indigo-200 font-medium">{statusText}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompts with Smart Categories */}
        <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
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

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full min-w-0">
            {filteredPrompts.map((item) => {
              const themeClass =
                item.category === 'accurate'
                  ? 'bg-cyan-950/50 hover:bg-cyan-600/90 text-cyan-300 hover:text-white border-cyan-700/40'
                  : item.category === 'stok'
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

        {/* Input Form + Stop Button */}
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
              placeholder="Tanya Kas/Bank & Valuasi Accurate, omset, void kasir, atau lacak IMEI..."
              disabled={isLoading}
              className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
            />
            {isLoading ? (
              <button
                type="button"
                onClick={handleStopGenerating}
                title="Hentikan respons AI"
                className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-semibold"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  );
};
