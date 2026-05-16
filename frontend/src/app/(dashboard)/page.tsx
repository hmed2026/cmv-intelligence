'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ArrowRight,
  Bot,
  RefreshCw,
  BarChart3,
  Percent,
  Target,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { transactionApi, reportApi, aiApi } from '@/lib/api';
import { KPICard } from '@/components/ui/KPICard';
import { RevenueExpenseChart } from '@/components/charts/RevenueExpenseChart';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { CashFlowChart } from '@/components/charts/CashFlowChart';
import { TransactionTable } from '@/components/tables/TransactionTable';
import { formatCurrency, formatPercentage, getCurrentMonthRange } from '@/lib/utils';
import { FinancialSummary, MonthlyData, CategoryBreakdown, Transaction, AIInsight } from '@/types';

// ─── Mock data for development/demo ─────────────────────────────────────
const MOCK_SUMMARY: FinancialSummary = {
  revenue: 187420.50,
  expenses: 98340.20,
  cmv: 52800.00,
  grossProfit: 134620.50,
  netProfit: 36280.30,
  taxes: 14200.00,
  withdrawals: 8500.00,
  grossMargin: 71.8,
  netMargin: 19.4,
};

const MOCK_MONTHLY: MonthlyData[] = [
  { month: 'Dez', revenue: 145000, expenses: 82000, profit: 63000 },
  { month: 'Jan', revenue: 158000, expenses: 88000, profit: 70000 },
  { month: 'Fev', revenue: 142000, expenses: 79000, profit: 63000 },
  { month: 'Mar', revenue: 171000, expenses: 95000, profit: 76000 },
  { month: 'Abr', revenue: 163000, expenses: 91000, profit: 72000 },
  { month: 'Mai', revenue: 187420, expenses: 98340, profit: 89080 },
];

const MOCK_CATEGORIES: CategoryBreakdown[] = [
  { category: 'CMV / Estoque', amount: 52800, percentage: 53.7, type: 'CMV' },
  { category: 'Pessoal', amount: 18400, percentage: 18.7, type: 'EXPENSE' },
  { category: 'Impostos', amount: 14200, percentage: 14.4, type: 'TAX' },
  { category: 'Aluguel', amount: 6800, percentage: 6.9, type: 'EXPENSE' },
  { category: 'Marketing', amount: 3200, percentage: 3.3, type: 'EXPENSE' },
  { category: 'Outros', amount: 2940, percentage: 3.0, type: 'EXPENSE' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1', date: '2025-05-15', description: 'Venda — Produto A', amount: 12500,
    type: 'REVENUE', category: 'Vendas', source: 'MANUAL', aiClassified: false, createdAt: '2025-05-15',
  },
  {
    id: '2', date: '2025-05-14', description: 'Compra de insumos', amount: 4200,
    type: 'CMV', category: 'CMV / Estoque', source: 'IMPORT', aiClassified: true, aiConfidence: 0.94, createdAt: '2025-05-14',
  },
  {
    id: '3', date: '2025-05-14', description: 'Folha de pagamento', amount: 9800,
    type: 'EXPENSE', category: 'Pessoal', source: 'MANUAL', aiClassified: false, createdAt: '2025-05-14',
  },
  {
    id: '4', date: '2025-05-13', description: 'Venda — Produto B', amount: 8750,
    type: 'REVENUE', category: 'Vendas', source: 'AI', aiClassified: true, aiConfidence: 0.88, createdAt: '2025-05-13',
  },
  {
    id: '5', date: '2025-05-13', description: 'DARF — IRPJ', amount: 3100,
    type: 'TAX', category: 'Impostos', source: 'MANUAL', aiClassified: false, createdAt: '2025-05-13',
  },
  {
    id: '6', date: '2025-05-12', description: 'Aluguel comercial', amount: 6800,
    type: 'EXPENSE', category: 'Aluguel', source: 'IMPORT', aiClassified: true, aiConfidence: 0.99, createdAt: '2025-05-12',
  },
  {
    id: '7', date: '2025-05-11', description: 'Serviços consultoria', amount: 5200,
    type: 'REVENUE', category: 'Serviços', source: 'MANUAL', aiClassified: false, createdAt: '2025-05-11',
  },
  {
    id: '8', date: '2025-05-10', description: 'Google Ads', amount: 1800,
    type: 'EXPENSE', category: 'Marketing', source: 'IMPORT', aiClassified: true, aiConfidence: 0.92, createdAt: '2025-05-10',
  },
];

