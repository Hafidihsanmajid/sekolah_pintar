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
  Filter,
  FileSpreadsheet,
  RotateCcw,
  Download,
} from 'lucide-react';

export default function RiwayatTransaksiPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
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

  // Cetak Excel State
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelPreviewData, setExcelPreviewData] = useState<{
    items: Payment[];
    startDate: string;
    endDate: string;
    status: string;
    totalAmount: number;
  } | null>(null);

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
      if (appliedStatusFilter) params.status = appliedStatusFilter;
      if (appliedStartDate) params.startDate = appliedStartDate;
      if (appliedEndDate) params.endDate = appliedEndDate;

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
  }, [page, searchQuery, appliedStatusFilter, appliedStartDate, appliedEndDate]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleApplyFilter = () => {
    setAppliedStatusFilter(statusFilter);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setPage(1);
  };

  const handleResetFilter = () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setAppliedStatusFilter('');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setPage(1);
  };

  const downloadExcelTable = (
    items: Payment[],
    periodStart: string,
    periodEnd: string,
    filterStatus: string
  ) => {
    const downloadDate = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const periodLabel =
      periodStart && periodEnd
        ? `${periodStart} s/d ${periodEnd}`
        : periodStart
        ? `Mulai ${periodStart}`
        : periodEnd
        ? `Sampai ${periodEnd}`
        : 'Semua Periode';

    const statusLabel =
      filterStatus === 'completed'
        ? 'Selesai (Lunas)'
        : filterStatus === 'void'
        ? 'Void (Dibatalkan)'
        : 'Semua Status';

    const totalLunas = items
      .filter((i) => i.status === 'completed')
      .reduce((sum, i) => sum + i.totalAmount, 0);

    const grandTotal = items.reduce((sum, i) => sum + i.totalAmount, 0);

    const tableRows = items
      .map((item, index) => {
        const formattedDate = new Date(item.paymentDate).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const isCompleted = item.status === 'completed';

        return `
          <tr>
            <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px;">${index + 1}</td>
            <td style="border: 1px solid #d1d5db; padding: 6px; mso-number-format:'\\@'; font-family: monospace;">${item.invoiceNumber}</td>
            <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px;">${formattedDate}</td>
            <td style="border: 1px solid #d1d5db; padding: 6px; mso-number-format:'\\@'; font-family: monospace;">${item.studentNis}</td>
            <td style="border: 1px solid #d1d5db; padding: 6px;">${item.studentName}</td>
            <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${item.classroomName || '-'}</td>
            <td style="border: 1px solid #d1d5db; padding: 6px;">${item.paymentMethodName}</td>
            <td style="border: 1px solid #d1d5db; padding: 6px;">${item.cashierName}</td>
            <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; font-weight: bold; color: ${isCompleted ? '#047857' : '#b91c1c'};">
              ${isCompleted ? 'Selesai' : 'Void'}
            </td>
            <td style="text-align: right; border: 1px solid #d1d5db; padding: 6px; mso-number-format:'\\#\\,\\#\\#0'; font-family: monospace;">
              ${item.totalAmount}
            </td>
          </tr>
        `;
      })
      .join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Riwayat Transaksi</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
          .title { font-size: 15pt; font-weight: bold; text-align: center; color: #064e3b; }
          .subtitle { font-size: 10pt; color: #4b5563; text-align: center; }
          .meta-label { font-weight: bold; color: #374151; font-size: 10pt; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="10" class="title">LAPORAN RIWAYAT TRANSAKSI KASIR</td></tr>
          <tr><td colspan="10" class="subtitle">SMK PINTAR BANGSA - SISTEM KEUANGAN SEKOLAH</td></tr>
          <tr><td colspan="10"></td></tr>
          <tr><td colspan="2" class="meta-label">Periode Transaksi:</td><td colspan="8">${periodLabel}</td></tr>
          <tr><td colspan="2" class="meta-label">Status Transaksi:</td><td colspan="8">${statusLabel}</td></tr>
          <tr><td colspan="2" class="meta-label">Tanggal Unduh:</td><td colspan="8">${downloadDate}</td></tr>
          <tr><td colspan="2" class="meta-label">Total Data:</td><td colspan="8">${items.length} Transaksi</td></tr>
          <tr><td colspan="10"></td></tr>
        </table>

        <table border="1" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #059669; color: #ffffff; font-weight: bold;">
              <th style="background-color: #059669; color: #ffffff; border: 1px solid #047857; padding: 8px; text-align: center; width: 45px;">No</th>
              <th style="background-color: #059669; color: #ffffff; border: 1px solid #047857; padding: 8px; text-align: center; width: 140px;">No. Invoice</th>
              <th style="background-color: #059669; color: #ffffff; border: 1px solid #047857; padding: 8px; text-align: center; width: 140px;">Tanggal Transaksi</th>
              <th style="background-color: #059669; color: #ffffff; border: 1px solid #047857; padding: 8px; text-align: center; width: 100px;">NIS Siswa</th>
              <th style="background-color: #059669; color: #ffffff; border: 1px solid #047857; padding: 8px; text-align: left; width: 180px;">Nama Siswa</th>
              <th style="background-color: #059669; color: #ffffff; border: 1px solid #047857; padding: 8px; text-align: center; width: 100px;">Kelas</th>
              <th style="background-color: #059669; color: #ffffff; border: 1px solid #047857; padding: 8px; text-align: left; width: 130px;">Saluran Bayar</th>
              <th style="background-color: #059669; color: #ffffff; border: 1px solid #047857; padding: 8px; text-align: left; width: 130px;">Kasir</th>
              <th style="background-color: #059669; color: #ffffff; border: 1px solid #047857; padding: 8px; text-align: center; width: 100px;">Status</th>
              <th style="background-color: #059669; color: #ffffff; border: 1px solid #047857; padding: 8px; text-align: right; width: 130px;">Total Bayar (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr style="background-color: #e5e7eb; font-weight: bold;">
              <td colspan="9" style="text-align: right; border: 1px solid #9ca3af; padding: 8px;">TOTAL NOMINAL LUNAS:</td>
              <td style="text-align: right; border: 1px solid #9ca3af; padding: 8px; mso-number-format:'\\#\\,\\#\\#0'; font-family: monospace;">${totalLunas}</td>
            </tr>
            <tr style="background-color: #f3f4f6; font-weight: bold;">
              <td colspan="9" style="text-align: right; border: 1px solid #9ca3af; padding: 8px;">TOTAL NOMINAL KESELURUHAN:</td>
              <td style="text-align: right; border: 1px solid #9ca3af; padding: 8px; mso-number-format:'\\#\\,\\#\\#0'; font-family: monospace;">${grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanStart = periodStart ? periodStart.replace(/-/g, '') : 'Semua';
    const cleanEnd = periodEnd ? periodEnd.replace(/-/g, '') : 'Semua';
    link.download = `Riwayat_Transaksi_${cleanStart}_sd_${cleanEnd}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const currentStart = appliedStartDate || startDate;
      const currentEnd = appliedEndDate || endDate;
      const currentStatus = appliedStatusFilter || statusFilter;

      const params: Record<string, string | number> = {
        page: 1,
        perPage: 10000,
      };
      if (searchQuery) params.search = searchQuery;
      if (currentStatus) params.status = currentStatus;
      if (currentStart) params.startDate = currentStart;
      if (currentEnd) params.endDate = currentEnd;

      const res = await apiClient.get<PaginatedData<Payment>>('/payments', { params });
      const items = res.data?.items || [];
      const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

      downloadExcelTable(items, currentStart, currentEnd, currentStatus);

      setExcelPreviewData({
        items,
        startDate: currentStart,
        endDate: currentEnd,
        status: currentStatus,
        totalAmount,
      });
      setIsExcelModalOpen(true);
    } catch {
      // Handled
    } finally {
      setIsExportingExcel(false);
    }
  };

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
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-wrap items-center gap-3">
        {/* Dropdown Status */}
        <div className="w-full sm:w-44">
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

        {/* Filter Dari Tanggal */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-zinc-500 font-medium shrink-0">Dari:</span>
          <div className="w-full sm:w-36">
            <InputField
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyFilter();
              }}
              className="py-1.5 text-xs font-mono"
            />
          </div>
        </div>

        {/* Filter Sampai Tanggal */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-zinc-500 font-medium shrink-0">Sampai:</span>
          <div className="w-full sm:w-36">
            <InputField
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyFilter();
              }}
              className="py-1.5 text-xs font-mono"
            />
          </div>
        </div>

        {/* Tombol Filter */}
        <Button
          variant="primary"
          size="md"
          onClick={handleApplyFilter}
          isLoading={isLoading}
          className="w-full sm:w-auto cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5 mr-1.5" />
          <span>Filter</span>
        </Button>

        {/* Tombol Reset */}
        {(appliedStartDate || appliedEndDate || appliedStatusFilter || startDate || endDate || statusFilter) && (
          <Button
            variant="outline"
            size="md"
            onClick={handleResetFilter}
            className="w-full sm:w-auto cursor-pointer text-zinc-600 hover:text-zinc-900"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reset</span>
          </Button>
        )}

        {/* Tombol Cetak Excel */}
        <div className="w-full sm:w-auto sm:ml-auto">
          <Button
            variant="outline"
            size="md"
            onClick={handleExportExcel}
            isLoading={isExportingExcel}
            className="w-full sm:w-auto cursor-pointer border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-600"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            <span>Cetak Excel</span>
          </Button>
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
      {/* Modal Pratinjau & Tabel Cetak Excel */}
      <Modal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="Tabel Hasil Cetak Excel Transaksi"
        description="Pratinjau tabel laporan yang telah diekspor dan dicetak ke dalam format spreadsheet Excel."
        size="3xl"
      >
        {excelPreviewData && (
          <div className="space-y-4">
            {/* Meta Info Banner */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-semibold text-zinc-950 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>File Excel Berhasil Digenerate</span>
                </div>
                <div className="text-zinc-600 text-[11px] mt-0.5 font-mono">
                  Periode:{' '}
                  {excelPreviewData.startDate && excelPreviewData.endDate
                    ? `${excelPreviewData.startDate} s/d ${excelPreviewData.endDate}`
                    : excelPreviewData.startDate
                    ? `Mulai ${excelPreviewData.startDate}`
                    : excelPreviewData.endDate
                    ? `Sampai ${excelPreviewData.endDate}`
                    : 'Semua Periode'}{' '}
                  • Status:{' '}
                  {excelPreviewData.status === 'completed'
                    ? 'Selesai'
                    : excelPreviewData.status === 'void'
                    ? 'Void'
                    : 'Semua Status'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="paid" size="sm">
                  {excelPreviewData.items.length} Baris Transaksi
                </Badge>
              </div>
            </div>

            {/* Tabel Cetak Excel */}
            <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
              <div className="max-h-72 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-emerald-700 text-white font-medium sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-2.5 text-center w-10 border-b border-emerald-800">No</th>
                      <th className="py-2 px-2.5 border-b border-emerald-800">No. Invoice</th>
                      <th className="py-2 px-2.5 text-center border-b border-emerald-800">Tanggal</th>
                      <th className="py-2 px-2.5 border-b border-emerald-800">Siswa / Rombel</th>
                      <th className="py-2 px-2.5 border-b border-emerald-800">Saluran</th>
                      <th className="py-2 px-2.5 border-b border-emerald-800">Kasir</th>
                      <th className="py-2 px-2.5 text-center border-b border-emerald-800">Status</th>
                      <th className="py-2 px-2.5 text-right border-b border-emerald-800">Total Bayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-800 bg-white">
                    {excelPreviewData.items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-zinc-400">
                          Tidak ada data transaksi pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      excelPreviewData.items.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-2 px-2.5 text-center font-mono text-zinc-400 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2.5 font-mono font-medium text-zinc-950 text-[11px]">
                            {row.invoiceNumber}
                          </td>
                          <td className="py-2 px-2.5 text-center text-zinc-500 text-[11px] font-mono">
                            {new Date(row.paymentDate).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-2 px-2.5">
                            <div className="font-medium text-zinc-900">{row.studentName}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              NIS: {row.studentNis} • {row.classroomName}
                            </div>
                          </td>
                          <td className="py-2 px-2.5">
                            <span className="text-[11px] text-zinc-600">
                              {row.paymentMethodName}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-zinc-600 text-[11px]">
                            {row.cashierName}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <Badge variant={row.status === 'completed' ? 'paid' : 'void'} size="sm">
                              {row.status === 'completed' ? 'Selesai' : 'Void'}
                            </Badge>
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-semibold text-zinc-950 text-[11px]">
                            {formatRupiah(row.totalAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {excelPreviewData.items.length > 0 && (
                    <tfoot className="bg-zinc-50 border-t border-zinc-200 text-xs font-semibold text-zinc-950">
                      <tr>
                        <td colSpan={7} className="py-2.5 px-3 text-right text-zinc-600 font-medium">
                          Total Keseluruhan:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                          {formatRupiah(excelPreviewData.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadExcelTable(
                    excelPreviewData.items,
                    excelPreviewData.startDate,
                    excelPreviewData.endDate,
                    excelPreviewData.status
                  )
                }
                className="cursor-pointer border-emerald-600/40 text-emerald-700 hover:bg-emerald-50"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                <span>Unduh Ulang File Excel (.xls)</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsExcelModalOpen(false)}
                className="cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
