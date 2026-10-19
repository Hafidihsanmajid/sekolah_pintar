'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { Student, Classroom, AcademicYear, PaginatedData } from '@/types/api';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { SelectField } from '@/components/ui/SelectField';
import {
  Users,
  School,
  Calendar,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function AbsensiDataSiswaPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const perPage = 15;

  // Fetch Classrooms & Academic Years
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [classRes, yearRes] = await Promise.all([
        apiClient.get<Classroom[]>('/classrooms'),
        apiClient.get<AcademicYear[]>('/academic-years'),
      ]);

      if (classRes.success && classRes.data) {
        // Kecualikan kelas khusus Tagihan Alumni
        setClassrooms(classRes.data.filter((c) => c.name.toLowerCase() !== 'tagihan alumni'));
      }

      if (yearRes.success && yearRes.data) {
        setAcademicYears(yearRes.data);
      }
    } catch {
      // Handled
    }
  }, []);

  // Fetch Attendance Students (Active only, excluding Tagihan Alumni)
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        perPage,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (selectedClassroomId) {
        params.classroomId = selectedClassroomId;
      }
      if (selectedAcademicYearId) {
        params.academicYearId = selectedAcademicYearId;
      }

      const res = await apiClient.get<PaginatedData<Student>>('/attendances/students', { params });
      if (res.success && res.data) {
        setStudents(res.data.items);
        setTotalRows(res.data.pagination.total);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, selectedClassroomId, selectedAcademicYearId]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filtered Classrooms by selected Academic Year
  const filteredClassrooms = useMemo(() => {
    if (!selectedAcademicYearId) return classrooms;
    return classrooms.filter((c) => c.academicYearId.toString() === selectedAcademicYearId);
  }, [classrooms, selectedAcademicYearId]);

  const handleAcademicYearChange = (yearId: string) => {
    setSelectedAcademicYearId(yearId);
    setPage(1);
    if (yearId && selectedClassroomId) {
      const currentClassroom = classrooms.find((c) => c.id.toString() === selectedClassroomId);
      if (currentClassroom && currentClassroom.academicYearId.toString() !== yearId) {
        setSelectedClassroomId('');
      }
    }
  };

  const handleClassroomChange = (classroomId: string) => {
    setSelectedClassroomId(classroomId);
    setPage(1);
    if (classroomId && !selectedAcademicYearId) {
      const cls = classrooms.find((c) => c.id.toString() === classroomId);
      if (cls && cls.academicYearId) {
        setSelectedAcademicYearId(cls.academicYearId.toString());
      }
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  // Kolom DataTable Sesuai PRD (Read-Only: Tanpa Tombol Edit/Hapus/Mutasi)
  const columns: Column<Student>[] = [
    {
      key: 'nis',
      header: 'NIS / NISN',
      isMono: true,
      render: (row) => (
        <div>
          <span className="font-mono font-medium text-xs text-zinc-950 block">{row.nis}</span>
          {row.nisn && (
            <span className="text-[11px] text-zinc-400 font-mono">NISN: {row.nisn}</span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Nama Siswa',
      render: (row) => (
        <div className="font-medium text-xs text-zinc-950 flex items-center gap-2">
          <span>{row.name}</span>
        </div>
      ),
    },
    {
      key: 'classroomName',
      header: 'Rombel / Kelas',
      render: (row) => (
        <div>
          <Badge variant="outline" size="sm">
            Kelas {row.classroomName || 'Belum diatur'}
          </Badge>
          {row.academicYearName && (
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              TA {row.academicYearName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'entryYear',
      header: 'Angkatan',
      isMono: true,
      render: (row) => (
        <span className="text-xs text-zinc-600 font-mono">{row.entryYear}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status Siswa',
      align: 'center',
      render: () => (
        <Badge variant="paid" size="sm">
          Siswa Aktif
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
              Data Siswa (Presensi)
            </h1>
            <Badge variant="neutral" size="sm">
              Read-Only
            </Badge>
          </div>
          <p className="text-xs text-steel mt-0.5">
            Daftar siswa aktif per rombel untuk kebutuhan validasi dan pencatatan kehadiran harian.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200/80 shadow-xs flex items-center gap-2 text-xs">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-zinc-500">Total Siswa Aktif:</span>
            <span className="font-mono font-semibold text-zinc-950">{totalRows}</span>
          </div>
        </div>
      </div>

      {/* Informasi Read-Only & Pengecualian Alumni */}
      <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-start gap-3 text-xs text-zinc-600">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          Halaman ini bersifat <strong>hanya baca (read-only)</strong>. Perubahan data induk siswa (tambah, ubah kelas, atau kelulusan) dikelola melalui menu <strong>Master Data &gt; Data Siswa</strong>. Seluruh siswa di kelas <em>Tagihan Alumni</em> secara otomatis dikecualikan dari daftar presensi ini.
        </div>
      </div>

      {/* DataTable TasteSkill */}
      <DataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={students as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Cari NIS, NISN, atau nama siswa..."
        page={page}
        totalRows={totalRows}
        perPage={perPage}
        onPageChange={setPage}
        emptyMessage="Tidak ada data siswa aktif yang cocok dengan filter pencarian"
        filterSlot={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="w-full sm:w-48">
              <SelectField
                label=""
                options={[
                  { label: 'Semua Tahun Ajaran', value: '' },
                  ...academicYears.map((y) => ({
                    label: `${y.name}${y.isActive ? ' (Aktif)' : ''}`,
                    value: y.id.toString(),
                  })),
                ]}
                value={selectedAcademicYearId}
                onChange={(e) => handleAcademicYearChange(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-48">
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
        }
      />
    </div>
  );
}
