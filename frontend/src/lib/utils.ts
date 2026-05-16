import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TransactionType } from '@/types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: string | Date, format?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  if (format === 'short') {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
  if (format === 'month-year') {
    return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  }
  if (format === 'long') {
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
  if (format === 'datetime') {
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    REVENUE: 'Receita',
    EXPENSE: 'Despesa',
    TAX: 'Imposto',
    WITHDRAWAL: 'Retirada',
    TRANSFER: 'Transferência',
    CMV: 'CMV',
  };
  return labels[type] || type;
}

export function getTransactionTypeColor(type: TransactionType): string {
  const colors: Record<TransactionType, string> = {
    REVENUE: '#10B981',
    EXPENSE: '#EF4444',
    TAX: '#F59E0B',
    WITHDRAWAL: '#8B5CF6',
    TRANSFER: '#6B7280',
    CMV: '#F97316',
  };
  return colors[type] || '#9CA3AF';
}

export function getTransactionTypeBg(type: TransactionType): string {
  const bgs: Record<TransactionType, string> = {
    REVENUE: 'rgba(16, 185, 129, 0.1)',
    EXPENSE: 'rgba(239, 68, 68, 0.1)',
    TAX: 'rgba(245, 158, 11, 0.1)',
    WITHDRAWAL: 'rgba(139, 92, 246, 0.1)',
    TRANSFER: 'rgba(107, 114, 128, 0.1)',
    CMV: 'rgba(249, 115, 22, 0.1)',
  };
  return bgs[type] || 'rgba(156, 163, 175, 0.1)';
}

export function getTransactionTypeBorder(type: TransactionType): string {
  const borders: Record<TransactionType, string> = {
    REVENUE: 'rgba(16, 185, 129, 0.3)',
    EXPENSE: 'rgba(239, 68, 68, 0.3)',
    TAX: 'rgba(245, 158, 11, 0.3)',
    WITHDRAWAL: 'rgba(139, 92, 246, 0.3)',
    TRANSFER: 'rgba(107, 114, 128, 0.3)',
    CMV: 'rgba(249, 115, 22, 0.3)',
  };
  return borders[type] || 'rgba(156, 163, 175, 0.3)';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function classifyTrend(current: number, previous: number): {
  value: number;
  isPositive: boolean;
  label: string;
} {
  if (previous === 0) return { value: 0, isPositive: true, label: '0%' };
  const diff = ((current - previous) / Math.abs(previous)) * 100;
  return {
    value: Math.abs(diff),
    isPositive: diff >= 0,
    label: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`,
  };
}

export function getMonthName(monthIndex: number, short = false): string {
  const months = short
    ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    : [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ];
  return months[monthIndex] || '';
}

export function getCurrentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}
