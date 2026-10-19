'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useAlert } from '@/context/alert-context';
import { apiClient } from '@/lib/api-client';
import { AttendanceSetting } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { InputField } from '@/components/ui/InputField';
import {
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ShieldAlert,
  Info,
  CalendarCheck,
} from 'lucide-react';

export default function KonfigurasiAbsensiPage() {
  const { user } = useAuth();
  const { showUpdateAlert } = useAlert();
  const isReadOnly = user?.role === 'kepala_sekolah';

  const [setting, setSetting] = useState<AttendanceSetting>({
    id: 1,
    entryTime: '07:00',
    exitTime: '15:00',
    lateTolerance: 15,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch Attendance Settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<AttendanceSetting>('/attendance-settings');
      if (res.success && res.data) {
        setSetting(res.data);
      }
    } catch {
      // Fallback default
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Kalkulasi batas akhir jam toleransi keterlambatan
  const calculatedToleranceTime = useMemo(() => {
    if (!setting.entryTime) return '-';
    const [hoursStr, minutesStr] = setting.entryTime.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (isNaN(hours) || isNaN(minutes)) return '-';

    const totalMinutes = hours * 60 + minutes + (Number(setting.lateTolerance) || 0);
    const resultHours = Math.floor(totalMinutes / 60) % 24;
    const resultMinutes = totalMinutes % 60;

    return `${String(resultHours).padStart(2, '0')}:${String(resultMinutes).padStart(2, '0')}`;
  }, [setting.entryTime, setting.lateTolerance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    const newErrors: Record<string, string> = {};
    if (!setting.entryTime) {
      newErrors.entryTime = 'Jam masuk wajib diisi';
    }
    if (!setting.exitTime) {
      newErrors.exitTime = 'Jam pulang wajib diisi';
    }
    if (setting.lateTolerance === undefined || setting.lateTolerance < 0) {
      newErrors.lateTolerance = 'Batas keterlambatan minimal 0 menit';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSuccessMsg(null);

    try {
      const res = await apiClient.put<AttendanceSetting>('/attendance-settings', {
        entryTime: setting.entryTime,
        exitTime: setting.exitTime,
        lateTolerance: Number(setting.lateTolerance),
      });

      if (res.success && res.data) {
        setSetting(res.data);
        setSuccessMsg('Konfigurasi parameter absensi berhasil disimpan.');
        showUpdateAlert('Konfigurasi parameter absensi berhasil diperbarui.');
      }
    } catch (err: unknown) {
      const errRes = err as { message?: string; errors?: Record<string, string[]> };
      if (errRes.errors) {
        const mappedErrors: Record<string, string> = {};
        Object.entries(errRes.errors).forEach(([key, msgs]) => {
          mappedErrors[key] = msgs[0];
        });
        setErrors(mappedErrors);
      } else {
        setErrors({ general: errRes.message || 'Gagal menyimpan konfigurasi absensi' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
              Konfigurasi Absensi
            </h1>
            <Badge variant="neutral" size="sm">
              Parameter Waktu
            </Badge>
          </div>
          <p className="text-xs text-steel mt-0.5">
            Pengaturan jam masuk, jam pulang, dan batas toleransi keterlambatan siswa untuk pencatatan kehadiran harian.
          </p>
        </div>

        {isReadOnly && (
          <Badge variant="neutral" size="sm" className="bg-amber-50 text-amber-800 border-amber-200">
            Mode Pantau (Read-Only)
          </Badge>
        )}
      </div>

      {/* Alert Notifikasi Sukses / Error */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errors.general && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Input Parameter (2 Kolom) */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-zinc-950">
                Parameter Waktu Kehadiran
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Jam Masuk Wajib (WIB)"
                  type="time"
                  value={setting.entryTime}
                  onChange={(e) => setSetting({ ...setting, entryTime: e.target.value })}
                  errorMessage={errors.entryTime || errors.entry_time}
                  disabled={isLoading || isReadOnly || isSubmitting}
                  required
                />

                <InputField
                  label="Jam Pulang Wajib (WIB)"
                  type="time"
                  value={setting.exitTime}
                  onChange={(e) => setSetting({ ...setting, exitTime: e.target.value })}
                  errorMessage={errors.exitTime || errors.exit_time}
                  disabled={isLoading || isReadOnly || isSubmitting}
                  required
                />
              </div>

              <div>
                <InputField
                  label="Batas Toleransi Keterlambatan (Menit)"
                  type="number"
                  min="0"
                  max="240"
                  placeholder="Contoh: 15"
                  value={setting.lateTolerance.toString()}
                  onChange={(e) =>
                    setSetting({
                      ...setting,
                      lateTolerance: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  errorMessage={errors.lateTolerance || errors.late_tolerance}
                  disabled={isLoading || isReadOnly || isSubmitting}
                  required
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Siswa yang diabsen melewati batas ini akan secara otomatis diklasifikasikan berstatus <strong>Terlambat</strong>.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-mono">
                  {setting.updatedAt
                    ? `Terakhir diperbarui: ${new Date(setting.updatedAt).toLocaleString('id-ID')}`
                    : 'Konfigurasi bawaan sistem'}
                </span>

                {!isReadOnly && (
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                    disabled={isLoading}
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    <span>Simpan Pengaturan</span>
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Kolom Kanan: Kartu Pratinjau & Aturan Bisnis (1 Kolom) */}
        <div className="space-y-4">
          <div className="bg-zinc-50/75 rounded-2xl border border-zinc-200/80 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider">
                Simulasi Logika Jam
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-zinc-200/70 shadow-sm space-y-1">
                <span className="text-zinc-500 text-[11px] block">Status Tepat Waktu (Hadir):</span>
                <p className="font-mono font-semibold text-emerald-700 text-sm">
                  Sebelum {calculatedToleranceTime} WIB
                </p>
                <span className="text-[10px] text-zinc-400">
                  Jam masuk ({setting.entryTime}) + toleransi {setting.lateTolerance} menit.
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-zinc-200/70 shadow-sm space-y-1">
                <span className="text-zinc-500 text-[11px] block">Status Terlambat:</span>
                <p className="font-mono font-semibold text-amber-700 text-sm">
                  Pukul {calculatedToleranceTime} WIB ke atas
                </p>
                <span className="text-[10px] text-zinc-400">
                  Siswa yang hadir melebihi jam toleransi.
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-zinc-200/70 shadow-sm space-y-1">
                <span className="text-zinc-500 text-[11px] block">Jam Selesai KBM (Pulang):</span>
                <p className="font-mono font-semibold text-zinc-900 text-sm">
                  {setting.exitTime} WIB
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Catatan Aturan Bisnis:</strong>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Perubahan pada konfigurasi waktu ini langsung berlaku untuk perhitungan absensi harian berikutnya, dan tidak mengubah riwayat absensi yang telah tercatat sebelumnya.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
