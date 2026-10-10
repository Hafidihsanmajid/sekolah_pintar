'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, RefreshCw, Trash2, X, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertType = 'create' | 'payment' | 'update' | 'delete';

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  duration: number;
}

export interface AlertContextType {
  showAlert: (options: { type: AlertType; message: string; title?: string; duration?: number }) => void;
  showCreateAlert: (message?: string, title?: string) => void;
  showPaymentAlert: (message?: string, title?: string) => void;
  showUpdateAlert: (message?: string, title?: string) => void;
  showDeleteAlert: (message?: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export function triggerAlert(options: { type: AlertType; message: string; title?: string; duration?: number }) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-trigger-alert', { detail: options }));
  }
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const showAlert = useCallback(
    ({
      type,
      message,
      title,
      duration = 3000,
    }: {
      type: AlertType;
      message: string;
      title?: string;
      duration?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      let defaultTitle = 'Pemberitahuan';
      if (type === 'create') defaultTitle = 'Data Berhasil Ditambahkan';
      else if (type === 'payment') defaultTitle = 'Pembayaran Berhasil Diproses';
      else if (type === 'update') defaultTitle = 'Data Berhasil Diperbarui';
      else if (type === 'delete') defaultTitle = 'Data Berhasil Dihapus';

      const alertItem: AlertItem = {
        id,
        type,
        title: title || defaultTitle,
        message,
        duration,
      };

      setAlerts((prev) => [alertItem, ...prev]);

      // Alert hanya 3 detik setelah itu menghilang
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    },
    [removeAlert]
  );

  const showCreateAlert = useCallback(
    (message = 'Data berhasil ditambahkan ke dalam sistem.', title = 'Data Berhasil Ditambahkan') => {
      showAlert({ type: 'create', message, title, duration: 3000 });
    },
    [showAlert]
  );

  const showPaymentAlert = useCallback(
    (message = 'Transaksi pembayaran kasir berhasil diproses.', title = 'Pembayaran Berhasil Diproses') => {
      showAlert({ type: 'payment', message, title, duration: 3000 });
    },
    [showAlert]
  );

  const showUpdateAlert = useCallback(
    (message = 'Perubahan data berhasil disimpan.', title = 'Data Berhasil Diperbarui') => {
      showAlert({ type: 'update', message, title, duration: 3000 });
    },
    [showAlert]
  );

  const showDeleteAlert = useCallback(
    (message = 'Data berhasil dihapus dari sistem.', title = 'Data Berhasil Dihapus') => {
      showAlert({ type: 'delete', message, title, duration: 3000 });
    },
    [showAlert]
  );

  // Global event listener untuk trigger alert dari mana saja
  useEffect(() => {
    const handleCustomAlert = (event: Event) => {
      const customEvent = event as CustomEvent<{
        type: AlertType;
        message: string;
        title?: string;
        duration?: number;
      }>;
      if (customEvent.detail) {
        showAlert(customEvent.detail);
      }
    };

    window.addEventListener('app-trigger-alert', handleCustomAlert);
    return () => window.removeEventListener('app-trigger-alert', handleCustomAlert);
  }, [showAlert]);

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showCreateAlert,
        showPaymentAlert,
        showUpdateAlert,
        showDeleteAlert,
      }}
    >
      {children}

      {/* Floating Container Alert Pojok Kanan Atas */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {alerts.map((alert) => {
          const isGreen = alert.type === 'create' || alert.type === 'payment';
          const isBlue = alert.type === 'update';
          const isRed = alert.type === 'delete';

          return (
            <div
              key={alert.id}
              role="alert"
              className={cn(
                'relative flex items-start gap-3 p-4 rounded-xl shadow-lg border text-white pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-top-3',
                // Hijau untuk tambah data & proses pembayaran
                isGreen && 'bg-emerald-600 border-emerald-500 shadow-emerald-950/20',
                // Biru untuk update data
                isBlue && 'bg-blue-600 border-blue-500 shadow-blue-950/20',
                // Merah untuk hapus data
                isRed && 'bg-rose-600 border-rose-500 shadow-rose-950/20'
              )}
            >
              <div className="shrink-0 mt-0.5">
                {alert.type === 'create' && <CheckCircle2 className="w-5 h-5 text-white" />}
                {alert.type === 'payment' && <CreditCard className="w-5 h-5 text-white" />}
                {alert.type === 'update' && <RefreshCw className="w-5 h-5 text-white" />}
                {alert.type === 'delete' && <Trash2 className="w-5 h-5 text-white" />}
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <div className="text-xs font-semibold leading-tight tracking-tight text-white">
                  {alert.title}
                </div>
                <div className="text-[11px] text-white/90 mt-0.5 break-words leading-relaxed">
                  {alert.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeAlert(alert.id)}
                className="shrink-0 text-white/70 hover:text-white p-0.5 rounded transition cursor-pointer"
                aria-label="Tutup alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </AlertContext.Provider>
  );
}
