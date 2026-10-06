'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import { DashboardStats } from '@/types/api';
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

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get<DashboardStats>('/dashboard/stats');
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch {
        // Handled
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Compute 7-day total for header
  const weekTotal = stats?.last7Days?.reduce((sum, d) => sum + d.total, 0) ?? 0;
  const maxDayTotal = Math.max(
    1,
    ...(stats?.last7Days?.map((d) => Math.max(d.total, 1)) ?? [1])
  );

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

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <Link href="/transaksi/kasir">
              <Button variant="primary" size="sm">
                <CreditCard className="w-3.5 h-3.5 mr-1" />
                <span>Kasir Baru</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Penerimaan Hari Ini"
          value={isLoading ? 'Memuat...' : formatRupiah(stats?.today.total ?? 0)}
          subtitle={`${stats?.today.count ?? 0} transaksi tercatat`}
          trend={{ value: "+100%", isPositive: true }}
          icon={<CreditCard className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Kas Tunai (Hari Ini)"
          value={isLoading ? 'Memuat...' : formatRupiah(stats?.today.cash ?? 0)}
          subtitle="Uang fisik siap setor TU"
          icon={<Receipt className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Transfer Bank (Hari Ini)"
          value={isLoading ? 'Memuat...' : formatRupiah(stats?.today.transfer ?? 0)}
          subtitle="Mutasi rekening terverifikasi"
          icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
        />
        <StatCard
          title="Tunggakan Berjalan"
          value={isLoading ? 'Memuat...' : formatRupiah(stats?.arrears.total ?? 0)}
          subtitle={`${stats?.arrears.studentsCount ?? 0} siswa belum lunas`}
          trend={{ value: "Tertunggak", isPositive: false }}
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
            <span className="text-xs font-mono text-zinc-400">Total: {formatRupiah(weekTotal)}</span>
          </div>

          {/* Minimalist Bar Chart */}
          <div className="mt-6 space-y-3">
            {stats?.last7Days.map((item, idx) => {
              const tunaiPct = maxDayTotal > 0 ? (item.tunai / maxDayTotal) * 100 : 0;
              const transferPct = maxDayTotal > 0 ? (item.transfer / maxDayTotal) * 100 : 0;

              return (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <span className="w-16 text-zinc-600 shrink-0">{item.day}</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-3 flex overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${tunaiPct}%` }}
                      title={`Tunai: ${formatRupiah(item.tunai)}`}
                    />
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${transferPct}%` }}
                      title={`Transfer: ${formatRupiah(item.transfer)}`}
                    />
                  </div>
                  <span className="w-28 text-right font-mono font-medium text-zinc-900 shrink-0">
                    {formatRupiah(item.total)}
                  </span>
                </div>
              );
            })}
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
            Status Sistem: Terhubung ke PostgreSQL 16
          </div>
        </div>
      </div>
    </div>
  );
}
