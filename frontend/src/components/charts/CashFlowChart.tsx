'use client';

import React from 'react';
import {
  BarChart,
  Bar,
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

interface CashFlowChartProps {
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
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-[#9CA3AF]">
              {entry.name === 'revenue' ? 'Receita' : 'Despesas'}
            </span>
          </div>
          <span className="text-xs font-semibold text-[#F9FAFB] font-mono-number">
            {formatCurrency(entry.value as number)}
          </span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-[#9CA3AF]">Resultado</span>
          <span
            className={`text-xs font-bold font-mono-number ${
              (payload[0].value as number) - (payload[1].value as number) >= 0
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
            {formatCurrency((payload[0].value as number) - (payload[1].value as number))}
          </span>
        </div>
      )}
    </div>
  );
}

export function CashFlowChart({ data, height = 260 }: CashFlowChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barGap={2}>
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
            }).format(v)
          }
          dx={-4}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 4 }}
        />
        <Legend
          formatter={(value) => (value === 'revenue' ? 'Receita' : 'Despesas')}
          wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }}
        />
        <Bar
          dataKey="revenue"
          fill="#3B82F6"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
        <Bar
          dataKey="expenses"
          fill="#EF4444"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
          fillOpacity={0.8}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
