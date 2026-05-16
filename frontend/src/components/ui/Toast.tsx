'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const CONFIG: Record<ToastType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' },
  error:   { icon: XCircle,      color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)' },
  warning: { icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  info:    { icon: Info,          color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
    setTimeout(() => remove(id), 4500);
  }, [remove]);

  const toast = {
    success: (title: string, msg?: string) => add('success', title, msg),
    error:   (title: string, msg?: string) => add('error', title, msg),
    warning: (title: string, msg?: string) => add('warning', title, msg),
    info:    (title: string, msg?: string) => add('info', title, msg),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const cfg = CONFIG[t.type];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[360px] px-4 py-3.5 rounded-2xl backdrop-blur-xl shadow-2xl"
                style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <Icon size={16} className="shrink-0 mt-0.5" style={{ color: cfg.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#F9FAFB] leading-tight">{t.title}</p>
                  {t.message && (
                    <p className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">{t.message}</p>
                  )}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="shrink-0 p-0.5 rounded text-[#6B7280] hover:text-[#F9FAFB] transition-colors"
                >
                  <X size={13} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue['toast'] {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}
