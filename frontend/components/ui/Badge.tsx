import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'paid' | 'pending' | 'void' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    void: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
