'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export function SlideOver({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
}: SlideOverProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-zinc-950/30 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 flex pl-10 max-w-full">
        <div
          className={cn(
            'w-screen bg-white shadow-2xl border-l border-zinc-200/90 flex flex-col justify-between',
            widthClasses[width]
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-start justify-between p-5 border-b border-zinc-100">
            <div>
              {title && (
                <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
              )}
              {description && (
                <p className="mt-1 text-xs text-zinc-500">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-4">{children}</div>

          {footer && (
            <div className="p-4 bg-zinc-50/70 border-t border-zinc-100 flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
