'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Database,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SubNavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

export interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  children?: SubNavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Master Data',
    icon: Database,
    children: [
      { label: 'Data Siswa', href: '/master/siswa', icon: Users },
      { label: 'Kelas & Tahun Ajaran', href: '/master/kelas', icon: School },
      { label: 'Tarif Pembayaran', href: '/master/biaya', icon: Coins },
    ],
  },
  {
    label: 'Transaksi Pembayaran',
    icon: CreditCard,
    children: [
      { label: 'Kasir Pembayaran', href: '/transaksi/kasir', icon: CreditCard },
      { label: 'Riwayat Transaksi', href: '/transaksi/riwayat', icon: Receipt },
    ],
  },
  {
    label: 'Keuangan',
    icon: Wallet,
    children: [
      { label: 'Laporan Keuangan', href: '/laporan', icon: FileSpreadsheet },
    ],
  },
  { label: 'Pengaturan Sistem', href: '/pengaturan', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Master Data': true,
    'Transaksi Pembayaran': true,
    'Keuangan': true,
  });

  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (sub) => pathname === sub.href || pathname?.startsWith(`${sub.href}/`)
        );
        if (isChildActive) {
          setExpandedMenus((prev) => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

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

            if (item.children && item.children.length > 0) {
              const isChildActive = item.children.some(
                (sub) => pathname === sub.href || pathname?.startsWith(`${sub.href}/`)
              );
              const isOpen = Boolean(expandedMenus[item.label]);

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer',
                      isChildActive
                        ? 'bg-zinc-100 text-zinc-950 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'w-4 h-4',
                          isChildActive ? 'text-emerald-600' : 'text-zinc-400'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-zinc-400 transition-transform duration-200',
                        isOpen && 'rotate-180 text-zinc-600'
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="ml-4 pl-3 border-l border-zinc-200/80 space-y-1 py-0.5">
                      {item.children.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive =
                          pathname === sub.href || pathname?.startsWith(`${sub.href}/`);

                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                              isSubActive
                                ? 'bg-zinc-950 text-white shadow-xs'
                                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                            )}
                          >
                            {SubIcon && (
                              <SubIcon
                                className={cn(
                                  'w-3.5 h-3.5',
                                  isSubActive ? 'text-emerald-400' : 'text-zinc-400'
                                )}
                              />
                            )}
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive =
              pathname === item.href || (item.href ? pathname?.startsWith(`${item.href}/`) : false);

            return (
              <Link
                key={item.label}
                href={item.href || '#'}
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