const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: '1',
    type: 'warning',
    title: 'CMV acima da meta',
    description: 'Seu CMV está em 28,2% da receita, 3,2pp acima da meta de 25%. Considere renegociar com fornecedores ou revisar o mix de produtos.',
    metric: 'CMV%',
    value: 28.2,
    generatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'success',
    title: 'Margem bruta crescendo',
    description: 'A margem bruta subiu 4,7pp em relação ao mês anterior, atingindo 71,8%. Excelente desempenho no controle de custos.',
    metric: 'Margem Bruta',
    value: 71.8,
    generatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'tip',
    title: 'Oportunidade de redução',
    description: 'A categoria "Pessoal" representa 18,7% das despesas. Uma análise de eficiência pode liberar até R$ 3.200/mês.',
    generatedAt: new Date().toISOString(),
  },
];

// ─── Section wrapper ────────────────────────────────────────────────────
const Section = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    {children}
  </motion.div>
);

// ─── CMV Indicator Component ────────────────────────────────────────────
function CMVIndicator({ label, value, unit = '%', color = '#3B82F6', target }: {
  label: string; value: number; unit?: string; color?: string; target?: number;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[#9CA3AF]">{label}</p>
        {target !== undefined && (
          <span className="text-[10px] text-[#6B7280]">meta: {target}{unit}</span>
        )}
      </div>
      <p className="text-xl font-bold font-mono-number" style={{ color }}>
        {unit === '%' ? formatPercentage(value) : formatCurrency(value)}
      </p>
      {target !== undefined && (
        <div className="mt-2">
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((value / (target * 1.5)) * 100, 100)}%`,
                backgroundColor: color,
                opacity: 0.7,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Insights Panel ──────────────────────────────────────────────────
function AIInsightsPanel({ insights, loading }: { insights: AIInsight[]; loading: boolean }) {
  const [expanded, setExpanded] = useState(true);

  const typeConfig = {
    warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    success: { color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    info: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
    tip: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
  };

  return (
    <div className="gradient-border">
      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <Sparkles size={15} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F9FAFB]">Análise IA</h3>
              <p className="text-[10px] text-[#6B7280]">
                Insights gerados agora
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 border border-blue-500/20 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/10 transition-all">
              <RefreshCw size={11} />
              Atualizar
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-3"
          >
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-xl" />
              ))
            ) : (
              insights.map((insight, i) => {
                const cfg = typeConfig[insight.type];
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-3 rounded-xl flex gap-3"
                    style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <div
                      className="w-1 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: cfg.color, minHeight: 40 }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-semibold" style={{ color: cfg.color }}>
                          {insight.title}
                        </p>
                        {insight.value !== undefined && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: cfg.border, color: cfg.color }}
                          >
                            {insight.metric}: {formatPercentage(insight.value)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9CA3AF] leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { startDate, endDate } = getCurrentMonthRange();
  const year = new Date().getFullYear();

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['summary', startDate, endDate],
    queryFn: () => transactionApi.getSummary(startDate, endDate),
    placeholderData: { data: MOCK_SUMMARY } as { data: FinancialSummary },
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly', year],
    queryFn: () => transactionApi.getMonthlyChart(year),
    placeholderData: { data: MOCK_MONTHLY } as { data: MonthlyData[] },
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', startDate, endDate],
    queryFn: () => transactionApi.getCategoryBreakdown(startDate, endDate),
    placeholderData: { data: MOCK_CATEGORIES } as { data: CategoryBreakdown[] },
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => transactionApi.list({ limit: 10, sortBy: 'date', sortOrder: 'desc' }),
    placeholderData: { data: { data: MOCK_TRANSACTIONS, total: MOCK_TRANSACTIONS.length, page: 1, limit: 10, totalPages: 1 } } as { data: { data: Transaction[]; total: number; page: number; limit: number; totalPages: number } },
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => aiApi.getInsights(),
    placeholderData: { data: MOCK_INSIGHTS } as { data: AIInsight[] },
  });

  const summary = summaryData?.data ?? MOCK_SUMMARY;
  const monthly = monthlyData?.data ?? MOCK_MONTHLY;
  const categories = categoriesData?.data ?? MOCK_CATEGORIES;
  const transactions = transactionsData?.data?.data ?? MOCK_TRANSACTIONS;
  const insights = insightsData?.data ?? MOCK_INSIGHTS;

  const prevRevenue = monthly[monthly.length - 2]?.revenue ?? summary.revenue;
  const revenueTrend = prevRevenue
    ? ((summary.revenue - prevRevenue) / prevRevenue) * 100
    : 0;

  const prevExpenses = monthly[monthly.length - 2]?.expenses ?? summary.expenses;
  const expensesTrend = prevExpenses
    ? ((summary.expenses - prevExpenses) / prevExpenses) * 100
    : 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Receita Total"
          value={formatCurrency(summary.revenue)}
          trend={revenueTrend}
          trendLabel="vs. mês anterior"
          icon={<TrendingUp size={18} />}
          color="green"
          loading={summaryLoading}
          delay={0}
        />
        <KPICard
          title="Despesas Totais"
          value={formatCurrency(summary.expenses)}
          trend={expensesTrend}
          trendLabel="vs. mês anterior"
          icon={<TrendingDown size={18} />}
          color="red"
          loading={summaryLoading}
          delay={0.06}
        />
        <KPICard
          title="Lucro Líquido"
          value={formatCurrency(summary.netProfit)}
          trend={summary.netMargin}
          trendLabel="margem líquida"
          icon={<DollarSign size={18} />}
          color="blue"
          loading={summaryLoading}
          delay={0.12}
        />
        <KPICard
          title="CMV"
          value={formatCurrency(summary.cmv)}
          trend={summary.revenue > 0 ? (summary.cmv / summary.revenue) * 100 : 0}
          trendLabel="da receita"
          icon={<Package size={18} />}
          color="orange"
          loading={summaryLoading}
          delay={0.18}
        />
      </div>

      {/* ── Charts Row 1 ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue vs Expenses */}
        <Section delay={0.22}>
          <div className="glass-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-[#F9FAFB]">Receita vs Despesas</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Últimos 6 meses</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] text-[#6B7280]">Receita</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] text-[#6B7280]">Despesas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-[#6B7280]">Lucro</span>
                </div>
              </div>
            </div>
            {monthlyLoading ? (
              <div className="h-[280px] skeleton rounded-xl" />
            ) : (
              <RevenueExpenseChart data={monthly} height={280} />
            )}
          </div>
        </Section>

        {/* Categories Pie */}
        <Section delay={0.26}>
          <div className="glass-card p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#F9FAFB]">Categorias de Despesas</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Distribuição por categoria</p>
            </div>
            {categoriesLoading ? (
              <div className="h-[260px] skeleton rounded-xl" />
            ) : (
              <CategoryPieChart data={categories} height={180} />
            )}
          </div>
        </Section>
      </div>

      {/* ── Charts Row 2 ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cash Flow */}
        <Section delay={0.3}>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-[#F9FAFB]">Fluxo de Caixa</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Comparativo mensal</p>
              </div>
              <BarChart3 size={16} className="text-[#4B5563]" />
            </div>
            {monthlyLoading ? (
              <div className="h-[260px] skeleton rounded-xl" />
            ) : (
              <CashFlowChart data={monthly} height={240} />
            )}
          </div>
        </Section>

        {/* CMV Indicators */}
        <Section delay={0.34}>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-[#F9FAFB]">Indicadores CMV</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Performance do período</p>
              </div>
              <Target size={16} className="text-[#4B5563]" />
            </div>
            {summaryLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 skeleton rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <CMVIndicator
                  label="CMV %"
                  value={summary.revenue > 0 ? (summary.cmv / summary.revenue) * 100 : 0}
                  color="#F97316"
                  target={25}
                />
                <CMVIndicator
                  label="Margem Bruta"
                  value={summary.grossMargin}
                  color="#10B981"
                  target={70}
                />
                <CMVIndicator
                  label="Margem Líquida"
                  value={summary.netMargin}
                  color="#3B82F6"
                  target={15}
                />
                <CMVIndicator
                  label="Impostos"
                  value={summary.revenue > 0 ? (summary.taxes / summary.revenue) * 100 : 0}
                  color="#8B5CF6"
                  target={12}
                />
              </div>
            )}

            {/* Summary Row */}
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-[10px] text-[#6B7280] mb-1">Lucro Bruto</p>
                <p className="text-sm font-bold text-emerald-400 font-mono-number">
                  {formatCurrency(summary.grossProfit)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[#6B7280] mb-1">Retiradas</p>
                <p className="text-sm font-bold text-purple-400 font-mono-number">
                  {formatCurrency(summary.withdrawals)}
                </p>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ── AI Insights ────────────────────────────────────────────── */}
      <Section delay={0.38}>
        <AIInsightsPanel insights={insights} loading={insightsLoading} />
      </Section>

      {/* ── Recent Transactions ────────────────────────────────────── */}
      <Section delay={0.42}>
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <Activity size={16} className="text-blue-400" />
              <div>
                <h3 className="text-sm font-semibold text-[#F9FAFB]">Transações Recentes</h3>
                <p className="text-xs text-[#6B7280]">
                  {transactions.length} transações
                </p>
              </div>
            </div>
            <Link
              href="/transacoes"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver todas
              <ArrowRight size={13} />
            </Link>
          </div>
          <TransactionTable
            transactions={transactions}
            loading={transactionsLoading}
            compact
          />
        </div>
      </Section>
    </div>
  );
}
