'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Settings,
  GraduationCap,
  School,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Kasir Pembayaran', href: '/transaksi/kasir', icon: CreditCard },
  { label: 'Riwayat Transaksi', href: '/transaksi/riwayat', icon: Receipt },
  { label: 'Data Siswa', href: '/master/siswa', icon: Users },
  { label: 'Kelas & Tahun Ajaran', href: '/master/kelas', icon: School },
  { label: 'Tarif & Pembayaran', href: '/master/biaya', icon: Coins },
  { label: 'Laporan Keuangan', href: '/laporan', icon: FileSpreadsheet },
  { label: 'Pengaturan Sistem', href: '/pengaturan', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-zinc-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 leading-tight">
              Sekolah Pintar
            </h2>
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              ERP Keuangan
            </p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-emerald-400' : 'text-zinc-400')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-100 text-xs text-zinc-400">
        <div className="font-mono text-[10px]">v1.1.0 • TasteSkill UI</div>
      </div>
    </aside>
  );
}
