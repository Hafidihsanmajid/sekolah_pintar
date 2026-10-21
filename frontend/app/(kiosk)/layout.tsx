import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kiosk Absensi Siswa Mandiri - Sekolah Pintar',
  description: 'Layar absensi mandiri siswa sekolah',
};

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-canvas text-ink flex flex-col select-none overflow-x-hidden">
      {children}
    </div>
  );
}
