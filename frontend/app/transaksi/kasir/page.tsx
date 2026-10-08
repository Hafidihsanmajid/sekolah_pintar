'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import { Student, Bill, PaymentMethod, Payment, Classroom, AcademicYear, PaginatedData } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import { cn } from '@/lib/utils';
import {
  CreditCard,
  Search,
  User,
  CheckCircle2,
  Printer,
  RotateCcw,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

export default function KasirPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'kepala_sekolah';

  // Academic Year, Classroom & Students by Class State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Format currency helper
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fetch payment methods, classrooms, and academic years on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [methodsRes, classroomsRes, yearsRes] = await Promise.all([
          apiClient.get<PaymentMethod[]>('/payment-methods', { params: { isActive: true } }),
          apiClient.get<Classroom[]>('/classrooms'),
          apiClient.get<AcademicYear[]>('/academic-years'),
        ]);

        if (methodsRes.success && methodsRes.data) {
          setPaymentMethods(methodsRes.data);
          if (methodsRes.data.length > 0) {
            setSelectedMethodId(methodsRes.data[0].id.toString());
          }
        }

        if (yearsRes.success && yearsRes.data) {
          setAcademicYears(yearsRes.data);
          const activeYear = yearsRes.data.find((y) => y.isActive) || yearsRes.data[0];
          if (activeYear) {
            setSelectedAcademicYearId(activeYear.id.toString());
          }
        }

        if (classroomsRes.success && classroomsRes.data) {
          setClassrooms(classroomsRes.data);
        }
      } catch {
        // Handled
      }
    };
    fetchInitialData();
  }, []);

  // Filtered Classrooms by selected Academic Year
  const filteredClassrooms = useMemo(() => {
    if (!selectedAcademicYearId) return classrooms;
    return classrooms.filter((c) => c.academicYearId?.toString() === selectedAcademicYearId);
  }, [classrooms, selectedAcademicYearId]);

  // Handler Tahun Ajaran Change
  const handleAcademicYearChange = (yearId: string) => {
    setSelectedAcademicYearId(yearId);
    if (yearId && selectedClassroomId) {
      const currentClassroom = classrooms.find((c) => c.id.toString() === selectedClassroomId);
      if (currentClassroom && currentClassroom.academicYearId?.toString() !== yearId) {
        setSelectedClassroomId('');
      }
    }
  };

  // Handler Classroom Change
  const handleClassroomChange = (classroomId: string) => {
    setSelectedClassroomId(classroomId);
    if (classroomId && !selectedAcademicYearId) {
      const cls = classrooms.find((c) => c.id.toString() === classroomId);
      if (cls && cls.academicYearId) {
        setSelectedAcademicYearId(cls.academicYearId.toString());
      }
    }
  };

  // Fetch students by selected classroom or academic year
  const fetchClassStudents = useCallback(async (classroomId: string, academicYearId: string) => {
    setIsLoadingStudents(true);
    try {
      const params: Record<string, string | number | boolean> = {
        perPage: 50,
        isActive: true,
      };
      if (classroomId) {
        params.classroomId = classroomId;
      }
      if (academicYearId) {
        params.academicYearId = academicYearId;
      }

      const res = await apiClient.get<PaginatedData<Student>>('/students', { params });
      if (res.success && res.data) {
        setStudentsList(res.data.items);
      }
    } catch {
      // Handled
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    fetchClassStudents(selectedClassroomId, selectedAcademicYearId);
  }, [selectedClassroomId, selectedAcademicYearId, fetchClassStudents]);

  // Filter students by local search/query without requiring search trigger
  const filteredStudents = useMemo(() => {
    if (!studentFilter.trim()) return studentsList;
    const q = studentFilter.toLowerCase();
    return studentsList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q))
    );
  }, [studentsList, studentFilter]);

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
    fetchStudentBills(student.id);
  };

  const handleReset = () => {
    setSelectedStudent(null);
    setBills([]);
    setSelectedItems({});
    setCashGiven('');
    setNotes('');
    setErrorMessage(null);
    setIsCheckoutModalOpen(false);
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

  const selectedItemsList = useMemo(() => {
    return bills.filter((b) => selectedItems[b.id]?.selected && selectedItems[b.id]?.payAmount > 0);
  }, [bills, selectedItems]);

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
        setIsCheckoutModalOpen(false);
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

      {/* Tampilan Penuh: Data Siswa & Pilih Tagihan */}
      <div className="space-y-6">
          {/* Box Identifikasi Siswa (Tabel Siswa Berdasarkan Kelas) */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-950 uppercase tracking-wider block">
                  1. Identifikasi Siswa Berdasarkan Kelas
                </label>
                <p className="text-[11px] text-steel mt-0.5">
                  Pilih tahun ajaran & kelas, lalu klik baris siswa pada tabel untuk menghubungkan tagihan otomatis.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-44">
                  <SelectField
                    label=""
                    options={[
                      { label: 'Semua Tahun Ajaran', value: '' },
                      ...academicYears.map((y) => ({
                        label: `${y.name} - ${y.semester}${y.isActive ? ' (Aktif)' : ''}`,
                        value: y.id.toString(),
                      })),
                    ]}
                    value={selectedAcademicYearId}
                    onChange={(e) => handleAcademicYearChange(e.target.value)}
                  />
                </div>

                <div className="w-full sm:w-52">
                  <SelectField
                    label=""
                    options={[
                      { label: 'Semua Kelas', value: '' },
                      ...filteredClassrooms.map((c) => ({
                        label: `Kelas ${c.name} (${c.level})`,
                        value: c.id.toString(),
                      })),
                    ]}
                    value={selectedClassroomId}
                    onChange={(e) => handleClassroomChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Quick Filter & Counter */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Saring nama atau NIS siswa..."
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-600 transition"
                />
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                {filteredStudents.length} siswa ditemukan
              </div>
            </div>

            {/* Tabel Siswa Berdasarkan Kelas */}
            <div className="border border-zinc-200/80 rounded-xl overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-medium sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">NIS</th>
                      <th className="py-2.5 px-3 font-medium">Nama Siswa</th>
                      <th className="py-2.5 px-3 font-medium">Kelas</th>
                      <th className="py-2.5 px-3 font-medium text-center">Status</th>
                      <th className="py-2.5 px-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-800">
                    {isLoadingStudents ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            <span>Memuat daftar siswa...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">
                          Tidak ada data siswa ditemukan
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const isSelected = selectedStudent?.id === s.id;
                        return (
                          <tr
                            key={s.id}
                            onClick={() => handleSelectStudent(s)}
                            className={cn(
                              'transition-colors cursor-pointer',
                              isSelected
                                ? 'bg-emerald-50/90 font-medium text-zinc-950 ring-1 ring-emerald-500/20'
                                : 'hover:bg-zinc-50/80'
                            )}
                          >
                            <td className="py-2.5 px-3 font-mono text-zinc-600">{s.nis}</td>
                            <td className="py-2.5 px-3 font-medium">
                              <div className="flex items-center gap-2">
                                <span>{s.name}</span>
                                {isSelected && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">
                              {s.classroomName || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <Badge variant={s.isActive ? 'paid' : 'neutral'} size="sm">
                                {s.isActive ? 'Aktif' : 'Non-Aktif'}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectStudent(s);
                                }}
                                className={cn(
                                  'px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer',
                                  isSelected
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-zinc-100 hover:bg-emerald-600 hover:text-white text-zinc-700'
                                )}
                              >
                                {isSelected ? 'Terpilih' : 'Pilih'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Profil Siswa Terpilih */}
            {selectedStudent && (
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-950 text-xs">
                      {selectedStudent.name}
                    </div>
                    <div className="text-[11px] text-zinc-600 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">NIS: {selectedStudent.nis}</span>
                      <span>•</span>
                      <span>Kelas: {selectedStudent.classroomName}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={selectedStudent.isActive ? 'paid' : 'neutral'} size="sm">
                  Tagihan Tersinkron
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
                <>
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

                {/* Footer di bawah Tagihan: Ringkasan Cepat & Tombol Proses Pembayaran */}
                <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="text-zinc-500">Total Tagihan Dipilih:</span>
                    <span className="font-mono font-bold text-emerald-700 text-lg">
                      {formatRupiah(totalAmountToPay)}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      ({selectedItemsList.length} tagihan)
                    </span>
                  </div>

                  {!isReadOnly ? (
                    <Button
                      variant="primary"
                      size="md"
                      disabled={totalAmountToPay <= 0}
                      onClick={() => {
                        setErrorMessage(null);
                        setIsCheckoutModalOpen(true);
                      }}
                      className="w-full sm:w-auto px-6 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      <span>Proses Pembayaran</span>
                    </Button>
                  ) : (
                    <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                      Read-only (Kepala Sekolah)
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal Ringkasan & Pembayaran */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title="Ringkasan & Pembayaran"
        description="Periksa kembali rincian pos tagihan dan tentukan metode pembayaran."
        size="md"
      >
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Info Siswa */}
          {selectedStudent && (
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between">
              <div>
                <div className="font-semibold text-zinc-950">{selectedStudent.name}</div>
                <div className="text-zinc-500 font-mono text-[11px] mt-0.5">
                  NIS: {selectedStudent.nis} • Kelas: {selectedStudent.classroomName}
                </div>
              </div>
              <Badge variant="paid" size="sm">
                {selectedItemsList.length} Pos Tagihan
              </Badge>
            </div>
          )}

          {/* Rincian Pos Tagihan yang Dipilih */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto border border-zinc-200/80 rounded-xl p-3 bg-white">
            <div className="text-[10px] uppercase font-mono text-zinc-400 font-semibold mb-1">
              Daftar Pos Tagihan
            </div>
            {selectedItemsList.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-xs py-1 border-b border-zinc-100 last:border-b-0"
              >
                <span className="text-zinc-800 truncate mr-2">{item.title}</span>
                <span className="font-mono font-semibold text-zinc-900 shrink-0">
                  {formatRupiah(selectedItems[item.id]?.payAmount ?? item.remainingAmount)}
                </span>
              </div>
            ))}
          </div>

          {/* Total Pembayaran */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <span className="text-xs font-medium text-emerald-900">Total Ditagihkan:</span>
            <span className="font-mono font-bold text-emerald-700 text-lg">
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <Button
              variant="outline"
              size="md"
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsCheckoutModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              type="button"
              disabled={
                totalAmountToPay <= 0 ||
                (isCash && !isCashSufficient) ||
                isSubmitting
              }
              isLoading={isSubmitting}
              onClick={handleSubmitPayment}
            >
              <CreditCard className="w-4 h-4 mr-1.5" />
              <span>Konfirmasi & Bayar</span>
            </Button>
          </div>
        </div>
      </Modal>

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
