'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown,
  Trash2,
  Edit2,
  ArrowLeftRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Transaction } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Badge, AIBadge } from '@/components/ui/Badge';

interface TransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
  onEdit?: (t: Transaction) => void;
  onDelete?: (t: Transaction) => void;
  onSelectionChange?: (ids: string[]) => void;
  showActions?: boolean;
  compact?: boolean;
}

type SortKey = 'date' | 'description' | 'amount' | 'type' | 'category';
type SortDir = 'asc' | 'desc';

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={7} className="px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center animate-float">
            <ArrowLeftRight size={24} className="text-[#4B5563]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#6B7280]">Nenhuma transação encontrada</p>
            <p className="text-xs text-[#4B5563] mt-0.5">
              Importe dados ou adicione manualmente
            </p>
          </div>
        </motion.div>
      </td>
    </tr>
  );
}

export function TransactionTable({
  transactions,
  loading = false,
  onEdit,
  onDelete,
  onSelectionChange,
  showActions = true,
  compact = false,
}: TransactionTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
    onSelectionChange?.(Array.from(next));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    } else {
      const all = new Set(transactions.map((t) => t.id));
      setSelectedIds(all);
      onSelectionChange?.(Array.from(all));
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...transactions].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';
    switch (sortKey) {
      case 'date': aVal = a.date; bVal = b.date; break;
      case 'description': aVal = a.description; bVal = b.description; break;
      case 'amount': aVal = a.amount; bVal = b.amount; break;
      case 'type': aVal = a.type; bVal = b.type; break;
      case 'category': aVal = a.category || ''; bVal = b.category || ''; break;
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-[#4B5563]" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-blue-400" />
      : <ChevronDown size={12} className="text-blue-400" />;
  };

  const getAmountStyle = (type: Transaction['type'], amount: number) => {
    if (type === 'REVENUE') return 'text-emerald-400';
    if (type === 'EXPENSE' || type === 'CMV' || type === 'TAX' || type === 'WITHDRAWAL')
      return 'text-red-400';
    return 'text-[#9CA3AF]';
  };

  const getAmountPrefix = (type: Transaction['type']) => {
    if (type === 'REVENUE') return '+';
    if (type === 'EXPENSE' || type === 'CMV' || type === 'TAX' || type === 'WITHDRAWAL')
      return '-';
    return '';
  };

  const thCls = 'px-4 py-3 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap';
  const tdCls = cn('px-4 text-sm transition-colors', compact ? 'py-2.5' : 'py-3.5');

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-white/5">
            {onSelectionChange && (
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={transactions.length > 0 && selectedIds.size === transactions.length}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-blue-500 cursor-pointer"
                />
              </th>
            )}
            <th
              className={cn(thCls, 'cursor-pointer hover:text-[#9CA3AF]')}
              onClick={() => handleSort('date')}
            >
              <span className="flex items-center gap-1.5">Data <SortIcon col="date" /></span>
            </th>
            <th
              className={cn(thCls, 'cursor-pointer hover:text-[#9CA3AF]')}
              onClick={() => handleSort('description')}
            >
              <span className="flex items-center gap-1.5">Descrição <SortIcon col="description" /></span>
            </th>
            <th
              className={cn(thCls, 'cursor-pointer hover:text-[#9CA3AF]')}
              onClick={() => handleSort('type')}
            >
              <span className="flex items-center gap-1.5">Tipo <SortIcon col="type" /></span>
            </th>
            <th className={thCls}>Categoria</th>
            <th
              className={cn(thCls, 'text-right cursor-pointer hover:text-[#9CA3AF]')}
              onClick={() => handleSort('amount')}
            >
              <span className="flex items-center justify-end gap-1.5">Valor <SortIcon col="amount" /></span>
            </th>
            {showActions && <th className={cn(thCls, 'text-right')}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
          ) : sorted.length === 0 ? (
            <EmptyState />
          ) : (
            <AnimatePresence initial={false}>
              {sorted.map((t, idx) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={cn(
                    'border-b border-white/5 table-row-hover group',
                    selectedIds.has(t.id) && 'bg-blue-500/5'
                  )}
                >
                  {onSelectionChange && (
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-blue-500 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className={tdCls}>
                    <span className="text-[#6B7280] text-xs font-mono-number">
                      {formatDate(t.date)}
                    </span>
                  </td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#F9FAFB] text-sm truncate max-w-[200px]">
                        {t.description}
                      </span>
                      {t.aiClassified && (
                        <AIBadge confidence={t.aiConfidence} />
                      )}
                    </div>
                  </td>
                  <td className={tdCls}>
                    <Badge type={t.type} />
                  </td>
                  <td className={tdCls}>
                    {t.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-xs text-[#9CA3AF]">
                        {t.category}
                      </span>
                    )}
                  </td>
                  <td className={cn(tdCls, 'text-right')}>
                    <span
                      className={cn(
                        'font-semibold font-mono-number text-sm',
                        getAmountStyle(t.type, t.amount)
                      )}
                    >
                      {getAmountPrefix(t.type)}
                      {formatCurrency(Math.abs(t.amount))}
                    </span>
                  </td>
                  {showActions && (
                    <td className={cn(tdCls, 'text-right')}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(t)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(t)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  );
}
