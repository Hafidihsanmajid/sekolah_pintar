'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/context/alert-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { StatCard } from '@/components/ui/StatCard';
import {
  AlumniItem,
  getAlumniList,
  addAlumni,
  deleteAlumni,
  saveAlumniList,
} from '@/lib/alumni';
import {
  GraduationCap,
  Trash2,
  Pencil,
  AlertTriangle,
  Award,
  Building2,
  UserPlus,
} from 'lucide-react';

export default function MasterAlumniPage() {
  const { user } = useAuth();
  const { showCreateAlert, showUpdateAlert, showDeleteAlert } = useAlert();
  const isReadOnly = user?.role === 'kepala_sekolah';

  const [alumni, setAlumni] = useState<AlumniItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGraduationYear, setSelectedGraduationYear] = useState('');
  const [selectedLastClass, setSelectedLastClass] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState<AlumniItem | null>(null);
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    name: '',
    lastClassroom: 'XII-IPA 1',
    entryYear: '2023',
    graduationYear: new Date().getFullYear().toString(),
    phoneNumber: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Modal Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAlumni, setDeletingAlumni] = useState<AlumniItem | null>(null);

  const loadData = useCallback(() => {
    setAlumni(getAlumniList());
  }, []);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('alumni-updated', handleUpdate);
    return () => window.removeEventListener('alumni-updated', handleUpdate);
  }, [loadData]);

  // Options for filter dropdowns
  const graduationYears = useMemo(() => {
    const years = Array.from(new Set(alumni.map((a) => a.graduationYear))).filter(Boolean);
    return years.sort((a, b) => b.localeCompare(a));
  }, [alumni]);

  const lastClassrooms = useMemo(() => {
    const classes = Array.from(new Set(alumni.map((a) => a.lastClassroom))).filter(Boolean);
    return classes.sort();
  }, [alumni]);

  // Filtered Alumni
  const filteredAlumni = useMemo(() => {
    return alumni.filter((item) => {
      if (selectedGraduationYear && item.graduationYear !== selectedGraduationYear) {
        return false;
      }
      if (selectedLastClass && item.lastClassroom !== selectedLastClass) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchNis = item.nis.toLowerCase().includes(q);
        const matchNisn = item.nisn ? item.nisn.toLowerCase().includes(q) : false;
        if (!matchName && !matchNis && !matchNisn) return false;
      }
      return true;
    });
  }, [alumni, selectedGraduationYear, selectedLastClass, searchQuery]);

  // Paginated Rows
  const paginatedAlumni = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredAlumni.slice(start, start + perPage);
  }, [filteredAlumni, page]);

  const handleOpenCreate = () => {
    setEditingAlumni(null);
    setFormData({
      nis: '',
      nisn: '',
      name: '',
      lastClassroom: lastClassrooms[0] || 'XII-IPA 1',
      entryYear: (new Date().getFullYear() - 3).toString(),
      graduationYear: new Date().getFullYear().toString(),
      phoneNumber: '',
      address: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AlumniItem) => {
    setEditingAlumni(item);
    setFormData({
      nis: item.nis,
      nisn: item.nisn || '',
      name: item.name,
      lastClassroom: item.lastClassroom,
      entryYear: item.entryYear,
      graduationYear: item.graduationYear,
      phoneNumber: item.phoneNumber || '',
      address: item.address || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.nis.trim()) errs.nis = 'NIS wajib diisi';
    if (!formData.name.trim()) errs.name = 'Nama alumni wajib diisi';
    if (!formData.lastClassroom.trim()) errs.lastClassroom = 'Kelas terakhir wajib diisi';
    if (!formData.graduationYear.trim()) errs.graduationYear = 'Tahun lulus wajib diisi';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingAlumni) {
        const updated = alumni.map((a) =>
          a.id === editingAlumni.id
            ? {
                ...a,
                nis: formData.nis.trim(),
                nisn: formData.nisn.trim() || null,
                name: formData.name.trim(),
                lastClassroom: formData.lastClassroom.trim(),
                entryYear: formData.entryYear.trim(),
                graduationYear: formData.graduationYear.trim(),
                phoneNumber: formData.phoneNumber.trim() || null,
                address: formData.address.trim() || null,
              }
            : a
        );
        saveAlumniList(updated);
        setAlumni(updated);
        showUpdateAlert(`Data alumni ${formData.name} berhasil diperbarui.`);
      } else {
        const created = addAlumni({
          nis: formData.nis.trim(),
          nisn: formData.nisn.trim() || null,
          name: formData.name.trim(),
          lastClassroom: formData.lastClassroom.trim(),
          entryYear: formData.entryYear.trim(),
          graduationYear: formData.graduationYear.trim(),
          phoneNumber: formData.phoneNumber.trim() || null,
          address: formData.address.trim() || null,
        });
        setAlumni(getAlumniList());
        showCreateAlert(`Data alumni ${created.name} berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!deletingAlumni) return;
    setIsSubmitting(true);
    try {
      deleteAlumni(deletingAlumni.id);
      setAlumni(getAlumniList());
      showDeleteAlert(`Data alumni ${deletingAlumni.name} berhasil dihapus.`);
      setIsDeleteModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<AlumniItem>[] = [
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
      header: 'Nama Alumni',
      render: (row) => (
        <div>
          <div className="font-medium text-zinc-900 text-xs">{row.name}</div>
          <div className="text-[11px] text-zinc-400">{row.address || 'Alamat tidak tercatat'}</div>
        </div>
      ),
    },
    {
      key: 'lastClassroom',
      header: 'Kelas Terakhir',
      render: (row) => (
        <div>
          <Badge variant="neutral" size="sm">
            {row.lastClassroom}
          </Badge>
          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">Tingkat XII</div>
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
      key: 'graduationYear',
      header: 'Tahun Lulus',
      isMono: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          <Award className="w-3 h-3 text-emerald-600" />
          {row.graduationYear}
        </span>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Kontak',
      render: (row) => (
        <span className="text-xs text-zinc-600 font-mono">{row.phoneNumber || '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => (
        <Badge variant="paid" size="sm">
          Lulus
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
              title="Edit Data Alumni"
            >
              <Pencil className="w-3 h-3 text-zinc-600" />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingAlumni(row);
                setIsDeleteModalOpen(true);
              }}
              className="px-2 py-1 h-7 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
              title="Hapus Alumni"
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
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
              Data Alumni
            </h1>
            <Badge variant="paid" size="sm">
              <GraduationCap className="w-3 h-3 mr-1" />
              {alumni.length} Alumni
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Daftar siswa yang telah menyelesaikan masa studi (lulus) dan riwayat angkatan alumni.
          </p>
        </div>

        {!isReadOnly && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Alumni</span>
          </Button>
        )}
      </div>

      {/* Summary StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Alumni Terdaftar"
          value={`${alumni.length} Siswa`}
          subtitle="Siswa lulus dari seluruh angkatan"
          icon={<GraduationCap className="w-5 h-5 text-zinc-400" />}
        />
        <StatCard
          title="Lulusan Terbanyak"
          value={
            graduationYears.length > 0
              ? `Tahun ${graduationYears[0]}`
              : '-'
          }
          subtitle="Angkatan kelulusan termutakhir"
          icon={<Award className="w-5 h-5 text-zinc-400" />}
        />
        <StatCard
          title="Distribusi Rombel Asal"
          value={`${lastClassrooms.length} Kelas`}
          subtitle="Rombel kelas XII kelulusan"
          icon={<Building2 className="w-5 h-5 text-zinc-400" />}
        />
      </div>

      {/* Integrated Data Table */}
      <DataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={paginatedAlumni as unknown as Record<string, unknown>[]}
        isLoading={false}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Cari NIS, NISN, atau Nama Alumni..."
        filterSlot={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter Tahun Kelulusan"
              value={selectedGraduationYear}
              onChange={(e) => {
                setSelectedGraduationYear(e.target.value);
                setPage(1);
              }}
              className="h-8 px-2.5 py-1 text-xs bg-zinc-50 border border-zinc-200/90 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-600 transition cursor-pointer font-medium"
            >
              <option value="">Semua Tahun Lulus</option>
              {graduationYears.map((yr) => (
                <option key={yr} value={yr}>
                  Lulus Tahun {yr}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Kelas Terakhir"
              value={selectedLastClass}
              onChange={(e) => {
                setSelectedLastClass(e.target.value);
                setPage(1);
              }}
              className="h-8 px-2.5 py-1 text-xs bg-zinc-50 border border-zinc-200/90 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-600 transition cursor-pointer font-medium"
            >
              <option value="">Semua Kelas Terakhir</option>
              {lastClassrooms.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            {(selectedGraduationYear || selectedLastClass || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGraduationYear('');
                  setSelectedLastClass('');
                  setSearchQuery('');
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
        totalRows={filteredAlumni.length}
        perPage={perPage}
        onPageChange={(newPage: number) => setPage(newPage)}
        emptyMessage="Belum ada data alumni yang cocok dengan pencarian atau filter."
      />

      {/* Modal Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAlumni ? 'Ubah Data Alumni' : 'Tambah Data Alumni'}
        description={
          editingAlumni
            ? 'Perbarui identitas kelulusan dan kontak alumni.'
            : 'Masukkan rincian identitas siswa yang telah menyelesaikan studi.'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="NIS"
              value={formData.nis}
              onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
              errorMessage={formErrors.nis}
              placeholder="Contoh: 20231201"
              required
            />
            <InputField
              label="NISN (Opsional)"
              value={formData.nisn}
              onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
              placeholder="10 digit nomor nasional"
            />
          </div>

          <InputField
            label="Nama Lengkap Alumni"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            errorMessage={formErrors.name}
            placeholder="Nama lengkap alumni"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InputField
              label="Kelas Terakhir"
              value={formData.lastClassroom}
              onChange={(e) => setFormData({ ...formData, lastClassroom: e.target.value })}
              errorMessage={formErrors.lastClassroom}
              placeholder="Contoh: XII-IPA 1"
              required
            />
            <InputField
              label="Tahun Masuk"
              value={formData.entryYear}
              onChange={(e) => setFormData({ ...formData, entryYear: e.target.value })}
              placeholder="Contoh: 2023"
              required
            />
            <InputField
              label="Tahun Kelulusan"
              value={formData.graduationYear}
              onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
              errorMessage={formErrors.graduationYear}
              placeholder="Contoh: 2026"
              required
            />
          </div>

          <InputField
            label="Nomor Telepon / WhatsApp"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="08xxxxxxxxxx"
          />

          <InputField
            label="Alamat Terakhir"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Alamat domisili alumni..."
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {editingAlumni ? 'Simpan Perubahan' : 'Tambahkan Alumni'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Hapus */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Data Alumni"
        description="Apakah Anda yakin ingin menghapus data alumni ini? Tindakan ini tidak dapat dibatalkan."
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800">
              <p className="font-semibold">{deletingAlumni?.name}</p>
              <p className="font-mono mt-0.5">
                NIS: {deletingAlumni?.nis} | Lulus: {deletingAlumni?.graduationYear} (Kelas: {deletingAlumni?.lastClassroom})
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleDelete}
            >
              Hapus Permanen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
