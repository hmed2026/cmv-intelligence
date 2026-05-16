import { TransactionType, TransactionSource } from '@prisma/client';
import { prisma } from '../config/database';

export function centsToDecimal(cents: number): number {
  return cents / 100;
}

export function decimalToCents(value: number): number {
  return Math.round(value * 100);
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  category?: string;
  bankAccount?: string;
  search?: string;
  source?: TransactionSource;
}

export interface CreateTransactionData {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  subcategory?: string;
  bankAccount?: string;
  reference?: string;
  notes?: string;
  tags?: string[];
  source?: TransactionSource;
}

export async function getTransactions(companyId: string, filters: TransactionFilters) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    companyId,
    deletedAt: null,
  };

  if (filters.startDate || filters.endDate) {
    where.date = {
      ...(filters.startDate && { gte: new Date(filters.startDate) }),
      ...(filters.endDate && { lte: new Date(filters.endDate + 'T23:59:59') }),
    };
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.category) {
    where.category = { contains: filters.category, mode: 'insensitive' };
  }

  if (filters.bankAccount) {
    where.bankAccount = { contains: filters.bankAccount, mode: 'insensitive' };
  }

  if (filters.source) {
    where.source = filters.source;
  }

  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: 'insensitive' } },
      { category: { contains: filters.search, mode: 'insensitive' } },
      { notes: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
  ]);

  return {
    data: transactions.map((t) => ({
      ...t,
      amount: centsToDecimal(t.amount),
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

export async function getTransaction(id: string, companyId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, companyId, deletedAt: null },
  });

  if (!transaction) {
    throw new Error('TRANSACTION_NOT_FOUND');
  }

  return { ...transaction, amount: centsToDecimal(transaction.amount) };
}

export async function createTransaction(data: CreateTransactionData, companyId: string) {
  const transaction = await prisma.transaction.create({
    data: {
      companyId,
      date: new Date(data.date),
      description: data.description,
      amount: decimalToCents(data.amount),
      type: data.type,
      category: data.category,
      subcategory: data.subcategory,
      bankAccount: data.bankAccount,
      reference: data.reference,
      notes: data.notes,
      tags: data.tags || [],
      source: data.source || 'MANUAL',
      aiClassified: false,
    },
  });

  return { ...transaction, amount: centsToDecimal(transaction.amount) };
}

export async function updateTransaction(
  id: string,
  data: Partial<CreateTransactionData>,
  companyId: string
) {
  const existing = await prisma.transaction.findFirst({
    where: { id, companyId, deletedAt: null },
  });

  if (!existing) {
    throw new Error('TRANSACTION_NOT_FOUND');
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...(data.date && { date: new Date(data.date) }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.amount !== undefined && { amount: decimalToCents(data.amount) }),
      ...(data.type && { type: data.type }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
      ...(data.bankAccount !== undefined && { bankAccount: data.bankAccount }),
      ...(data.reference !== undefined && { reference: data.reference }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.tags !== undefined && { tags: data.tags }),
    },
  });

  return { ...updated, amount: centsToDecimal(updated.amount) };
}

