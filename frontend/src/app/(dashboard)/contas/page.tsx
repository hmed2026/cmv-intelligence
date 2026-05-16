'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

interface BankAccount {
  id: string;
  name: string;
  bank: string;
  agency?: string;
  account?: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  balance: number;
  lastTransaction?: { date: string; amount: number; type: 'in' | 'out' };
}

const MOCK_ACCOUNTS: BankAccount[] = [
  {
    id: '1', name: 'Conta Corrente Principal', bank: 'Banco do Brasil',
    agency: '1234-5', account: '98765-4', type: 'CHECKING', balance: 48320.50,
    lastTransaction: { date: '2025-05-15', amount: 12500, type: 'in' },
  },
  {
    id: '2', name: 'Conta Corrente PJ', bank: 'Itaú BBA',
    agency: '5678-9', account: '12345-6', type: 'CHECKING', balance: 22100.00,
    lastTransaction: { date: '2025-05-14', amount: 9800, type: 'out' },
  },
  {
    id: '3', name: 'Conta Poupança Reserva', bank: 'Caixa Econômica',
    account: '77777-0', type: 'SAVINGS', balance: 85400.00,
    lastTransaction: { date: '2025-05-01', amount: 5000, type: 'in' },
  },
  {
    id: '4', name: 'Aplicação CDB', bank: 'XP Investimentos',
    type: 'INVESTMENT', balance: 120000.00,
    lastTransaction: { date: '2025-05-10', amount: 450, type: 'in' },
  },
];

