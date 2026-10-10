'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAlert } from '@/context/alert-context';
import { ExpenseItem } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import {
  PlusCircle,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  Layers,
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

export default function InputUangKeluarPage() {
  const { showCreateAlert } = useAlert();
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
        // Fallback
      }
    }
    return INITIAL_EXPENSES;
  });

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
  const [lastSavedInvoice, setLastSavedInvoice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-increment nomor invoice
  const nextInvoiceNumber = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `OUT/${year}${month}${day}/`;

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

    const invoiceIssued = nextInvoiceNumber;
    const newExpense: ExpenseItem = {
      id: Date.now(),
      invoiceNumber: invoiceIssued,
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
    setLastSavedInvoice(invoiceIssued);
    setSuccessMessage(`Data berhasil disimpan dengan nomor invoice ${invoiceIssued}`);
    showCreateAlert(`Pengeluaran uang keluar ${title.trim()} sebesar ${formatRupiah(numAmount)} berhasil dicatat.`);
    setIsSubmitting(false);

    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
              Input Uang Keluar
            </h1>
            <Badge variant="void" size="sm">
              Formulir Kas Keluar
            </Badge>
          </div>
          <p className="text-xs text-steel mt-0.5">
            Pencatatan pengeluaran operasional sekolah dengan penerbitan nomor invoice otomatis (auto-increment).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/keuangan/uang-keluar">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-zinc-500" />
              <span>Lihat Laporan Uang Keluar</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* FORM PENCATATAN UANG KELUAR */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">
                Formulir Pengeluaran Keuangan
              </h2>
              <p className="text-xs text-zinc-500">
                Lengkapi seluruh informasi pengeluaran di bawah ini secara akurat.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">
              Invoice Berikutnya
            </span>
            <span className="text-xs font-mono font-bold text-rose-600">
              {nextInvoiceNumber}
            </span>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            {lastSavedInvoice && (
              <Link
                href="/keuangan/uang-keluar"
                className="text-[11px] font-semibold text-emerald-700 underline flex items-center gap-1 hover:text-emerald-900"
              >
                <span>Buka di Laporan</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                Nomor invoice digenerate otomatis berurutan oleh sistem untuk menjamin ketertiban audit.
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

          {/* 5. KEPERLUAN (TEXTAREA) */}
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

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <span className="text-[11px] text-zinc-400">
              Pastikan data dan bukti kuitansi fisik sudah sesuai sebelum menyimpan.
            </span>
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

      {/* RINCIAN TERAKHIR YANG TELAH DIINPUT */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-500" />
            <h3 className="text-xs font-semibold text-zinc-950">
              Pengeluaran Terakhir Dicatat
            </h3>
          </div>
          <Link
            href="/keuangan/uang-keluar"
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Semua Laporan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-zinc-100 text-xs">
          {expenses.slice(0, 3).map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-zinc-950">{item.invoiceNumber}</span>
                  <Badge variant="neutral" size="sm" className="text-[10px]">
                    {item.category}
                  </Badge>
                </div>
                <div className="font-medium text-zinc-800 mt-0.5">{item.title}</div>
                <div className="text-[11px] text-zinc-400">{item.purpose}</div>
              </div>
              <div className="text-right">
                <span className="font-mono font-semibold text-rose-600 block">
                  {formatRupiah(item.amount)}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
