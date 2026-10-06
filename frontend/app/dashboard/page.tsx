'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import {
  CreditCard,
  TrendingUp,
  Receipt,
  Users,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const isReadOnly = user?.role === 'kepala_sekolah';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
            Ringkasan Keuangan
          </h1>
          <p className="text-xs text-steel mt-0.5">
            Pantau arus kas masuk dan status pembayaran siswa secara real-time.
          </p>
        </div>

        {!isReadOnly ? (
          <div className="flex items-center gap-2">
            <Link href="/transaksi/kasir">
              <Button variant="primary" size="sm">
                <CreditCard className="w-3.5 h-3.5 mr-1" />
                <span>Kasir Baru</span>
              </Button>
            </Link>
          </div>
        ) : null}
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Penerimaan Hari Ini"
          value="Rp 4.250.000"
          subtitle="18 transaksi tercatat"
          trend={{ value: "+12%", isPositive: true }}
          icon={<CreditCard className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Kas Tunai (Hari Ini)"
          value="Rp 2.750.000"
          subtitle="Uang fisik siap setor TU"
          icon={<Receipt className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Transfer Bank (Hari Ini)"
          value="Rp 1.500.000"
          subtitle="Mutasi rekening terverifikasi"
          icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
        />
        <StatCard
          title="Tunggakan Berjalan"
          value="Rp 12.800.000"
          subtitle="32 siswa belum melunasi SPP"
          trend={{ value: "-5%", isPositive: false }}
          icon={<AlertCircle className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* Main Grid: Tren Pembayaran & Akses Cepat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tren 7 Hari Terakhir */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">Tren Pembayaran (7 Hari Terakhir)</h2>
              <p className="text-xs text-steel mt-0.5">Distribusi penerimaan tunai dan transfer bank harian</p>
            </div>
            <span className="text-xs font-mono text-zinc-400">Total: Rp 28.600.000</span>
          </div>

          {/* Minimalist Bar Chart Representation */}
          <div className="mt-6 space-y-3">
            {[
              { day: 'Senin', tunai: 80, transfer: 60, total: 'Rp 4.500.000' },
              { day: 'Selasa', tunai: 65, transfer: 50, total: 'Rp 3.800.000' },
              { day: 'Rabu', tunai: 90, transfer: 75, total: 'Rp 5.200.000' },
              { day: 'Kamis', tunai: 70, transfer: 45, total: 'Rp 3.600.000' },
              { day: 'Jumat', tunai: 85, transfer: 80, total: 'Rp 4.900.000' },
              { day: 'Sabtu', tunai: 50, transfer: 30, total: 'Rp 2.350.000' },
              { day: 'Minggu', tunai: 75, transfer: 55, total: 'Rp 4.250.000' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <span className="w-14 text-zinc-600 shrink-0">{item.day}</span>
                <div className="flex-1 bg-zinc-100 rounded-full h-3 flex overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(item.tunai / 170) * 100}%` }}
                    title="Tunai"
                  />
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${(item.transfer / 170) * 100}%` }}
                    title="Transfer"
                  />
                </div>
                <span className="w-24 text-right font-mono font-medium text-zinc-900 shrink-0">
                  {item.total}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Tunai</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Transfer Bank</span>
            </div>
          </div>
        </div>

        {/* Akses Cepat Fitur */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">Aksi Cepat</h2>
            <p className="text-xs text-steel mt-0.5">Pintasan navigasi operasional</p>

            <div className="mt-4 space-y-2">
              {!isReadOnly && (
                <>
                  <Link
                    href="/transaksi/kasir"
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 hover:border-emerald-500 hover:bg-emerald-50/30 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-zinc-900">Kasir Pembayaran Siswa</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 transition" />
                  </Link>

                  <Link
                    href="/master/siswa"
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 hover:border-emerald-500 hover:bg-emerald-50/30 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-zinc-900">Kelola Data Siswa</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 transition" />
                  </Link>
                </>
              )}

              <Link
                href="/laporan"
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 hover:border-emerald-500 hover:bg-emerald-50/30 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-zinc-900">Laporan Kas & Bank Harian</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 transition" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 text-xs text-zinc-400 font-mono">
            Status Sistem: Terhubung ke PostgreSQL
          </div>
        </div>
      </div>
    </div>
  );
}
