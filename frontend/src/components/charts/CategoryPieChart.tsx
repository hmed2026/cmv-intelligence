'use client';

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { CategoryBreakdown } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface CategoryPieChartProps {
  data: CategoryBreakdown[];
  height?: number;
}

const PALETTE = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#F97316',
  '#EC4899',
  '#14B8A6',
  '#6366F1',
];

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as CategoryBreakdown;
  return (
    <div className="glass-card p-3 shadow-glass min-w-[160px]">
      <p className="text-sm font-semibold text-[#F9FAFB] mb-1">{d.category}</p>
      <p className="text-xs text-[#9CA3AF]">
        {formatCurrency(d.amount)} &bull; {formatPercentage(d.percentage)}
      </p>
    </div>
  );
}

export function CategoryPieChart({ data, height = 260 }: CategoryPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const top = data.slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={top}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="amount"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {top.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={PALETTE[index % PALETTE.length]}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom Legend */}
      <div className="space-y-2 px-1">
        {top.map((item, index) => (
          <div
            key={item.category}
            className="flex items-center justify-between gap-2 group"
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-full shrink-0 transition-all"
                style={{
                  backgroundColor: PALETTE[index % PALETTE.length],
                  boxShadow:
                    activeIndex === index
                      ? `0 0 6px ${PALETTE[index % PALETTE.length]}`
                      : 'none',
                }}
              />
              <span className="text-xs text-[#9CA3AF] truncate group-hover:text-[#F9FAFB] transition-colors">
                {item.category}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-[#F9FAFB] font-mono-number">
                {formatPercentage(item.percentage)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
