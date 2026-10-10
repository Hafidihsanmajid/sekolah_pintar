'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import { UserProfile } from '@/types/api';
import {
  SystemRole,
  SYSTEM_MENUS,
  ROLE_DEFINITIONS,
  DEFAULT_ROLE_PERMISSIONS,
  getRolePermissions,
  saveRolePermissions,
} from '@/lib/role-permissions';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Layers,
  Sparkles,
  Save,
  RotateCcw,
  Search,
} from 'lucide-react';

export default function HakAksesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  // Tab State
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');

  // Role Permissions State
  const [selectedRole, setSelectedRole] = useState<SystemRole>('admin_tu');
  const [allPermissions, setAllPermissions] = useState<Record<SystemRole, string[]>>(getRolePermissions);
  const [roleSuccessMsg, setRoleSuccessMsg] = useState<string | null>(null);
  const [roleErrorMsg, setRoleErrorMsg] = useState<string | null>(null);

  // User Management State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin_tu' as SystemRole,
  });
  const [userErrors, setUserErrors] = useState<Record<string, string>>({});
  const [isUserSubmitting, setIsUserSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    if (!isSuperAdmin) return;
    setIsLoadingUsers(true);
    try {
      const res = await apiClient.get<UserProfile[]>('/settings/users');
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch {
      // Fallback data jika backend offline
      setUsers([
        {
          id: 1,
          name: 'Super Administrator',
          email: 'superadmin@sekolah.sch.id',
          role: 'super_admin',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Staf Tata Usaha',
          email: 'tu@sekolah.sch.id',
          role: 'admin_tu',
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          name: 'Kepala Sekolah',
          email: 'kepsek@sekolah.sch.id',
          role: 'kepala_sekolah',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    let ignore = false;
    if (isSuperAdmin) {
      apiClient.get<UserProfile[]>('/settings/users')
        .then((res) => {
          if (!ignore && res.success && res.data) {
            setUsers(res.data);
          }
        })
        .catch(() => {
          if (!ignore) {
            setUsers([
              {
                id: 1,
                name: 'Super Administrator',
                email: 'superadmin@sekolah.sch.id',
                role: 'super_admin',
                createdAt: new Date().toISOString(),
              },
              {
                id: 2,
                name: 'Staf Tata Usaha',
                email: 'tu@sekolah.sch.id',
                role: 'admin_tu',
                createdAt: new Date().toISOString(),
              },
              {
                id: 3,
                name: 'Kepala Sekolah',
                email: 'kepsek@sekolah.sch.id',
                role: 'kepala_sekolah',
                createdAt: new Date().toISOString(),
              },
            ]);
          }
        });
    }
    return () => {
      ignore = true;
    };
  }, [isSuperAdmin]);

  // Current active permissions for the selected role
  const currentRoleMenus = useMemo(() => {
    return allPermissions[selectedRole] || [];
  }, [allPermissions, selectedRole]);

  // Toggle specific menu permission
  const handleToggleMenu = (menuKey: string) => {
    setRoleSuccessMsg(null);
    setRoleErrorMsg(null);

    const isCurrentAssigned = currentRoleMenus.includes(menuKey);
    let updatedRoleMenus: string[];

    if (isCurrentAssigned) {
      updatedRoleMenus = currentRoleMenus.filter((k) => k !== menuKey);
    } else {
      updatedRoleMenus = [...currentRoleMenus, menuKey];
    }

    setAllPermissions((prev) => ({
      ...prev,
      [selectedRole]: updatedRoleMenus,
    }));
  };

  // Preset Handlers
  const handleApplyTuPreset = () => {
    setRoleSuccessMsg(null);
    // Contoh eksplisit: role admin tata usaha hanya bisa akses menu master data dan transaksi pembayaran
    setAllPermissions((prev) => ({
      ...prev,
      [selectedRole]: ['master_data', 'transaksi'],
    }));
  };

  const handleSelectAllMenus = () => {
    setRoleSuccessMsg(null);
    setAllPermissions((prev) => ({
      ...prev,
      [selectedRole]: SYSTEM_MENUS.map((m) => m.key),
    }));
  };

  const handleResetToDefault = () => {
    setRoleSuccessMsg(null);
    setAllPermissions((prev) => ({
      ...prev,
      [selectedRole]: DEFAULT_ROLE_PERMISSIONS[selectedRole] || [],
    }));
  };

  // Save Permissions
  const handleSavePermissions = () => {
    try {
      saveRolePermissions(allPermissions);
      setRoleSuccessMsg(
        `Pengaturan hak akses untuk "${ROLE_DEFINITIONS[selectedRole].label}" berhasil disimpan dan diterapkan ke navigasi!`
      );
      setTimeout(() => {
        setRoleSuccessMsg(null);
      }, 5000);
    } catch {
      setRoleErrorMsg('Gagal menyimpan konfigurasi hak akses.');
    }
  };

  // User Management Handlers
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'admin_tu',
    });
    setUserErrors({});
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (usr: UserProfile) => {
    setEditingUser(usr);
    setUserForm({
      name: usr.name,
      email: usr.email,
      password: '',
      role: usr.role as SystemRole,
    });
    setUserErrors({});
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!userForm.name.trim()) errs.name = 'Nama lengkap wajib diisi';
    if (!userForm.email.trim()) errs.email = 'Email wajib diisi';
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
      } else {
        await apiClient.post('/settings/users', userForm);
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
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const errRes = err as { message?: string };
      setDeleteError(errRes.message || 'Gagal menghapus pengguna');
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        userSearchQuery === '' ||
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
      const matchesRole = !userRoleFilter || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearchQuery, userRoleFilter]);

  // Jika bukan Super Admin, tampilkan batasan akses ketat
  if (!isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-zinc-950 mb-2">Akses Terbatas</h1>
        <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
          Menu <strong>Hak Akses</strong> dan konfigurasi perizinan role sistem hanya dapat diakses
          oleh akun dengan peran <strong>Super Administrator</strong>.
        </p>
        <Link href="/dashboard">
          <Button variant="primary" size="md">
            <span>Kembali ke Dashboard</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
              Hak Akses & Manajemen Pengguna
            </h1>
            <Badge variant="paid" size="sm">
              Super Admin Only
            </Badge>
          </div>
          <p className="text-xs text-steel mt-0.5">
            Pengaturan peran (role), konfigurasi batasan izin menu modul, dan pengelolaan akun staf sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'users' && (
            <Button variant="primary" size="sm" onClick={handleOpenCreateUser}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Tambah Pengguna</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-2">
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'roles'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Pengaturan Hak Akses Role</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'users'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Pengguna</span>
        </button>
      </div>

      {/* TAB 1: PENGATURAN HAK AKSES ROLE */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Notifikasi Alert */}
          {roleSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{roleSuccessMsg}</span>
            </div>
          )}

          {roleErrorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{roleErrorMsg}</span>
            </div>
          )}

          {/* Pemilihan Role */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <h2 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider mb-3">
              Pilih Role Yang Ingin Dikonfigurasi:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(Object.keys(ROLE_DEFINITIONS) as SystemRole[]).map((rKey) => {
                const def = ROLE_DEFINITIONS[rKey];
                const isSelected = selectedRole === rKey;
                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => {
                      setSelectedRole(rKey);
                      setRoleSuccessMsg(null);
                    }}
                    className={`text-left p-4 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/20 shadow-xs'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-zinc-950">
                        {def.label}
                      </span>
                      <Badge variant={def.badgeVariant} size="sm">
                        {rKey}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      {def.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Matrix Izin Menu Modul */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-100 gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-950">
                    Izin Menu Navigasi untuk Role:
                  </h3>
                  <Badge variant={ROLE_DEFINITIONS[selectedRole].badgeVariant} size="sm">
                    {ROLE_DEFINITIONS[selectedRole].label}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Centang modul yang diizinkan untuk diakses oleh role ini pada sidebar.
                </p>
              </div>

              {/* Action Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyTuPreset}
                  title="Atur role hanya mengakses Master Data dan Transaksi Pembayaran"
                  className="cursor-pointer text-[11px] border-zinc-300"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  <span>Preset: Master Data & Transaksi</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllMenus}
                  className="cursor-pointer text-[11px] border-zinc-300"
                >
                  <span>Pilih Semua</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetToDefault}
                  className="cursor-pointer text-[11px] border-zinc-300"
                >
                  <RotateCcw className="w-3 h-3 mr-1 text-zinc-500" />
                  <span>Reset Default</span>
                </Button>
              </div>
            </div>

            {/* Matrix Modul Checkboxes */}
            <div className="space-y-3">
              {SYSTEM_MENUS.map((menu) => {
                const isChecked = currentRoleMenus.includes(menu.key);
                return (
                  <div
                    key={menu.key}
                    onClick={() => handleToggleMenu(menu.key)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                      isChecked
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-zinc-200 bg-zinc-50/30 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleMenu(menu.key)}
                      className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-950">
                          {menu.label}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            isChecked
                              ? 'bg-emerald-100 text-emerald-800 font-medium'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {isChecked ? 'Diizinkan (Aktif)' : 'Dilarang (Sembunyi)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {menu.description}
                      </p>
                      {menu.subMenus && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          <span className="text-[10px] text-zinc-400 font-medium">
                            Sub-menu terkait:
                          </span>
                          {menu.subMenus.map((sub) => (
                            <span
                              key={sub}
                              className="text-[10px] bg-white border border-zinc-200 px-2 py-0.5 rounded text-zinc-700"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-zinc-100 mt-6 gap-3">
              <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  Total <strong>{currentRoleMenus.length}</strong> dari{' '}
                  <strong>{SYSTEM_MENUS.length}</strong> menu modul diaktifkan untuk role ini.
                </span>
              </div>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSavePermissions}
                className="cursor-pointer"
              >
                <Save className="w-4 h-4 mr-1.5" />
                <span>Simpan Pengaturan Hak Akses</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAJEMEN PENGGUNA */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filter & Toolbar */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama atau email pengguna..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 rounded-xl border border-zinc-200 text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="w-52">
                <SelectField
                  options={[
                    { label: 'Semua Peran (Role)', value: '' },
                    { label: 'Super Administrator', value: 'super_admin' },
                    { label: 'Admin Tata Usaha', value: 'admin_tu' },
                    { label: 'Kepala Sekolah', value: 'kepala_sekolah' },
                  ]}
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                />
              </div>
            </div>

            <span className="text-xs font-mono text-zinc-400">
              {filteredUsers.length} Pengguna Terdaftar
            </span>
          </div>

          {/* Tabel Pengguna */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-600 font-medium">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Email Akun</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">Tanggal Dibuat</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400">
                        Memuat data pengguna sistem...
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((u, idx) => {
                      const roleMeta = ROLE_DEFINITIONS[u.role as SystemRole] || {
                        label: u.role,
                        badgeVariant: 'neutral',
                      };
                      const isMe = user?.id === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-zinc-50/50 transition">
                          <td className="py-3 px-4 text-center font-mono text-zinc-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-medium text-zinc-900">
                            <div className="flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isMe && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-100 text-zinc-600 rounded">
                                  Akun Anda
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <Badge variant={roleMeta.badgeVariant as 'paid' | 'info' | 'neutral'} size="sm">
                              {roleMeta.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-500 whitespace-nowrap">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                title="Edit Pengguna"
                                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeletingUser(u);
                                  setDeleteError(null);
                                  setIsDeleteModalOpen(true);
                                }}
                                disabled={isMe}
                                title={isMe ? 'Tidak bisa menghapus akun sendiri' : 'Hapus Pengguna'}
                                className={`p-1 rounded-lg transition ${
                                  isMe
                                    ? 'text-zinc-200 cursor-not-allowed'
                                    : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400">
                        Tidak ada data pengguna yang sesuai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT PENGGUNA */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
        description={
          editingUser
            ? 'Perbarui informasi profil akun atau peran akses sistem.'
            : 'Buat akun staf baru untuk mengakses sistem ERP sesuai perannya.'
        }
        size="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          {userErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{userErrors.general}</span>
            </div>
          )}

          <InputField
            label="Nama Lengkap"
            placeholder="Contoh: Ahmad Baihaqi, S.Kom."
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            errorMessage={userErrors.name}
            required
          />

          <InputField
            label="Alamat Email (Digunakan untuk Login)"
            type="email"
            placeholder="nama@sekolah.sch.id"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            errorMessage={userErrors.email}
            required
          />

          <InputField
            label={
              editingUser
                ? 'Kata Sandi Baru (Kosongkan jika tidak diubah)'
                : 'Kata Sandi (Minimal 6 karakter)'
            }
            type="password"
            placeholder="••••••••"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            errorMessage={userErrors.password}
            required={!editingUser}
          />

          <div>
            <SelectField
              label="Peran / Hak Akses (Role)"
              options={[
                { label: 'Super Administrator (Akses Penuh Seluruh Modul)', value: 'super_admin' },
                { label: 'Admin Tata Usaha (Staf Administrasi & Kasir)', value: 'admin_tu' },
                { label: 'Kepala Sekolah (Monitoring Laporan)', value: 'kepala_sekolah' },
              ]}
              value={userForm.role}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  role: e.target.value as SystemRole,
                })
              }
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Menu yang dapat diakses oleh role ini dikendalikan pada tab &quot;Pengaturan Hak Akses Role&quot;.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsUserModalOpen(false)}
            >
              <span>Batal</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isUserSubmitting}
            >
              <span>{editingUser ? 'Perbarui Pengguna' : 'Simpan Pengguna'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL KONFIRMASI HAPUS PENGGUNA */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Akun Pengguna"
        description={`Apakah Anda yakin ingin menghapus akun "${deletingUser?.name}" (${deletingUser?.email})?`}
        size="sm"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <p className="text-xs text-zinc-600">
            Tindakan ini permanen. Pengguna yang dihapus tidak akan dapat lagi masuk ke dalam sistem ERP.
          </p>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              <span>Batal</span>
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={handleDeleteUser}
            >
              <span>Hapus Akun</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
