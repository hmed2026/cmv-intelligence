import { prisma } from '../config/database';
import { logger } from '../config/logger';

function centsToDecimal(cents: number): number {
  return cents / 100;
}

function formatCurrency(value: number): string {
  return (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface DREReport {
  period: string;
  grossRevenue: number;
  deductions: number;
  netRevenue: number;
  cmv: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  operatingProfit: number;
  taxes: number;
  netProfit: number;
  netMargin: number;
  // Extended detail
  expensesByCategory: Record<string, number>;
  withdrawals: number;
}

export async function getDRE(companyId: string, month: number, year: number): Promise<DREReport> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: { companyId, deletedAt: null, date: { gte: startDate, lte: endDate } },
    select: { type: true, amount: true, category: true },
  });

  const sum = (type: string) =>
    transactions.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

  const grossRevenueCents = sum('REVENUE');
  const cmvCents = sum('CMV');
  const taxesCents = sum('TAX');
  const withdrawalsCents = sum('WITHDRAWAL');

  const expensesByCategory: Record<string, number> = {};
  for (const t of transactions.filter((t) => t.type === 'EXPENSE')) {
    const cat = t.category || 'Outras Despesas';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount;
  }
  const operatingExpensesCents = Object.values(expensesByCategory).reduce((s, v) => s + v, 0);

  // Standard Brazilian DRE structure
  const deductionsCents = 0; // devoluções/cancelamentos — atualize se necessário
  const netRevenueCents = grossRevenueCents - deductionsCents;
  const grossProfitCents = netRevenueCents - cmvCents;
  const operatingProfitCents = grossProfitCents - operatingExpensesCents;
  const netProfitCents = operatingProfitCents - taxesCents - withdrawalsCents;

  const d = centsToDecimal;
  const pct = (num: number, base: number) =>
    base > 0 ? Math.round((num / base) * 10000) / 100 : 0;

  const expensesDecimal: Record<string, number> = {};
  for (const [k, v] of Object.entries(expensesByCategory)) {
    expensesDecimal[k] = d(v);
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  return {
    period: `${monthNames[month - 1]} ${year}`,
    grossRevenue: d(grossRevenueCents),
    deductions: d(deductionsCents),
    netRevenue: d(netRevenueCents),
    cmv: d(cmvCents),
    grossProfit: d(grossProfitCents),
    grossMargin: pct(grossProfitCents, netRevenueCents),
    operatingExpenses: d(operatingExpensesCents),
    operatingProfit: d(operatingProfitCents),
    taxes: d(taxesCents),
    netProfit: d(netProfitCents),
    netMargin: pct(netProfitCents, netRevenueCents),
    expensesByCategory: expensesDecimal,
    withdrawals: d(withdrawalsCents),
  };
}

export interface CMVReport {
  period: string;
  totalRevenue: number;
  totalCMV: number;
  cmvPercentage: number;
  grossProfit: number;
  grossMargin: number;
  itemsByCMVCategory: Array<{ category: string; amount: number; percentage: number }>;
  monthlyTrend: Array<{ month: string; revenue: number; cmv: number; percentage: number }>;
}

