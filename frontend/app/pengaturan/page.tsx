'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/context/alert-context';
import { apiClient } from '@/lib/api-client';
import { SchoolProfile, UserProfile } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import {
  Building2,
  Users,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Lock,
} from 'lucide-react';

export default function PengaturanPage() {
  const { user } = useAuth();
  const { showCreateAlert, showUpdateAlert, showDeleteAlert } = useAlert();
  const isSuperAdmin = user?.role === 'super_admin';
  const isReadOnly = user?.role === 'kepala_sekolah';

  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'security'>('profile');

  // School Profile State
  const [profile, setProfile] = useState<SchoolProfile>({
    id: 1,
    name: 'SMK Pintar Bangsa',
    address: '',
    phone: '',
    email: '',
    principalName: '',
    treasurerName: '',
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // User Management State (Super Admin)
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserSubmitting, setIsUserSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin_tu' as 'super_admin' | 'admin_tu' | 'kepala_sekolah',
  });
  const [userErrors, setUserErrors] = useState<Record<string, string>>({});

  // Delete User State
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Security / Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Fetch School Profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiClient.get<SchoolProfile>('/settings/profile');
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } catch {
      // Handled
    }
  }, []);

  // Fetch Users List
  const fetchUsers = useCallback(async () => {
    if (!isSuperAdmin) return;
    setIsLoadingUsers(true);
    try {
      const res = await apiClient.get<UserProfile[]>('/settings/users');
      if (res.success && res.data) {
        setUsersList(res.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchProfile();
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [fetchProfile, fetchUsers, isSuperAdmin]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setIsProfileSaving(true);
    setProfileSuccessMsg(null);
    try {
      const res = await apiClient.put<SchoolProfile>('/settings/profile', profile);
      if (res.success && res.data) {
        setProfile(res.data);
        setProfileSuccessMsg('Profil sekolah & identitas kuitansi berhasil diperbarui');
        showUpdateAlert('Profil sekolah & identitas kuitansi berhasil diperbarui.');
      }
    } catch {
      // Handled
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Handle User Modal
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', password: '', role: 'admin_tu' });
    setUserErrors({});
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setUserForm({ name: u.name, email: u.email, password: '', role: u.role });
    setUserErrors({});
    setIsUserModalOpen(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!userForm.name.trim()) errs.name = 'Nama lengkap wajib diisi';
    if (!userForm.email.trim()) errs.email = 'Alamat email wajib diisi';
    if (!editingUser && (!userForm.password || userForm.password.length < 6)) {
      errs.password = 'Kata sandi minimal 6 karakter';
    }

    if (Object.keys(errs).length > 0) {
      setUserErrors(errs);
      return;
    }

    setIsUserSubmitting(true);
    try {
      if (editingUser) {
        await apiClient.put(`/settings/users/${editingUser.id}`, userForm);
        showUpdateAlert(`Data pengguna ${userForm.name} berhasil diperbarui.`);
      } else {
        await apiClient.post('/settings/users', userForm);
        showCreateAlert(`Pengguna baru ${userForm.name} berhasil ditambahkan.`);
      }
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const errRes = err as { message?: string };
      setUserErrors({ general: errRes.message || 'Gagal menyimpan data pengguna' });
    } finally {
      setIsUserSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteError(null);
    try {
      await apiClient.delete(`/settings/users/${deletingUser.id}`);
      showDeleteAlert(`Pengguna ${deletingUser.name} berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const errRes = err as { message?: string };
      setDeleteError(errRes.message || 'Gagal menghapus pengguna');
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (newPassword.length < 6) {
      setPasswordErrorMsg('Kata sandi baru minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Konfirmasi kata sandi tidak cocok');
      return;
    }

    setIsPasswordSaving(true);
    try {
      await apiClient.post('/settings/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccessMsg('Kata sandi berhasil diganti');
      showUpdateAlert('Kata sandi akun Anda berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const errRes = err as { message?: string };
      setPasswordErrorMsg(errRes.message || 'Kata sandi saat ini tidak valid');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const roleBadgeMap: Record<string, { label: string; variant: 'paid' | 'info' | 'neutral' }> = {
    super_admin: { label: 'Super Admin', variant: 'paid' },
    admin_tu: { label: 'Admin TU', variant: 'info' },
    kepala_sekolah: { label: 'Kepala Sekolah', variant: 'neutral' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
          Pengaturan Sistem & Keamanan
        </h1>
        <p className="text-xs text-steel mt-0.5">
          Identitas instansi sekolah, manajemen akun pengguna RBAC, dan kredensial akses.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Profil Sekolah & Kuitansi</span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
              activeTab === 'users'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manajemen Pengguna (RBAC)</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'security'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Keamanan & Kata Sandi</span>
        </button>
      </div>

      {/* TAB 1: PROFIL SEKOLAH */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] max-w-3xl">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <InputField
              label="Nama Resmi Instansi Sekolah"
              placeholder="SMK Pintar Bangsa"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              disabled={isReadOnly}
              required
            />

            <InputField
              label="Alamat Lengkap Sekolah (Untuk Kop Kuitansi)"
              placeholder="Jl. Pendidikan No. 45, Kebayoran Baru, Jakarta Selatan"
              value={profile.address || ''}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              disabled={isReadOnly}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Nomor Telepon Sekolah"
                placeholder="021-7890123"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={isReadOnly}
              />
              <InputField
                label="Alamat Email Sekolah"
                type="email"
                placeholder="info@sekolah.sch.id"
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Nama Kepala Sekolah (Penanggung Jawab)"
                placeholder="Dr. H. Muhammad Arifin, M.Pd."
                value={profile.principalName || ''}
                onChange={(e) => setProfile({ ...profile, principalName: e.target.value })}
                disabled={isReadOnly}
              />
              <InputField
                label="Nama Bendahara Sekolah"
                placeholder="Siti Rahmawati, S.E."
                value={profile.treasurerName || ''}
                onChange={(e) => setProfile({ ...profile, treasurerName: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            {!isReadOnly && (
              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isProfileSaving}
                >
                  <span>Simpan Perubahan Profil</span>
                </Button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: MANAJEMEN PENGGUNA (SUPER ADMIN ONLY) */}
      {activeTab === 'users' && isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Daftar akun staf yang berhak mengakses sistem ERP.
            </span>
            <Button variant="primary" size="sm" onClick={handleOpenCreateUser}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Tambah Pengguna</span>
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-600 font-medium">
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Alamat Email</th>
                    <th className="py-3 px-4">Hak Akses (Role)</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {usersList.map((u) => {
                    const badgeInfo = roleBadgeMap[u.role] || {
                      label: u.role,
                      variant: 'neutral' as const,
                    };
                    return (
                      <tr key={u.id} className="hover:bg-zinc-50/50 transition">
                        <td className="py-3 px-4 font-semibold text-zinc-950">{u.name}</td>
                        <td className="py-3 px-4 text-zinc-600 font-mono">{u.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant={badgeInfo.variant} size="sm">
                            {badgeInfo.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditUser(u)}
                              className="px-2 py-1 h-7"
                            >
                              <Pencil className="w-3 h-3 text-zinc-600" />
                            </Button>
                            {u.id !== user?.id && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setDeletingUser(u);
                                  setDeleteError(null);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="px-2 py-1 h-7 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KEAMANAN & GANTI KATA SANDI */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] max-w-lg">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-950 flex items-center gap-1.5 pb-2 border-b border-zinc-100">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Ganti Kata Sandi Akun Anda</span>
            </h3>

            {passwordSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <InputField
              label="Kata Sandi Saat Ini"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <InputField
              label="Kata Sandi Baru"
              type="password"
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <InputField
              label="Konfirmasi Kata Sandi Baru"
              type="password"
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isPasswordSaving}
              >
                <span>Perbarui Kata Sandi</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Add / Edit User */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? 'Perbarui Data Pengguna' : 'Tambah Pengguna Baru'}
        size="md"
      >
        <form onSubmit={handleSubmitUser} className="space-y-4">
          {userErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {userErrors.general}
            </div>
          )}

          <InputField
            label="Nama Lengkap Pengguna"
            placeholder="Contoh: Budi Santoso"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            errorMessage={userErrors.name}
            required
          />

          <InputField
            label="Alamat Email (Login)"
            type="email"
            placeholder="nama@sekolah.sch.id"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            errorMessage={userErrors.email}
            required
          />

          <InputField
            label={editingUser ? 'Kata Sandi Baru (Kosongkan jika tidak diubah)' : 'Kata Sandi'}
            type="password"
            placeholder="••••••••"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            errorMessage={userErrors.password}
            required={!editingUser}
          />

          <SelectField
            label="Hak Akses (Role)"
            options={[
              { label: 'Admin Tata Usaha (Operator Kasir & Master)', value: 'admin_tu' },
              { label: 'Kepala Sekolah (Monitoring & Laporan Read-Only)', value: 'kepala_sekolah' },
              { label: 'Super Administrator (Akses Penuh & Void)', value: 'super_admin' },
            ]}
            value={userForm.role}
            onChange={(e) =>
              setUserForm({
                ...userForm,
                role: e.target.value as 'super_admin' | 'admin_tu' | 'kepala_sekolah',
              })
            }
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsUserModalOpen(false)}
              disabled={isUserSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isUserSubmitting}
            >
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Delete User */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Pengguna"
        size="sm"
      >
        <div className="space-y-4">
          {deleteError ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              {deleteError}
            </div>
          ) : (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              Apakah Anda yakin ingin menghapus akun <strong>{deletingUser?.name}</strong> ({deletingUser?.email})?
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            {!deleteError && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteUser}
              >
                Hapus
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
