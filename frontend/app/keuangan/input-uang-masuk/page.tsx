'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAlert } from '@/context/alert-context';
import { IncomeItem } from '@/types/api';
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
  TrendingUp,
} from 'lucide-react';
import {
  INCOME_STORAGE_KEY,
  INCOME_CATEGORIES,
  INITIAL_INCOMES,
} from '@/lib/incomes';

const PAYMENT_CHANNELS = [
  { label: 'Transfer Bank (BNI)', value: 'Transfer Bank (BNI)' },
  { label: 'Transfer Bank (Bank Jatim)', value: 'Transfer Bank (Bank Jatim)' },
  { label: 'Transfer Bank (Mandiri)', value: 'Transfer Bank (Mandiri)' },
  { label: 'Transfer Bank (BRI)', value: 'Transfer Bank (BRI)' },
  { label: 'Kas Tunai (Kasir TU)', value: 'Kas Tunai (Kasir TU)' },
  { label: 'Rekening Giro Operasional', value: 'Rekening Giro Operasional' },
];

export default function InputUangMasukPage() {
  const { showCreateAlert } = useAlert();
  const [incomes, setIncomes] = useState<IncomeItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(INCOME_STORAGE_KEY);
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
    return INITIAL_INCOMES;
  });

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(INCOME_CATEGORIES[0].value);
  const [source, setSource] = useState('');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(PAYMENT_CHANNELS[0].value);

  // Form UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastSavedInvoice, setLastSavedInvoice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-increment nomor invoice (IN/YYYYMMDD/XXXX)
  const nextInvoiceNumber = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `IN/${year}${month}${day}/`;

    let maxSeq = 0;
    incomes.forEach((item) => {
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
  }, [incomes]);

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
      newErrors.title = 'Nama uang masuk wajib diisi';
    }
    if (!category) {
      newErrors.category = 'Kategori uang masuk wajib dipilih';
    }
    if (!source.trim()) {
      newErrors.source = 'Asal sumber dana wajib diisi';
    }
    const numAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!numAmount || numAmount <= 0) {
      newErrors.amount = 'Nominal uang masuk harus lebih dari Rp 0';
    }
    if (!date) {
      newErrors.date = 'Tanggal penerimaan wajib dipilih';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const invoiceIssued = nextInvoiceNumber;
    const newIncome: IncomeItem = {
      id: Date.now(),
      invoiceNumber: invoiceIssued,
      title: title.trim(),
      category,
      source: source.trim(),
      purpose: purpose.trim() || 'Penerimaan dana kas masuk non-kasir',
      amount: numAmount,
      date,
      notes: notes || 'Transfer Bank',
      createdAt: new Date().toISOString(),
    };

    const updated = [newIncome, ...incomes];
    setIncomes(updated);
    try {
      localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignored
    }

    // Reset Form
    setTitle('');
    setSource('');
    setPurpose('');
    setAmount('');
    setLastSavedInvoice(invoiceIssued);
    setSuccessMessage(`Data uang masuk berhasil disimpan dengan nomor invoice ${invoiceIssued}`);
    showCreateAlert(`Pencatatan uang masuk ${title.trim()} sebesar ${formatRupiah(numAmount)} berhasil disimpan.`);
    setIsSubmitting(false);

    setTimeout(() => {
      setSuccessMessage(null);
    }, 6000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
              Input Uang Masuk
            </h1>
            <Badge variant="paid" size="sm">
              Kas Masuk Non-Kasir
            </Badge>
          </div>
          <p className="text-xs text-steel mt-0.5">
            Pencatatan dana masuk dari bantuan pemerintah (BOS/Pemda), hibah, donasi yayasan, dan sumber non-kasir lainnya.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/laporan">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              <span>Lihat Laporan Uang Masuk</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* FORM PENCATATAN UANG MASUK */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">
                Formulir Penerimaan Dana Non-Kasir
              </h2>
              <p className="text-xs text-zinc-500">
                Lengkapi seluruh informasi sumber dana dan nominal uang masuk di bawah ini.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">
              Invoice Berikutnya
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600">
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
                href="/laporan"
                className="text-[11px] font-semibold text-emerald-700 underline flex items-center gap-1 hover:text-emerald-900"
              >
                <span>Buka di Laporan Uang Masuk</span>
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
                Nomor invoice dibuat berurutan otomatis untuk ketertiban audit pembukuan.
              </p>
            </div>

            {/* 2. NAMA UANG MASUK */}
            <div>
              <InputField
                label="Nama / Deskripsi Penerimaan"
                placeholder="Contoh: Pencairan Dana BOS Reguler Tahap II"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                errorMessage={errors.title}
              />
            </div>

            {/* 3. KATEGORI UANG MASUK */}
            <div>
              <SelectField
                label="Kategori / Pos Dana Masuk"
                options={INCOME_CATEGORIES}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                }}
                errorMessage={errors.category}
              />
            </div>

            {/* 4. ASAL SUMBER DANA */}
            <div>
              <InputField
                label="Asal Sumber Dana"
                placeholder="Contoh: Kemendikbudristek / Pemkab / Yayasan / Alumni"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  if (errors.source) setErrors((prev) => ({ ...prev, source: '' }));
                }}
                errorMessage={errors.source}
              />
            </div>

            {/* 5. NOMINAL UANG MASUK */}
            <div>
              <InputField
                label="Nominal Uang Masuk (Rp)"
                placeholder="Contoh: 15000000"
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

            {/* 6. TANGGAL PENERIMAAN */}
            <div>
              <InputField
                label="Tanggal Penerimaan"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                errorMessage={errors.date}
              />
            </div>

            {/* 7. SALURAN / REKENING KAS */}
            <div className="md:col-span-2">
              <SelectField
                label="Saluran / Rekening Kas Masuk"
                options={PAYMENT_CHANNELS}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* 8. KETERANGAN / ALOKASI (TEXTAREA) */}
          <div>
            <label className="text-xs font-medium text-zinc-700 block mb-1.5">
              Keterangan & Rincian Penggunaan (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder="Catatan tambahan mengenai ketentuan penggunaan dana atau nomor surat keputusan..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-zinc-200/90 focus:border-emerald-500 text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <span className="text-[11px] text-zinc-400">
              Data yang disimpan otomatis masuk ke dalam Laporan Uang Masuk sekolah.
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
              Uang Masuk Terakhir Dicatat
            </h3>
          </div>
          <Link
            href="/laporan"
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Semua di Laporan Uang Masuk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-zinc-100 text-xs">
          {incomes.slice(0, 3).map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-zinc-950">{item.invoiceNumber}</span>
                  <Badge variant="paid" size="sm" className="text-[10px]">
                    {item.category}
                  </Badge>
                </div>
                <div className="font-medium text-zinc-800 mt-0.5">{item.title}</div>
                <div className="text-[11px] text-zinc-400">
                  Sumber: {item.source} • {item.notes || 'Transfer'}
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-semibold text-emerald-600 block">
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
