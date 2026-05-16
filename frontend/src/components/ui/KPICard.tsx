'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type CardColor = 'blue' | 'green' | 'red' | 'orange' | 'purple';

interface KPICardProps {
  title: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  color?: CardColor;
  loading?: boolean;
  subtitle?: string;
  delay?: number;
}

const colorConfig: Record<CardColor, {
  gradient: string;
  glow: string;
  iconBg: string;
  borderLeft: string;
  trendPositive: string;
  trendNegative: string;
}> = {
  blue: {
    gradient: 'from-blue-500/10 to-transparent',
    glow: 'hover:shadow-glow-blue',
    iconBg: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    borderLeft: 'bg-gradient-to-b from-blue-500 to-blue-700',
    trendPositive: 'text-blue-400',
    trendNegative: 'text-red-400',
  },
  green: {
    gradient: 'from-emerald-500/10 to-transparent',
    glow: 'hover:shadow-glow-green',
    iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    borderLeft: 'bg-gradient-to-b from-emerald-400 to-emerald-600',
    trendPositive: 'text-emerald-400',
    trendNegative: 'text-red-400',
  },
  red: {
    gradient: 'from-red-500/10 to-transparent',
    glow: 'hover:shadow-glow-red',
    iconBg: 'bg-red-500/15 text-red-400 border-red-500/20',
    borderLeft: 'bg-gradient-to-b from-red-400 to-red-600',
    trendPositive: 'text-emerald-400',
    trendNegative: 'text-red-400',
  },
  orange: {
    gradient: 'from-orange-500/10 to-transparent',
    glow: 'hover:shadow-glow-orange',
    iconBg: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    borderLeft: 'bg-gradient-to-b from-orange-400 to-orange-600',
    trendPositive: 'text-emerald-400',
    trendNegative: 'text-red-400',
  },
  purple: {
    gradient: 'from-purple-500/10 to-transparent',
    glow: 'hover:shadow-glow-blue',
    iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    borderLeft: 'bg-gradient-to-b from-purple-400 to-purple-600',
    trendPositive: 'text-emerald-400',
    trendNegative: 'text-red-400',
  },
};

function SkeletonKPICard() {
  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-10 w-10 rounded-xl" />
      </div>
      <div className="skeleton h-8 w-40 rounded mb-2" />
      <div className="skeleton h-3 w-24 rounded" />
    </div>
  );
}

export function KPICard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  color = 'blue',
  loading = false,
  subtitle,
  delay = 0,
}: KPICardProps) {
  const cfg = colorConfig[color];

  if (loading) {
    return <SkeletonKPICard />;
  }

  const trendIsPositive = trend !== undefined ? trend >= 0 : true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'glass-card glass-card-hover p-6 relative overflow-hidden cursor-default',
        cfg.glow,
        'transition-all duration-300'
      )}
    >
      {/* Left accent border */}
      <div className={cn('absolute left-0 top-4 bottom-4 w-0.5 rounded-full', cfg.borderLeft)} />

      {/* Background gradient */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none',
          cfg.gradient
        )}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-[#9CA3AF]">{title}</p>
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border',
              cfg.iconBg
            )}
          >
            {icon}
          </div>
        </div>

        {/* Value */}
        <div className="mb-2">
          <p className="text-2xl font-bold text-[#F9FAFB] font-mono-number tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Trend */}
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trendIsPositive ? cfg.trendPositive : cfg.trendNegative
            )}
          >
            {trendIsPositive ? (
              <TrendingUp size={13} />
            ) : (
              <TrendingDown size={13} />
            )}
            <span>
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
            {trendLabel && (
              <span className="text-[#6B7280] font-normal ml-0.5">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
