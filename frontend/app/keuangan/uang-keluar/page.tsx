'use client';

import React, { useState, useMemo } from 'react';
import { ExpenseItem } from '@/types/api';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import {
  FileSpreadsheet,
  Printer,
  TrendingDown,
  Receipt,
  PlusCircle,
  Search,
  Trash2,
  Layers,
  CheckCircle2,
} from 'lucide-react';

const STORAGE_KEY = 'sekolah_pintar_uang_keluar';

const EXPENSE_CATEGORIES = [
  { label: 'Operasional Sekolah & ATK', value: 'Operasional Sekolah & ATK' },
  { label: 'Sarana & Prasarana', value: 'Sarana & Prasarana' },
  { label: 'Honorarium & Pembicara', value: 'Honorarium & Pembicara' },
  { label: 'Kegiatan Siswa & Ekstrakurikuler', value: 'Kegiatan Siswa & Ekstrakurikuler' },
  { label: 'Konsumsi & Logistik', value: 'Konsumsi & Logistik' },
  { label: 'Pemeliharaan & Utilitas', value: 'Pemeliharaan & Utilitas' },
  { label: 'Lain-lain', value: 'Lain-lain' },
];

const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 1,
    invoiceNumber: 'OUT/20261008/0001',
    title: 'Pembelian Kertas HVS & Tinta Printer',
    category: 'Operasional Sekolah & ATK',
    purpose: 'Kebutuhan administrasi ruang TU dan cetak berkas ujian tengah semester',
    amount: 850000,
    date: '2026-10-08',
    notes: 'Kasir TU (Tunai)',
    createdAt: '2026-10-08T09:30:00Z',
  },
  {
    id: 2,
    invoiceNumber: 'OUT/20261009/0002',
    title: 'Servis & Perawatan AC Lab Komputer',
    category: 'Sarana & Prasarana',
    purpose: 'Pemeliharaan berkala 4 unit AC ruang praktikum komputer siswa',
    amount: 1200000,
    date: '2026-10-09',
    notes: 'Transfer Bank',
    createdAt: '2026-10-09T14:15:00Z',
  },
  {
    id: 3,
    invoiceNumber: 'OUT/20261010/0003',
    title: 'Konsumsi Rapat Koordinasi Kurikulum',
    category: 'Konsumsi & Logistik',
    purpose: 'Konsumsi snack dan makan siang dewan guru evaluasi pembelajaran semester ganjil',
    amount: 450000,
    date: '2026-10-10',
    notes: 'Kasir TU (Tunai)',
    createdAt: '2026-10-10T11:00:00Z',
  },
];