export async function deleteTransaction(id: string, companyId: string) {
  const existing = await prisma.transaction.findFirst({
    where: { id, companyId, deletedAt: null },
  });

  if (!existing) {
    throw new Error('TRANSACTION_NOT_FOUND');
  }

  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export interface BulkTransactionData extends CreateTransactionData {
  aiClassified?: boolean;
  aiConfidence?: number;
  importId?: string;
}

export async function bulkCreate(
  transactions: BulkTransactionData[],
  companyId: string
): Promise<number> {
  const data = transactions.map((t) => ({
    companyId,
    date: new Date(t.date),
    description: t.description,
    amount: decimalToCents(t.amount),
    type: t.type,
    category: t.category,
    subcategory: t.subcategory,
    bankAccount: t.bankAccount,
    reference: t.reference,
    notes: t.notes,
    tags: t.tags || [],
    source: t.source || ('IMPORT' as TransactionSource),
    aiClassified: t.aiClassified || false,
    aiConfidence: t.aiConfidence,
    importId: t.importId,
  }));

  const result = await prisma.transaction.createMany({ data, skipDuplicates: false });
  return result.count;
}

export async function getFinancialSummary(
  companyId: string,
  startDate: string,
  endDate: string
) {
  const transactions = await prisma.transaction.findMany({
    where: {
      companyId,
      deletedAt: null,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59'),
      },
    },
    select: { type: true, amount: true },
  });

  const revenue = transactions.filter((t) => t.type === 'REVENUE').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const cmv = transactions.filter((t) => t.type === 'CMV').reduce((s, t) => s + t.amount, 0);
  const taxes = transactions.filter((t) => t.type === 'TAX').reduce((s, t) => s + t.amount, 0);
  const withdrawals = transactions.filter((t) => t.type === 'WITHDRAWAL').reduce((s, t) => s + t.amount, 0);
  const transfers = transactions.filter((t) => t.type === 'TRANSFER').reduce((s, t) => s + t.amount, 0);
  const grossProfit = revenue - cmv;
  const netProfit = grossProfit - expenses - taxes - withdrawals;
  const cmvPercentage = revenue > 0 ? (cmv / revenue) * 100 : 0;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    revenue: centsToDecimal(revenue),
    expenses: centsToDecimal(expenses),
    cmv: centsToDecimal(cmv),
    taxes: centsToDecimal(taxes),
    withdrawals: centsToDecimal(withdrawals),
    transfers: centsToDecimal(transfers),
    grossProfit: centsToDecimal(grossProfit),
    netProfit: centsToDecimal(netProfit),
    cmvPercentage: Math.round(cmvPercentage * 100) / 100,
    grossMargin: Math.round(grossMargin * 100) / 100,
    netMargin: Math.round(netMargin * 100) / 100,
    transactionCount: transactions.length,
  };
}

export async function getFlowByMonth(companyId: string, year: number) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: {
      companyId,
      deletedAt: null,
      date: { gte: startDate, lte: endDate },
    },
    select: { date: true, type: true, amount: true },
  });

  const monthlyData: Record<number, { month: number; revenue: number; expenses: number; cmv: number; taxes: number; netProfit: number }> = {};

  for (let m = 1; m <= 12; m++) {
    monthlyData[m] = { month: m, revenue: 0, expenses: 0, cmv: 0, taxes: 0, netProfit: 0 };
  }

  for (const tx of transactions) {
    const month = tx.date.getMonth() + 1;
    if (tx.type === 'REVENUE') monthlyData[month].revenue += tx.amount;
    else if (tx.type === 'EXPENSE') monthlyData[month].expenses += tx.amount;
    else if (tx.type === 'CMV') monthlyData[month].cmv += tx.amount;
    else if (tx.type === 'TAX') monthlyData[month].taxes += tx.amount;
  }

  return Object.values(monthlyData).map((m) => ({
    month: m.month,
    revenue: centsToDecimal(m.revenue),
    expenses: centsToDecimal(m.expenses),
    cmv: centsToDecimal(m.cmv),
    taxes: centsToDecimal(m.taxes),
    netProfit: centsToDecimal(m.revenue - m.cmv - m.expenses - m.taxes),
  }));
}

export async function getCategoryBreakdown(
  companyId: string,
  startDate: string,
  endDate: string
) {
  const transactions = await prisma.transaction.findMany({
    where: {
      companyId,
      deletedAt: null,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59'),
      },
    },
    select: { type: true, category: true, amount: true },
  });

  const breakdown: Record<string, { category: string; type: string; total: number; count: number }> = {};

  for (const tx of transactions) {
    const key = `${tx.type}:${tx.category || 'Sem Categoria'}`;
    if (!breakdown[key]) {
      breakdown[key] = {
        category: tx.category || 'Sem Categoria',
        type: tx.type,
        total: 0,
        count: 0,
      };
    }
    breakdown[key].total += tx.amount;
    breakdown[key].count += 1;
  }

  return Object.values(breakdown)
    .map((b) => ({ ...b, total: centsToDecimal(b.total) }))
    .sort((a, b) => b.total - a.total);
}
