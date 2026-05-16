'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-5xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  className,
}: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
    }
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'relative w-full rounded-2xl overflow-hidden',
              'bg-[#0D1526] border border-white/10',
              'shadow-[0_25px_60px_rgba(0,0,0,0.6)]',
              sizeClasses[size],
              className
            )}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-start justify-between p-6 pb-4 border-b border-white/5">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-[#F9FAFB]">{title}</h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-[#9CA3AF]">{description}</p>
                  )}
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="ml-4 p-1.5 rounded-lg text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/5 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className={cn(!title && !showClose ? 'p-6' : 'px-6 py-4 pb-6')}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex gap-3 mt-2">
        <button
          onClick={onClose}
          className="flex-1 h-10 rounded-xl border border-white/10 text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 transition-all text-sm font-medium"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            'flex-1 h-10 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50',
            variant === 'danger'
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'
          )}
        >
          {loading ? 'Aguarde...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
