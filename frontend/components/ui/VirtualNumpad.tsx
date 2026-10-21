'use client';

import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VirtualNumpadProps {
  onNumberClick: (digit: string) => void;
  onDelete: () => void;
  onClear: () => void;
  disabled?: boolean;
  className?: string;
}

export function VirtualNumpad({
  onNumberClick,
  onDelete,
  onClear,
  disabled = false,
  className,
}: VirtualNumpadProps) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const baseButtonClass = cn(
    'relative flex flex-col items-center justify-center select-none',
    'h-16 sm:h-20 md:h-22 rounded-2xl font-mono text-2xl sm:text-3xl font-semibold',
    'transition-all duration-150 ease-out active:scale-[0.96] cursor-pointer',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
    'disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100'
  );

  return (
    <div className={cn('grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-sm sm:max-w-md mx-auto', className)}>
      {digits.map((digit) => (
        <button
          key={digit}
          type="button"
          disabled={disabled}
          onClick={() => onNumberClick(digit)}
          className={cn(
            baseButtonClass,
            'bg-white text-zinc-900 border border-zinc-200 shadow-sm',
            'hover:bg-zinc-50 hover:border-zinc-300 active:bg-zinc-100'
          )}
        >
          <span>{digit}</span>
        </button>
      ))}

      {/* Clear Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onClear}
        title="Hapus Semua (Reset)"
        className={cn(
          baseButtonClass,
          'bg-rose-50/70 text-rose-700 border border-rose-200/80 shadow-sm',
          'hover:bg-rose-100 hover:border-rose-300 active:bg-rose-200/80'
        )}
      >
        <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-[10px] sm:text-xs font-sans font-medium tracking-tight mt-0.5 opacity-90">
          Reset
        </span>
      </button>

      {/* Digit 0 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onNumberClick('0')}
        className={cn(
          baseButtonClass,
          'bg-white text-zinc-900 border border-zinc-200 shadow-sm',
          'hover:bg-zinc-50 hover:border-zinc-300 active:bg-zinc-100'
        )}
      >
        <span>0</span>
      </button>

      {/* Backspace Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onDelete}
        title="Hapus Karakter Terakhir"
        className={cn(
          baseButtonClass,
          'bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-sm',
          'hover:bg-zinc-200/80 hover:text-zinc-900 active:bg-zinc-300'
        )}
      >
        <Delete className="w-6 h-6 sm:w-7 sm:h-7" />
        <span className="text-[10px] sm:text-xs font-sans font-medium tracking-tight mt-0.5 opacity-80">
          Hapus
        </span>
      </button>
    </div>
  );
}
