'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  DailyCashReport,
  ArrearsReport,
  ReconciliationReport,
  Classroom,
  AcademicYear,
} from '@/types/api';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import {
  FileSpreadsheet,
  AlertTriangle,
  Scale,
  Printer,
  TrendingUp,
  Receipt,
  Building2,
  Calendar,
} from 'lucide-react';

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<'cash' | 'arrears' | 'reconciliation'>('cash');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');

  // Daily Cash & Reconciliation State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  // Helper load Cash Report
  const loadCashReport = useCallback(async (start: string, end: string) => {
    if (!start || !end) return;
    setIsLoadingCash(true);
    try {
      const res = await apiClient.get<DailyCashReport>('/reports/daily-cash', {
        params: { startDate: start, endDate: end },
      });
      if (res.success && res.data) {
        setCashReport(res.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoadingCash(false);
    }
  }, []);

  // Helper load Arrears Report
  const loadArrearsReport = useCallback(async (academicYearIdParam?: string, classroomIdParam?: string) => {
    setIsLoadingArrears(true);
    try {
      const params: Record<string, string> = {};
      const ayId = academicYearIdParam !== undefined ? academicYearIdParam : selectedAcademicYearId;
      const cId = classroomIdParam !== undefined ? classroomIdParam : selectedClassroomId;

      if (ayId) params.academicYearId = ayId;
      if (cId) params.classroomId = cId;

      const res = await apiClient.get<ArrearsReport>('/reports/arrears', { params });
      if (res.success && res.data) {
        setArrearsReport(res.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoadingArrears(false);
    }
  }, [selectedAcademicYearId, selectedClassroomId]);

  // Helper load Reconciliation Report
  const loadReconReport = useCallback(async (start: string, end: string) => {
    if (!start || !end) return;
    setIsLoadingRecon(true);
    try {
      const res = await apiClient.get<ReconciliationReport>('/reports/reconciliation', {
        params: { startDate: start, endDate: end },
      });
      if (res.success && res.data) {
        setReconReport(res.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoadingRecon(false);
    }
  }, []);

  // Inisialisasi awal: Muat data kelas, tahun ajaran aktif, dan langsung tampilkan laporan di periode tahun ajaran aktif
  useEffect(() => {
    let isMounted = true;

    async function initPage() {
      try {
        const [classroomsRes, yearsRes] = await Promise.all([
          apiClient.get<Classroom[]>('/classrooms'),
          apiClient.get<AcademicYear[]>('/academic-years'),
        ]);

        if (!isMounted) return;

        if (classroomsRes.success && classroomsRes.data) {
          setClassrooms(classroomsRes.data);
        }

        let curActiveYear: AcademicYear | null = null;
        if (yearsRes.success && yearsRes.data) {
          setAcademicYears(yearsRes.data);
          curActiveYear = yearsRes.data.find((y) => y.isActive) || yearsRes.data[0] || null;
          setActiveAcademicYear(curActiveYear);
        }

        // Tentukan periode tanggal dari tahun ajaran yang aktif
        const todayStr = new Date().toISOString().split('T')[0];
        let pStart = `${new Date().getFullYear()}-01-01`;
        let pEnd = todayStr;

        if (curActiveYear) {
          setSelectedAcademicYearId(curActiveYear.id.toString());
          const match = curActiveYear.name.match(/\d{4}/g);
          if (match && match.length >= 2) {
            pStart = `${match[0]}-07-01`;
            const nominalEnd = `${match[1]}-06-30`;
            pEnd = todayStr > nominalEnd ? todayStr : nominalEnd;
          } else if (match && match.length === 1) {
            pStart = `${match[0]}-01-01`;
            const nominalEnd = `${match[0]}-12-31`;
            pEnd = todayStr > nominalEnd ? todayStr : nominalEnd;
          }
        }

        setStartDate(pStart);
        setEndDate(pEnd);

        // Langsung tampilkan semua laporan keuangan di periode tahun ajaran aktif
        loadCashReport(pStart, pEnd);
        loadArrearsReport(curActiveYear ? curActiveYear.id.toString() : '', '');
        loadReconReport(pStart, pEnd);
      } catch {
        // Handled
      }
    }

    initPage();

    return () => {
      isMounted = false;
    };
  }, [loadCashReport, loadArrearsReport, loadReconReport]);

  // Handler ganti Tahun Ajaran
  const handleAcademicYearChange = (yearId: string) => {
    setSelectedAcademicYearId(yearId);
    const chosenYear = academicYears.find((y) => y.id.toString() === yearId);
    if (chosenYear) {
      const match = chosenYear.name.match(/\d{4}/g);
      const todayStr = new Date().toISOString().split('T')[0];
      let pStart = startDate;
      let pEnd = endDate;

      if (match && match.length >= 2) {
        pStart = `${match[0]}-07-01`;
        const nominalEnd = `${match[1]}-06-30`;
        pEnd = todayStr > nominalEnd ? todayStr : nominalEnd;
      } else if (match && match.length === 1) {
        pStart = `${match[0]}-01-01`;
        const nominalEnd = `${match[0]}-12-31`;
        pEnd = todayStr > nominalEnd ? todayStr : nominalEnd;
      }

      setStartDate(pStart);
      setEndDate(pEnd);
      loadCashReport(pStart, pEnd);
      loadArrearsReport(yearId, selectedClassroomId);
      loadReconReport(pStart, pEnd);
    }
  };

  // Handler Terapkan Filter
  const handleApplyFilter = () => {
    loadCashReport(startDate, endDate);
    loadReconReport(startDate, endDate);
  };

  // Export Excel Lengkap untuk Tab Arus Kas & Bank Harian
  const exportCashReportToExcel = () => {
    if (!cashReport) return;

    const academicYearLabel = activeAcademicYear
      ? `${activeAcademicYear.name} (${activeAcademicYear.semester})`
      : 'Semua Periode';

    const safeVal = (v: number | undefined | null) => (v ?? 0).toLocaleString('id-ID');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; }
          .title { font-size: 14pt; font-weight: bold; color: #047857; margin-bottom: 4px; }
          .meta { font-size: 10pt; color: #4b5563; }
          .section-title { font-size: 11pt; font-weight: bold; background-color: #f3f4f6; color: #111827; }
          table { border-collapse: collapse; width: 100%; margin-top: 8px; margin-bottom: 24px; }
          th { background-color: #047857; color: #ffffff; font-weight: bold; border: 1px solid #059669; padding: 6px 10px; text-align: left; }
          td { border: 1px solid #d1d5db; padding: 6px 10px; }
          .num { text-align: right; mso-number-format: "\\#\\,\\#\\#0"; }
          .text-center { text-align: center; }
          .total-row { font-weight: bold; background-color: #d1fae5; }
        </style>
      </head>
      <body>
        <div class="title">LAPORAN KEUANGAN & PENERIMAAN KAS / BANK</div>
        <div class="meta"><strong>Sistem ERP Pembayaran Sekolah</strong></div>
        <div class="meta">Periode: ${startDate} s/d ${endDate} | Tahun Ajaran: ${academicYearLabel}</div>
        <div class="meta">Dicetak pada: ${new Date().toLocaleString('id-ID')}</div>
        <br/>

        <!-- TABEL 1: RINGKASAN PENERIMAAN (KPI) -->
        <table>
          <thead>
            <tr>
              <th colspan="3" class="section-title">1. RINGKASAN PENERIMAAN KEUANGAN</th>
            </tr>
            <tr>
              <th>Indikator / Kategori</th>
              <th style="text-align: right;">Total Nominal (Rp)</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr class="total-row">
              <td><strong>Total Penerimaan Keseluruhan</strong></td>
              <td class="num"><strong>${safeVal(cashReport.summary.totalOverall)}</strong></td>
              <td>${cashReport.summary.completedCount} transaksi pembayaran berhasil</td>
            </tr>
            <tr>
              <td>Kas Fisik Tunai (Kasir TU)</td>
              <td class="num">${safeVal(cashReport.summary.totalCash)}</td>
              <td>Uang tunai siap disetor ke bendahara</td>
            </tr>
            <tr>
              <td>Penerimaan Transfer Bank</td>
              <td class="num">${safeVal(cashReport.summary.totalTransfer)}</td>
              <td>Masuk langsung ke rekening bank sekolah</td>
            </tr>
            <tr>
              <td>Transaksi Dibatalkan (Void)</td>
              <td class="num">${safeVal(cashReport.summary.voidAmount)}</td>
              <td>${cashReport.summary.voidCount} transaksi dibatalkan</td>
            </tr>
          </tbody>
        </table>

        <!-- TABEL 2: PENERIMAAN PER SALURAN / REKENING -->
        <table>
          <thead>
            <tr>
              <th colspan="6" class="section-title">2. PENERIMAAN PER SALURAN / METODE PEMBAYARAN</th>
            </tr>
            <tr>
              <th style="width: 40px;" class="text-center">No</th>
              <th>Metode Pembayaran</th>
              <th>Tipe</th>
              <th>No. Rekening</th>
              <th style="text-align: right;">Jumlah Transaksi</th>
              <th style="text-align: right;">Total Nominal (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${cashReport.byMethod
              .map(
                (m, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td>${m.methodName}</td>
                <td>${m.methodType === 'cash' ? 'Tunai' : 'Transfer Bank'}</td>
                <td>${m.accountNumber ? m.accountNumber : '-'}</td>
                <td class="num">${m.transactionCount}</td>
                <td class="num">${safeVal(m.totalAmount)}</td>
              </tr>
            `
              )
              .join('')}
            <tr class="total-row">
              <td colspan="4" class="text-center"><strong>TOTAL</strong></td>
              <td class="num"><strong>${cashReport.byMethod.reduce((acc, m) => acc + m.transactionCount, 0)}</strong></td>
              <td class="num"><strong>${safeVal(cashReport.summary.totalOverall)}</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- TABEL 3: ALOKASI BERDASARKAN POS TAGIHAN -->
        <table>
          <thead>
            <tr>
              <th colspan="4" class="section-title">3. ALOKASI PENERIMAAN PER POS BIAYA</th>
            </tr>
            <tr>
              <th style="width: 40px;" class="text-center">No</th>
              <th>Pos Tagihan / Kategori Biaya</th>
              <th style="text-align: right;">Frekuensi Pembayaran</th>
              <th style="text-align: right;">Total Nominal (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${cashReport.byFeeCategory
              .map(
                (f, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td>${f.categoryName}</td>
                <td class="num">${f.count} kali</td>
                <td class="num">${safeVal(f.totalAmount)}</td>
              </tr>
            `
              )
              .join('')}
            <tr class="total-row">
              <td colspan="2" class="text-center"><strong>TOTAL</strong></td>
              <td class="num"><strong>${cashReport.byFeeCategory.reduce((acc, f) => acc + f.count, 0)} kali</strong></td>
              <td class="num"><strong>${safeVal(cashReport.byFeeCategory.reduce((acc, f) => acc + f.totalAmount, 0))}</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- TABEL 4: RINCIAN RIWAYAT TRANSAKSI LENGKAP -->
        <table>
          <thead>
            <tr>
              <th colspan="9" class="section-title">4. RINCIAN RIWAYAT TRANSAKSI PEMBAYARAN</th>
            </tr>
            <tr>
              <th style="width: 40px;" class="text-center">No</th>
              <th>No. Invoice</th>
              <th>Tanggal & Waktu</th>
              <th>Nama Siswa</th>
              <th>Kelas</th>
              <th>Saluran</th>
              <th>Petugas Kasir</th>
              <th style="text-align: right;">Nominal (Rp)</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              cashReport.transactions.length > 0
                ? cashReport.transactions
                    .map(
                      (tx, i) => `
                  <tr>
                    <td class="text-center">${i + 1}</td>
                    <td><strong>${tx.invoiceNumber}</strong></td>
                    <td>${new Date(tx.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</td>
                    <td>${tx.studentName ?? '-'}</td>
                    <td>${tx.classroomName ?? '-'}</td>
                    <td>${tx.methodName ?? '-'}</td>
                    <td>${tx.cashierName ?? '-'}</td>
                    <td class="num">${safeVal(tx.totalAmount)}</td>
                    <td class="text-center">${tx.status === 'completed' ? 'Selesai' : 'Void'}</td>
                  </tr>
                `
                    )
                    .join('')
                : `<tr><td colspan="9" class="text-center">Tidak ada transaksi pada periode ini.</td></tr>`
            }
            <tr class="total-row">
              <td colspan="7" class="text-center"><strong>TOTAL PENERIMAAN</strong></td>
              <td class="num"><strong>${safeVal(cashReport.summary.totalOverall)}</strong></td>
              <td></td>
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
    link.download = `Laporan_Keuangan_${startDate}_sd_${endDate}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Excel untuk Tab Tunggakan
  const exportArrearsToExcel = () => {
    if (!arrearsReport) return;

    const academicYearLabel = activeAcademicYear
      ? `${activeAcademicYear.name} (${activeAcademicYear.semester})`
      : 'Semua Periode';

    const safeVal = (v: number | undefined | null) => (v ?? 0).toLocaleString('id-ID');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; }
          .title { font-size: 14pt; font-weight: bold; color: #b91c1c; margin-bottom: 4px; }
          .meta { font-size: 10pt; color: #4b5563; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; margin-bottom: 24px; }
          th { background-color: #b91c1c; color: #ffffff; font-weight: bold; border: 1px solid #991b1b; padding: 6px 10px; text-align: left; }
          td { border: 1px solid #d1d5db; padding: 6px 10px; }
          .num { text-align: right; mso-number-format: "\\#\\,\\#\\#0"; }
          .text-center { text-align: center; }
          .total-row { font-weight: bold; background-color: #fee2e2; }
        </style>
      </head>
      <body>
        <div class="title">LAPORAN TUNGGAKAN IURAN SISWA</div>
        <div class="meta"><strong>Sistem ERP Pembayaran Sekolah</strong></div>
        <div class="meta">Tahun Ajaran: ${academicYearLabel} | Dicetak: ${new Date().toLocaleString('id-ID')}</div>
        <br/>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;" class="text-center">No</th>
              <th>NIS</th>
              <th>Nama Siswa</th>
              <th>Kelas</th>
              <th>Rincian Tagihan Belum Lunas</th>
              <th style="text-align: right;">Sisa Tunggakan (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${
              arrearsReport.students.length > 0
                ? arrearsReport.students
                    .map(
                      (st, i) => `
                  <tr>
                    <td class="text-center">${i + 1}</td>
                    <td>${st.studentNis}</td>
                    <td><strong>${st.studentName}</strong></td>
                    <td>${st.classroomName}</td>
                    <td>${st.bills.map((b) => `${b.title} (Sisa: ${safeVal(b.remainingAmount)})`).join('; ')}</td>
                    <td class="num"><strong>${safeVal(st.totalArrears)}</strong></td>
                  </tr>
                `
                    )
                    .join('')
                : `<tr><td colspan="6" class="text-center">Tidak ada siswa yang tertunggak.</td></tr>`
            }
            <tr class="total-row">
              <td colspan="5" class="text-center"><strong>TOTAL PIUTANG TUNGGAKAN</strong></td>
              <td class="num"><strong>${safeVal(arrearsReport.summary.grandTotalArrears)}</strong></td>
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
    link.download = `Laporan_Tunggakan_Siswa.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
              Laporan & Rekonsiliasi Keuangan
            </h1>
            {activeAcademicYear && (
              <Badge variant="paid" size="sm" className="hidden sm:inline-flex">
                T.A. {activeAcademicYear.name} - {activeAcademicYear.semester} (Aktif)
              </Badge>
            )}
          </div>
          <p className="text-xs text-steel mt-0.5">
            Audit penerimaan kasir, monitoring tunggakan iuran siswa, dan pencocokan mutasi bank pada periode tahun ajaran aktif.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === 'cash') exportCashReportToExcel();
              else if (activeTab === 'arrears') exportArrearsToExcel();
              else exportCashReportToExcel();
            }}
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            <span>Cetak Excel</span>
          </Button>

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
            {academicYears.length > 0 && (
              <div className="w-48">
                <SelectField
                  label=""
                  options={academicYears.map((ay) => ({
                    label: `${ay.name} - ${ay.semester}${ay.isActive ? ' (Aktif)' : ''}`,
                    value: ay.id.toString(),
                  }))}
                  value={selectedAcademicYearId}
                  onChange={(e) => handleAcademicYearChange(e.target.value)}
                />
              </div>
            )}

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

            <Button variant="primary" size="sm" onClick={handleApplyFilter} isLoading={isLoadingCash}>
              <span>Terapkan Filter</span>
            </Button>

            {/* Tombol Cetak Excel di samping tombol terapkan filter */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportCashReportToExcel}
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              title="Cetak seluruh tabel laporan ke file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              <span>Cetak Excel</span>
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
              <div>
                <h3 className="text-xs font-semibold text-zinc-950">
                  Rincian Riwayat Transaksi Pada Periode Ini
                </h3>
                <p className="text-[11px] text-steel mt-0.5">
                  Daftar transaksi penerimaan keuangan lengkap dengan status verifikasi.
                </p>
              </div>
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
                  {cashReport?.transactions && cashReport.transactions.length > 0 ? (
                    cashReport.transactions.map((tx) => (
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-400">
                        Tidak ada riwayat transaksi pada periode tahun ajaran ini.
                      </td>
                    </tr>
                  )}
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
            <div className="flex items-center gap-3">
              {academicYears.length > 0 && (
                <div className="w-48">
                  <SelectField
                    options={academicYears.map((ay) => ({
                      label: `${ay.name} - ${ay.semester}${ay.isActive ? ' (Aktif)' : ''}`,
                      value: ay.id.toString(),
                    }))}
                    value={selectedAcademicYearId}
                    onChange={(e) => {
                      setSelectedAcademicYearId(e.target.value);
                      loadArrearsReport(e.target.value, selectedClassroomId);
                    }}
                  />
                </div>
              )}

              <div className="w-64">
                <SelectField
                  options={[
                    { label: 'Semua Rombel Kelas', value: '' },
                    ...classrooms.map((c) => ({ label: c.name, value: c.id.toString() })),
                  ]}
                  value={selectedClassroomId}
                  onChange={(e) => {
                    setSelectedClassroomId(e.target.value);
                    loadArrearsReport(selectedAcademicYearId, e.target.value);
                  }}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={exportArrearsToExcel}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Cetak Excel</span>
              </Button>
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
            {arrearsReport?.students && arrearsReport.students.length > 0 ? (
              arrearsReport.students.map((st) => (
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
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-8 text-center text-zinc-400 text-xs shadow-xs">
                {isLoadingArrears ? 'Memuat data tunggakan...' : 'Tidak ada tunggakan iuran siswa pada periode ini.'}
              </div>
            )}
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
                Bandingkan angka sistem dengan fisik brankas TU dan rekening koran bank pada periode {startDate} s/d {endDate}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCashReportToExcel}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Cetak Excel</span>
              </Button>
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {startDate} s/d {endDate}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoadingRecon ? (
              <div className="col-span-full py-8 text-center text-zinc-400 text-xs">
                Memuat data rekonsiliasi saluran...
              </div>
            ) : reconReport?.channels && reconReport.channels.length > 0 ? (
              reconReport.channels.map((ch) => (
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
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-zinc-400 text-xs">
                Tidak ada data mutasi saluran pembayaran pada periode ini.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}