'use client';

import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      prefixIcon,
      suffixIcon,
      showPasswordToggle,
      containerClassName,
      className,
      type,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const inputType =
      showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#9CA3AF]"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {prefixIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] group-focus-within:text-blue-400 transition-colors pointer-events-none">
              {prefixIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              'w-full h-11 bg-white/5 border border-white/10 rounded-xl text-[#F9FAFB] placeholder:text-[#4B5563] text-sm transition-all duration-200',
              'focus:outline-none focus:border-blue-500/50 focus:bg-white/7 focus:ring-2 focus:ring-blue-500/10',
              'hover:border-white/20',
              prefixIcon ? 'pl-10' : 'pl-4',
              (suffixIcon || showPasswordToggle) ? 'pr-10' : 'pr-4',
              error && 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10',
              className
            )}
            {...props}
          />
          {(suffixIcon || showPasswordToggle) && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {showPasswordToggle ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#6B7280] hover:text-[#9CA3AF] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              ) : (
                <span className="text-[#6B7280] pointer-events-none">{suffixIcon}</span>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] shrink-0">!</span>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-[#6B7280]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
