import React from 'react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white p-5 rounded-2xl border border-zinc-200/80',
        'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col justify-between gap-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</span>
        {icon ? <div className="text-zinc-400">{icon}</div> : null}
      </div>

      <div>
        <div className="text-2xl font-mono font-semibold tracking-tight text-zinc-950">
          {value}
        </div>
        {subtitle ? (
          <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
        ) : null}
      </div>

      {trend ? (
        <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-100 text-xs">
          <span
            className={cn(
              'font-mono font-medium',
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            )}
          >
            {trend.value}
          </span>
          <span className="text-zinc-400">vs periode lalu</span>
        </div>
      ) : null}
    </div>
  );
}
