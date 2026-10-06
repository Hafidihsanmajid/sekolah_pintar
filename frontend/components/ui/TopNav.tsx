'use client';

import React from 'react';
import { User, LogOut } from 'lucide-react';
import { Badge } from './Badge';

export interface TopNavProps {
  title?: string;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export function TopNav({
  title = 'Sistem ERP Pembayaran Sekolah',
  userName = 'Petugas TU',
  userRole = 'Admin TU',
  onLogout,
}: TopNavProps) {
  const getBadgeVariant = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes('super')) return 'paid';
    if (lower.includes('tu')) return 'neutral';
    return 'pending';
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-sm font-semibold text-zinc-950">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 border border-zinc-200">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-medium text-zinc-900 leading-tight">
              {userName}
            </div>
            <div className="mt-0.5">
              <Badge variant={getBadgeVariant(userRole)} className="text-[10px] px-1.5 py-0">
                {userRole}
              </Badge>
            </div>
          </div>
        </div>

        {onLogout ? (
          <button
            onClick={onLogout}
            title="Keluar"
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </header>
  );
}