export default function UangKeluarPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Fallback ke default
      }
    }
    return INITIAL_EXPENSES;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].value);
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Kas Tunai (Kasir TU)');

  // Form UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hitung invoice auto increment berikutnya berdasarkan data saat ini
  const nextInvoiceNumber = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `OUT/${year}${month}${day}/`;

    // Cari sequence terbesar
    let maxSeq = 0;
    expenses.forEach((item) => {
      if (item.invoiceNumber) {
        const parts = item.invoiceNumber.split('/');
        if (parts.length === 3) {
          const seqNum = parseInt(parts[2], 10);
          if (!isNaN(seqNum) && seqNum > maxSeq) {
            maxSeq = seqNum;
          }
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${datePrefix}${String(nextSeq).padStart(4, '0')}`;
  }, [expenses]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Simpan data pengeluaran baru
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Nama pengeluaran wajib diisi';
    }
    if (!category) {
      newErrors.category = 'Jenis pengeluaran wajib dipilih';
    }
    if (!purpose.trim()) {
      newErrors.purpose = 'Keperluan pengeluaran wajib diisi';
    }
    const numAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!numAmount || numAmount <= 0) {
      newErrors.amount = 'Nominal pengeluaran harus lebih dari Rp 0';
    }
    if (!date) {
      newErrors.date = 'Tanggal pengeluaran wajib dipilih';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const newExpense: ExpenseItem = {
      id: Date.now(),
      invoiceNumber: nextInvoiceNumber,
      title: title.trim(),
      category,
      purpose: purpose.trim(),
      amount: numAmount,
      date,
      notes: notes || 'Kas Tunai',
      createdAt: new Date().toISOString(),
    };

    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignored
    }

    // Reset Form
    setTitle('');
    setPurpose('');
    setAmount('');
    setSuccessMessage(`Berhasil mencatat pengeluaran dengan Invoice ${nextInvoiceNumber}`);
    setIsSubmitting(false);

    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Hapus item pengeluaran
  const handleDelete = (id: number, inv: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pengeluaran ${inv}?`)) {
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignored
      }
    }
  };

  // Filter daftar pengeluaran
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategoryFilter || item.category === selectedCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, selectedCategoryFilter]);

  // Total summary
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  // Cetak Excel Lengkap
  const exportToExcel = () => {
    const safeVal = (v: number | undefined | null) => (v ?? 0).toLocaleString('id-ID');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; color: #111827; }
          .title { font-size: 14pt; font-weight: bold; color: #b91c1c; margin-bottom: 4px; }
          .meta { font-size: 10pt; color: #4b5563; margin-bottom: 2px; }
          table { border-collapse: collapse; width: 100%; margin-top: 14px; }
          th { background-color: #b91c1c; color: #ffffff; font-weight: bold; border: 1px solid #991b1b; padding: 8px 10px; text-align: left; }
          td { border: 1px solid #d1d5db; padding: 6px 10px; }
          .num { text-align: right; mso-number-format: "\\#\\,\\#\\#0"; }
          .text-center { text-align: center; }
          .total-row { font-weight: bold; background-color: #fee2e2; }
        </style>
      </head>
      <body>
        <div class="title">LAPORAN RINCIAN UANG KELUAR & PENGELUARAN SEKOLAH</div>
        <div class="meta"><strong>Sistem ERP Pembayaran Sekolah</strong></div>
        <div class="meta">Total Data: ${filteredExpenses.length} Transaksi | Dicetak pada: ${new Date().toLocaleString('id-ID')}</div>
        <br/>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;" class="text-center">No</th>
              <th>No. Invoice</th>
              <th>Tanggal</th>
              <th>Nama Pengeluaran</th>
              <th>Jenis Pengeluaran</th>
              <th>Keperluan</th>
              <th>Metode Kas</th>
              <th style="text-align: right;">Nominal (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${
              filteredExpenses.length > 0
                ? filteredExpenses
                    .map(
                      (item, i) => `
                  <tr>
                    <td class="text-center">${i + 1}</td>
                    <td><strong>${item.invoiceNumber}</strong></td>
                    <td>${item.date}</td>
                    <td>${item.title}</td>
                    <td>${item.category}</td>
                    <td>${item.purpose}</td>
                    <td>${item.notes || '-'}</td>
                    <td class="num">${safeVal(item.amount)}</td>
                  </tr>
                `
                    )
                    .join('')
                : `<tr><td colspan="8" class="text-center">Tidak ada data pengeluaran.</td></tr>`
            }
            <tr class="total-row">
              <td colspan="7" class="text-center"><strong>TOTAL PENGELUARAN</strong></td>
              <td class="num"><strong>${safeVal(totalAmount)}</strong></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Uang_Keluar_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
              Laporan Uang Keluar
            </h1>
            <Badge variant="void" size="sm">
              Kas Keluar
            </Badge>
          </div>
          <p className="text-xs text-steel mt-0.5">
            Pencatatan pengeluaran operasional sekolah, honorarium, logistik, dan rekapitulasi kas keluar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            <span>Cetak Excel</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Cetak Dokumen</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Uang Keluar Tercatat"
          value={formatRupiah(totalAmount)}
          subtitle={`${filteredExpenses.length} transaksi pengeluaran`}
          icon={<TrendingDown className="w-4 h-4 text-rose-600" />}
        />
        <StatCard
          title="Rata-rata Pengeluaran"
          value={formatRupiah(filteredExpenses.length > 0 ? Math.round(totalAmount / filteredExpenses.length) : 0)}
          subtitle="Nominal rata-rata per transaksi"
          icon={<Receipt className="w-4 h-4 text-zinc-600" />}
        />
        <StatCard
          title="Transaksi Terakhir"
          value={filteredExpenses[0]?.invoiceNumber || '-'}
          subtitle={filteredExpenses[0] ? `${filteredExpenses[0].title}` : 'Belum ada transaksi'}
          icon={<Layers className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* FORM PENCATATAN UANG KELUAR */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">
                Formulir Pencatatan Uang Keluar
              </h2>
              <p className="text-xs text-zinc-500">
                Input nomor invoice auto-increment, nama pengeluaran, jenis, dan keperluan.
              </p>
            </div>
          </div>
          <Badge variant="neutral" size="sm" className="font-mono">
            Next: {nextInvoiceNumber}
          </Badge>
        </div>

        {successMessage && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. NOMOR INVOICE (AUTO INCREMENT) */}
            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1.5">
                Nomor Invoice <span className="text-emerald-600 font-normal">(Auto Increment)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nextInvoiceNumber}
                  disabled
                  readOnly
                  className="w-full px-3.5 py-2 text-sm bg-zinc-50 rounded-xl border border-zinc-200 text-zinc-950 font-mono font-semibold cursor-not-allowed select-none"
                />
                <span className="absolute right-3 top-2.5 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                  Auto
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Nomor invoice digenerate otomatis berurutan oleh sistem.
              </p>
            </div>

            {/* 2. NAMA PENGELUARAN */}
            <div>
              <InputField
                label="Nama Pengeluaran"
                placeholder="Contoh: Pembelian ATK & Kertas Ujian"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                errorMessage={errors.title}
              />
            </div>

            {/* 3. JENIS PENGELUARAN */}
            <div>
              <SelectField
                label="Jenis Pengeluaran"
                options={EXPENSE_CATEGORIES}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                }}
                errorMessage={errors.category}
              />
            </div>

            {/* 4. NOMINAL PENGELUARAN */}
            <div>
              <InputField
                label="Nominal Pengeluaran (Rp)"
                placeholder="Contoh: 500000"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAmount(val);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                errorMessage={errors.amount}
              />
              {amount && parseInt(amount, 10) > 0 ? (
                <p className="text-[11px] font-mono text-emerald-600 mt-1">
                  Terbilang: {formatRupiah(parseInt(amount, 10))}
                </p>
              ) : null}
            </div>

            {/* TANGGAL PENGELUARAN */}
            <div>
              <InputField
                label="Tanggal Pengeluaran"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                errorMessage={errors.date}
              />
            </div>

            {/* SALURAN KAS */}
            <div>
              <SelectField
                label="Saluran / Metode Kas"
                options={[
                  { label: 'Kas Tunai (Kasir TU)', value: 'Kas Tunai (Kasir TU)' },
                  { label: 'Transfer Bank Operasional', value: 'Transfer Bank Operasional' },
                ]}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* 5. KEPERLUAN (TEXTAREA / INPUT) */}
          <div>
            <label className="text-xs font-medium text-zinc-700 block mb-1.5">
              Keperluan Pengeluaran
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan secara rinci tujuan dan keperluan uang keluar ini..."
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                if (errors.purpose) setErrors((prev) => ({ ...prev, purpose: '' }));
              }}
              className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border ${
                errors.purpose ? 'border-rose-400 focus:border-rose-500' : 'border-zinc-200/90 focus:border-emerald-500'
              } text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition`}
            />
            {errors.purpose ? (
              <p className="text-xs text-rose-600 font-medium mt-1">{errors.purpose}</p>
            ) : null}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Simpan & Terbitkan Invoice</span>
            </Button>
          </div>
        </form>
      </div>

      {/* TABEL DAFTAR RIWAYAT UANG KELUAR */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        {/* Filter bar tabel */}
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari pengeluaran, keperluan, invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 rounded-xl border border-zinc-200 text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="w-56">
              <SelectField
                options={[
                  { label: 'Semua Jenis Pengeluaran', value: '' },
                  ...EXPENSE_CATEGORIES,
                ]}
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              />
            </div>
          </div>

          <span className="text-xs font-mono text-zinc-400">
            {filteredExpenses.length} Data Pengeluaran
          </span>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-600 font-medium">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Pengeluaran</th>
                <th className="py-3 px-4">Jenis Pengeluaran</th>
                <th className="py-3 px-4">Keperluan</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3 px-4 text-center font-mono text-zinc-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-950">
                      {item.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-500 whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-900">
                      {item.title}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral" size="sm">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 max-w-xs truncate" title={item.purpose}>
                      {item.purpose}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600 whitespace-nowrap">
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.invoiceNumber)}
                        title="Hapus Pengeluaran"
                        className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400">
                    Tidak ada data uang keluar yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-zinc-50 font-semibold border-t border-zinc-200">
                  <td colSpan={6} className="py-3 px-4 text-right text-zinc-700">
                    Total Pengeluaran:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-700 font-bold whitespace-nowrap">
                    {formatRupiah(totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
