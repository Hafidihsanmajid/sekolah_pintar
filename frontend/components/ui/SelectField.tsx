import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  options: SelectOption[];
  placeholderOption?: string;
}

export function SelectField({
  label,
  helperText,
  errorMessage,
  options,
  placeholderOption,
  id,
  className,
  disabled,
  ...props
}: SelectFieldProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label ? (
        <label htmlFor={selectId} className="text-xs font-medium text-zinc-700">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        disabled={disabled}
        className={cn(
          'w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-zinc-200/90 text-zinc-950',
          'transition duration-150 ease-in-out cursor-pointer',
          'focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
          'disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed',
          errorMessage && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
          className
        )}
        {...props}
      >
        {placeholderOption ? (
          <option value="" disabled>
            {placeholderOption}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {errorMessage ? (
        <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
      ) : helperText ? (
        <p className="text-xs text-zinc-500">{helperText}</p>
      ) : null}
    </div>
  );
}
