'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { MonthlyData } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface RevenueExpenseChartProps {
  data: MonthlyData[];
  height?: number;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-card p-3 shadow-glass min-w-[180px]">
      <p className="text-xs font-semibold text-[#9CA3AF] mb-2 uppercase tracking-wide">
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-[#9CA3AF]">
              {entry.name === 'revenue' ? 'Receita' : entry.name === 'expenses' ? 'Despesas' : 'Lucro'}
            </span>
          </div>
          <span className="text-xs font-semibold text-[#F9FAFB] font-mono-number">
            {formatCurrency(entry.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

const COLORS = {
  revenue: '#3B82F6',
  expenses: '#EF4444',
  profit: '#10B981',
};

export function RevenueExpenseChart({ data, height = 280 }: RevenueExpenseChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.revenue} stopOpacity={0.25} />
            <stop offset="95%" stopColor={COLORS.revenue} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.expenses} stopOpacity={0.2} />
            <stop offset="95%" stopColor={COLORS.expenses} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.profit} stopOpacity={0.2} />
            <stop offset="95%" stopColor={COLORS.profit} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.04)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fill: '#6B7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fill: '#6B7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            new Intl.NumberFormat('pt-BR', {
              notation: 'compact',
              compactDisplay: 'short',
              currency: 'BRL',
              style: 'currency',
            }).format(v)
          }
          dx={-4}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
        <Legend
          formatter={(value) =>
            value === 'revenue' ? 'Receita' : value === 'expenses' ? 'Despesas' : 'Lucro'
          }
          wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={COLORS.revenue}
          strokeWidth={2}
          fill="url(#gradRevenue)"
          dot={false}
          activeDot={{ r: 4, fill: COLORS.revenue, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke={COLORS.expenses}
          strokeWidth={2}
          fill="url(#gradExpenses)"
          dot={false}
          activeDot={{ r: 4, fill: COLORS.expenses, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="profit"
          stroke={COLORS.profit}
          strokeWidth={2}
          fill="url(#gradProfit)"
          dot={false}
          activeDot={{ r: 4, fill: COLORS.profit, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
