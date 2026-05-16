import { PrismaClient, TransactionType, BankAccountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('Demo@123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@cmv.com' },
    update: {},
    create: {
      email: 'admin@cmv.com',
      name: 'Administrador Demo',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('User created:', user.email);

  // Create demo company
  const company = await prisma.company.upsert({
    where: { cnpj: '12.345.678/0001-90' },
    update: {},
    create: {
      name: 'Empresa Demo Ltda',
      cnpj: '12.345.678/0001-90',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      email: 'contato@empresademo.com.br',
      phone: '(11) 99999-0000',
      address: 'Av. Paulista, 1000 - São Paulo/SP',
      active: true,
    },
  });
  console.log('Company created:', company.name);

  // Link user to company
  await prisma.userCompany.upsert({
    where: { userId_companyId: { userId: user.id, companyId: company.id } },
    update: {},
    create: {
      userId: user.id,
      companyId: company.id,
      role: 'OWNER',
    },
  });

  // Create default categories
  const categories: Array<{ name: string; type: TransactionType; color: string; icon: string }> = [
    { name: 'Vendas de Produtos', type: TransactionType.REVENUE, color: '#10b981', icon: '🛒' },
    { name: 'Prestação de Serviços', type: TransactionType.REVENUE, color: '#06b6d4', icon: '🔧' },
    { name: 'Outras Receitas', type: TransactionType.REVENUE, color: '#84cc16', icon: '💰' },
    { name: 'Custo de Mercadorias', type: TransactionType.CMV, color: '#f59e0b', icon: '📦' },
    { name: 'Salários e Encargos', type: TransactionType.EXPENSE, color: '#ef4444', icon: '👥' },
    { name: 'Aluguel e Imóveis', type: TransactionType.EXPENSE, color: '#f97316', icon: '🏢' },
    { name: 'Marketing e Publicidade', type: TransactionType.EXPENSE, color: '#a855f7', icon: '📣' },
    { name: 'Tecnologia e Software', type: TransactionType.EXPENSE, color: '#3b82f6', icon: '💻' },
    { name: 'Energia e Utilidades', type: TransactionType.EXPENSE, color: '#eab308', icon: '⚡' },
    { name: 'Transporte e Logística', type: TransactionType.EXPENSE, color: '#6b7280', icon: '🚚' },
    { name: 'Material de Escritório', type: TransactionType.EXPENSE, color: '#14b8a6', icon: '📎' },
    { name: 'Outras Despesas', type: TransactionType.EXPENSE, color: '#ec4899', icon: '💸' },
    { name: 'Imposto de Renda', type: TransactionType.TAX, color: '#dc2626', icon: '🏛️' },
    { name: 'ICMS', type: TransactionType.TAX, color: '#b91c1c', icon: '🏛️' },
    { name: 'PIS/COFINS', type: TransactionType.TAX, color: '#991b1b', icon: '🏛️' },
    { name: 'Simples Nacional', type: TransactionType.TAX, color: '#7f1d1d', icon: '🏛️' },
    { name: 'Taxas Bancárias', type: TransactionType.EXPENSE, color: '#78716c', icon: '🏦' },
    { name: 'Pró-labore', type: TransactionType.WITHDRAWAL, color: '#0ea5e9', icon: '💼' },
    { name: 'Distribuição de Lucros', type: TransactionType.WITHDRAWAL, color: '#0284c7', icon: '💎' },
    { name: 'Transferências', type: TransactionType.TRANSFER, color: '#64748b', icon: '🔄' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { companyId_name_type: { companyId: company.id, name: cat.name, type: cat.type } },
      update: {},
      create: {
        companyId: company.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
        isDefault: true,
      },
    });
  }
  console.log('Categories created');

  // Create default bank account
  const bankAccount = await prisma.bankAccount.create({
    data: {
      companyId: company.id,
      name: 'Conta Corrente Principal',
      bank: 'Banco do Brasil',
      agency: '1234-5',
      account: '12345-6',
      type: BankAccountType.CHECKING,
      balance: 5000000, // R$ 50.000,00 in centavos
    },
  });

  await prisma.bankAccount.create({
    data: {
      companyId: company.id,
      name: 'Conta Poupança',
      bank: 'Caixa Econômica Federal',
      agency: '0987-6',
      account: '98765-4',
      type: BankAccountType.SAVINGS,
      balance: 2000000, // R$ 20.000,00
    },
  });
  console.log('Bank accounts created');

  // Sample transactions for the last 3 months
  const transactions: Array<{
    date: Date;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    bankAccount: string;
  }> = [
    // Revenue - Month 1 (90-60 days ago)
    { date: daysAgo(88), description: 'Venda de produtos - Cliente ABC Ltda', amount: 1250000, type: TransactionType.REVENUE, category: 'Vendas de Produtos', bankAccount: bankAccount.name },
    { date: daysAgo(85), description: 'Prestação de serviços - Projeto XYZ', amount: 800000, type: TransactionType.REVENUE, category: 'Prestação de Serviços', bankAccount: bankAccount.name },
    { date: daysAgo(82), description: 'Venda de produtos - Cliente DEF S/A', amount: 950000, type: TransactionType.REVENUE, category: 'Vendas de Produtos', bankAccount: bankAccount.name },
    { date: daysAgo(78), description: 'Venda de produtos - Loja Online', amount: 430000, type: TransactionType.REVENUE, category: 'Vendas de Produtos', bankAccount: bankAccount.name },
    { date: daysAgo(75), description: 'Serviços de consultoria', amount: 600000, type: TransactionType.REVENUE, category: 'Prestação de Serviços', bankAccount: bankAccount.name },
    { date: daysAgo(70), description: 'Venda de produtos - Atacado GHI', amount: 2100000, type: TransactionType.REVENUE, category: 'Vendas de Produtos', bankAccount: bankAccount.name },
    { date: daysAgo(65), description: 'Recebimento de parcela - Cliente JKL', amount: 350000, type: TransactionType.REVENUE, category: 'Outras Receitas', bankAccount: bankAccount.name },
    // Expenses - Month 1
    { date: daysAgo(87), description: 'Folha de pagamento - Março', amount: -350000, type: TransactionType.EXPENSE, category: 'Salários e Encargos', bankAccount: bankAccount.name },
    { date: daysAgo(87), description: 'FGTS - Março', amount: -28000, type: TransactionType.EXPENSE, category: 'Salários e Encargos', bankAccount: bankAccount.name },
    { date: daysAgo(86), description: 'Aluguel - Sede Março', amount: -180000, type: TransactionType.EXPENSE, category: 'Aluguel e Imóveis', bankAccount: bankAccount.name },
    { date: daysAgo(84), description: 'Google Ads - Campanha Março', amount: -45000, type: TransactionType.EXPENSE, category: 'Marketing e Publicidade', bankAccount: bankAccount.name },
    { date: daysAgo(83), description: 'Compra de estoque - Fornecedor MNO', amount: -620000, type: TransactionType.CMV, category: 'Custo de Mercadorias', bankAccount: bankAccount.name },
    { date: daysAgo(80), description: 'Conta de energia elétrica', amount: -8500, type: TransactionType.EXPENSE, category: 'Energia e Utilidades', bankAccount: bankAccount.name },
    { date: daysAgo(79), description: 'Internet e telefone', amount: -32000, type: TransactionType.EXPENSE, category: 'Tecnologia e Software', bankAccount: bankAccount.name },
    { date: daysAgo(77), description: 'Frete e logística', amount: -15000, type: TransactionType.EXPENSE, category: 'Transporte e Logística', bankAccount: bankAccount.name },
    { date: daysAgo(73), description: 'Compra de materiais - Fornecedor PQR', amount: -480000, type: TransactionType.CMV, category: 'Custo de Mercadorias', bankAccount: bankAccount.name },
    // Taxes - Month 1
    { date: daysAgo(72), description: 'DAS - Simples Nacional Março', amount: -87500, type: TransactionType.TAX, category: 'Simples Nacional', bankAccount: bankAccount.name },
    { date: daysAgo(68), description: 'PIS/COFINS - Março', amount: -35000, type: TransactionType.TAX, category: 'PIS/COFINS', bankAccount: bankAccount.name },
    // Withdrawals - Month 1
    { date: daysAgo(67), description: 'Pró-labore - Sócio Administrador', amount: -250000, type: TransactionType.WITHDRAWAL, category: 'Pró-labore', bankAccount: bankAccount.name },

    // Revenue - Month 2 (60-30 days ago)
    { date: daysAgo(58), description: 'Venda de produtos - Cliente STU Ltda', amount: 1380000, type: TransactionType.REVENUE, category: 'Vendas de Produtos', bankAccount: bankAccount.name },
    { date: daysAgo(55), description: 'Prestação de serviços - Implantação sistema', amount: 950000, type: TransactionType.REVENUE, category: 'Prestação de Serviços', bankAccount: bankAccount.name },
    { date: daysAgo(52), description: 'Venda de produtos - E-commerce', amount: 560000, type: TransactionType.REVENUE, category: 'Vendas de Produtos', bankAccount: bankAccount.name },
    { date: daysAgo(48), description: 'Venda de produtos - Cliente VWX', amount: 890000, type: TransactionType.REVENUE, category: 'Vendas de Produtos', bankAccount: bankAccount.name },
    { date: daysAgo(45), description: 'Suporte técnico mensal', amount: 420000, type: TransactionType.REVENUE, category: 'Prestação de Serviços', bankAccount: bankAccount.name },
    { date: daysAgo(40), description: 'Venda de produtos - Atacado YZ', amount: 1750000, type: TransactionType.REVENUE, category: 'Vendas de Produtos', bankAccount: bankAccount.name },
    // Expenses - Month 2
    { date: daysAgo(57), description: 'Folha de pagamento - Abril', amount: -350000, type: TransactionType.EXPENSE, category: 'Salários e Encargos', bankAccount: bankAccount.name },
    { date: daysAgo(57), description: 'INSS Patronal - Abril', amount: -63000, type: TransactionType.EXPENSE, category: 'Salários e Encargos', bankAccount: bankAccount.name },
    { date: daysAgo(56), description: 'Aluguel - Sede Abril', amount: -180000, type: TransactionType.EXPENSE, category: 'Aluguel e Imóveis', bankAccount: bankAccount.name },
    { date: daysAgo(53), description: 'Meta Ads - Campanhas Abril', amount: -68000, type: TransactionType.EXPENSE, category: 'Marketing e Publicidade', bankAccount: bankAccount.name },
    { date: daysAgo(51), description: 'Compra de estoque - Fornecedor ABC', amount: -780000, type: TransactionType.CMV, category: 'Custo de Mercadorias', bankAccount: bankAccount.name },
    { date: daysAgo(49), description: 'Licença software ERP', amount: -45000, type: TransactionType.EXPENSE, category: 'Tecnologia e Software', bankAccount: bankAccount.name },
    { date: daysAgo(46), description: 'Manutenção de equipamentos', amount: -22000, type: TransactionType.EXPENSE, category: 'Outras Despesas', bankAccount: bankAccount.name },
    { date: daysAgo(43), description: 'Compra de insumos - Fornecedor DEF', amount: -350000, type: TransactionType.CMV, category: 'Custo de Mercadorias', bankAccount: bankAccount.name },
    { date: daysAgo(42), description: 'Material de escritório', amount: -3500, type: TransactionType.EXPENSE, category: 'Material de Escritório', bankAccount: bankAccount.name },
    // Taxes - Month 2
    { date: daysAgo(41), description: 'DAS - Simples Nacional Abril', amount: -96250, type: TransactionType.TAX, category: 'Simples Nacional', bankAccount: bankAccount.name },
    { date: daysAgo(38), description: 'ICMS - Abril', amount: -42000, type: TransactionType.TAX, category: 'ICMS', bankAccount: bankAccount.name },
    // Withdrawals - Month 2
    { date: daysAgo(37), description: 'Pró-labore - Sócio Administrador', amount: -250000, type: TransactionType.WITHDRAWAL, category: 'Pró-labore', bankAccount: bankAccount.name },
    { date: daysAgo(35), description: 'Distribuição de lucros - Sócios', amount: -300000, type: TransactionType.WITHDRAWAL, category: 'Distribuição de Lucros', bankAccount: bankAccount.name },

    // Revenue - Month 3 (last 30 days)
    { date: daysAgo(28), description: 'Venda de produtos - Cliente MNO Ltda', amount: 1560000, type: TransactionType.REVENUE, category: 'Vendas de Produtos', bankAccount: bankAccount.name },
    { date: daysAgo(25), description: 'Prestação de serviços - Treinamento', amount: 380000, type: TransactionType.REVENUE, category: 'Prestação de Serviços', bankAccount: bankAccount.name },
    { date: daysAgo(22), description: 'Venda de produtos - E-commerce Maio', amount: 720000, type: TransactionType.REVENUE, category: 'Vendas de Produtos', bankAccount: bankAccount.name },
    { date: daysAgo(18), description: 'Consultoria estratégica', amount: 1100000, type: TransactionType.REVENUE, category: 'Prestação de Serviços', bankAccount: bankAccount.name },
    { date: daysAgo(15), description: 'Venda de produtos - Atacado PQR', amount: 2300000, type: TransactionType.REVENUE, category: 'Vendas de Produtos', bankAccount: bankAccount.name },
    { date: daysAgo(10), description: 'Venda de produtos - Cliente STU', amount: 980000, type: TransactionType.REVENUE, category: 'Vendas de Produtos', bankAccount: bankAccount.name },
    { date: daysAgo(5), description: 'Manutenção mensal - Clientes', amount: 540000, type: TransactionType.REVENUE, category: 'Prestação de Serviços', bankAccount: bankAccount.name },
    // Expenses - Month 3
    { date: daysAgo(27), description: 'Folha de pagamento - Maio', amount: -380000, type: TransactionType.EXPENSE, category: 'Salários e Encargos', bankAccount: bankAccount.name },
    { date: daysAgo(27), description: 'FGTS e INSS - Maio', amount: -91000, type: TransactionType.EXPENSE, category: 'Salários e Encargos', bankAccount: bankAccount.name },
    { date: daysAgo(26), description: 'Aluguel - Sede Maio', amount: -185000, type: TransactionType.EXPENSE, category: 'Aluguel e Imóveis', bankAccount: bankAccount.name },
    { date: daysAgo(23), description: 'Google e Meta Ads - Maio', amount: -92000, type: TransactionType.EXPENSE, category: 'Marketing e Publicidade', bankAccount: bankAccount.name },
    { date: daysAgo(21), description: 'Compra de estoque - Fornecedor GHI', amount: -920000, type: TransactionType.CMV, category: 'Custo de Mercadorias', bankAccount: bankAccount.name },
    { date: daysAgo(19), description: 'Conta de energia e água', amount: -12000, type: TransactionType.EXPENSE, category: 'Energia e Utilidades', bankAccount: bankAccount.name },
    { date: daysAgo(16), description: 'Fretes e entregas', amount: -28000, type: TransactionType.EXPENSE, category: 'Transporte e Logística', bankAccount: bankAccount.name },
    { date: daysAgo(14), description: 'Compra de insumos adicionais', amount: -450000, type: TransactionType.CMV, category: 'Custo de Mercadorias', bankAccount: bankAccount.name },
    { date: daysAgo(12), description: 'Tarifas bancárias', amount: -4800, type: TransactionType.EXPENSE, category: 'Taxas Bancárias', bankAccount: bankAccount.name },
    // Taxes - Month 3
    { date: daysAgo(9), description: 'DAS - Simples Nacional Maio', amount: -108500, type: TransactionType.TAX, category: 'Simples Nacional', bankAccount: bankAccount.name },
    { date: daysAgo(7), description: 'PIS/COFINS e ICMS - Maio', amount: -65000, type: TransactionType.TAX, category: 'PIS/COFINS', bankAccount: bankAccount.name },
    // Withdrawals - Month 3
    { date: daysAgo(6), description: 'Pró-labore - Sócio Administrador', amount: -250000, type: TransactionType.WITHDRAWAL, category: 'Pró-labore', bankAccount: bankAccount.name },
  ];

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        companyId: company.id,
        date: tx.date,
        description: tx.description,
        amount: Math.abs(tx.amount),
        type: tx.type,
        category: tx.category,
        bankAccount: tx.bankAccount,
        source: 'MANUAL',
        aiClassified: false,
      },
    });
  }
  console.log(`${transactions.length} transactions created`);

  // Create financial reports for the last 3 months
  const now = new Date();
  const reportMonths = [
    { month: now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1, year: now.getMonth() - 1 < 0 ? now.getFullYear() - 1 : now.getFullYear() },
    { month: now.getMonth() - 2 < 0 ? 10 : now.getMonth() - 2, year: now.getMonth() - 2 < 0 ? now.getFullYear() - 1 : now.getFullYear() },
    { month: now.getMonth() - 3 < 0 ? 9 : now.getMonth() - 3, year: now.getMonth() - 3 < 0 ? now.getFullYear() - 1 : now.getFullYear() },
  ];

  const reportData = [
    { revenue: 6480000, expenses: 1279500, cmv: 1100000, taxes: 122500, withdrawals: 250000 },
    { revenue: 5950000, expenses: 1531500, cmv: 1130000, taxes: 138250, withdrawals: 550000 },
    { revenue: 7580000, expenses: 1788800, cmv: 1370000, taxes: 173500, withdrawals: 250000 },
  ];

  for (let i = 0; i < reportMonths.length; i++) {
    const rm = reportMonths[i];
    const rd = reportData[i];
    const grossProfit = rd.revenue - rd.cmv;
    const netProfit = grossProfit - rd.expenses - rd.taxes - rd.withdrawals;

    await prisma.financialReport.upsert({
      where: { companyId_month_year: { companyId: company.id, month: rm.month + 1, year: rm.year } },
      update: {},
      create: {
        companyId: company.id,
        month: rm.month + 1,
        year: rm.year,
        revenue: rd.revenue,
        expenses: rd.expenses,
        cmv: rd.cmv,
        grossProfit,
        netProfit,
        taxes: rd.taxes,
        withdrawals: rd.withdrawals,
      },
    });
  }
  console.log('Financial reports created');

  console.log('\nSeed completed successfully!');
  console.log('Demo user: admin@cmv.com / Demo@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
