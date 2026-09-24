import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const normalizeMarkdown = (text: string): string => {
  if (!text) return '';

  const rawLines = text.split('\n');
  const processedLines: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      processedLines.push(line);
      continue;
    }

    if (inCodeBlock) {
      processedLines.push(line);
      continue;
    }

    // Step 1: Clean up multi-pipe artifacts at the very beginning of lines (e.g. "|| iPhone 17" -> "| iPhone 17")
    line = line.replace(/^\|{2,}\s*/g, '| ');

    // Step 2: Convert collapsed row separators into proper line breaks
    // When LLM glues rows together like: "... | | | iPhone 15 ..." or "... ||| iPhone 15 ..."
    line = line.replace(/\|\s*\|\s*\|\s*/g, '|\n| ');
    line = line.replace(/\|\s*\|\s*([0-9A-Za-z#\-\:\*\—\–\w])/g, '|\n| $1');
    line = line.replace(/\|{2,}\s*/g, '|\n| ');

    // If multiple lines were created by Step 2, split and handle each
    const subLines = line.split('\n');
    for (const sub of subLines) {
      let subTrimmed = sub.trim();
      // If line has pipes and looks like a table row (not a quote or heading)
      if (subTrimmed.includes('|') && !subTrimmed.startsWith('>') && !subTrimmed.startsWith('#')) {
        if (!subTrimmed.startsWith('|')) {
          subTrimmed = '| ' + subTrimmed;
        }
        if (!subTrimmed.endsWith('|')) {
          subTrimmed = subTrimmed + ' |';
        }
      }
      processedLines.push(subTrimmed);
    }
  }

  // Step 3: Ensure blank line before table start, and NO blank lines inside table
  const finalLines: string[] = [];
  let inTable = false;
  inCodeBlock = false;

  for (let i = 0; i < processedLines.length; i++) {
    const line = processedLines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      finalLines.push(line);
      continue;
    }

    if (inCodeBlock) {
      finalLines.push(line);
      continue;
    }

    const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2;

    if (isTableRow) {
      if (!inTable) {
        // Table starting: ensure previous line is blank if preceded by non-empty text
        if (finalLines.length > 0 && finalLines[finalLines.length - 1] !== '') {
          finalLines.push('');
        }
        inTable = true;
      }
      finalLines.push(trimmed);
    } else {
      if (inTable && trimmed === '') {
        // Lookahead: check if next non-empty line is a table row
        let nextIsTable = false;
        for (let j = i + 1; j < processedLines.length; j++) {
          const nextTrimmed = processedLines[j].trim();
          if (nextTrimmed === '') continue;
          if (nextTrimmed.startsWith('|') && nextTrimmed.endsWith('|')) {
            nextIsTable = true;
          }
          break;
        }
        if (nextIsTable) {
          // Skip empty line between table rows
          continue;
        }
        inTable = false;
      } else if (inTable) {
        inTable = false;
      }
      finalLines.push(line);
    }
  }

  return finalLines.join('\n');
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const normalized = normalizeMarkdown(content);

  return (
    <div className={`text-xs text-slate-200 leading-relaxed overflow-hidden break-words [overflow-wrap:anywhere] max-w-full ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="my-3 w-full max-w-full overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950/90 shadow-lg scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <table className="w-full border-collapse text-[11px] text-slate-300 min-w-[280px]">
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
            <th className="px-2.5 py-2 text-left font-semibold text-slate-200 border-r border-slate-800 last:border-r-0 whitespace-normal min-w-[70px] leading-tight">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2.5 py-2 border-r border-slate-800/50 last:border-r-0 text-slate-300 tabular-nums whitespace-normal break-words leading-snug">
              {children}
            </td>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 leading-relaxed text-slate-200 last:mb-0 break-words [overflow-wrap:anywhere]">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 space-y-1 my-2 text-slate-200 break-words [overflow-wrap:anywhere]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 space-y-1 my-2 text-slate-200 break-words [overflow-wrap:anywhere]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed break-words [overflow-wrap:anywhere]">
              {children}
            </li>
          ),
          h1: ({ children }) => (
            <h1 className="text-sm font-bold text-white mt-3.5 mb-1.5 pb-1 border-b border-slate-800 break-words [overflow-wrap:anywhere]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-bold text-white mt-3 mb-1 break-words [overflow-wrap:anywhere]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-indigo-300 mt-2.5 mb-1 break-words [overflow-wrap:anywhere]">
              {children}
            </h3>
          ),
          pre: ({ children }) => (
            <div className="my-2.5 w-full max-w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-2.5 shadow-inner">
              <pre className="text-[11px] font-mono text-indigo-300 whitespace-pre overflow-x-auto">
                {children}
              </pre>
            </div>
          ),
          code: ({ children, ...props }) => (
            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px] break-all inline-block max-w-full overflow-x-auto align-middle" {...props}>
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
