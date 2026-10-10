'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/context/alert-context';
import { apiClient } from '@/lib/api-client';
import { AcademicYear, Classroom } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import {
  Calendar,
  School,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function MasterKelasPage() {
  const { user } = useAuth();
  const { showCreateAlert, showUpdateAlert, showDeleteAlert } = useAlert();
  const isReadOnly = user?.role === 'kepala_sekolah';

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab State: 'classrooms' | 'academicYears'
  const [activeTab, setActiveTab] = useState<'classrooms' | 'academicYears'>('classrooms');

  // Modal Academic Year State
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isYearSubmitting, setIsYearSubmitting] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [yearForm, setYearForm] = useState({
    name: '2025/2026',
    isActive: true,
  });
  const [yearErrors, setYearErrors] = useState<Record<string, string>>({});

  // Modal Classroom State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isClassSubmitting, setIsClassSubmitting] = useState(false);
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);
  const [classForm, setClassForm] = useState({
    academicYearId: '',
    name: '',
    level: '10',
  });
  const [classErrors, setClassErrors] = useState<Record<string, string>>({});

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: 'year' | 'class'; id: number; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [yearRes, classRes] = await Promise.all([
        apiClient.get<AcademicYear[]>('/academic-years'),
        apiClient.get<Classroom[]>('/classrooms'),
      ]);

      if (yearRes.success && yearRes.data) {
        setAcademicYears(yearRes.data);
      }
      if (classRes.success && classRes.data) {
        setClassrooms(classRes.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Academic Year Handlers
  const handleOpenCreateYear = () => {
    setEditingYear(null);
    setYearForm({ name: '', isActive: false });
    setYearErrors({});
    setIsYearModalOpen(true);
  };

  const handleOpenEditYear = (item: AcademicYear) => {
    setEditingYear(item);
    setYearForm({ name: item.name, isActive: item.isActive });
    setYearErrors({});
    setIsYearModalOpen(true);
  };

  const handleSubmitYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearForm.name.trim()) {
      setYearErrors({ name: 'Nama tahun ajaran wajib diisi (contoh: 2025/2026)' });
      return;
    }

    setIsYearSubmitting(true);
    try {
      const payload = {
        name: yearForm.name.trim(),
        isActive: yearForm.isActive,
      };

      if (editingYear) {
        await apiClient.put(`/academic-years/${editingYear.id}`, payload);
        showUpdateAlert(`Tahun ajaran ${payload.name} berhasil diperbarui.`);
      } else {
        await apiClient.post('/academic-years', payload);
        showCreateAlert(`Tahun ajaran ${payload.name} berhasil ditambahkan.`);
      }
      setIsYearModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errRes = err as { message?: string };
      setYearErrors({ general: errRes.message || 'Gagal menyimpan data tahun ajaran' });
    } finally {
      setIsYearSubmitting(false);
    }
  };

  // Classroom Handlers
  const handleOpenCreateClass = () => {
    setEditingClass(null);
    const activeYear = academicYears.find((y) => y.isActive) || academicYears[0];
    setClassForm({
      academicYearId: activeYear ? activeYear.id.toString() : '',
      name: '',
      level: '10',
    });
    setClassErrors({});
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (item: Classroom) => {
    setEditingClass(item);
    setClassForm({
      academicYearId: item.academicYearId.toString(),
      name: item.name,
      level: item.level,
    });
    setClassErrors({});
    setIsClassModalOpen(true);
  };

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!classForm.name.trim()) errs.name = 'Nama kelas wajib diisi (contoh: X-RPL 1)';
    if (!classForm.academicYearId) errs.academicYearId = 'Pilih tahun ajaran';
    if (!classForm.level) errs.level = 'Pilih tingkatan kelas';

    if (Object.keys(errs).length > 0) {
      setClassErrors(errs);
      return;
    }

    setIsClassSubmitting(true);
    try {
      const payload = {
        name: classForm.name,
        academicYearId: parseInt(classForm.academicYearId, 10),
        level: classForm.level,
      };

      if (editingClass) {
        await apiClient.put(`/classrooms/${editingClass.id}`, payload);
        showUpdateAlert(`Kelas ${payload.name} berhasil diperbarui.`);
      } else {
        await apiClient.post('/classrooms', payload);
        showCreateAlert(`Kelas ${payload.name} berhasil ditambahkan.`);
      }
      setIsClassModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errRes = err as { message?: string };
      setClassErrors({ general: errRes.message || 'Gagal menyimpan kelas' });
    } finally {
      setIsClassSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleteError(null);
    try {
      const endpoint =
        deletingItem.type === 'year'
          ? `/academic-years/${deletingItem.id}`
          : `/classrooms/${deletingItem.id}`;
      await apiClient.delete(endpoint);
      showDeleteAlert(
        `${deletingItem.type === 'year' ? 'Tahun ajaran' : 'Kelas'} ${deletingItem.name} berhasil dihapus.`
      );
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errRes = err as { message?: string };
      setDeleteError(errRes.message || 'Gagal menghapus entitas');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
            Kelas & Tahun Ajaran
          </h1>
          <p className="text-xs text-steel mt-0.5">
            Konfigurasi rombel kelas dan kalender periode akademik sekolah.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            {activeTab === 'classrooms' ? (
              <Button variant="primary" size="sm" onClick={handleOpenCreateClass}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Tambah Kelas</span>
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleOpenCreateYear}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Tambah Tahun Ajaran</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('classrooms')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'classrooms'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Daftar Kelas ({classrooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('academicYears')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'academicYears'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Tahun Ajaran ({academicYears.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: KELAS */}
      {activeTab === 'classrooms' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-600 font-medium">
                  <th className="py-3 px-4">Nama Kelas</th>
                  <th className="py-3 px-4">Tingkat</th>
                  <th className="py-3 px-4">Tahun Ajaran</th>
                  <th className="py-3 px-4 text-center">Jumlah Siswa</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {classrooms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      {isLoading ? 'Memuat data kelas...' : 'Belum ada data kelas'}
                    </td>
                  </tr>
                ) : (
                  classrooms.map((cls) => (
                    <tr key={cls.id} className="hover:bg-zinc-50/50 transition">
                      <td className="py-3 px-4 font-semibold text-zinc-950">{cls.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" size="sm">
                          Tingkat {cls.level}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-zinc-600">{cls.academicYearName || '-'}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        <Badge variant="neutral" size="sm">
                          {cls.studentsCount ?? 0} Siswa
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isReadOnly ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditClass(cls)}
                              className="px-2 py-1 h-7"
                            >
                              <Pencil className="w-3 h-3 text-zinc-600" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setDeletingItem({ type: 'class', id: cls.id, name: cls.name });
                                setDeleteError(null);
                                setIsDeleteModalOpen(true);
                              }}
                              className="px-2 py-1 h-7 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">Read-only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TAHUN AJARAN */}
      {activeTab === 'academicYears' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-600 font-medium">
                  <th className="py-3 px-4">Tahun Ajaran</th>
                  <th className="py-3 px-4">Total Rombel Kelas</th>
                  <th className="py-3 px-4">Status Kalender</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {academicYears.map((ay) => (
                  <tr key={ay.id} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3 px-4 font-semibold text-zinc-950 font-mono">{ay.name}</td>
                    <td className="py-3 px-4 text-zinc-600 font-mono">
                      {ay.classroomsCount ?? 0} Kelas
                    </td>
                    <td className="py-3 px-4">
                      {ay.isActive ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Aktif (Sedang Berjalan)</span>
                        </div>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Arsip / Non-Aktif
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isReadOnly ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditYear(ay)}
                            className="px-2 py-1 h-7"
                          >
                            <Pencil className="w-3 h-3 text-zinc-600" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setDeletingItem({ type: 'year', id: ay.id, name: ay.name });
                              setDeleteError(null);
                              setIsDeleteModalOpen(true);
                            }}
                            className="px-2 py-1 h-7 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Kelas */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title={editingClass ? 'Edit Rombel Kelas' : 'Tambah Kelas Baru'}
        description="Pastikan kelas dikaitkan dengan tahun ajaran yang tepat."
        size="md"
      >
        <form onSubmit={handleSubmitClass} className="space-y-4">
          {classErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {classErrors.general}
            </div>
          )}

          <InputField
            label="Nama Kelas"
            placeholder="Contoh: X-RPL 1 atau XII-AKL 2"
            value={classForm.name}
            onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
            errorMessage={classErrors.name}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Tingkatan"
              options={[
                { label: 'Kelas 10', value: '10' },
                { label: 'Kelas 11', value: '11' },
                { label: 'Kelas 12', value: '12' },
              ]}
              value={classForm.level}
              onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}
              errorMessage={classErrors.level}
            />

            <SelectField
              label="Tahun Ajaran"
              options={academicYears.map((y) => ({
                label: `${y.name} ${y.isActive ? '• Aktif' : ''}`,
                value: y.id.toString(),
              }))}
              value={classForm.academicYearId}
              onChange={(e) => setClassForm({ ...classForm, academicYearId: e.target.value })}
              errorMessage={classErrors.academicYearId}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsClassModalOpen(false)}
              disabled={isClassSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isClassSubmitting}
            >
              Simpan Kelas
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Add/Edit Tahun Ajaran */}
      <Modal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        title={editingYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru'}
        description="Hanya 1 tahun ajaran yang dapat berstatus aktif secara bersamaan."
        size="md"
      >
        <form onSubmit={handleSubmitYear} className="space-y-4">
          {yearErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {yearErrors.general}
            </div>
          )}

          <InputField
            label="Tahun Ajaran"
            placeholder="Contoh: 2025/2026"
            value={yearForm.name}
            onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
            errorMessage={yearErrors.name}
            required
          />

          <div className="flex items-center gap-2 p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
            <input
              type="checkbox"
              id="yearActiveCheck"
              checked={yearForm.isActive}
              onChange={(e) => setYearForm({ ...yearForm, isActive: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="yearActiveCheck" className="text-xs text-zinc-800 cursor-pointer select-none">
              Jadikan Tahun Ajaran Aktif Saat Ini
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsYearModalOpen(false)}
              disabled={isYearSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isYearSubmitting}
            >
              Simpan Tahun Ajaran
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Data"
        size="sm"
      >
        <div className="space-y-4">
          {deleteError ? (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {deleteError}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                Apakah Anda yakin ingin menghapus <strong>{deletingItem?.name}</strong>? Data yang masih memiliki relasi tidak dapat dihapus.
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Tutup
            </Button>
            {!deleteError && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
              >
                Hapus Sekarang
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
