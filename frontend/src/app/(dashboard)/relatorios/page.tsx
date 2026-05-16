'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  FileText,
  Download,
  TrendingUp,
  Package,
  DollarSign,
  Percent,
  Calendar,
} from 'lucide-react';
import { reportApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { DREReport } from '@/types';

const MONTHS = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

const YEARS = ['2025', '2024', '2023'].map((y) => ({ value: y, label: y }));

const MOCK_DRE: DREReport = {
  period: 'Maio 2025',
  grossRevenue: 187420.50,
  deductions: 12800.00,
  netRevenue: 174620.50,
  cmv: 52800.00,
  grossProfit: 121820.50,
  grossMargin: 69.8,
  operatingExpenses: 71340.20,
  operatingProfit: 50480.30,
  taxes: 14200.00,
  netProfit: 36280.30,
  netMargin: 20.8,
};

function DRERow({
  label, value, highlight = false, indent = false, percentage, bold = false,
}: {
  label: string; value: number; highlight?: boolean; indent?: boolean; percentage?: number; bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 ${
        highlight ? 'bg-blue-500/5 -mx-5 px-5 rounded' : ''
      }`}
    >
      <span
        className={`text-sm ${bold ? 'font-semibold text-[#F9FAFB]' : 'text-[#9CA3AF]'} ${
          indent ? 'pl-4' : ''
        }`}
      >
        {label}
      </span>
      <div className="flex items-center gap-4">
        {percentage !== undefined && (
          <span className="text-xs text-[#6B7280] w-12 text-right font-mono-number">
            {formatPercentage(percentage)}
          </span>
        )}
        <span
          className={`text-sm font-semibold font-mono-number w-32 text-right ${
            value >= 0 ? (highlight || bold ? 'text-[#F9FAFB]' : 'text-[#F9FAFB]') : 'text-red-400'
          }`}
        >
          {formatCurrency(Math.abs(value))}
        </span>
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const { data: dreData, isLoading } = useQuery({
    queryKey: ['dre', month, year],
    queryFn: () => reportApi.getDRE(Number(month), Number(year)),
    placeholderData: { data: MOCK_DRE } as { data: DREReport },
  });

  const dre = dreData?.data ?? MOCK_DRE;

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Relatórios</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">DRE e análises financeiras</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={MONTHS}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            containerClassName="w-36"
          />
          <Select
            options={YEARS}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            containerClassName="w-24"
          />
          <Button variant="secondary" size="sm" icon={<Download size={14} />}>
            PDF
          </Button>
        </div>
      </motion.div>

      {/* KPI Row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Receita Bruta', value: dre.grossRevenue, icon: TrendingUp, color: '#10B981' },
          { label: 'CMV', value: dre.cmv, icon: Package, color: '#F97316' },
          { label: 'Lucro Bruto', value: dre.grossProfit, icon: DollarSign, color: '#3B82F6' },
          { label: 'Margem Líquida', value: dre.netMargin, icon: Percent, color: '#8B5CF6', isPercent: true },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[#9CA3AF]">{item.label}</p>
              <item.icon size={15} style={{ color: item.color }} />
            </div>
            <p className="text-lg font-bold font-mono-number" style={{ color: item.color }}>
              {'isPercent' in item && item.isPercent
                ? formatPercentage(item.value)
                : formatCurrency(item.value)}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* DRE Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <BarChart3 size={16} className="text-blue-400" />
            <div>
              <h3 className="text-sm font-semibold text-[#F9FAFB]">
                DRE — Demonstrativo de Resultado
              </h3>
              <p className="text-xs text-[#6B7280]">{dre.period}</p>
            </div>
          </div>
          <div className="flex gap-1 text-[10px] text-[#6B7280]">
            <span className="px-2 py-0.5 rounded bg-white/5">Valor</span>
            <span className="px-2 py-0.5 rounded bg-white/5">%</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 skeleton rounded" />
            ))}
          </div>
        ) : (
          <div className="px-5 py-2">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider py-2">
              Receita
            </p>
            <DRERow label="Receita Bruta" value={dre.grossRevenue} percentage={100} bold />
            <DRERow label="Deduções e Devoluções" value={-dre.deductions} indent
              percentage={dre.grossRevenue > 0 ? (dre.deductions / dre.grossRevenue) * 100 : 0} />
            <DRERow label="Receita Líquida" value={dre.netRevenue} bold
              percentage={dre.grossRevenue > 0 ? (dre.netRevenue / dre.grossRevenue) * 100 : 0} />

            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider py-2 mt-2">
              Custos
            </p>
            <DRERow label="CMV — Custo da Mercadoria Vendida" value={-dre.cmv} indent
              percentage={dre.grossRevenue > 0 ? (dre.cmv / dre.grossRevenue) * 100 : 0} />
            <DRERow label="Lucro Bruto" value={dre.grossProfit} highlight bold
              percentage={dre.grossMargin} />

            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider py-2 mt-2">
              Despesas Operacionais
            </p>
            <DRERow label="Total de Despesas Operacionais" value={-dre.operatingExpenses} indent
              percentage={dre.grossRevenue > 0 ? (dre.operatingExpenses / dre.grossRevenue) * 100 : 0} />
            <DRERow label="Resultado Operacional" value={dre.operatingProfit} bold
              percentage={dre.grossRevenue > 0 ? (dre.operatingProfit / dre.grossRevenue) * 100 : 0} />

            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider py-2 mt-2">
              Resultado Final
            </p>
            <DRERow label="Impostos sobre o Lucro" value={-dre.taxes} indent
              percentage={dre.grossRevenue > 0 ? (dre.taxes / dre.grossRevenue) * 100 : 0} />
            <DRERow
              label="Lucro Líquido"
              value={dre.netProfit}
              highlight bold
              percentage={dre.netMargin}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