const TYPE_CONFIG = {
  CHECKING:   { label: 'Conta Corrente', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  SAVINGS:    { label: 'Conta Poupança', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  INVESTMENT: { label: 'Investimento',   color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
};

function AccountCard({ account, hidden }: { account: BankAccount; hidden: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = TYPE_CONFIG[account.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass-card p-5 relative overflow-hidden group cursor-pointer"
    >
      {/* Color accent */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
        style={{ backgroundColor: cfg.color }}
      />

      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${cfg.bg}, transparent 70%)` }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: cfg.bg }}
            >
              {account.type === 'INVESTMENT' ? (
                <TrendingUp size={18} style={{ color: cfg.color }} />
              ) : (
                <CreditCard size={18} style={{ color: cfg.color }} />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F9FAFB]">{account.name}</p>
              <p className="text-xs text-[#6B7280]">{account.bank}</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 glass-card p-1 min-w-[130px] shadow-2xl">
                <button className="w-full text-left text-xs px-3 py-2 text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 rounded-lg transition-colors">
                  Editar conta
                </button>
                <button className="w-full text-left text-xs px-3 py-2 text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 rounded-lg transition-colors">
                  Ver transações
                </button>
                <button className="w-full text-left text-xs px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  Remover
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Balance */}
        <div className="mb-4">
          <p className="text-xs text-[#6B7280] mb-1">Saldo disponível</p>
          <p
            className="text-2xl font-bold font-mono-number"
            style={{ color: cfg.color }}
          >
            {hidden ? '••••••' : formatCurrency(account.balance)}
          </p>
        </div>

        {/* Account details */}
        {(account.agency || account.account) && (
          <div className="flex gap-4 mb-4">
            {account.agency && (
              <div>
                <p className="text-[10px] text-[#6B7280]">Agência</p>
                <p className="text-xs text-[#9CA3AF] font-mono">{account.agency}</p>
              </div>
            )}
            {account.account && (
              <div>
                <p className="text-[10px] text-[#6B7280]">Conta</p>
                <p className="text-xs text-[#9CA3AF] font-mono">{account.account}</p>
              </div>
            )}
          </div>
        )}

        {/* Last transaction */}
        {account.lastTransaction && (
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <p className="text-[10px] text-[#6B7280]">Última movimentação</p>
            <div className="flex items-center gap-1.5">
              {account.lastTransaction.type === 'in' ? (
                <ArrowUpRight size={12} className="text-green-400" />
              ) : (
                <ArrowDownRight size={12} className="text-red-400" />
              )}
              <span
                className="text-xs font-semibold font-mono-number"
                style={{ color: account.lastTransaction.type === 'in' ? '#10B981' : '#EF4444' }}
              >
                {hidden ? '•••' : formatCurrency(account.lastTransaction.amount)}
              </span>
            </div>
          </div>
        )}

        {/* Type badge */}
        <div
          className="absolute top-0 right-0 text-[10px] font-semibold px-2 py-0.5 rounded-bl-xl rounded-tr-xl"
          style={{ backgroundColor: cfg.bg, color: cfg.color }}
        >
          {cfg.label}
        </div>
      </div>
    </motion.div>
  );
}

export default function ContasPage() {
  const [hidden, setHidden] = useState(false);

  const totalBalance = MOCK_ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const checkingBalance = MOCK_ACCOUNTS.filter((a) => a.type === 'CHECKING').reduce((s, a) => s + a.balance, 0);
  const investmentBalance = MOCK_ACCOUNTS.filter((a) => a.type === 'INVESTMENT').reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Contas Bancárias</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {MOCK_ACCOUNTS.length} contas cadastradas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHidden(!hidden)}
            className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#F9FAFB] px-3 py-2 rounded-xl hover:bg-white/5 transition-all border border-white/5"
          >
            {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            {hidden ? 'Mostrar saldos' : 'Ocultar saldos'}
          </button>
          <Button variant="primary" size="sm" icon={<Plus size={14} />}>
            Nova Conta
          </Button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          {
            label: 'Saldo Total',
            value: totalBalance,
            icon: Wallet,
            color: '#3B82F6',
            description: 'Todas as contas',
          },
          {
            label: 'Contas Correntes',
            value: checkingBalance,
            icon: CreditCard,
            color: '#10B981',
            description: 'Disponível imediatamente',
          },
          {
            label: 'Investimentos',
            value: investmentBalance,
            icon: TrendingUp,
            color: '#8B5CF6',
            description: 'Aplicações financeiras',
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${item.color}18` }}
              >
                <item.icon size={16} style={{ color: item.color }} />
              </div>
              <span className="text-[10px] text-[#6B7280]">{item.description}</span>
            </div>
            <p className="text-xs text-[#9CA3AF] mb-1">{item.label}</p>
            <p className="text-2xl font-bold font-mono-number" style={{ color: item.color }}>
              {hidden ? '••••••' : formatCurrency(item.value)}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Account cards grid */}
      <div>
        <h3 className="text-sm font-semibold text-[#9CA3AF] mb-3">Suas contas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {MOCK_ACCOUNTS.map((account, i) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
            >
              <AccountCard account={account} hidden={hidden} />
            </motion.div>
          ))}

          {/* Add account card */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + MOCK_ACCOUNTS.length * 0.06 }}
            whileHover={{ y: -2 }}
            className="glass-card p-5 flex flex-col items-center justify-center gap-3 min-h-[180px] border-dashed border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-blue-500/15 flex items-center justify-center transition-colors">
              <Plus size={20} className="text-[#6B7280] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#9CA3AF] group-hover:text-[#F9FAFB] transition-colors">
                Adicionar conta
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Corrente, poupança ou investimento
              </p>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Bank logos strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-4"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Building2 size={14} className="text-[#6B7280]" />
          <p className="text-xs text-[#6B7280]">Bancos suportados:</p>
          {['Banco do Brasil', 'Itaú', 'Bradesco', 'Caixa', 'Santander', 'Nubank', 'XP', 'BTG', 'Sicoob', 'Inter'].map((bank) => (
            <span
              key={bank}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-[#9CA3AF] hover:bg-white/8 hover:text-[#F9FAFB] transition-colors cursor-default"
            >
              {bank}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
