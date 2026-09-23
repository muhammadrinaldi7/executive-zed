import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const normalizeMarkdown = (text: string): string => {
  if (!text) return '';
  // 1. Ensure table starts on its own paragraph (requires blank line before the table)
  let formatted = text.replace(/([^\n])\n(\|[^\n]+\|)/g, '$1\n\n$2');
  // 2. If newlines were collapsed into spaces between table rows (e.g. "| ... | | ... |"), restore newlines
  formatted = formatted.replace(/\|\s*\|\s*([0-9A-Za-z#\-\:\*])/g, '|\n| $1');
  return formatted;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const normalized = normalizeMarkdown(content);

  return (
    <div className={`text-xs text-slate-200 leading-relaxed overflow-hidden ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="my-3 w-full overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950/90 shadow-lg">
              <table className="w-full border-collapse text-[11px] text-slate-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-900/95 text-slate-200 border-b border-slate-700/80 text-[10px] uppercase font-bold tracking-wider">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-800/70">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-800/40 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold whitespace-nowrap text-slate-200 border-r border-slate-800 last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-1.5 whitespace-nowrap border-r border-slate-800/50 last:border-r-0 text-slate-300 tabular-nums">
              {children}
            </td>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 leading-relaxed text-slate-200 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 space-y-1 my-2 text-slate-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 space-y-1 my-2 text-slate-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          h1: ({ children }) => (
            <h1 className="text-sm font-bold text-white mt-3.5 mb-1.5 pb-1 border-b border-slate-800">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-bold text-white mt-3 mb-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-indigo-300 mt-2.5 mb-1">
              {children}
            </h3>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px]">
              {children}
            </code>
          ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
};
