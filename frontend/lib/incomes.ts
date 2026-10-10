import { IncomeItem } from '@/types/api';

export const INCOME_STORAGE_KEY = 'sekolah_pintar_uang_masuk';

export const INCOME_CATEGORIES = [
  { label: 'Bantuan Operasional Sekolah (BOS)', value: 'Bantuan Operasional Sekolah (BOS)' },
  { label: 'Bantuan Pemerintah / Pemda', value: 'Bantuan Pemerintah / Pemda' },
  { label: 'Hibah & Donasi Yayasan / Donatur', value: 'Hibah & Donasi Yayasan / Donatur' },
  { label: 'Sponsorship & CSR Perusahaan', value: 'Sponsorship & CSR Perusahaan' },
  { label: 'Unit Usaha & Koperasi Sekolah', value: 'Unit Usaha & Koperasi Sekolah' },
  { label: 'Pendapatan Lain-lain', value: 'Pendapatan Lain-lain' },
];

export const INITIAL_INCOMES: IncomeItem[] = [
  {
    id: 1,
    invoiceNumber: 'IN/20261008/0001',
    title: 'Pencairan Dana BOS Reguler Tahap II',
    category: 'Bantuan Operasional Sekolah (BOS)',
    source: 'Kementerian Pendidikan & Kebudayaan RI',
    purpose: 'Alokasi operasional pembelajaran, buku teks, dan pemeliharaan gedung sekolah',
    amount: 45000000,
    date: '2026-10-08',
    notes: 'Transfer Bank (BNI)',
    createdAt: '2026-10-08T08:30:00Z',
  },
  {
    id: 2,
    invoiceNumber: 'IN/20261009/0002',
    title: 'Bantuan Hibah Revitalisasi Lab Sains',
    category: 'Bantuan Pemerintah / Pemda',
    source: 'Dinas Pendidikan Kabupaten/Kota',
    purpose: 'Pengadaan peralatan mikroskop dan alat peraga laboratorium sains fisika & biologi',
    amount: 15000000,
    date: '2026-10-09',
    notes: 'Transfer Bank (Bank Jatim)',
    createdAt: '2026-10-09T10:15:00Z',
  },
  {
    id: 3,
    invoiceNumber: 'IN/20261010/0003',
    title: 'Donasi Beasiswa Siswa Berprestasi Alumni',
    category: 'Hibah & Donasi Yayasan / Donatur',
    source: 'Ikatan Alumni Angkatan 2015',
    purpose: 'Bantuan biaya SPP dan seragam untuk 10 siswa berprestasi kurang mampu',
    amount: 5000000,
    date: '2026-10-10',
    notes: 'Kas Tunai (Kasir TU)',
    createdAt: '2026-10-10T13:00:00Z',
  },
];
