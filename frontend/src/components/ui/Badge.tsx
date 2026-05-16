'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TransactionType } from '@/types';
import {
  getTransactionTypeLabel,
  getTransactionTypeColor,
  getTransactionTypeBg,
} from '@/lib/utils';

interface BadgeProps {
  type?: TransactionType;
  label?: string;
  color?: string;
  bg?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function Badge({
  type,
  label,
  color,
  bg,
  size = 'sm',
  dot = true,
  className,
}: BadgeProps) {
  const resolvedLabel = label ?? (type ? getTransactionTypeLabel(type) : '');
  const resolvedColor = color ?? (type ? getTransactionTypeColor(type) : '#9CA3AF');
  const resolvedBg = bg ?? (type ? getTransactionTypeBg(type) : 'rgba(156, 163, 175, 0.1)');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap',
        size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5',
        className
      )}
      style={{
        color: resolvedColor,
        backgroundColor: resolvedBg,
        border: `1px solid ${resolvedColor}33`,
      }}
    >
      {dot && (
        <span
          className="rounded-full shrink-0"
          style={{
            width: size === 'sm' ? 5 : 6,
            height: size === 'sm' ? 5 : 6,
            backgroundColor: resolvedColor,
          }}
        />
      )}
      {resolvedLabel}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    PROCESSING: {
      label: 'Processando',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    COMPLETED: {
      label: 'Concluído',
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    FAILED: {
      label: 'Falhou',
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.1)',
    },
  };

  const c = config[status];
  return (
    <Badge
      label={c.label}
      color={c.color}
      bg={c.bg}
      className={className}
    />
  );
}

interface AIBadgeProps {
  confidence?: number;
  className?: string;
}

export function AIBadge({ confidence, className }: AIBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        'bg-purple-500/10 text-purple-400 border border-purple-500/20',
        className
      )}
    >
      <span className="text-[10px]">✦</span>
      IA
      {confidence !== undefined && (
        <span className="text-purple-300/70 text-[10px]">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </span>
  );
}
