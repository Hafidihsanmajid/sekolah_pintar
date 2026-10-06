'use client';

import React from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  isMono?: boolean;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  page?: number;
  totalRows?: number;
  perPage?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  onSort?: (key: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  page = 1,
  totalRows = data.length,
  perPage = 10,
  onPageChange,
  onRowClick,
  onSort,
  emptyMessage = 'Tidak ada data ditemukan',
  className,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalRows / perPage);

  return (
    <div className={cn('bg-white rounded-2xl border border-zinc-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden', className)}>
      {onSearchChange ? (
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50/60 rounded-lg border border-zinc-200/80 text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="text-xs text-zinc-400 font-mono">
            {totalRows} entri
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50/70 border-b border-zinc-100 text-zinc-500 font-medium">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'py-3 px-4 font-medium',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable && 'cursor-pointer hover:text-zinc-900 select-none'
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      col.align === 'right' && 'justify-end',
                      col.align === 'center' && 'justify-center'
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable ? <ArrowUpDown className="w-3 h-3 text-zinc-400" /> : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-4">
                      <div className="h-4 bg-zinc-100 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-zinc-400">
                  <p className="text-sm font-medium">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors duration-100',
                    onRowClick && 'cursor-pointer hover:bg-zinc-50/80'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'py-3.5 px-4',
                        col.isMono && 'font-mono text-zinc-900',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center'
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : (row[col.key] as React.ReactNode) ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && totalPages > 1 ? (
        <div className="p-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span className="font-mono">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded-md border border-zinc-200 text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1 rounded-md border border-zinc-200 text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
