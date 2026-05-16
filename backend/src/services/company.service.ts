import { prisma } from '../config/database';
import { logger } from '../config/logger';

export interface CompanyData {
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export function centsToDecimal(cents: number): number {
  return cents / 100;
}

export async function getCompanies(userId: string) {
  const userCompanies = await prisma.userCompany.findMany({
    where: { userId },
    include: {
      company: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          cnpj: true,
          logo: true,
          primaryColor: true,
          secondaryColor: true,
          email: true,
          phone: true,
          active: true,
          createdAt: true,
        },
      },
    },
  });

  return userCompanies
    .filter((uc) => uc.company)
    .map((uc) => ({
      ...uc.company,
      role: uc.role,
    }));
}

export async function getCompany(id: string, userId: string) {
  const userCompany = await prisma.userCompany.findFirst({
    where: { userId, companyId: id },
    include: {
      company: {
        where: { deletedAt: null },
      },
    },
  });

  if (!userCompany || !userCompany.company) {
    throw new Error('COMPANY_NOT_FOUND');
  }

  return {
    ...userCompany.company,
    role: userCompany.role,
  };
}

export async function createCompany(data: CompanyData, userId: string) {
  if (data.cnpj) {
    const existing = await prisma.company.findFirst({
      where: { cnpj: data.cnpj, deletedAt: null },
    });
    if (existing) {
      throw new Error('CNPJ_ALREADY_EXISTS');
    }
  }

  const company = await prisma.company.create({
    data: {
      name: data.name,
      cnpj: data.cnpj,
      email: data.email,
      phone: data.phone,
      address: data.address,
      primaryColor: data.primaryColor || '#6366f1',
      secondaryColor: data.secondaryColor || '#8b5cf6',
      active: true,
    },
  });

  await prisma.userCompany.create({
    data: {
      userId,
      companyId: company.id,
      role: 'OWNER',
    },
  });

  // Create default categories
  const defaultCategories = [
    { name: 'Vendas de Produtos', type: 'REVENUE' as const, color: '#10b981', icon: '🛒' },
    { name: 'Prestação de Serviços', type: 'REVENUE' as const, color: '#06b6d4', icon: '🔧' },
    { name: 'Outras Receitas', type: 'REVENUE' as const, color: '#84cc16', icon: '💰' },
    { name: 'Custo de Mercadorias', type: 'CMV' as const, color: '#f59e0b', icon: '📦' },
    { name: 'Salários e Encargos', type: 'EXPENSE' as const, color: '#ef4444', icon: '👥' },
    { name: 'Aluguel', type: 'EXPENSE' as const, color: '#f97316', icon: '🏢' },
    { name: 'Marketing', type: 'EXPENSE' as const, color: '#a855f7', icon: '📣' },
    { name: 'Simples Nacional', type: 'TAX' as const, color: '#dc2626', icon: '🏛️' },
    { name: 'Pró-labore', type: 'WITHDRAWAL' as const, color: '#0ea5e9', icon: '💼' },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.create({
      data: { companyId: company.id, ...cat, isDefault: true },
    });
  }

  return company;
}

export async function updateCompany(id: string, data: Partial<CompanyData>, userId: string) {
  const userCompany = await prisma.userCompany.findFirst({
    where: { userId, companyId: id, role: { in: ['OWNER', 'ADMIN'] } },
  });

  if (!userCompany) {
    throw new Error('UNAUTHORIZED');
  }

  if (data.cnpj) {
    const existing = await prisma.company.findFirst({
      where: { cnpj: data.cnpj, deletedAt: null, NOT: { id } },
    });
    if (existing) {
      throw new Error('CNPJ_ALREADY_EXISTS');
    }
  }

  return prisma.company.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.primaryColor && { primaryColor: data.primaryColor }),
      ...(data.secondaryColor && { secondaryColor: data.secondaryColor }),
    },
  });
}

export async function uploadLogo(id: string, filePath: string, userId: string) {
  const userCompany = await prisma.userCompany.findFirst({
    where: { userId, companyId: id, role: { in: ['OWNER', 'ADMIN'] } },
  });

  if (!userCompany) {
    throw new Error('UNAUTHORIZED');
  }

  return prisma.company.update({
    where: { id },
    data: { logo: filePath },
    select: { id: true, logo: true },
  });
}

export async function getCompanyStats(id: string, userId: string) {
  const userCompany = await prisma.userCompany.findFirst({
    where: { userId, companyId: id },
  });

  if (!userCompany) {
    throw new Error('COMPANY_NOT_FOUND');
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [transactions, lastMonthTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        companyId: id,
        deletedAt: null,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { type: true, amount: true },
    }),
    prisma.transaction.findMany({
      where: {
        companyId: id,
        deletedAt: null,
        date: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        },
      },
      select: { type: true, amount: true },
    }),
  ]);

  const calcStats = (txs: Array<{ type: string; amount: number }>) => {
    const revenue = txs.filter((t) => t.type === 'REVENUE').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const cmv = txs.filter((t) => t.type === 'CMV').reduce((s, t) => s + t.amount, 0);
    const taxes = txs.filter((t) => t.type === 'TAX').reduce((s, t) => s + t.amount, 0);
    const withdrawals = txs.filter((t) => t.type === 'WITHDRAWAL').reduce((s, t) => s + t.amount, 0);
    const grossProfit = revenue - cmv;
    const netProfit = grossProfit - expenses - taxes - withdrawals;
    return { revenue, expenses, cmv, taxes, withdrawals, grossProfit, netProfit };
  };

  const current = calcStats(transactions);
  const previous = calcStats(lastMonthTransactions);

  const growthPct = (curr: number, prev: number) =>
    prev === 0 ? null : ((curr - prev) / prev) * 100;

  return {
    currentMonth: {
      revenue: centsToDecimal(current.revenue),
      expenses: centsToDecimal(current.expenses),
      cmv: centsToDecimal(current.cmv),
      taxes: centsToDecimal(current.taxes),
      withdrawals: centsToDecimal(current.withdrawals),
      grossProfit: centsToDecimal(current.grossProfit),
      netProfit: centsToDecimal(current.netProfit),
    },
    growth: {
      revenue: growthPct(current.revenue, previous.revenue),
      expenses: growthPct(current.expenses, previous.expenses),
      netProfit: growthPct(current.netProfit, previous.netProfit),
    },
    transactionCount: transactions.length,
  };
}
