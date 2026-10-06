'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { InputField } from '@/components/ui/InputField';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!password) {
      newErrors.password = 'Kata sandi wajib diisi';
    } else if (password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(email, password);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errors?: Record<string, string[]> };
      setErrors({
        general: errorObj.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.',
      });
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-sm mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
            Sekolah Pintar ERP
          </h1>
          <p className="mt-1 text-xs text-steel">
            Sistem Pembayaran dan Rekonsiliasi Keuangan Sekolah
          </p>
        </div>

        {/* Card Login */}
        <div className="bg-surface rounded-2xl border border-zinc-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errors.general}
              </div>
            ) : null}

            <div>
              <InputField
                label="Alamat Email"
                type="email"
                placeholder="nama@sekolah.sch.id"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                errorMessage={errors.email}
                autoComplete="email"
              />
            </div>

            <div>
              <InputField
                label="Kata Sandi"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                errorMessage={errors.password}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              <span>Masuk ke Sistem</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-zinc-100">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Akun Demo RBAC:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoAccount('superadmin@sekolah.sch.id')}
                className="px-2 py-1.5 rounded-lg border border-zinc-200 text-[11px] font-medium text-zinc-700 hover:border-emerald-500 hover:bg-emerald-50/50 transition cursor-pointer text-center"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('tu@sekolah.sch.id')}
                className="px-2 py-1.5 rounded-lg border border-zinc-200 text-[11px] font-medium text-zinc-700 hover:border-emerald-500 hover:bg-emerald-50/50 transition cursor-pointer text-center"
              >
                Admin TU
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('kepsek@sekolah.sch.id')}
                className="px-2 py-1.5 rounded-lg border border-zinc-200 text-[11px] font-medium text-zinc-700 hover:border-emerald-500 hover:bg-emerald-50/50 transition cursor-pointer text-center"
              >
                Kepala Sekolah
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-zinc-400">
          <p>© 2026 Sistem ERP Sekolah Pintar • TasteSkill UI</p>
        </div>
      </div>
    </div>
  );
}