export async function getCMVReport(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<CMVReport> {
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59');

  const transactions = await prisma.transaction.findMany({
    where: {
      companyId,
      deletedAt: null,
      date: { gte: start, lte: end },
      type: { in: ['REVENUE', 'CMV'] },
    },
    select: { type: true, amount: true, category: true, date: true },
  });

  const revenue = transactions.filter((t) => t.type === 'REVENUE').reduce((s, t) => s + t.amount, 0);
  const cmv = transactions.filter((t) => t.type === 'CMV').reduce((s, t) => s + t.amount, 0);
  const grossProfit = revenue - cmv;

  // CMV by category
  const cmvByCategory: Record<string, number> = {};
  for (const t of transactions.filter((t) => t.type === 'CMV')) {
    const cat = t.category || 'Sem Categoria';
    cmvByCategory[cat] = (cmvByCategory[cat] || 0) + t.amount;
  }

  const itemsByCMVCategory = Object.entries(cmvByCategory)
    .map(([category, amount]) => ({
      category,
      amount: centsToDecimal(amount),
      percentage: cmv > 0 ? Math.round((amount / cmv) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Monthly trend
  const monthlyData: Record<string, { revenue: number; cmv: number }> = {};
  for (const t of transactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, cmv: 0 };
    if (t.type === 'REVENUE') monthlyData[key].revenue += t.amount;
    else if (t.type === 'CMV') monthlyData[key].cmv += t.amount;
  }

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthlyTrend = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => {
      const [y, m] = key.split('-');
      return {
        month: `${monthNames[parseInt(m) - 1]}/${y}`,
        revenue: centsToDecimal(data.revenue),
        cmv: centsToDecimal(data.cmv),
        percentage: data.revenue > 0 ? Math.round((data.cmv / data.revenue) * 10000) / 100 : 0,
      };
    });

  return {
    period: `${startDate} a ${endDate}`,
    totalRevenue: centsToDecimal(revenue),
    totalCMV: centsToDecimal(cmv),
    cmvPercentage: revenue > 0 ? Math.round((cmv / revenue) * 10000) / 100 : 0,
    grossProfit: centsToDecimal(grossProfit),
    grossMargin: revenue > 0 ? Math.round((grossProfit / revenue) * 10000) / 100 : 0,
    itemsByCMVCategory,
    monthlyTrend,
  };
}

export interface FluxoCaixaItem {
  date: string;
  description: string;
  type: string;
  amount: number;
  balance: number;
}

export async function getFluxoCaixa(
  companyId: string,
  startDate: string,
  endDate: string
) {
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59');

  const transactions = await prisma.transaction.findMany({
    where: {
      companyId,
      deletedAt: null,
      date: { gte: start, lte: end },
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      date: true,
      description: true,
      type: true,
      amount: true,
      category: true,
    },
  });

  let balance = 0;
  const items: FluxoCaixaItem[] = transactions.map((t) => {
    const isInflow = ['REVENUE'].includes(t.type);
    const delta = isInflow ? t.amount : -t.amount;
    balance += delta;

    return {
      date: t.date.toISOString().split('T')[0],
      description: t.description,
      type: t.type,
      amount: centsToDecimal(Math.abs(t.amount)),
      balance: centsToDecimal(balance),
    };
  });

  const inflows = transactions.filter((t) => t.type === 'REVENUE').reduce((s, t) => s + t.amount, 0);
  const outflows = transactions.filter((t) => t.type !== 'REVENUE' && t.type !== 'TRANSFER').reduce((s, t) => s + t.amount, 0);

  return {
    period: `${startDate} a ${endDate}`,
    totalInflows: centsToDecimal(inflows),
    totalOutflows: centsToDecimal(outflows),
    netFlow: centsToDecimal(inflows - outflows),
    items,
  };
}

export async function getTopExpenses(companyId: string, limit = 10) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: {
      companyId,
      deletedAt: null,
      type: { in: ['EXPENSE', 'CMV', 'TAX'] },
      date: { gte: startDate, lte: endDate },
    },
    select: { category: true, amount: true, type: true },
  });

  const byCategory: Record<string, { amount: number; count: number; type: string }> = {};
  for (const t of transactions) {
    const key = t.category || 'Sem Categoria';
    if (!byCategory[key]) byCategory[key] = { amount: 0, count: 0, type: t.type };
    byCategory[key].amount += t.amount;
    byCategory[key].count += 1;
  }

  const total = Object.values(byCategory).reduce((s, v) => s + v.amount, 0);

  return Object.entries(byCategory)
    .map(([category, data]) => ({
      category,
      type: data.type,
      amount: centsToDecimal(data.amount),
      count: data.count,
      percentage: total > 0 ? Math.round((data.amount / total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export async function getRevenueGrowth(companyId: string, months = 6) {
  const results: Array<{ month: string; revenue: number; growth: number | null }> = [];
  let prevRevenue: number | null = null;

  for (let i = months - 1; i >= 0; i--) {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        companyId,
        deletedAt: null,
        type: 'REVENUE',
        date: { gte: startDate, lte: endDate },
      },
      select: { amount: true },
    });

    const revenue = transactions.reduce((s, t) => s + t.amount, 0);
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const label = `${monthNames[date.getMonth()]}/${date.getFullYear()}`;
    const growth = prevRevenue !== null && prevRevenue > 0
      ? Math.round(((revenue - prevRevenue) / prevRevenue) * 10000) / 100
      : null;

    results.push({ month: label, revenue: centsToDecimal(revenue), growth });
    prevRevenue = revenue;
  }

  return results;
}

export function exportToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export async function saveMonthlyReport(
  companyId: string,
  month: number,
  year: number
) {
  const dre = await getDRE(companyId, month, year);

  return prisma.financialReport.upsert({
    where: { companyId_month_year: { companyId, month, year } },
    update: {
      revenue: Math.round(dre.grossRevenue * 100),
      expenses: Math.round(dre.operatingExpenses * 100),
      cmv: Math.round(dre.cmv * 100),
      grossProfit: Math.round(dre.grossProfit * 100),
      netProfit: Math.round(dre.netProfit * 100),
      taxes: Math.round(dre.taxes * 100),
      withdrawals: Math.round(dre.withdrawals * 100),
    },
    create: {
      companyId,
      month,
      year,
      revenue: Math.round(dre.grossRevenue * 100),
      expenses: Math.round(dre.operatingExpenses * 100),
      cmv: Math.round(dre.cmv * 100),
      grossProfit: Math.round(dre.grossProfit * 100),
      netProfit: Math.round(dre.netProfit * 100),
      taxes: Math.round(dre.taxes * 100),
      withdrawals: Math.round(dre.withdrawals * 100),
    },
  });
}
