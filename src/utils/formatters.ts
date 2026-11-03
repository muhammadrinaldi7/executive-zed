/**
 * Format numbers as Indonesian Rupiah (IDR).
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return 'Rp 0';

  const isNegative = num < 0;
  const absVal = Math.abs(num);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absVal);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format large numbers into compact notation (e.g. 1.2M, 500K).
 */
export function formatCompact(value: number | undefined | null): string {
  const num = value ?? 0;
  if (Math.abs(num) >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  }
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toFixed(0) + 'K';
  }
  return num.toString();
}

/**
 * Format percentages with + / - sign.
 */
export function formatPercent(value: number | undefined | null, decimals = 1): string {
  const num = value ?? 0;
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(decimals)}%`;
}

/**
 * Format dates into friendly Indonesian strings.
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format standard number with thousand separators.
 */
export function formatNumber(value: number | undefined | null): string {
  const num = value ?? 0;
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Convert GitHub-Flavored Markdown (including pipe tables & headings) into clean mobile WhatsApp formatting.
 */
export function formatMarkdownForWhatsApp(markdown: string): string {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  const output: string[] = [];
  let tableHeaders: string[] = [];
  let inTable = false;

  const parsePipeCells = (row: string): string[] =>
    row
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.replace(/\*\*/g, '').trim());

  const isSeparatorRow = (cells: string[]): boolean =>
    cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      const cells = parsePipeCells(trimmed);
      if (isSeparatorRow(cells)) {
        inTable = true;
        continue;
      }

      if (!inTable && tableHeaders.length === 0) {
        tableHeaders = cells;
        inTable = true;
        continue;
      }

      if (cells.length > 0) {
        const primary = cells[1] && /^\d+$/.test(cells[0]) ? `${cells[0]}. *${cells[1]}*` : `*${cells[0]}*`;
        const startIdx = cells[1] && /^\d+$/.test(cells[0]) ? 2 : 1;
        const details: string[] = [];

        for (let c = startIdx; c < cells.length; c++) {
          if (!cells[c]) continue;
          const colLabel = tableHeaders[c] ? `${tableHeaders[c]}: ` : '';
          details.push(`${colLabel}${cells[c]}`);
        }

        output.push(`• ${primary}${details.length > 0 ? ' — ' + details.join(' | ') : ''}`);
      }
      continue;
    }

    if (inTable) {
      inTable = false;
      tableHeaders = [];
    }

    // Convert Markdown headings (### Title) -> WhatsApp bold (*Title*)
    if (/^#{1,4}\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^#{1,4}\s+/, '').replace(/\*\*/g, '').trim();
      output.push(`\n*${headingText}*`);
      continue;
    }

    // Convert Markdown **bold** -> WhatsApp *bold* and list dashes -> bullets
    let formattedLine = rawLine
      .replace(/\*\*([^*]+)\*\*/g, '*$1*')
      .replace(/^\s*[-*]\s+/, '• ')
      .replace(/`([^`]+)`/g, '$1');

    output.push(formattedLine);
  }

  return output
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
