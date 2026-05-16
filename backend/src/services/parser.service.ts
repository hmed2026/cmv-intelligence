import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';
import { TransactionType } from '@prisma/client';
import { logger } from '../config/logger';

export interface ParsedRow {
  date?: string;
  description?: string;
  amount?: number;
  type?: string;
  raw?: Record<string, string>;
}

export interface ColumnMapping {
  dateCol: string | null;
  descriptionCol: string | null;
  amountCol: string | null;
  creditCol: string | null;
  debitCol: string | null;
  typeCol: string | null;
}

export function normalizeAmount(raw: string | number | undefined | null): number {
  if (raw === null || raw === undefined || raw === '') return 0;

  if (typeof raw === 'number') return Math.abs(raw);

  let str = String(raw).trim();

  // Remove currency symbols and spaces
  str = str.replace(/R\$\s*/g, '').replace(/\s/g, '');

  // Handle negative values
  const isNegative = str.startsWith('-') || str.startsWith('(');
  str = str.replace(/[()]/g, '').replace(/^-/, '');

  // Handle Brazilian number format: 1.234,56 → 1234.56
  if (str.includes(',') && str.includes('.')) {
    // Check which comes last to determine format
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Brazilian format: 1.234,56
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Could be decimal comma: 1234,56
    const commaIdx = str.lastIndexOf(',');
    const afterComma = str.substring(commaIdx + 1);
    if (afterComma.length <= 2) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  }

  const value = parseFloat(str);
  if (isNaN(value)) return 0;

  return Math.abs(value);
}

export function normalizeDate(raw: string | Date | undefined | null): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;

  const str = String(raw).trim();

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const year = y.length === 2 ? parseInt(y) + 2000 : parseInt(y);
    const date = new Date(year, parseInt(m) - 1, parseInt(d));
    return isNaN(date.getTime()) ? null : date;
  }

  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const date = new Date(str.substring(0, 10));
    return isNaN(date.getTime()) ? null : date;
  }

  // DD/MM/YY
  const shortMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (shortMatch) {
    const [, d, m, y] = shortMatch;
    const year = parseInt(y) + 2000;
    const date = new Date(year, parseInt(m) - 1, parseInt(d));
    return isNaN(date.getTime()) ? null : date;
  }

  // Try native Date parse as last resort
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function detectTransactionType(description: string, amount: number): TransactionType {
  const desc = (description || '').toLowerCase();

  // Tax indicators
  if (/\b(das|simples|icms|pis|cofins|iss|irpj|csll|inss|fgts|darf|gps|gru|sefaz|receita federal)\b/.test(desc)) {
    return TransactionType.TAX;
  }

  // Withdrawal indicators
  if (/\b(pró-labore|pro-labore|prolabore|distribuição de lucros|lucros e dividendos|retirada (de )?sócio)\b/.test(desc)) {
    return TransactionType.WITHDRAWAL;
  }

  // Transfer indicators
  if (/\b(transferência|transferencia|ted|doc|tev)\b/.test(desc) && !(/\b(recebimento|pagamento)\b/.test(desc))) {
    return TransactionType.TRANSFER;
  }

  // CMV indicators (cost of goods)
  if (/\b(compra (de )?(estoque|mercadoria|produto|insumo|matéria[-\s]prima)|fornecedor|nota fiscal compra|nf compra)\b/.test(desc)) {
    return TransactionType.CMV;
  }

  // Revenue indicators
  if (/\b(venda|recebimento|receita|faturamento|pix recebido|depósito|deposito|crédito|credito|maquininha|stone|cielo|rede|getnet|pagseguro|mercado pago|paypal|stripe)\b/.test(desc)) {
    return TransactionType.REVENUE;
  }

  // Expense indicators
  if (/\b(pagamento|débito|debito|despesa|pix enviado|boleto pago|mensalidade|assinatura|aluguel|energia|água|internet|telefone|salário|salario|fornecedor)\b/.test(desc)) {
    return TransactionType.EXPENSE;
  }

  // Fallback based on amount sign convention (positive = revenue, negative handled elsewhere)
  return TransactionType.EXPENSE;
}

export function parseCSV(buffer: Buffer): ParsedRow[] {
  try {
    const text = buffer.toString('utf-8');
    const rows = csvParse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    }) as Record<string, string>[];

    return rows.map((row) => ({ raw: row }));
  } catch (error) {
    // Try with semicolon delimiter
    try {
      const text = buffer.toString('utf-8');
      const rows = csvParse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ';',
        relax_column_count: true,
        bom: true,
      }) as Record<string, string>[];

      return rows.map((row) => ({ raw: row }));
    } catch (err2) {
      logger.error('CSV parse error:', err2);
      return [];
    }
  }
}

