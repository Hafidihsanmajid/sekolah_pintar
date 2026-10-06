'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import { Payment, PaginatedData } from '@/types/api';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import {
  Receipt,
  Printer,
  Ban,
  AlertTriangle,
  GraduationCap,
  Eye,
} from 'lucide-react';

export default function RiwayatTransaksiPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  // View Receipt Modal State
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Void Modal State
  const [voidPayment, setVoidPayment] = useState<Payment | null>(null);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [isVoidSubmitting, setIsVoidSubmitting] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        perPage: 15,
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;

      const res = await apiClient.get<PaginatedData<Payment>>('/payments', { params });
      if (res.success && res.data) {
        setPayments(res.data.items);
        setTotalRows(res.data.pagination.total);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleOpenReceipt = async (paymentId: number) => {
    try {
      const res = await apiClient.get<Payment>(`/payments/${paymentId}`);
      if (res.success && res.data) {
        setSelectedPayment(res.data);
        setIsReceiptModalOpen(true);
      }
    } catch {
      // Handled
    }
  };

  const handleOpenVoid = (payment: Payment) => {
    setVoidPayment(payment);
    setVoidReason('');
    setVoidError(null);
    setIsVoidModalOpen(true);
  };

  const handleConfirmVoid = async () => {
    if (!voidPayment || !voidReason.trim()) {
      setVoidError('Alasan pembatalan (void) wajib diisi');
      return;
    }

    setIsVoidSubmitting(true);
    setVoidError(null);

    try {
      await apiClient.post(`/payments/${voidPayment.id}/void`, {
        reason: voidReason,
      });
      setIsVoidModalOpen(false);
      fetchPayments();
    } catch (err: unknown) {
      const errRes = err as { message?: string };
      setVoidError(errRes.message || 'Gagal membatalkan transaksi');
    } finally {
      setIsVoidSubmitting(false);
    }
  };

  const columns: Column<Payment>[] = [
    {
      key: 'invoiceNumber',
      header: 'No. Invoice',
      isMono: true,
      render: (row) => (
        <div>
          <span className="font-mono font-semibold text-zinc-950 text-xs">
            {row.invoiceNumber}
          </span>
          <div className="text-[11px] text-zinc-400">
            {new Date(row.paymentDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'studentName',
      header: 'Siswa / Rombel',
      render: (row) => (
        <div>
          <div className="font-medium text-zinc-900 text-xs">{row.studentName}</div>
          <div className="text-[11px] text-zinc-400 font-mono">
            NIS: {row.studentNis} • {row.classroomName}
          </div>
        </div>
      ),
    },
    {
      key: 'paymentMethodName',
      header: 'Saluran',
      render: (row) => (
        <Badge variant={row.paymentMethodType === 'cash' ? 'outline' : 'info'} size="sm">
          {row.paymentMethodName}
        </Badge>
      ),
    },
    {
      key: 'cashierName',
      header: 'Kasir',
      render: (row) => <span className="text-xs text-zinc-600">{row.cashierName}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total Bayar',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-semibold text-zinc-950 text-xs">
          {formatRupiah(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'completed' ? 'paid' : 'void'} size="sm">
          {row.status === 'completed' ? 'Selesai' : 'Batal / Void'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenReceipt(row.id);
            }}
            className="px-2 py-1 h-7"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-600 mr-1" />
            <span>Kuitansi</span>
          </Button>

          {isSuperAdmin && row.status === 'completed' && (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenVoid(row);
              }}
              className="px-2 py-1 h-7 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
            >
              <Ban className="w-3.5 h-3.5 text-rose-600 mr-1" />
              <span>Void</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
            Riwayat Transaksi Kasir
          </h1>
          <p className="text-xs text-steel mt-0.5">
            Daftar seluruh transaksi pembayaran masuk dan arsip pembatalan kasir.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-48">
          <SelectField
            options={[
              { label: 'Semua Status', value: '' },
              { label: 'Selesai (Lunas)', value: 'completed' },
              { label: 'Void (Dibatalkan)', value: 'void' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={payments as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Cari berdasarkan nomor invoice atau nama siswa..."
        page={page}
        totalRows={totalRows}
        perPage={15}
        onPageChange={setPage}
        emptyMessage="Belum ada transaksi pembayaran tercatat"
      />

      {/* Modal View Kuitansi */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Bukti Kuitansi Pembayaran"
        size="md"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div
              id="printable-history-receipt"
              className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-950 font-sans text-xs space-y-4"
            >
              {/* Header */}
              <div className="text-center pb-3 border-b border-zinc-200">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white mb-1">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm tracking-tight">SMK PINTAR BANGSA</div>
                <div className="text-[10px] text-zinc-500">
                  Bukti Pembayaran Keuangan Administrasi Siswa
                </div>
              </div>

              {/* Info Header */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pb-3 border-b border-zinc-200 font-mono">
                <div>
                  <span className="text-zinc-400">No. Invoice:</span>
                  <div className="font-bold text-zinc-900">{selectedPayment.invoiceNumber}</div>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400">Tanggal:</span>
                  <div className="text-zinc-900">
                    {new Date(selectedPayment.paymentDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-400">Siswa:</span>
                  <div className="font-semibold text-zinc-900">{selectedPayment.studentName}</div>
                  <div className="text-[10px] text-zinc-500">
                    NIS: {selectedPayment.studentNis} • {selectedPayment.classroomName}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400">Kasir:</span>
                  <div className="text-zinc-900">{selectedPayment.cashierName}</div>
                  <div className="text-[10px] text-zinc-500">
                    {selectedPayment.paymentMethodName}
                  </div>
                </div>
              </div>

              {/* Rincian Pos */}
              <div className="space-y-1.5 py-1">
                <div className="text-[10px] uppercase font-mono text-zinc-400 font-semibold mb-1">
                  Rincian Pos Pembayaran
                </div>
                {selectedPayment.details?.map((d) => (
                  <div key={d.id} className="flex justify-between items-center text-xs">
                    <span className="text-zinc-800">{d.billTitle}</span>
                    <span className="font-mono font-medium text-zinc-900">
                      {formatRupiah(d.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status Void Notice */}
              {selectedPayment.status === 'void' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700">
                    <Ban className="w-4 h-4" />
                    <span>TRANSAKSI INI TELAH DI-VOID (DIBATALKAN)</span>
                  </div>
                  <div className="mt-1 text-[11px] text-rose-600">
                    Alasan: {selectedPayment.voidReason || 'Tidak ada keterangan'}
                  </div>
                </div>
              )}

              {/* Total Bayar */}
              <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                <div>
                  <Badge variant={selectedPayment.status === 'completed' ? 'paid' : 'void'} size="sm">
                    {selectedPayment.status === 'completed' ? 'LUNAS DIVERIFIKASI' : 'DIBATALKAN'}
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase">Total</span>
                  <div className="text-base font-mono font-bold text-zinc-950">
                    {formatRupiah(selectedPayment.totalAmount)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                <span>Cetak Ulang Resi</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsReceiptModalOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Void Transaksi (Super Admin Only) */}
      <Modal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        title="Pembatalan Transaksi (Void)"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>Perhatian:</strong> Membatalkan transaksi nomor{' '}
              <span className="font-mono font-bold">{voidPayment?.invoiceNumber}</span> akan
              mengembalikan status tagihan siswa menjadi belum lunas.
            </div>
          </div>

          {voidError && (
            <div className="p-2.5 bg-rose-100/70 text-rose-800 rounded-lg text-xs">
              {voidError}
            </div>
          )}

          <InputField
            label="Alasan Pembatalan / Void"
            placeholder="Contoh: Salah pilih pos tagihan atau kelebihan nominal..."
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVoidModalOpen(false)}
              disabled={isVoidSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmVoid}
              isLoading={isVoidSubmitting}
            >
              Konfirmasi Void
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
