'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/context/alert-context';
import { apiClient } from '@/lib/api-client';
import {
  Student,
  Classroom,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummary,
  AttendanceListResponse,
} from '@/types/api';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import {
  ClipboardList,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Maximize2,
  AlertCircle,
  Users,
  Search,
  Filter,
  RefreshCw,
  Save,
  CheckCheck,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface BatchStudentItem {
  studentId: number;
  nis: string;
  name: string;
  status: AttendanceStatus;
  notes: string;
}

export default function AbsensiRiwayatPage() {
  const { user } = useAuth();
  const { showCreateAlert, showUpdateAlert } = useAlert();
  const isReadOnly = user?.role === 'kepala_sekolah';

  // Mode / Tab State: 'log' | 'input'
  const [activeTab, setActiveTab] = useState<'log' | 'input'>('log');

  // Master Data Kelas Filter
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  // ===================== LOG & REKAPITULASI STATE =====================
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    hadir: 0,
    terlambat: 0,
    sakit: 0,
    izin: 0,
    alpa: 0,
  });
  const [isLogLoading, setIsLogLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const perPage = 15;

  // Filters for Log
  const [filterDate, setFilterDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [filterClassroomId, setFilterClassroomId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ===================== INPUT MASSAL STATE =====================
  const [inputDate, setInputDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [inputClassroomId, setInputClassroomId] = useState('');
  const [batchItems, setBatchItems] = useState<BatchStudentItem[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchFeedback, setBatchFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Fetch Classrooms
  const fetchClassrooms = useCallback(async () => {
    try {
      const res = await apiClient.get<Classroom[]>('/classrooms');
      if (res.success && res.data) {
        setClassrooms(res.data.filter((c) => c.name.toLowerCase() !== 'tagihan alumni'));
      }
    } catch {
      // Handled
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  // Fetch Log Riwayat & Rekapitulasi
  const fetchAttendanceLog = useCallback(async () => {
    setIsLogLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: logPage,
        perPage,
      };

      if (filterDate) params.date = filterDate;
      if (filterClassroomId) params.classroomId = filterClassroomId;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get<AttendanceListResponse>('/attendances', { params });
      if (res.success && res.data) {
        setRecords(res.data.items);
        setSummary(res.data.summary);
        setTotalRows(res.data.pagination.total);
      }
    } catch {
      // Handled
    } finally {
      setIsLogLoading(false);
    }
  }, [logPage, filterDate, filterClassroomId, filterStatus, searchQuery]);

  useEffect(() => {
    if (activeTab === 'log') {
      fetchAttendanceLog();
    }
  }, [activeTab, fetchAttendanceLog]);

  // Load Siswa saat Kelas Dipilih untuk Input Massal
  const handleLoadClassStudents = useCallback(async (classId: string) => {
    if (!classId) {
      setBatchItems([]);
      return;
    }

    setIsStudentsLoading(true);
    setBatchFeedback(null);
    try {
      const res = await apiClient.get<{ items: Student[]; total: number }>(
        '/attendances/students',
        { params: { classroomId: classId, all: 1 } }
      );

      if (res.success && res.data) {
        const initialItems: BatchStudentItem[] = res.data.items.map((s) => ({
          studentId: s.id,
          nis: s.nis,
          name: s.name,
          status: 'hadir',
          notes: '',
        }));
        setBatchItems(initialItems);
      }
    } catch {
      setBatchFeedback({ type: 'error', message: 'Gagal memuat siswa kelas terpilih' });
    } finally {
      setIsStudentsLoading(false);
    }
  }, []);

  const handleClassSelectForInput = (clsId: string) => {
    setInputClassroomId(clsId);
    handleLoadClassStudents(clsId);
  };

  // Quick Action: Set Semua Siswa ke Status Tertentu
  const handleSetAllStatus = (targetStatus: AttendanceStatus) => {
    setBatchItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: targetStatus,
      }))
    );
  };

  // Ubah Status Siswa Tertentu
  const handleItemStatusChange = (studentId: number, newStatus: AttendanceStatus) => {
    setBatchItems((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status: newStatus } : item))
    );
  };

  // Ubah Catatan Siswa Tertentu
  const handleItemNotesChange = (studentId: number, notes: string) => {
    setBatchItems((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, notes } : item))
    );
  };

  // Submit Batch Absensi
  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!inputDate) {
      setBatchFeedback({ type: 'error', message: 'Tanggal absensi wajib dipilih.' });
      return;
    }
    if (!inputClassroomId) {
      setBatchFeedback({ type: 'error', message: 'Rombel / kelas wajib dipilih.' });
      return;
    }
    if (batchItems.length === 0) {
      setBatchFeedback({ type: 'error', message: 'Tidak ada data siswa untuk disimpan.' });
      return;
    }

    setIsSubmittingBatch(true);
    setBatchFeedback(null);

    try {
      const payload = {
        date: inputDate,
        classroomId: parseInt(inputClassroomId, 10),
        items: batchItems.map((item) => ({
          studentId: item.studentId,
          status: item.status,
          notes: item.notes.trim() || undefined,
        })),
      };

      const res = await apiClient.post<{ savedCount: number; date: string }>(
        '/attendances/batch',
        payload
      );

      if (res.success && res.data) {
        showCreateAlert(
          `Berhasil mencatat presensi ${res.data.savedCount} siswa untuk tanggal ${res.data.date}`
        );
        setBatchFeedback({
          type: 'success',
          message: `Berhasil mencatat presensi ${res.data.savedCount} siswa pada tanggal ${res.data.date}.`,
        });
        // Sinkronisasi filter log dengan tanggal yang baru diinput
        setFilterDate(inputDate);
        setFilterClassroomId(inputClassroomId);
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message || 'Gagal menyimpan absensi massal.';
      setBatchFeedback({ type: 'error', message: errorMsg });
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Helper Badge Status
  const getStatusBadge = (status: AttendanceStatus) => {
    const config: Record<
      AttendanceStatus,
      { label: string; variant: BadgeVariant; dotColor: string }
    > = {
      hadir: { label: 'Hadir', variant: 'paid', dotColor: 'bg-emerald-500' },
      terlambat: { label: 'Terlambat', variant: 'warning', dotColor: 'bg-amber-500' },
      sakit: { label: 'Sakit', variant: 'info', dotColor: 'bg-blue-500' },
      izin: { label: 'Izin', variant: 'neutral', dotColor: 'bg-indigo-500' },
      alpa: { label: 'Alpa', variant: 'void', dotColor: 'bg-rose-500' },
    };

    const c = config[status] || {
      label: status,
      variant: 'neutral' as BadgeVariant,
      dotColor: 'bg-zinc-400',
    };

    return (
      <Badge variant={c.variant} size="sm" className="gap-1.5 font-medium">
        <span className={`w-1.5 h-1.5 rounded-full ${c.dotColor}`} />
        <span>{c.label}</span>
      </Badge>
    );
  };

  // Kolom DataTable Riwayat Log
  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'date',
      header: 'Tanggal',
      isMono: true,
      render: (row) => (
        <span className="font-mono text-xs text-zinc-900 font-medium">{row.date}</span>
      ),
    },
    {
      key: 'nis',
      header: 'NIS / NISN',
      isMono: true,
      render: (row) => (
        <div>
          <span className="font-mono text-xs text-zinc-950 font-medium block">
            {row.studentNis || '-'}
          </span>
          {row.studentNisn && (
            <span className="text-[10px] text-zinc-400 font-mono">NISN: {row.studentNisn}</span>
          )}
        </div>
      ),
    },
    {
      key: 'studentName',
      header: 'Nama Siswa',
      render: (row) => (
        <span className="text-xs font-semibold text-zinc-950">{row.studentName || '-'}</span>
      ),
    },
    {
      key: 'classroomName',
      header: 'Kelas / Rombel',
      render: (row) => (
        <Badge variant="outline" size="sm">
          Kelas {row.classroomName || '-'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status Presensi',
      align: 'center',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'notes',
      header: 'Keterangan',
      render: (row) => (
        <span className="text-xs text-zinc-500 italic">{row.notes || '-'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Halaman & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
              Riwayat &amp; Input Presensi
            </h1>
            <Badge variant="neutral" size="sm">
              Operasional Harian
            </Badge>
          </div>
          <p className="text-xs text-steel mt-0.5">
            Pencatatan kehadiran harian massal per rombel dan pemantauan rekapitulasi kehadiran siswa.
          </p>
        </div>

        {/* Actions & Tab Switcher */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/layar-absen"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/90 rounded-xl shadow-xs transition-all"
            title="Buka Layar Absen Mandiri Fullscreen di Tab Baru"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Layar Kiosk</span>
          </Link>

          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('log')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'log'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Log &amp; Rekapitulasi</span>
          </button>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'input'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Input Presensi Cepat</span>
            </button>
          )}
        </div>
      </div>
    </div>

      {/* ======================= TAB 1: LOG & REKAPITULASI ======================= */}
      {activeTab === 'log' && (
        <div className="space-y-6">
          {/* Kartu Ringkasan Metrik (TasteSkill UI) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-zinc-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider block">
                Total Tercatat
              </span>
              <p className="font-mono text-xl font-bold text-zinc-950 mt-1">{summary.total}</p>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <span className="text-[11px] text-emerald-800 font-medium uppercase tracking-wider block">
                Hadir
              </span>
              <p className="font-mono text-xl font-bold text-emerald-700 mt-1">{summary.hadir}</p>
            </div>

            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <span className="text-[11px] text-amber-800 font-medium uppercase tracking-wider block">
                Terlambat
              </span>
              <p className="font-mono text-xl font-bold text-amber-700 mt-1">{summary.terlambat}</p>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <span className="text-[11px] text-blue-800 font-medium uppercase tracking-wider block">
                Sakit
              </span>
              <p className="font-mono text-xl font-bold text-blue-700 mt-1">{summary.sakit}</p>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <span className="text-[11px] text-indigo-800 font-medium uppercase tracking-wider block">
                Izin
              </span>
              <p className="font-mono text-xl font-bold text-indigo-700 mt-1">{summary.izin}</p>
            </div>

            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <span className="text-[11px] text-rose-800 font-medium uppercase tracking-wider block">
                Alpa
              </span>
              <p className="font-mono text-xl font-bold text-rose-700 mt-1">{summary.alpa}</p>
            </div>
          </div>

          {/* DataTable Riwayat */}
          <DataTable
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            data={records as unknown as Record<string, unknown>[]}
            isLoading={isLogLoading}
            searchQuery={searchQuery}
            onSearchChange={(val) => {
              setSearchQuery(val);
              setLogPage(1);
            }}
            searchPlaceholder="Cari NIS, nama siswa..."
            page={logPage}
            totalRows={totalRows}
            perPage={perPage}
            onPageChange={setLogPage}
            emptyMessage="Tidak ada riwayat presensi yang cocok dengan filter tanggal/kelas"
            filterSlot={
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="w-full sm:w-40">
                  <InputField
                    label=""
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      setLogPage(1);
                    }}
                  />
                </div>

                <div className="w-full sm:w-44">
                  <SelectField
                    label=""
                    options={[
                      { label: 'Semua Kelas', value: '' },
                      ...classrooms.map((c) => ({
                        label: `Kelas ${c.name}`,
                        value: c.id.toString(),
                      })),
                    ]}
                    value={filterClassroomId}
                    onChange={(e) => {
                      setFilterClassroomId(e.target.value);
                      setLogPage(1);
                    }}
                  />
                </div>

                <div className="w-full sm:w-36">
                  <SelectField
                    label=""
                    options={[
                      { label: 'Semua Status', value: '' },
                      { label: 'Hadir', value: 'hadir' },
                      { label: 'Terlambat', value: 'terlambat' },
                      { label: 'Sakit', value: 'sakit' },
                      { label: 'Izin', value: 'izin' },
                      { label: 'Alpa', value: 'alpa' },
                    ]}
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setLogPage(1);
                    }}
                  />
                </div>

                {filterDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterDate('');
                      setLogPage(1);
                    }}
                    className="text-xs text-zinc-500 h-9"
                  >
                    Semua Tanggal
                  </Button>
                )}
              </div>
            }
          />
        </div>
      )}

      {/* ======================= TAB 2: INPUT PRESENSI MASSAL ======================= */}
      {activeTab === 'input' && (
        <div className="space-y-6">
          <form onSubmit={handleSubmitBatch} className="space-y-6">
            {/* Panel Pengaturan Rombel & Tanggal */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-zinc-950">
                  Parameter Presensi Rombel
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField
                  label="Tanggal Presensi"
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  required
                />

                <SelectField
                  label="Pilih Rombel / Kelas"
                  options={[
                    { label: '-- Pilih Kelas --', value: '' },
                    ...classrooms.map((c) => ({
                      label: `Kelas ${c.name} (${c.level})`,
                      value: c.id.toString(),
                    })),
                  ]}
                  value={inputClassroomId}
                  onChange={(e) => handleClassSelectForInput(e.target.value)}
                  required
                />

                <div className="flex flex-col justify-end">
                  <div className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200/70 p-2.5 rounded-xl">
                    <span className="font-semibold text-zinc-900 block">Aturan Pencatatan:</span>
                    Data absensi otomatis tersimpan/terbarukan (upsert) tanpa duplikasi record per tanggal.
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Alert */}
            {batchFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                  batchFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {batchFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{batchFeedback.message}</span>
              </div>
            )}

            {/* Tabel Daftar Siswa Rombel */}
            {inputClassroomId && (
              <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                {/* Baris Tombol Cepat (Quick Actions) */}
                <div className="p-4 bg-zinc-50/70 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-zinc-900">
                      Daftar Siswa Kelas Terpilih
                    </span>
                    <Badge variant="neutral" size="sm">
                      {batchItems.length} Siswa Aktif
                    </Badge>
                  </div>

                  {batchItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500 hidden sm:inline">Set Massal:</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetAllStatus('hadir')}
                        className="text-xs py-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                        <span>Semua Hadir</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Loading State Siswa */}
                {isStudentsLoading ? (
                  <div className="p-12 text-center text-xs text-zinc-500 space-y-2">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p>Memuat daftar siswa kelas...</p>
                  </div>
                ) : batchItems.length === 0 ? (
                  <div className="p-12 text-center text-xs text-zinc-500">
                    Tidak ada siswa aktif di kelas ini.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {batchItems.map((item, idx) => (
                      <div
                        key={item.studentId}
                        className="p-4 hover:bg-zinc-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        {/* Kolom Identitas Siswa */}
                        <div className="flex items-start gap-3 min-w-[200px]">
                          <span className="font-mono text-xs text-zinc-400 w-6 pt-0.5">
                            {idx + 1}.
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-zinc-950 block">
                              {item.name}
                            </span>
                            <span className="font-mono text-[11px] text-zinc-500">
                              NIS: {item.nis}
                            </span>
                          </div>
                        </div>

                        {/* Kolom Pilihan Status (Radio Pills) */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(
                            [
                              { key: 'hadir', label: 'Hadir', activeCls: 'bg-emerald-600 text-white' },
                              { key: 'terlambat', label: 'Terlambat', activeCls: 'bg-amber-600 text-white' },
                              { key: 'sakit', label: 'Sakit', activeCls: 'bg-blue-600 text-white' },
                              { key: 'izin', label: 'Izin', activeCls: 'bg-indigo-600 text-white' },
                              { key: 'alpa', label: 'Alpa', activeCls: 'bg-rose-600 text-white' },
                            ] as const
                          ).map((statusOption) => {
                            const isSelected = item.status === statusOption.key;
                            return (
                              <button
                                key={statusOption.key}
                                type="button"
                                onClick={() => handleItemStatusChange(item.studentId, statusOption.key)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                                  isSelected
                                    ? `${statusOption.activeCls} border-transparent shadow-xs`
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100/70'
                                }`}
                              >
                                {statusOption.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Kolom Catatan Opsional */}
                        <div className="w-full md:w-56">
                          <input
                            type="text"
                            placeholder="Catatan (opsional)..."
                            value={item.notes}
                            onChange={(e) => handleItemNotesChange(item.studentId, e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Submit Button */}
                {batchItems.length > 0 && (
                  <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      Total <strong>{batchItems.length}</strong> siswa siap disimpan.
                    </span>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isSubmittingBatch}
                      disabled={isStudentsLoading}
                    >
                      <Save className="w-4 h-4 mr-1.5" />
                      <span>Simpan Presensi Kelas</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
