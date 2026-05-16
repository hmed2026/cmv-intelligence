'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Upload,
  Building2,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Zap,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Transações',
    href: '/transacoes',
    icon: ArrowLeftRight,
  },
  {
    label: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3,
  },
  {
    label: 'Importar',
    href: '/importar',
    icon: Upload,
  },
  {
    label: 'Contas',
    href: '/contas',
    icon: CreditCard,
  },
  {
    label: 'Empresas',
    href: '/empresas',
    icon: Building2,
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function CompanySelector({ collapsed }: { collapsed: boolean }) {
  const { company, companies, selectCompany } = useAuth();
  const [open, setOpen] = useState(false);

  if (!company) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-all group',
          open && 'bg-white/5'
        )}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: company.primaryColor || 'linear-gradient(135deg, #3B82F6, #1E40AF)' }}
        >
          {getInitials(company.name)}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-[#F9FAFB] truncate">{company.name}</p>
              <p className="text-[10px] text-[#6B7280]">Empresa ativa</p>
            </div>
            <ChevronDown
              size={14}
              className={cn(
                'text-[#6B7280] transition-transform shrink-0',
                open && 'rotate-180'
              )}
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && !collapsed && companies.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-10 glass-card overflow-hidden shadow-glass"
          >
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  selectCompany(c);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left',
                  c.id === company.id && 'bg-blue-500/10'
                )}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{
                    background: c.primaryColor || 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                  }}
                >
                  {getInitials(c.name)}
                </div>
                <span className="text-xs text-[#F9FAFB] truncate">{c.name}</span>
                {c.id === company.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[#080E1A] border-r border-white/5 transition-all duration-300',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-white/5 px-3 shrink-0',
          collapsed ? 'justify-center' : 'gap-2.5'
        )}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-glow-blue shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-sm font-bold gradient-text">CMV Intelligence</span>
          </div>
        )}
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            className="ml-auto p-1 rounded-lg text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
        )}
        {onToggleCollapse && collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Company Selector */}
      <div className="px-2 py-3 border-b border-white/5">
        <CompanySelector collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'nav-active'
                  : 'text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/5',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon
                size={17}
                className={cn(
                  'shrink-0 transition-colors',
                  isActive ? 'text-blue-400' : 'text-[#6B7280] group-hover:text-[#9CA3AF]'
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-white/5 p-2">
        {user && (
          <div
            className={cn(
              'flex items-center gap-2.5 p-2 rounded-xl',
              collapsed && 'justify-center'
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {getInitials(user.name)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#F9FAFB] truncate">{user.name}</p>
                <p className="text-[10px] text-[#6B7280] truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? 'Sair' : undefined}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-[#6B7280] hover:text-red-400 hover:bg-red-500/10 transition-all mt-0.5 group',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[220px]"
          >
            <Sidebar onToggleCollapse={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
