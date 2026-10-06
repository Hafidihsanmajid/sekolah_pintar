'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopNav } from '@/components/ui/TopNav';
import { Eye } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-500">Memuat sesi pengguna...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const roleDisplayName: Record<string, string> = {
    super_admin: 'Super Admin',
    admin_tu: 'Admin TU',
    kepala_sekolah: 'Kepala Sekolah',
  };

  const isReadOnly = user.role === 'kepala_sekolah';

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          title="Sistem ERP Pembayaran Sekolah"
          userName={user.name}
          userRole={roleDisplayName[user.role] || user.role}
          onLogout={logout}
        />

        {isReadOnly ? (
          <div className="bg-amber-50/80 border-b border-amber-200/80 px-6 py-2 flex items-center gap-2 text-xs text-amber-800">
            <Eye className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Akses Read-Only:</strong> Anda masuk sebagai Kepala Sekolah. Akses mutasi dan edit data dinonaktifkan.
            </span>
          </div>
        ) : null}

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
