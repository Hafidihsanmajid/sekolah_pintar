'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Clock,
  Maximize2,
  Minimize2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Calendar,
  Home,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { VirtualNumpad } from '@/components/ui/VirtualNumpad';
import { apiClient } from '@/lib/api-client';
import { ApiResponse, AttendanceRecord, KioskAttendancePayload } from '@/types/api';

type FeedbackType = 'success' | 'error' | null;

interface FeedbackState {
  type: FeedbackType;
  title: string;
  message: string;
  data?: AttendanceRecord;
}

// Audio synthesizer for kiosk sound feedback (zero external audio files needed)
function playKioskBeep(isSuccess: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (isSuccess) {
      // Pleasant chime (Two harmonious ascending tones)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);
    } else {
      // Error double-buzz tone
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now); // A3
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Ignore audio permission or autoplay errors
  }
}

export default function LayarAbsenKioskPage() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [nis, setNis] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time digital clock running every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' WIB'
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Auto-focus input when in normal ready state
  useEffect(() => {
    if (!feedback && !isSubmitting) {
      inputRef.current?.focus();
    }
  }, [feedback, isSubmitting]);

  // Toggle Fullscreen mode
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen API may be blocked by browser policy
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          // Ignore exit error
        });
      }
    }
  };

  // Reset form and feedback
  const handleReset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setFeedback(null);
    setNis('');
    setCountdown(3);
    setIsSubmitting(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  // Trigger 3-second auto-reset after feedback
  const startAutoReset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setCountdown(3);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    resetTimerRef.current = setTimeout(() => {
      handleReset();
    }, 3000);
  }, [handleReset]);

  // Submit attendance via Kiosk API
  const handleSubmitAttendance = async (nisToSubmit?: string) => {
    const targetNis = (nisToSubmit ?? nis).trim();
    if (!targetNis) {
      inputRef.current?.focus();
      return;
    }

    if (isSubmitting || feedback) return;

    setIsSubmitting(true);

    try {
      const response = await apiClient.post<AttendanceRecord>('/v1/attendances/kiosk', {
        nis: targetNis,
      } as KioskAttendancePayload);

      if (response.success && response.data) {
        playKioskBeep(true);
        setFeedback({
          type: 'success',
          title: response.data.status === 'hadir' ? 'KEHADIRAN TEPAT WAKTU' : 'KEHADIRAN TERLAMBAT',
          message: response.message || 'Presensi berhasil dicatat oleh sistem.',
          data: response.data,
        });
      } else {
        playKioskBeep(false);
        setFeedback({
          type: 'error',
          title: 'ABSENSI GAGAL',
          message: response.message || 'Gagal mencatat absensi.',
        });
      }
    } catch (err: unknown) {
      playKioskBeep(false);
      const apiErr = err as ApiResponse<AttendanceRecord>;
      const errorMessage = apiErr?.message || 'Terjadi gangguan koneksi ke server sekolah.';
      setFeedback({
        type: 'error',
        title: 'ABSENSI GAGAL',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
      startAutoReset();
    }
  };

  // Virtual Numpad handlers
  const handleDigitClick = (digit: string) => {
    if (feedback || isSubmitting) return;
    if (nis.length >= 20) return; // Prevent excessive input
    setNis((prev) => prev + digit);
  };

  const handleDeleteDigit = () => {
    if (feedback || isSubmitting) return;
    setNis((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    if (feedback || isSubmitting) return;
    setNis('');
  };

  // Keyboard navigation on input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitAttendance();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (feedback) {
        handleReset();
      } else {
        setNis('');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-canvas text-ink flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none">
      {/* Top Header Bar */}
      <header className="w-full flex items-center justify-between pb-4 sm:pb-6 border-b border-zinc-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-bold text-lg sm:text-xl text-zinc-950 tracking-tight">
                Sekolah Pintar ERP
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Kiosk Aktif
              </span>
            </div>
            <p className="text-xs text-zinc-500 hidden sm:block">
              Layar Pencatatan Presensi Siswa Mandiri (Self-Service)
            </p>
          </div>
        </div>

        {/* Live Clock & Fullscreen Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-1.5 justify-end text-xs font-medium text-zinc-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentDate || 'Memuat tanggal...'}</span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center justify-end gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{currentTime || '--:--:-- WIB'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2.5 sm:p-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 active:scale-95 transition-all cursor-pointer shadow-sm"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Tampilan Layar Penuh (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Kiosk Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center py-4 sm:py-8 w-full max-w-4xl mx-auto">
        {/* Mobile Clock View */}
        <div className="sm:hidden text-center mb-4">
          <p className="text-xs text-zinc-500">{currentDate}</p>
          <p className="font-mono text-2xl font-bold text-zinc-900 tracking-tight flex items-center justify-center gap-1.5 mt-0.5">
            <Clock className="w-4 h-4 text-emerald-600" />
            {currentTime}
          </p>
        </div>

        {/* FEEDBACK STATE: Emerald Success or Rose Failure */}
        {feedback ? (
          <div
            className={`w-full max-w-xl mx-auto rounded-3xl p-6 sm:p-8 border-2 transition-all duration-200 shadow-diffused ${
              feedback.type === 'success'
                ? 'bg-emerald-50/90 border-emerald-500/80'
                : 'bg-rose-50/90 border-rose-500/80'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              {/* Status Icon */}
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 shadow-sm ${
                  feedback.type === 'success'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-rose-600 text-white shadow-rose-600/30'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2.5]" />
                ) : (
                  <XCircle className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2.5]" />
                )}
              </div>

              {/* Status Header */}
              <h2
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5 ${
                  feedback.type === 'success' ? 'text-emerald-900' : 'text-rose-900'
                }`}
              >
                {feedback.title}
              </h2>

              <p
                className={`text-sm sm:text-base font-medium max-w-md ${
                  feedback.type === 'success' ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {feedback.message}
              </p>

              {/* Success Student Detail Card */}
              {feedback.type === 'success' && feedback.data && (
                <div className="w-full mt-6 p-5 bg-white/95 rounded-2xl border border-emerald-200/90 shadow-sm text-left">
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-zinc-100">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                        Siswa Terverifikasi
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-zinc-950 mt-0.5">
                        {feedback.data.studentName}
                      </h3>
                      <p className="font-mono text-sm text-zinc-500">
                        NIS: <span className="font-semibold text-zinc-800">{feedback.data.studentNis}</span>
                      </p>
                    </div>

                    <Badge
                      variant={feedback.data.status === 'hadir' ? 'success' : 'warning'}
                      size="md"
                      className="text-xs sm:text-sm px-3 py-1 font-bold uppercase tracking-wide"
                    >
                      {feedback.data.status === 'hadir' ? 'Hadir' : 'Terlambat'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-zinc-400 block text-[11px]">Kelas</span>
                      <span className="font-semibold text-zinc-800">
                        {feedback.data.classroomName || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[11px]">Waktu Absen</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {feedback.data.checkInTime || currentTime}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3-Second Auto Reset Timer Bar */}
              <div className="w-full mt-6 pt-2">
                <div className="w-full bg-zinc-200/70 h-2 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ease-linear ${
                      feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                    style={{
                      width: `${(countdown / 3) * 100}%`,
                      transitionDuration: '1000ms',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Layar siap untuk siswa berikutnya dalam{' '}
                    <strong className="font-mono font-bold text-zinc-900">{countdown}s</strong>
                  </span>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="font-medium underline hover:text-zinc-900 cursor-pointer"
                  >
                    Lanjut Sekarang
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* NORMAL INPUT STATE: Input Display + Virtual Numpad */
          <div className="w-full max-w-md mx-auto flex flex-col items-center">
            {/* Guide Card */}
            <div className="text-center mb-5">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Layar Sentuh & Scanner
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
                Masukkan NIS Anda
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Ketik nomor NIS pada tombol di bawah atau scan kartu pelajar
              </p>
            </div>

            {/* Large NIS Display Box with Real Hidden Input for Barcode/Keyboard */}
            <div className="w-full relative mb-5 sm:mb-6">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={nis}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  setNis(cleaned);
                }}
                onKeyDown={handleKeyDown}
                placeholder="NIS Siswa..."
                autoComplete="off"
                disabled={isSubmitting}
                className="w-full h-16 sm:h-20 px-6 bg-white rounded-2xl border-2 border-zinc-200/90 text-center font-mono text-2xl sm:text-4xl font-bold tracking-widest text-zinc-950 placeholder:text-zinc-300 placeholder:font-sans placeholder:text-base sm:placeholder:text-xl placeholder:tracking-normal shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
              />

              {nis.length > 0 && !isSubmitting && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 hover:text-rose-600 bg-zinc-100 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Virtual Numpad */}
            <VirtualNumpad
              onNumberClick={handleDigitClick}
              onDelete={handleDeleteDigit}
              onClear={handleClearAll}
              disabled={isSubmitting}
              className="mb-5 sm:mb-6"
            />

            {/* Big Action Submit Button */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={nis.trim().length === 0 || isSubmitting}
              isLoading={isSubmitting}
              onClick={() => handleSubmitAttendance()}
              className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold rounded-2xl shadow-md shadow-emerald-600/20"
            >
              {!isSubmitting && (
                <span className="flex items-center gap-2">
                  <span>Catat Kehadiran</span>
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
              {isSubmitting && <span>Memproses Presensi...</span>}
            </Button>
          </div>
        )}
      </main>

      {/* Subtle Footer with ERP Exit link */}
      <footer className="w-full pt-4 border-t border-zinc-200/80 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sistem Presensi Kiosk Terintegrasi</span>
        </div>

        <Link
          href="/absensi/riwayat"
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 transition-colors p-1 rounded font-medium"
          title="Kembali ke Dashboard Utama"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Kembali ke Dashboard ERP</span>
        </Link>
      </footer>
    </div>
  );
}
