'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import { Student, Classroom, AcademicYear, PaginatedData } from '@/types/api';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import { UserPlus, Pencil, Trash2, AlertTriangle } from 'lucide-react';

export default function MasterSiswaPage() {
  const { user } = useAuth();
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
    if (!selectedAcademicYearId) return classrooms;
    return classrooms.filter((c) => c.academicYearId.toString() === selectedAcademicYearId);
  }, [classrooms, selectedAcademicYearId]);

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
        setStudents(res.data.items);
        setTotalRows(res.data.pagination.total);
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
    setFormData({
      nis: '',
      nisn: '',
      name: '',
      classroomId: classrooms[0]?.id?.toString() || '',
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
      } else {
        await apiClient.post('/students', payload);
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
      setIsDeleteModalOpen(false);
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
      render: (row) =>
        !isReadOnly ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(row);
              }}
              className="px-2 py-1 h-7"
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
            >
              <Trash2 className="w-3 h-3 text-rose-600" />
            </Button>
          </div>
        ) : (
          <span className="text-xs text-zinc-400 italic">Read-only</span>
        ),
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
                  {y.name} - {y.semester}{y.isActive ? ' (Aktif)' : ''}
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
    </div>
  );
}
