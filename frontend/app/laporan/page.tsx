'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  DailyCashReport,
  ArrearsReport,
  ReconciliationReport,
  Classroom,
} from '@/types/api';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import {
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  Scale,
  Printer,
  TrendingUp,
  Receipt,
  Building2,
  GraduationCap,
} from 'lucide-react';

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<'cash' | 'arrears' | 'reconciliation'>('cash');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  // Daily Cash State
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [cashReport, setCashReport] = useState<DailyCashReport | null>(null);
  const [isLoadingCash, setIsLoadingCash] = useState(false);

  // Arrears State
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [arrearsReport, setArrearsReport] = useState<ArrearsReport | null>(null);
  const [isLoadingArrears, setIsLoadingArrears] = useState(false);

  // Reconciliation State
  const [reconReport, setReconReport] = useState<ReconciliationReport | null>(null);
  const [isLoadingRecon, setIsLoadingRecon] = useState(false);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Fetch Classrooms on Mount
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await apiClient.get<Classroom[]>('/classrooms');
        if (res.success && res.data) {
          setClassrooms(res.data);
        }
      } catch {
        // Handled
      }
    };
    fetchClassrooms();
  }, []);

  // Fetch Daily Cash Report
  const fetchCashReport = useCallback(async () => {
    setIsLoadingCash(true);
    try {
      const res = await apiClient.get<DailyCashReport>('/reports/daily-cash', {
        params: { startDate, endDate },
      });
      if (res.success && res.data) {
        setCashReport(res.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoadingCash(false);
    }
  }, [startDate, endDate]);

  // Fetch Arrears Report
  const fetchArrearsReport = useCallback(async () => {
    setIsLoadingArrears(true);
    try {
      const params: Record<string, string> = {};
      if (selectedClassroomId) params.classroomId = selectedClassroomId;

      const res = await apiClient.get<ArrearsReport>('/reports/arrears', { params });
      if (res.success && res.data) {
        setArrearsReport(res.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoadingArrears(false);
    }
  }, [selectedClassroomId]);

  // Fetch Reconciliation Report
  const fetchReconReport = useCallback(async () => {
    setIsLoadingRecon(true);
    try {
      const res = await apiClient.get<ReconciliationReport>('/reports/reconciliation', {
        params: { startDate, endDate },
      });
      if (res.success && res.data) {
        setReconReport(res.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoadingRecon(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'cash') {
      fetchCashReport();
    } else if (activeTab === 'arrears') {
      fetchArrearsReport();
    } else if (activeTab === 'reconciliation') {
      fetchReconReport();
    }
  }, [activeTab, fetchCashReport, fetchArrearsReport, fetchReconReport]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
            Laporan & Rekonsiliasi Keuangan
          </h1>
          <p className="text-xs text-steel mt-0.5">
            Audit penerimaan kasir, monitoring tunggakan iuran siswa, dan pencocokan mutasi bank.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Cetak Dokumen</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('cash')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'cash'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Arus Kas & Bank Harian</span>
        </button>

        <button
          onClick={() => setActiveTab('arrears')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'arrears'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Tunggakan Iuran Siswa</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'reconciliation'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Rekonsiliasi Saluran</span>
        </button>
      </div>

      {/* TAB 1: ARUS KAS & BANK HARIAN */}
      {activeTab === 'cash' && (
        <div className="space-y-6">
          {/* Filter Periode */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-zinc-700">Periode:</span>
            <div className="w-40">
              <InputField
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <span className="text-xs text-zinc-400">s/d</span>
            <div className="w-40">
              <InputField
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button variant="primary" size="sm" onClick={fetchCashReport} isLoading={isLoadingCash}>
              <span>Terapkan Filter</span>
            </Button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Penerimaan Periode"
              value={formatRupiah(cashReport?.summary.totalOverall ?? 0)}
              subtitle={`${cashReport?.summary.completedCount ?? 0} transaksi berhasil`}
              icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
            />
            <StatCard
              title="Kas Fisik Tunai (Kasir TU)"
              value={formatRupiah(cashReport?.summary.totalCash ?? 0)}
              subtitle="Uang tunai siap disetor ke bendahara"
              icon={<Receipt className="w-4 h-4 text-emerald-600" />}
            />
            <StatCard
              title="Penerimaan Transfer Bank"
              value={formatRupiah(cashReport?.summary.totalTransfer ?? 0)}
              subtitle="Masuk langsung ke rekening sekolah"
              icon={<Building2 className="w-4 h-4 text-blue-600" />}
            />
          </div>

          {/* Breakdown Per Pos Biaya & Per Saluran Bank */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Saluran */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <h3 className="text-xs font-semibold text-zinc-950 mb-3 pb-2 border-b border-zinc-100">
                Penerimaan per Saluran / Rekening
              </h3>
              <div className="space-y-3">
                {cashReport?.byMethod.map((m) => (
                  <div key={m.methodId} className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-zinc-900">{m.methodName}</div>
                      <div className="text-[11px] text-zinc-400">
                        {m.accountNumber ? `Rek: ${m.accountNumber}` : 'Tunai Kasir'} • {m.transactionCount} transaksi
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-zinc-950">
                      {formatRupiah(m.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pos Biaya */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <h3 className="text-xs font-semibold text-zinc-950 mb-3 pb-2 border-b border-zinc-100">
                Alokasi Berdasarkan Pos Tagihan
              </h3>
              <div className="space-y-3">
                {cashReport?.byFeeCategory.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-zinc-900">{f.categoryName}</div>
                      <div className="text-[11px] text-zinc-400">{f.count} kali dibayarkan</div>
                    </div>
                    <span className="font-mono font-semibold text-zinc-950">
                      {formatRupiah(f.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabel Detail Transaksi */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-950">
                Rincian Riwayat Transaksi Pada Periode Ini
              </h3>
              <span className="text-xs font-mono text-zinc-400">
                {cashReport?.transactions.length ?? 0} Invoice
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-600 font-medium">
                    <th className="py-3 px-4">No. Invoice</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Siswa</th>
                    <th className="py-3 px-4">Saluran</th>
                    <th className="py-3 px-4">Kasir</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {cashReport?.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50/50 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-zinc-950">
                        {tx.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-zinc-500">
                        {new Date(tx.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-900">{tx.studentName}</div>
                        <div className="text-[11px] text-zinc-400">{tx.classroomName}</div>
                      </td>
                      <td className="py-3 px-4 text-zinc-600">{tx.methodName}</td>
                      <td className="py-3 px-4 text-zinc-600">{tx.cashierName}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-zinc-950">
                        {formatRupiah(tx.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={tx.status === 'completed' ? 'paid' : 'void'} size="sm">
                          {tx.status === 'completed' ? 'Selesai' : 'Void'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TUNGGAKAN IURAN SISWA */}
      {activeTab === 'arrears' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex items-center justify-between flex-wrap gap-4">
            <div className="w-64">
              <SelectField
                options={[
                  { label: 'Semua Rombel Kelas', value: '' },
                  ...classrooms.map((c) => ({ label: c.name, value: c.id.toString() })),
                ]}
                value={selectedClassroomId}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-zinc-500">Siswa Tertunggak:</span>{' '}
                <strong className="text-zinc-950 font-mono">
                  {arrearsReport?.summary.totalStudentsWithArrears ?? 0} Siswa
                </strong>
              </div>
              <div>
                <span className="text-zinc-500">Total Nominal Piutang:</span>{' '}
                <strong className="text-rose-700 font-mono text-sm">
                  {formatRupiah(arrearsReport?.summary.grandTotalArrears ?? 0)}
                </strong>
              </div>
            </div>
          </div>

          {/* Daftar Tunggakan per Siswa */}
          <div className="space-y-4">
            {arrearsReport?.students.map((st) => (
              <div
                key={st.studentId}
                className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
                  <div>
                    <h3 className="font-semibold text-zinc-950 text-sm">{st.studentName}</h3>
                    <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">NIS: {st.studentNis}</span>
                      <span>•</span>
                      <span>Kelas: {st.classroomName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-zinc-400">
                      Total Tunggakan
                    </span>
                    <div className="text-sm font-mono font-bold text-rose-600">
                      {formatRupiah(st.totalArrears)}
                    </div>
                  </div>
                </div>

                {/* Sub-table Rincian Tagihan Siswa Ini */}
                <div className="mt-3 divide-y divide-zinc-100 text-xs">
                  {st.bills.map((b) => (
                    <div key={b.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-800">{b.title}</span>
                        <span className="text-[11px] text-zinc-400">
                          (Total: {formatRupiah(b.amount)})
                        </span>
                      </div>
                      <div className="font-mono font-semibold text-zinc-900">
                        Sisa: {formatRupiah(b.remainingAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REKONSILIASI SALURAN KAS & BANK */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-zinc-950">
                Pencocokan Mutasi Saluran Pembayaran
              </h3>
              <p className="text-[11px] text-steel mt-0.5">
                Bandingkan angka sistem dengan fisik brankas TU dan rekening koran bank.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">Bulan Berjalan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reconReport?.channels.map((ch) => (
              <div
                key={ch.methodId}
                className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={ch.type === 'cash' ? 'outline' : 'info'} size="sm">
                      {ch.type === 'cash' ? 'Kas Fisik' : 'Bank'}
                    </Badge>
                    <span className="text-xs font-mono text-zinc-400">
                      {ch.transactionCount} Transaksi
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-zinc-950">{ch.name}</h4>
                  {ch.type === 'transfer' ? (
                    <div className="text-xs text-zinc-500 font-mono mt-1">
                      {ch.accountNumber} • a.n {ch.accountHolder}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 mt-1">Penyimpanan: Kasir Ruang TU</div>
                  )}
                </div>

                <div className="mt-6 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Saldo Tercatat:</span>
                  <span className="text-sm font-mono font-bold text-emerald-700">
                    {formatRupiah(ch.systemCalculatedTotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
