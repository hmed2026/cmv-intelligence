'use client';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      containerClassName,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[#9CA3AF]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-11 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl',
              'text-[#F9FAFB] text-sm appearance-none transition-all duration-200',
              'focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10',
              'hover:border-white/20',
              error && 'border-red-500/50 focus:border-red-500/70',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-[#0D1526] text-[#6B7280]">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-[#0D1526] text-[#F9FAFB]"
              >
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7280]">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[#6B7280]">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
