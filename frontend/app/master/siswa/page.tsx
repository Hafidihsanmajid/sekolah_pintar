'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/context/alert-context';
import { apiClient } from '@/lib/api-client';
import { Student, Classroom, AcademicYear, PaginatedData } from '@/types/api';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import { UserPlus, Pencil, Trash2, AlertTriangle, GraduationCap, TrendingUp } from 'lucide-react';
import { addAlumni, getAlumniList } from '@/lib/alumni';

function parseGradeLevel(level?: string | null, className?: string | null): number | null {
  const l = (level || '').trim().toUpperCase();
  if (l === '10' || l === 'X') return 10;
  if (l === '11' || l === 'XI') return 11;
  if (l === '12' || l === 'XII') return 12;

  const name = (className || '').trim().toUpperCase();
  if (/(^|\b)(10|X)(\b|[-_ ])/i.test(name)) return 10;
  if (/(^|\b)(11|XI)(\b|[-_ ])/i.test(name)) return 11;
  if (/(^|\b)(12|XII)(\b|[-_ ])/i.test(name)) return 12;

  const num = parseInt(l, 10);
  return !isNaN(num) && num > 0 ? num : null;
}

export default function MasterSiswaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showCreateAlert, showUpdateAlert, showDeleteAlert } = useAlert();
  const isReadOnly = user?.role === 'kepala_sekolah';

  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    name: '',
    classroomId: '',
    entryYear: new Date().getFullYear().toString(),
    phoneNumber: '',
    address: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Graduate State
  const [isGraduateModalOpen, setIsGraduateModalOpen] = useState(false);
  const [graduatingStudent, setGraduatingStudent] = useState<Student | null>(null);
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear().toString());

  // Promote State (Naik Kelas)
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promotingStudent, setPromotingStudent] = useState<Student | null>(null);
  const [targetClassroomId, setTargetClassroomId] = useState('');

  // Fetch Academic Years
  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await apiClient.get<AcademicYear[]>('/academic-years');
      if (res.success && res.data) {
        setAcademicYears(res.data);
      }
    } catch {
      // Handled
    }
  }, []);

  // Fetch Classrooms
  const fetchClassrooms = useCallback(async () => {
    try {
      const res = await apiClient.get<Classroom[]>('/classrooms');
      if (res.success && res.data) {
        setClassrooms(res.data);
      }
    } catch {
      // Handled by global interceptor
    }
  }, []);

  // Filtered Classrooms by selected Academic Year
  const filteredClassrooms = useMemo(() => {
    const list = !selectedAcademicYearId
      ? classrooms
      : classrooms.filter((c) => c.academicYearId.toString() === selectedAcademicYearId);
    return list.filter((c) => c.name.toLowerCase() !== 'tagihan alumni');
  }, [classrooms, selectedAcademicYearId]);

  // Available Target Classrooms for promotion strictly of next grade level (no level skipping)
  const availableTargetClassrooms = useMemo(() => {
    if (!promotingStudent) return [];
    const currentLevel = parseGradeLevel(promotingStudent.classroomLevel, promotingStudent.classroomName);
    if (!currentLevel || currentLevel >= 12) return [];
    const targetLevel = currentLevel + 1;

    return classrooms.filter((c) => {
      if (c.name.toLowerCase() === 'tagihan alumni') return false;
      const cLevel = parseGradeLevel(c.level, c.name);
      return cLevel === targetLevel;
    });
  }, [promotingStudent, classrooms]);

  // Handler Tahun Ajaran Change
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

  // Handler Classroom Change
  const handleClassroomChange = (classroomId: string) => {
    setSelectedClassroomId(classroomId);
    setPage(1);
    if (classroomId && !selectedAcademicYearId) {
      const cls = classrooms.find((c) => c.id.toString() === classroomId);
      if (cls) {
        setSelectedAcademicYearId(cls.academicYearId.toString());
      }
    }
  };

  // Fetch Students
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        perPage: 10,
      };
      if (searchQuery) params.search = searchQuery;
      if (selectedAcademicYearId) params.academicYearId = selectedAcademicYearId;
      if (selectedClassroomId) params.classroomId = selectedClassroomId;

      const res = await apiClient.get<PaginatedData<Student>>('/students', { params });
      if (res.success && res.data) {
        const alumniList = getAlumniList();
        const alumniNisSet = new Set(alumniList.map((a) => a.nis));
        const filteredItems = res.data.items.filter(
          (s) => !alumniNisSet.has(s.nis) && s.classroomName?.toLowerCase() !== 'tagihan alumni'
        );

        setStudents(filteredItems);
        const removedCount = res.data.items.length - filteredItems.length;
        setTotalRows(Math.max(0, res.data.pagination.total - removedCount));
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, selectedAcademicYearId, selectedClassroomId]);

  useEffect(() => {
    fetchAcademicYears();
    fetchClassrooms();
  }, [fetchAcademicYears, fetchClassrooms]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenCreate = () => {
    setEditingStudent(null);
    const availableClassrooms = classrooms.filter((c) => c.name.toLowerCase() !== 'tagihan alumni');
    setFormData({
      nis: '',
      nisn: '',
      name: '',
      classroomId: availableClassrooms[0]?.id?.toString() || '',
      entryYear: new Date().getFullYear().toString(),
      phoneNumber: '',
      address: '',
      isActive: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nis: student.nis,
      nisn: student.nisn || '',
      name: student.name,
      classroomId: student.classroomId.toString(),
      entryYear: student.entryYear,
      phoneNumber: student.phoneNumber || '',
      address: student.address || '',
      isActive: student.isActive,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.nis.trim()) errs.nis = 'NIS wajib diisi';
    if (!formData.name.trim()) errs.name = 'Nama lengkap wajib diisi';
    if (!formData.classroomId) errs.classroomId = 'Pilih kelas';
    if (!formData.entryYear.trim()) errs.entryYear = 'Tahun masuk wajib diisi';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        nis: formData.nis,
        nisn: formData.nisn || null,
        name: formData.name,
        classroomId: parseInt(formData.classroomId, 10),
        entryYear: formData.entryYear,
        phoneNumber: formData.phoneNumber || null,
        address: formData.address || null,
        isActive: formData.isActive,
      };

      if (editingStudent) {
        await apiClient.put(`/students/${editingStudent.id}`, payload);
        showUpdateAlert(`Data siswa ${formData.name} berhasil diperbarui.`);
      } else {
        await apiClient.post('/students', payload);
        showCreateAlert(`Data siswa ${formData.name} berhasil ditambahkan.`);
      }

      setIsModalOpen(false);
      fetchStudents();
    } catch (err: unknown) {
      const errRes = err as { errors?: Record<string, string[]> };
      if (errRes.errors) {
        const mappedErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(errRes.errors)) {
          mappedErrors[key] = msgs[0];
        }
        setFormErrors(mappedErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/students/${deletingStudent.id}`);
      showDeleteAlert(`Data siswa ${deletingStudent.name} berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      fetchStudents();
    } catch {
      // Handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmGraduation = async () => {
    if (!graduatingStudent) return;
    setIsSubmitting(true);
    try {
      // 1. Catat ke Data Alumni
      addAlumni({
        nis: graduatingStudent.nis,
        nisn: graduatingStudent.nisn,
        name: graduatingStudent.name,
        lastClassroom: graduatingStudent.classroomName || 'Kelas XII',
        entryYear: graduatingStudent.entryYear,
        graduationYear: (graduationYear || '').trim() || new Date().getFullYear().toString(),
        phoneNumber: graduatingStudent.phoneNumber,
        address: graduatingStudent.address,
      });

      // 2. Dapatkan atau buat kelas khusus "Tagihan Alumni"
      let alumniClassroom = classrooms.find((c) => c.name.toLowerCase() === 'tagihan alumni');
      if (!alumniClassroom) {
        try {
          const resClass = await apiClient.get<Classroom[]>('/classrooms');
          if (resClass.success && resClass.data) {
            alumniClassroom = resClass.data.find((c) => c.name.toLowerCase() === 'tagihan alumni');
          }
        } catch {
          // Handled
        }
      }

      if (!alumniClassroom) {
        try {
          const activeYear = academicYears.find((y) => y.isActive) || academicYears[0];
          const createRes = await apiClient.post<Classroom>('/classrooms', {
            name: 'Tagihan Alumni',
            level: 'Alumni',
            academicYearId: activeYear?.id || 1,
          });
          if (createRes.success && createRes.data) {
            alumniClassroom = createRes.data;
          }
        } catch {
          // Handled
        }
      }

      // 3. Pindahkan siswa dan tagihannya ke kelas "Tagihan Alumni" tanpa menghapus tagihan
      if (alumniClassroom) {
        try {
          await apiClient.put(`/students/${graduatingStudent.id}`, {
            nis: graduatingStudent.nis,
            nisn: graduatingStudent.nisn,
            name: graduatingStudent.name,
            classroomId: alumniClassroom.id,
            entryYear: graduatingStudent.entryYear,
            phoneNumber: graduatingStudent.phoneNumber,
            address: graduatingStudent.address,
            isActive: true,
          });
        } catch {
          // Handled
        }
      }

      // 4. Hapus dari tampilan tabel data siswa aktif saat ini
      setStudents((prev) => prev.filter((s) => s.id !== graduatingStudent.id));
      setTotalRows((prev) => Math.max(0, prev - 1));

      showCreateAlert(
        `Siswa ${graduatingStudent.name} dinyatakan lulus dan dipindahkan ke Data Alumni. Tagihan siswa dialihkan ke kelas Tagihan Alumni.`
      );
      setIsGraduateModalOpen(false);
      router.push('/master/alumni');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPromote = (student: Student) => {
    setPromotingStudent(student);
    const currentLevel = parseGradeLevel(student.classroomLevel, student.classroomName);
    const targetLevel = currentLevel ? currentLevel + 1 : null;
    const matching = classrooms.filter((c) => {
      if (c.name.toLowerCase() === 'tagihan alumni') return false;
      return parseGradeLevel(c.level, c.name) === targetLevel;
    });
    setTargetClassroomId(matching[0]?.id?.toString() || '');
    setIsPromoteModalOpen(true);
  };

  const handleConfirmPromote = async () => {
    if (!promotingStudent || !targetClassroomId) return;
    setIsSubmitting(true);
    try {
      const targetClass = classrooms.find((c) => c.id.toString() === targetClassroomId.toString());
      if (!targetClass) return;

      const currentLevel = parseGradeLevel(promotingStudent.classroomLevel, promotingStudent.classroomName);
      const targetLevel = parseGradeLevel(targetClass.level, targetClass.name);

      if (!currentLevel || !targetLevel || targetLevel !== currentLevel + 1) {
        showUpdateAlert('Kenaikan kelas gagal: Kelas tidak boleh melompat tingkat.');
        return;
      }

      await apiClient.put(`/students/${promotingStudent.id}`, {
        nis: promotingStudent.nis,
        nisn: promotingStudent.nisn,
        name: promotingStudent.name,
        classroomId: targetClass.id,
        entryYear: promotingStudent.entryYear,
        phoneNumber: promotingStudent.phoneNumber,
        address: promotingStudent.address,
        isActive: promotingStudent.isActive,
      });

      setStudents((prev) =>
        prev.map((s) =>
          s.id === promotingStudent.id
            ? {
                ...s,
                classroomId: targetClass.id,
                classroomName: targetClass.name,
                classroomLevel: targetClass.level,
                academicYearId: targetClass.academicYearId,
                academicYearName: targetClass.academicYearName,
              }
            : s
        )
      );

      showUpdateAlert(
        `Siswa ${promotingStudent.name} berhasil dinaikkan ke kelas ${targetClass.name} beserta seluruh tagihannya.`
      );
      setIsPromoteModalOpen(false);
      fetchStudents();
    } catch {
      // Handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Student>[] = [
    {
      key: 'nis',
      header: 'NIS / NISN',
      isMono: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-zinc-950 font-mono text-xs">{row.nis}</div>
          <div className="text-[11px] text-zinc-400 font-mono">{row.nisn || '-'}</div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Nama Siswa',
      render: (row) => (
        <div>
          <div className="font-medium text-zinc-900 text-xs">{row.name}</div>
          <div className="text-[11px] text-zinc-400">{row.address || 'Alamat belum diisi'}</div>
        </div>
      ),
    },
    {
      key: 'classroomName',
      header: 'Kelas',
      render: (row) => (
        <div>
          <Badge variant="outline" size="sm">
            {row.classroomName || 'Belum diatur'}
          </Badge>
          {row.academicYearName && (
            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{row.academicYearName}</div>
          )}
        </div>
      ),
    },
    {
      key: 'entryYear',
      header: 'Angkatan',
      isMono: true,
      render: (row) => <span className="text-xs text-zinc-600 font-mono">{row.entryYear}</span>,
    },
    {
      key: 'phoneNumber',
      header: 'Kontak',
      render: (row) => (
        <span className="text-xs text-zinc-600 font-mono">{row.phoneNumber || '-'}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'neutral'} size="sm">
          {row.isActive ? 'Aktif' : 'Non-Aktif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (row) => {
        const isGrade12 =
          row.classroomLevel === '12' ||
          row.classroomLevel === 'XII' ||
          parseGradeLevel(row.classroomLevel, row.classroomName) === 12 ||
          (row.classroomName ? /(^XII|\bXII\b|\b12\b)/i.test(row.classroomName) : false);

        return !isReadOnly ? (
          <div className="flex items-center justify-end gap-1">
            {isGrade12 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setGraduatingStudent(row);
                  setGraduationYear(new Date().getFullYear().toString());
                  setIsGraduateModalOpen(true);
                }}
                className="px-2 py-1 h-7 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-xs flex items-center gap-1 font-medium"
                title="Luluskan Siswa ke Data Alumni"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lulus</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPromote(row);
                }}
                className="px-2 py-1 h-7 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 text-xs flex items-center gap-1 font-medium"
                title="Naikkan Kelas Siswa"
              >
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>Naik Kelas</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(row);
              }}
              className="px-2 py-1 h-7"
              title="Edit Data Siswa"
            >
              <Pencil className="w-3 h-3 text-zinc-600" />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingStudent(row);
                setIsDeleteModalOpen(true);
              }}
              className="px-2 py-1 h-7 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
              title="Hapus Siswa"
            >
              <Trash2 className="w-3 h-3 text-rose-600" />
            </Button>
          </div>
        ) : (
          <span className="text-xs text-zinc-400 italic">Read-only</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
            Data Siswa
          </h1>
          <p className="text-xs text-steel mt-0.5">
            Kelola data induk siswa, penempatan rombel kelas, dan nomor kontak wali murid.
          </p>
        </div>

        {!isReadOnly && (
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <UserPlus className="w-3.5 h-3.5 mr-1" />
            <span>Tambah Siswa</span>
          </Button>
        )}
      </div>

      {/* Data Table with Integrated Filters */}
      <DataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={students as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Cari siswa berdasarkan NIS atau Nama..."
        filterSlot={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter Tahun Ajaran"
              value={selectedAcademicYearId}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
              className="h-8 px-2.5 py-1 text-xs bg-zinc-50 border border-zinc-200/90 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-600 transition cursor-pointer font-medium"
            >
              <option value="">Semua Tahun Ajaran</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id.toString()}>
                  {y.name}{y.isActive ? ' (Aktif)' : ''}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Kelas"
              value={selectedClassroomId}
              onChange={(e) => handleClassroomChange(e.target.value)}
              className="h-8 px-2.5 py-1 text-xs bg-zinc-50 border border-zinc-200/90 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-600 transition cursor-pointer font-medium"
            >
              <option value="">Semua Kelas</option>
              {filteredClassrooms.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  Kelas {c.name} {c.academicYearName ? `(${c.academicYearName})` : ''}
                </option>
              ))}
            </select>

            {(selectedAcademicYearId || selectedClassroomId) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAcademicYearId('');
                  setSelectedClassroomId('');
                  setPage(1);
                }}
                className="h-8 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition cursor-pointer font-medium"
              >
                Reset
              </button>
            )}
          </div>
        }
        page={page}
        totalRows={totalRows}
        perPage={10}
        onPageChange={setPage}
        emptyMessage="Belum ada data siswa ditemukan"
      />

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Perbarui Data Siswa' : 'Tambah Siswa Baru'}
        description="Pastikan nomor induk siswa unik dan kelas terdaftar pada tahun ajaran aktif."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Nomor Induk Siswa (NIS)"
              placeholder="Contoh: 20251001"
              value={formData.nis}
              onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
              errorMessage={formErrors.nis}
              required
            />
            <InputField
              label="NISN (Opsional)"
              placeholder="Contoh: 0071234501"
              value={formData.nisn}
              onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
              errorMessage={formErrors.nisn}
            />
          </div>

          <InputField
            label="Nama Lengkap Siswa"
            placeholder="Contoh: Ahmad Fauzan"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            errorMessage={formErrors.name}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField
              label="Pilihan Kelas"
              options={[
                { label: '-- Pilih Kelas --', value: '' },
                ...classrooms.map((c) => ({
                  label: c.academicYearName ? `${c.name} (${c.academicYearName})` : c.name,
                  value: c.id.toString(),
                })),
              ]}
              value={formData.classroomId}
              onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
              errorMessage={formErrors.classroomId}
              required
            />
            <InputField
              label="Tahun Angkatan Masuk"
              placeholder="Contoh: 2025"
              value={formData.entryYear}
              onChange={(e) => setFormData({ ...formData, entryYear: e.target.value })}
              errorMessage={formErrors.entryYear}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Nomor Telepon / WhatsApp Wali"
              placeholder="081234567890"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              errorMessage={formErrors.phoneNumber}
            />
            <div className="flex flex-col justify-end">
              <label className="text-xs font-medium text-zinc-700 mb-1.5">Status Siswa</label>
              <div className="flex items-center gap-2 h-9 px-3 border border-zinc-200 rounded-xl bg-white">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-xs text-zinc-700 cursor-pointer select-none">
                  Siswa Aktif Terdaftar
                </label>
              </div>
            </div>
          </div>

          <InputField
            label="Alamat Tempat Tinggal"
            placeholder="Jl. Merdeka No. 10..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            errorMessage={formErrors.address}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Simpan Data
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Siswa"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              Apakah Anda yakin ingin menghapus siswa <strong>{deletingStudent?.name}</strong> (NIS: {deletingStudent?.nis})? Tindakan ini tidak dapat dibatalkan.
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={isSubmitting}
            >
              Hapus Siswa
            </Button>
          </div>
        </div>
      </Modal>

      {/* Graduate Confirmation Modal */}
      <Modal
        isOpen={isGraduateModalOpen}
        onClose={() => setIsGraduateModalOpen(false)}
        title="Konfirmasi Kelulusan Siswa"
        description="Apakah siswa benar lulus dan siap dipindahkan ke Data Alumni?"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <p className="font-semibold text-sm text-emerald-900">{graduatingStudent?.name}</p>
              <p className="font-mono text-emerald-800">
                NIS: {graduatingStudent?.nis} {graduatingStudent?.nisn ? `| NISN: ${graduatingStudent.nisn}` : ''}
              </p>
              <p className="text-emerald-700">
                Kelas: {graduatingStudent?.classroomName || 'Kelas XII'} (Angkatan {graduatingStudent?.entryYear})
              </p>
            </div>
          </div>

          <div className="text-xs text-zinc-600 leading-relaxed">
            Apakah siswa benar lulus? Konfirmasi ini akan mencatat siswa ke dalam sub menu <strong>Data Alumni</strong> dan memindahkan tagihannya ke kelas khusus <strong>Tagihan Alumni</strong> di Kasir Pembayaran tanpa menghapus tagihan yang belum lunas.
          </div>

          <InputField
            label="Tahun Kelulusan"
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            placeholder="Contoh: 2026"
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGraduateModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleConfirmGraduation}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Ya, Siswa Benar Lulus
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Naikkan Kelas Siswa */}
      <Modal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        title="Kenaikan Kelas Siswa"
        description="Pindahkan siswa ke tingkat kelas berikutnya beserta tagihannya."
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950 space-y-1">
              <p className="font-semibold text-sm text-blue-900">{promotingStudent?.name}</p>
              <p className="font-mono text-blue-800">
                NIS: {promotingStudent?.nis} {promotingStudent?.nisn ? `| NISN: ${promotingStudent.nisn}` : ''}
              </p>
              <p className="text-blue-700">
                Kelas Saat Ini: <strong>{promotingStudent?.classroomName || 'Belum diatur'}</strong> (Tingkat{' '}
                {parseGradeLevel(promotingStudent?.classroomLevel, promotingStudent?.classroomName) || '-'})
              </p>
            </div>
          </div>

          {parseGradeLevel(promotingStudent?.classroomLevel, promotingStudent?.classroomName) === 12 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              Siswa ini sudah berada di tingkat akhir (Kelas XII). Siswa tingkat akhir tidak dapat dinaikkan kelas lagi.
              Silakan gunakan tombol <strong>Lulus</strong> untuk meluluskan siswa ke Data Alumni.
            </div>
          ) : availableTargetClassrooms.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              Tidak ditemukan kelas tujuan untuk tingkat{' '}
              {(parseGradeLevel(promotingStudent?.classroomLevel, promotingStudent?.classroomName) || 0) + 1}. Silakan
              tambahkan kelas tingkat tersebut di sub menu Kelas terlebih dahulu.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-zinc-600 leading-relaxed">
                Pilih kelas tujuan untuk tingkat{' '}
                <strong className="text-blue-700">
                  {(parseGradeLevel(promotingStudent?.classroomLevel, promotingStudent?.classroomName) || 0) + 1}
                </strong>
                . Sesuai aturan, kelas tidak boleh melompat tingkat. Seluruh tagihan siswa akan tetap tersinkron dan
                mengikuti kelas baru.
              </div>

              <SelectField
                label="Pilih Kelas Tujuan"
                options={availableTargetClassrooms.map((c) => ({
                  label: `Kelas ${c.name} (Tingkat ${c.level})${c.academicYearName ? ` - ${c.academicYearName}` : ''}`,
                  value: c.id.toString(),
                }))}
                value={targetClassroomId}
                onChange={(e) => setTargetClassroomId(e.target.value)}
                required
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPromoteModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleConfirmPromote}
              disabled={
                isSubmitting ||
                !targetClassroomId ||
                availableTargetClassrooms.length === 0 ||
                parseGradeLevel(promotingStudent?.classroomLevel, promotingStudent?.classroomName) === 12
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Konfirmasi Naik Kelas
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
