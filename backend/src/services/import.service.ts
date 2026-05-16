import { ImportStatus, TransactionType } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import {
  parseCSV,
  parseXLSX,
  parsePDF,
  parseTXT,
  detectColumns,
  normalizeRows,
  detectTransactionType,
} from './parser.service';
import { parseDocument, classifyBatch } from './ai.service';
import { bulkCreate } from './transaction.service';

export async function createImport(
  companyId: string,
  fileName: string,
  fileType: string
) {
  return prisma.importHistory.create({
    data: {
      companyId,
      fileName,
      fileType,
      status: ImportStatus.PROCESSING,
      totalRows: 0,
      processedRows: 0,
    },
  });
}

export async function processFile(
  importId: string,
  buffer: Buffer,
  fileType: string,
  companyId: string
): Promise<void> {
  try {
    await prisma.importHistory.update({
      where: { id: importId },
      data: { status: ImportStatus.PROCESSING },
    });

    let rawRows: Array<{ date?: string; description?: string; amount?: number; type?: string; raw?: Record<string, string> }> = [];

    const ext = fileType.toLowerCase();

    if (ext === 'csv' || ext === 'text/csv') {
      const parsed = parseCSV(buffer);
      const mapping = detectColumns(parsed);
      rawRows = normalizeRows(parsed, mapping);
    } else if (ext === 'xlsx' || ext === 'xls') {
      const parsed = parseXLSX(buffer);
      const mapping = detectColumns(parsed);
      rawRows = normalizeRows(parsed, mapping);
    } else if (ext === 'pdf' || ext === 'application/pdf') {
      const text = await parsePDF(buffer);
      // Use AI to parse PDF text
      const aiParsed = await parseDocument(text, 'PDF extrato bancário');
      rawRows = aiParsed.map((t) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
      }));
    } else if (ext === 'txt' || ext === 'text/plain') {
      const parsed = parseTXT(buffer);
      const mapping = detectColumns(parsed);
      rawRows = normalizeRows(parsed, mapping);

      if (rawRows.length === 0) {
        // Try AI parsing for plain text
        const text = buffer.toString('utf-8');
        const aiParsed = await parseDocument(text, 'arquivo texto com transações financeiras');
        rawRows = aiParsed.map((t) => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
        }));
      }
    }

    await prisma.importHistory.update({
      where: { id: importId },
      data: { totalRows: rawRows.length },
    });

    if (rawRows.length === 0) {
      await prisma.importHistory.update({
        where: { id: importId },
        data: {
          status: ImportStatus.FAILED,
          completedAt: new Date(),
          errors: { message: 'Nenhuma transação encontrada no arquivo' },
        },
      });
      return;
    }

    // Step 1: Rule-based classification
    const ruleClassified = rawRows.map((row) => {
      const description = row.description || '';
      const amount = row.amount || 0;
      let type: TransactionType;

      if (row.type && isValidType(row.type)) {
        type = row.type as TransactionType;
      } else {
        type = detectTransactionType(description, amount);
      }

      return {
        date: row.date || new Date().toISOString().split('T')[0],
        description,
        amount,
        type,
        confidence: 0.7,
        needsAI: false,
      };
    });

    // Step 2: AI classification for uncertain items (confidence < 0.8)
    const uncertainRows = ruleClassified
      .map((row, idx) => ({ ...row, idx }))
      .filter((r) => r.needsAI || r.description.length < 5);

    if (uncertainRows.length > 0) {
      const aiResults = await classifyBatch(
        uncertainRows.map((r) => ({
          description: r.description,
          amount: Math.round(r.amount * 100),
          id: String(r.idx),
        }))
      );

      for (const aiResult of aiResults) {
        if (aiResult.id !== undefined) {
          const idx = parseInt(aiResult.id);
          if (!isNaN(idx) && ruleClassified[idx]) {
            ruleClassified[idx].type = aiResult.type as TransactionType;
            ruleClassified[idx].confidence = aiResult.confidence;
          }
        }
      }
    }

    // Step 3: Bulk insert
    const transactionsToInsert = ruleClassified
      .filter((row) => row.amount > 0 && row.description && row.date)
      .map((row) => ({
        date: row.date,
        description: row.description,
        amount: row.amount,
        type: row.type as TransactionType,
        source: 'IMPORT' as const,
        aiClassified: row.confidence < 0.8,
        aiConfidence: row.confidence,
        importId,
      }));

    const inserted = await bulkCreate(transactionsToInsert, companyId);

    await prisma.importHistory.update({
      where: { id: importId },
      data: {
        status: ImportStatus.COMPLETED,
        processedRows: inserted,
        completedAt: new Date(),
      },
    });

    logger.info(`Import ${importId} completed: ${inserted}/${rawRows.length} transactions`);
  } catch (error) {
    logger.error(`Import ${importId} failed:`, error);
    await prisma.importHistory.update({
      where: { id: importId },
      data: {
        status: ImportStatus.FAILED,
        completedAt: new Date(),
        errors: { message: error instanceof Error ? error.message : 'Erro desconhecido' },
      },
    });
  }
}

function isValidType(type: string): boolean {
  return ['REVENUE', 'EXPENSE', 'TAX', 'WITHDRAWAL', 'TRANSFER', 'CMV'].includes(type.toUpperCase());
}

export async function getImportHistory(companyId: string) {
  const imports = await prisma.importHistory.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      fileName: true,
      fileType: true,
      status: true,
      totalRows: true,
      processedRows: true,
      errors: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return imports;
}

export async function getImportById(id: string, companyId: string) {
  const imp = await prisma.importHistory.findFirst({
    where: { id, companyId },
    include: {
      transactions: {
        where: { deletedAt: null },
        orderBy: { date: 'desc' },
        take: 100,
        select: {
          id: true,
          date: true,
          description: true,
          amount: true,
          type: true,
          category: true,
          aiClassified: true,
          aiConfidence: true,
        },
      },
    },
  });

  if (!imp) {
    throw new Error('IMPORT_NOT_FOUND');
  }

  return {
    ...imp,
    transactions: imp.transactions.map((t) => ({
      ...t,
      amount: t.amount / 100,
    })),
  };
}
