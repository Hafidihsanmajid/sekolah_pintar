'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/context/alert-context';
import { apiClient } from '@/lib/api-client';
import { SchoolProfile } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import {
  Building2,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function PengaturanPage() {
  const { user } = useAuth();
  const { showUpdateAlert } = useAlert();
  const isReadOnly = user?.role === 'kepala_sekolah';

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

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

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
          Pengaturan Sistem & Keamanan
        </h1>
        <p className="text-xs text-steel mt-0.5">
          Identitas instansi sekolah dan kredensial akses akun.
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

      {/* TAB 2: KEAMANAN & GANTI KATA SANDI */}
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
    </div>
  );
}
