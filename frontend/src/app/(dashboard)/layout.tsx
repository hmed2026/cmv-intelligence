'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, MobileSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transacoes': 'Transações',
  '/relatorios': 'Relatórios',
  '/importar': 'Importar Dados',
  '/contas': 'Contas Bancárias',
  '/empresas': 'Empresas',
  '/configuracoes': 'Configurações',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080E1A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center animate-pulse-glow">
            <span className="text-white font-bold">C</span>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  const pageTitle = pageTitles[pathname] || 'CMV Intelligence';

  return (
    <div className="flex h-screen bg-[#080E1A] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={pageTitle}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-mesh">
          {children}
        </main>
      </div>
    </div>
  );
}
