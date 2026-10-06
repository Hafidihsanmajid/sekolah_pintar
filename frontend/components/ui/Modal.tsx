'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {
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

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl border border-zinc-200/90 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden z-10 flex flex-col max-h-[90vh]',
          maxWidthClasses[maxWidth]
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
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
        )}

        <div className="p-5 overflow-y-auto space-y-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 p-4 bg-zinc-50/60 border-t border-zinc-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