export function parseXLSX(buffer: Buffer): ParsedRow[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false,
    });

    return rows.map((row) => {
      const strRow: Record<string, string> = {};
      for (const [key, val] of Object.entries(row)) {
        strRow[key] = val !== null && val !== undefined ? String(val) : '';
      }
      return { raw: strRow };
    });
  } catch (error) {
    logger.error('XLSX parse error:', error);
    return [];
  }
}

export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    logger.error('PDF parse error:', error);
    return '';
  }
}

export function parseTXT(buffer: Buffer): ParsedRow[] {
  try {
    const text = buffer.toString('utf-8');
    const lines = text.split('\n').filter((l) => l.trim().length > 0);

    // Try to detect if it's a fixed-width or delimited file
    const hasTabs = lines.some((l) => l.includes('\t'));
    const hasSemicolon = lines.some((l) => l.includes(';'));
    const hasComma = lines.some((l) => l.includes(','));

    let delimiter = ',';
    if (hasTabs) delimiter = '\t';
    else if (hasSemicolon) delimiter = ';';

    if (hasComma || hasTabs || hasSemicolon) {
      try {
        const rows = csvParse(text, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          delimiter,
          bom: true,
        }) as Record<string, string>[];
        return rows.map((row) => ({ raw: row }));
      } catch {
        // fall through to line-based parsing
      }
    }

    // Return lines as raw text for AI parsing
    return lines.map((line) => ({ raw: { line }, description: line }));
  } catch (error) {
    logger.error('TXT parse error:', error);
    return [];
  }
}

export function detectColumns(rows: ParsedRow[]): ColumnMapping {
  if (rows.length === 0 || !rows[0].raw) {
    return { dateCol: null, descriptionCol: null, amountCol: null, creditCol: null, debitCol: null, typeCol: null };
  }

  const columns = Object.keys(rows[0].raw);
  const colLower = columns.map((c) => c.toLowerCase().trim());

  const findCol = (patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      const idx = colLower.findIndex((c) => pattern.test(c));
      if (idx >= 0) return columns[idx];
    }
    return null;
  };

  return {
    dateCol: findCol([/^data$/, /^dt$/, /date/, /data\s*(lançamento|transação|movimento)/]),
    descriptionCol: findCol([/^descrição$/, /^descricao$/, /^historico$/, /^histórico$/, /^memo$/, /^lançamento$/, /description/, /memo/]),
    amountCol: findCol([/^valor$/, /^value$/, /^amount$/, /valor\s*(r\$)?$/]),
    creditCol: findCol([/^crédito$/, /^credito$/, /^entrada$/, /credit/, /entrada/]),
    debitCol: findCol([/^débito$/, /^debito$/, /^saída$/, /debit/, /saida/]),
    typeCol: findCol([/^tipo$/, /^type$/, /tipo\s*(transação|operação)/]),
  };
}

export function normalizeRows(rows: ParsedRow[], mapping: ColumnMapping): ParsedRow[] {
  return rows
    .map((row) => {
      if (!row.raw) return row;

      const raw = row.raw;
      let date: string | undefined;
      let description: string | undefined;
      let amount: number | undefined;
      let type: string | undefined;

      if (mapping.dateCol && raw[mapping.dateCol]) {
        const d = normalizeDate(raw[mapping.dateCol]);
        if (d) date = d.toISOString().split('T')[0];
      }

      if (mapping.descriptionCol && raw[mapping.descriptionCol]) {
        description = raw[mapping.descriptionCol];
      }

      if (mapping.amountCol && raw[mapping.amountCol]) {
        amount = normalizeAmount(raw[mapping.amountCol]);
      } else if (mapping.creditCol && mapping.debitCol) {
        const credit = normalizeAmount(raw[mapping.creditCol] || '');
        const debit = normalizeAmount(raw[mapping.debitCol] || '');
        if (credit > 0) {
          amount = credit;
          type = 'REVENUE';
        } else if (debit > 0) {
          amount = debit;
          type = 'EXPENSE';
        }
      }

      if (!type && mapping.typeCol && raw[mapping.typeCol]) {
        type = raw[mapping.typeCol];
      }

      return { date, description, amount, type, raw };
    })
    .filter((row) => row.amount && row.amount > 0 && row.description && row.date);
}
