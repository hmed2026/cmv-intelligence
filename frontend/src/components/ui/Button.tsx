'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white border-transparent shadow-lg hover:shadow-glow-blue active:scale-[0.98]',
  secondary:
    'bg-white/5 hover:bg-white/10 text-[#F9FAFB] border border-white/10 hover:border-white/20 backdrop-blur-sm',
  danger:
    'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-transparent shadow-lg hover:shadow-glow-red active:scale-[0.98]',
  ghost:
    'bg-transparent hover:bg-white/5 text-[#9CA3AF] hover:text-[#F9FAFB] border-transparent',
  outline:
    'bg-transparent hover:bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:border-blue-500/60',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
