'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import { Student, Bill, PaymentMethod, Payment } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import {
  CreditCard,
  Search,
  User,
  Receipt,
  CheckCircle2,
  Printer,
  RotateCcw,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

export default function KasirPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'kepala_sekolah';

  // Search Student State
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Bills & Methods State
  const [bills, setBills] = useState<Bill[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingBills, setIsLoadingBills] = useState(false);

  // Selected items to pay: Record<billId, { selected: boolean, payAmount: number }>
  const [selectedItems, setSelectedItems] = useState<Record<number, { selected: boolean; payAmount: number }>>({});
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Process & Receipt State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Format currency helper
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fetch payment methods on mount
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await apiClient.get<PaymentMethod[]>('/payment-methods', {
          params: { isActive: true },
        });
        if (res.success && res.data) {
          setPaymentMethods(res.data);
          if (res.data.length > 0) {
            setSelectedMethodId(res.data[0].id.toString());
          }
        }
      } catch {
        // Handled
      }
    };
    fetchMethods();
  }, []);

  // Search students debounce
  useEffect(() => {
    if (!studentSearch.trim() || studentSearch.length < 2) {
      setStudentSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiClient.get<{ items: Student[] }>('/students', {
          params: { search: studentSearch, perPage: 6 },
        });
        if (res.success && res.data) {
          setStudentSuggestions(res.data.items);
        }
      } catch {
        // Handled
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [studentSearch]);

  // Fetch student active bills when selected
  const fetchStudentBills = useCallback(async (studentId: number) => {
    setIsLoadingBills(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get<Bill[]>(`/students/${studentId}/bills`);
      if (res.success && res.data) {
        setBills(res.data);

        // Pre-select first bill if available
        const initialSelection: Record<number, { selected: boolean; payAmount: number }> = {};
        res.data.forEach((b, idx) => {
          initialSelection[b.id] = {
            selected: idx === 0, // Auto check item pertama
            payAmount: b.remainingAmount,
          };
        });
        setSelectedItems(initialSelection);
      }
    } catch (err: unknown) {
      const errRes = err as { message?: string };
      setErrorMessage(errRes.message || 'Gagal memuat tagihan siswa');
    } finally {
      setIsLoadingBills(false);
    }
  }, []);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch(`${student.name} (${student.nis})`);
    setStudentSuggestions([]);
    fetchStudentBills(student.id);
  };

  const handleReset = () => {
    setSelectedStudent(null);
    setStudentSearch('');
    setBills([]);
    setSelectedItems({});
    setCashGiven('');
    setNotes('');
    setErrorMessage(null);
  };

  // Toggle item selection
  const handleToggleItem = (billId: number, remaining: number) => {
    setSelectedItems((prev) => {
      const current = prev[billId] || { selected: false, payAmount: remaining };
      return {
        ...prev,
        [billId]: {
          ...current,
          selected: !current.selected,
          payAmount: current.payAmount > 0 ? current.payAmount : remaining,
        },
      };
    });
  };

  // Change individual pay amount
  const handlePayAmountChange = (billId: number, val: number, maxAmount: number) => {
    const safeAmount = Math.max(0, Math.min(val, maxAmount));
    setSelectedItems((prev) => ({
      ...prev,
      [billId]: {
        selected: safeAmount > 0,
        payAmount: safeAmount,
      },
    }));
  };

  // Calculations
  const totalAmountToPay = useMemo(() => {
    return Object.entries(selectedItems).reduce((sum, [_, item]) => {
      return item.selected ? sum + item.payAmount : sum;
    }, 0);
  }, [selectedItems]);

  const activeMethod = useMemo(() => {
    return paymentMethods.find((m) => m.id.toString() === selectedMethodId);
  }, [paymentMethods, selectedMethodId]);

  const isCash = activeMethod?.type === 'cash';
  const parsedCashGiven = parseInt(cashGiven.replace(/\D/g, '') || '0', 10);
  const changeAmount = isCash ? Math.max(0, parsedCashGiven - totalAmountToPay) : 0;
  const isCashSufficient = !isCash || parsedCashGiven >= totalAmountToPay;

  // Submit Payment
  const handleSubmitPayment = async () => {
    if (!selectedStudent || totalAmountToPay <= 0) return;
    if (isCash && !isCashSufficient) {
      setErrorMessage('Nominal uang tunai yang diterima kurang dari total pembayaran.');
      return;
    }

    const items = Object.entries(selectedItems)
      .filter(([_, item]) => item.selected && item.payAmount > 0)
      .map(([billId, item]) => ({
        billId: parseInt(billId, 10),
        amount: item.payAmount,
      }));

    if (items.length === 0) {
      setErrorMessage('Pilih minimal 1 pos tagihan untuk dibayar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        studentId: selectedStudent.id,
        paymentMethodId: parseInt(selectedMethodId, 10),
        items,
        notes: notes.trim() || null,
      };

      const res = await apiClient.post<Payment>('/payments', payload);
      if (res.success && res.data) {
        setLastPayment(res.data);
        setIsReceiptModalOpen(true);
        // Refresh bills of student
        fetchStudentBills(selectedStudent.id);
      }
    } catch (err: unknown) {
      const errRes = err as { message?: string };
      setErrorMessage(errRes.message || 'Gagal memproses transaksi pembayaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
            Kasir Pembayaran Siswa
          </h1>
          <p className="text-xs text-steel mt-0.5">
            Penerimaan kas pembayaran SPP dan administrasi sekolah dengan penerbitan bukti kuitansi.
          </p>
        </div>

        {selectedStudent && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Ganti Siswa</span>
          </Button>
        )}
      </div>

      {/* Grid: Kiri (Cari Siswa & Checklist Tagihan) vs Kanan (Panel Checkout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Box Pencarian Siswa */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <label className="text-xs font-semibold text-zinc-950 mb-2 block">
              1. Identifikasi Siswa
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ketik NIS atau Nama Siswa untuk mencari..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              {/* Suggestions Dropdown */}
              {studentSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 max-h-56 overflow-y-auto divide-y divide-zinc-100">
                  {studentSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStudent(s)}
                      className="w-full p-3 text-left hover:bg-emerald-50/50 flex items-center justify-between text-xs transition cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-zinc-900">{s.name}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          NIS: {s.nis} • Kelas: {s.classroomName || '-'}
                        </div>
                      </div>
                      <Badge variant="outline" size="sm">
                        Pilih
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profil Siswa Terpilih */}
            {selectedStudent && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-950 text-sm">
                      {selectedStudent.name}
                    </div>
                    <div className="text-xs text-zinc-600 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">NIS: {selectedStudent.nis}</span>
                      <span>•</span>
                      <span>Kelas: {selectedStudent.classroomName}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={selectedStudent.isActive ? 'success' : 'neutral'} size="sm">
                  {selectedStudent.isActive ? 'Siswa Aktif' : 'Non-Aktif'}
                </Badge>
              </div>
            )}
          </div>

          {/* Box Daftar Tagihan Aktif Siswa */}
          {selectedStudent && (
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-950">
                    2. Pilih Tagihan yang Akan Dibayar
                  </h3>
                  <p className="text-[11px] text-steel mt-0.5">
                    Centang tagihan dan sesuaikan jumlah pembayaran jika mencicil.
                  </p>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  {bills.length} Tagihan Tertunggak
                </span>
              </div>

              {isLoadingBills ? (
                <div className="py-12 text-center text-xs text-zinc-400">
                  Memuat data tagihan siswa...
                </div>
              ) : bills.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <div>Tidak ada tagihan tertunggak untuk siswa ini.</div>
                  <div className="text-zinc-400 text-[11px] mt-0.5">
                    Seluruh kewajiban pembayaran telah lunas.
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-xl overflow-hidden">
                  {bills.map((b) => {
                    const isChecked = selectedItems[b.id]?.selected ?? false;
                    const payVal = selectedItems[b.id]?.payAmount ?? b.remainingAmount;

                    return (
                      <div
                        key={b.id}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                          isChecked ? 'bg-emerald-50/20' : 'hover:bg-zinc-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(b.id, b.remainingAmount)}
                            className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <div className="font-semibold text-zinc-950 text-xs">
                              {b.title}
                            </div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                              <Badge variant={b.feeCategoryType === 'monthly' ? 'info' : 'warning'} size="sm">
                                {b.feeCategoryType === 'monthly' ? 'Bulanan' : 'Insidental'}
                              </Badge>
                              <span>
                                Total: {formatRupiah(b.amount)} • Terbayar: {formatRupiah(b.paidAmount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Input Jumlah Bayar */}
                        <div className="flex items-center gap-3 sm:justify-end">
                          <div className="text-right">
                            <div className="text-[10px] uppercase font-mono text-zinc-400">
                              Sisa Tagihan
                            </div>
                            <div className="text-xs font-mono font-medium text-rose-600">
                              {formatRupiah(b.remainingAmount)}
                            </div>
                          </div>

                          <div className="w-36">
                            <input
                              type="number"
                              disabled={!isChecked}
                              value={payVal}
                              onChange={(e) =>
                                handlePayAmountChange(
                                  b.id,
                                  parseInt(e.target.value || '0', 10),
                                  b.remainingAmount
                                )
                              }
                              className="w-full text-right px-2.5 py-1.5 text-xs font-mono font-semibold bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-zinc-100 disabled:text-zinc-400"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kolom Kanan: 1 Col (Checkout Card) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] sticky top-20">
            <h3 className="text-xs font-semibold text-zinc-950 mb-3 pb-3 border-b border-zinc-100">
              3. Ringkasan & Pembayaran
            </h3>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}

            {/* Total Belanja */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>Total Ditagihkan:</span>
                <span className="font-mono font-semibold text-zinc-950 text-base">
                  {formatRupiah(totalAmountToPay)}
                </span>
              </div>

              {/* Pilihan Metode Bayar */}
              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1.5 block">
                  Metode Pembayaran
                </label>
                <SelectField
                  options={paymentMethods.map((m) => ({
                    label: `${m.name} (${m.type === 'cash' ? 'Tunai' : 'Transfer'})`,
                    value: m.id.toString(),
                  }))}
                  value={selectedMethodId}
                  onChange={(e) => setSelectedMethodId(e.target.value)}
                />
              </div>

              {/* Kalkulator Tunai Kasir */}
              {isCash && (
                <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-2.5">
                  <label className="text-xs font-medium text-zinc-900 block">
                    Uang Diterima dari Wali/Siswa (Rp)
                  </label>
                  <InputField
                    type="number"
                    placeholder="0"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                  />

                  {/* Tombol Pintasan Uang Pas */}
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setCashGiven(totalAmountToPay.toString())}
                      className="px-2 py-1 rounded-md bg-white border border-zinc-200 text-[11px] font-medium text-zinc-700 hover:border-emerald-500 cursor-pointer"
                    >
                      Uang Pas
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashGiven((totalAmountToPay + 50000).toString())}
                      className="px-2 py-1 rounded-md bg-white border border-zinc-200 text-[11px] font-medium text-zinc-700 hover:border-emerald-500 cursor-pointer"
                    >
                      +50rb
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashGiven((totalAmountToPay + 100000).toString())}
                      className="px-2 py-1 rounded-md bg-white border border-zinc-200 text-[11px] font-medium text-zinc-700 hover:border-emerald-500 cursor-pointer"
                    >
                      +100rb
                    </button>
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-xs">
                    <span className="text-zinc-600">Kembalian:</span>
                    <span
                      className={`font-mono font-semibold ${
                        isCashSufficient ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {formatRupiah(changeAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Catatan / Keterangan */}
              <InputField
                label="Catatan Transaksi (Opsional)"
                placeholder="Contoh: Titipan orang tua..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {/* Submit Button */}
              {!isReadOnly ? (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full mt-4"
                  disabled={
                    !selectedStudent ||
                    totalAmountToPay <= 0 ||
                    (isCash && !isCashSufficient) ||
                    isSubmitting
                  }
                  isLoading={isSubmitting}
                  onClick={handleSubmitPayment}
                >
                  <CreditCard className="w-4 h-4 mr-1.5" />
                  <span>Proses Pembayaran Sekarang</span>
                </Button>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs text-center border border-amber-200">
                  Kepala Sekolah tidak memiliki hak akses memproses kasir.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Resi / Kuitansi Pembayaran */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Kuitansi Pembayaran Sukses"
        size="md"
      >
        {lastPayment && (
          <div className="space-y-4">
            {/* Template Resi Kuitansi Fisik */}
            <div
              id="printable-receipt"
              className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-950 font-sans text-xs space-y-4"
            >
              {/* Header Resi */}
              <div className="text-center pb-3 border-b border-zinc-200">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white mb-1">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm tracking-tight">SMK PINTAR BANGSA</div>
                <div className="text-[10px] text-zinc-500">
                  Bukti Pembayaran Keuangan Administrasi Siswa
                </div>
              </div>

              {/* Info Resi */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pb-3 border-b border-zinc-200 font-mono">
                <div>
                  <span className="text-zinc-400">No. Invoice:</span>
                  <div className="font-bold text-zinc-900">{lastPayment.invoiceNumber}</div>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400">Tanggal:</span>
                  <div className="text-zinc-900">
                    {new Date(lastPayment.paymentDate).toLocaleDateString('id-ID', {
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
                  <div className="font-semibold text-zinc-900">{lastPayment.studentName}</div>
                  <div className="text-[10px] text-zinc-500">
                    NIS: {lastPayment.studentNis} • {lastPayment.classroomName}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400">Kasir:</span>
                  <div className="text-zinc-900">{lastPayment.cashierName}</div>
                  <div className="text-[10px] text-zinc-500">{lastPayment.paymentMethodName}</div>
                </div>
              </div>

              {/* Rincian Pos Tagihan Terbayar */}
              <div className="space-y-1.5 py-1">
                <div className="text-[10px] uppercase font-mono text-zinc-400 font-semibold mb-1">
                  Rincian Pos Pembayaran
                </div>
                {lastPayment.details?.map((d) => (
                  <div key={d.id} className="flex justify-between items-center text-xs">
                    <span className="text-zinc-800">{d.billTitle}</span>
                    <span className="font-mono font-medium text-zinc-900">
                      {formatRupiah(d.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total & Status */}
              <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                <div>
                  <Badge variant="paid" size="sm">
                    LUNAS DIVERIFIKASI
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase">
                    Total Bayar
                  </span>
                  <div className="text-base font-mono font-bold text-emerald-700">
                    {formatRupiah(lastPayment.totalAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Aksi Resi */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                <span>Cetak Resi</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  handleReset();
                }}
              >
                <span>Selesai / Transaksi Baru</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
