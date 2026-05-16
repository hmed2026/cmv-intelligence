'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  Calendar,
  Check,
} from 'lucide-react';
import { cn, getInitials, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const DATE_PRESETS = [
  { label: 'Hoje', value: 'today' },
  { label: 'Esta semana', value: 'week' },
  { label: 'Este mês', value: 'month' },
  { label: 'Últimos 3 meses', value: '3months' },
  { label: 'Este ano', value: 'year' },
  { label: 'Personalizado', value: 'custom' },
];

function getPresetDates(preset: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { startDate: endDate, endDate };
    case 'week': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return { startDate: start.toISOString().split('T')[0], endDate };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start.toISOString().split('T')[0], endDate };
    }
    case '3months': {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 3);
      return { startDate: start.toISOString().split('T')[0], endDate };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start.toISOString().split('T')[0], endDate };
    }
    default:
      return { startDate: endDate, endDate };
  }
}

interface HeaderProps {
  title?: string;
  onMobileMenuOpen?: () => void;
}

export function Header({ title = 'Dashboard', onMobileMenuOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const [datePreset, setDatePreset] = useState('month');
  const [dateOpen, setDateOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setDateOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activePreset = DATE_PRESETS.find((p) => p.value === datePreset);

  return (
    <header className="h-14 border-b border-white/5 flex items-center gap-3 px-4 bg-[#080E1A]/80 backdrop-blur-xl sticky top-0 z-30">
      {/* Mobile menu button */}
      {onMobileMenuOpen && (
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2 rounded-lg text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Title */}
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-[#F9FAFB]">{title}</h1>
      </div>

      {/* Date Range Picker */}
      <div className="relative" ref={dateRef}>
        <button
          onClick={() => setDateOpen(!dateOpen)}
          className={cn(
            'flex items-center gap-2 h-8 px-3 rounded-lg border text-xs font-medium transition-all',
            'bg-white/5 border-white/10 text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-white/20',
            dateOpen && 'border-blue-500/40 text-[#F9FAFB]'
          )}
        >
          <Calendar size={13} className="text-blue-400" />
          <span>{activePreset?.label}</span>
          <ChevronDown size={12} className={cn('transition-transform', dateOpen && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {dateOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-44 glass-card overflow-hidden shadow-glass z-50"
            >
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setDatePreset(preset.value);
                    setDateOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-xs transition-colors',
                    preset.value === datePreset
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
                  )}
                >
                  <span>{preset.label}</span>
                  {preset.value === datePreset && <Check size={12} />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => {
            setNotifOpen(!notifOpen);
            setUserOpen(false);
          }}
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors"
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
        </button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-72 glass-card overflow-hidden shadow-glass z-50"
            >
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-xs font-semibold text-[#F9FAFB]">Notificações</p>
              </div>
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="mx-auto text-[#4B5563] mb-2" />
                <p className="text-xs text-[#6B7280]">Nenhuma notificação</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => {
            setUserOpen(!userOpen);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-lg hover:bg-white/5 transition-colors group"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
            {user ? getInitials(user.name) : 'U'}
          </div>
          <ChevronDown
            size={12}
            className={cn(
              'text-[#6B7280] transition-transform group-hover:text-[#9CA3AF]',
              userOpen && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {userOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-52 glass-card overflow-hidden shadow-glass z-50"
            >
              {user && (
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-xs font-semibold text-[#F9FAFB] truncate">{user.name}</p>
                  <p className="text-[10px] text-[#6B7280] truncate">{user.email}</p>
                </div>
              )}
              <div className="py-1">
                <button className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors">
                  <User size={14} />
                  Meu Perfil
                </button>
                <button className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors">
                  <Settings size={14} />
                  Configurações
                </button>
                <div className="my-1 border-t border-white/5" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
