# Roadmap Pengembangan: Sistem ERP Pembayaran Sekolah

Dokumen roadmap implementasi bertahap sistem ERP sekolah berbasis Laravel 12 API, Next.js (App Router), PostgreSQL, dan TasteSkill Design System.

---

## Ringkasan Proyek
- **Backend:** Laravel 12 (REST API, Token Auth Sanctum, PostgreSQL 16)
- **Frontend:** Next.js 16 App Router + Tailwind CSS + TasteSkill UI tokens
- **Aktor:** Super Admin, Admin TU, Kepala Sekolah (Read-Only)
- **Status Pengujian:** 30 Feature Tests Lulus (231 Assertions) | Next.js Build 13 Routes Sukses (0 TypeScript Errors)

---

## [x] Fase 0: Setup Repositori & Fondasi Desain
Inisialisasi workspace monorepo/multi-folder dan standardisasi UI TasteSkill.

### Backend (Laravel 12)
1. [x] Setup proyek Laravel 12 API-only di `/backend`.
2. [x] Konfigurasi koneksi PostgreSQL lokal port 5432 (`sekolah_pintar_db`) dan migration dasar.
3. [x] Setup autentikasi API token (Laravel Sanctum).
4. [x] Standardisasi format JSON response (`ApiResponse` trait) dan global error handling.

### Frontend (Next.js)
1. [x] Setup proyek Next.js (App Router) TypeScript di `/frontend`.
2. [x] Integrasi Tailwind CSS dengan token TasteSkill (Geist Sans, Geist Mono, Zinc-950, Emerald accents).
3. [x] Base components TasteSkill di `frontend/components/ui/` (`Sidebar`, `TopNav`, `DataTable`, `Modal`, `InputField`, `SelectField`, `Badge`, `StatCard`).
4. [x] Setup API client Axios dengan token interceptor dan auto-redirect.

---

## [x] Fase 1: Autentikasi & Role-Based Access Control (RBAC)
Membangun fondasi izin 3 role sesuai PRD.

### Backend
1. [x] Skema database: tabel `roles`, `permissions`, `model_has_roles` via `spatie/laravel-permission`.
2. [x] Seeder role awal: `super_admin`, `admin_tu`, `kepala_sekolah`.
3. [x] Middleware proteksi route `role:super_admin`, `role:admin_tu`, `role:kepala_sekolah`.
4. [x] Endpoint: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

### Frontend
1. [x] Halaman Login TasteSkill dengan validasi instan client-side dan pintasan akun demo.
2. [x] Session provider (`AuthContext`) & route guards di layout app.
3. [x] Dynamic layout dashboard dengan banner read-only untuk Kepala Sekolah.

---

## [x] Fase 2: Manajemen Data Master
CRUD lengkap entitas inti sekolah sebelum transaksi aktif.

### Backend
1. [x] Migrasi & Model: `academic_years`, `classrooms`, `students`, `fee_categories`, `payment_methods`.
2. [x] Form Request validation (`AcademicYearRequest`, `ClassroomRequest`, `StudentRequest`, `FeeCategoryRequest`, `PaymentMethodRequest`).
3. [x] REST Controller untuk tiap entitas dengan format respons baku `camelCase`.
4. [x] Seeder data master: 2 tahun ajaran, 4 kelas, 4 kategori tarif, 3 metode bayar, 6 siswa aktif.

### Frontend
1. [x] Modul Siswa (`/master/siswa`): Tabel data siswa, filter kelas, live search NIS/nama, modal tambah/edit/hapus.
2. [x] Modul Rombel & Tahun Ajaran (`/master/kelas`): Tab navigasi kelas dan tahun ajaran, status kalender aktif.
3. [x] Modul Tarif & Saluran (`/master/biaya`): Pos biaya SPP/Gedung dan saluran penerimaan kasir.

---

## [x] Fase 3: Modul Transaksi Kasir & Cetak Kuitansi
Core feature penerimaan pembayaran kasir cepat dan aman.

### Backend
1. [x] Migrasi & Model: `bills`, `payments`, `payment_details`.
2. [x] Transaksi atomik kasir (`DB::transaction`) dengan row locking (`lockForUpdate`).
3. [x] Generate nomor invoice otomatis (`INV/YYYYMMDD/XXXX`).
4. [x] Fitur Void Transaksi oleh `super_admin` dengan pencatatan audit log alasan pembatalan dan auto-revert saldo tagihan.
5. [x] Seeder transaksi awal (`TransactionSeeder`).

### Frontend
1. [x] Layar Kasir Pembayaran (`/transaksi/kasir`): Pencarian instan siswa, checklist tagihan cicilan/lunas, kalkulator kembalian uang tunai.
2. [x] Dialog Kuitansi Fisik: Format kuitansi termal/A4 dengan tombol cetak resi `window.print()`.
3. [x] Riwayat Transaksi (`/transaksi/riwayat`): Tabel histori, cetak ulang kuitansi, dan modal void (khusus Super Admin).

---

## [x] Fase 4: Laporan Keuangan & Dashboard
Visibilitas keuangan real-time untuk Tata Usaha dan Kepala Sekolah.

### Backend
1. [x] Endpoint `GET /api/dashboard/stats`: KPI penerimaan hari ini, kas tunai vs transfer, total tunggakan, tren harian 7 hari.
2. [x] Endpoint `GET /api/reports/daily-cash`: Laporan kas harian dengan split penerimaan tunai vs transfer per rekening dan pos tagihan.
3. [x] Endpoint `GET /api/reports/arrears`: Laporan tunggakan siswa per kelas dengan rincian kewajiban belum lunas.
4. [x] Endpoint `GET /api/reports/reconciliation`: Rekonsiliasi saldo per rekening bank & brankas kas fisik TU.

### Frontend
1. [x] Dashboard Utama (`/dashboard`): Terhubung langsung ke statistik backend real-time dan bar chart tren 7 hari terakhir.
2. [x] Halaman Laporan (`/laporan`): Tab arus kas harian, tab tunggakan siswa, dan tab rekonsiliasi mutasi dengan opsi cetak fisik.

---

## [x] Fase 5: Pengaturan Sistem & Profil Sekolah
Konfigurasi operasional dan branding institusi.

### Backend
1. [x] Migrasi & Model: `school_profiles` (nama sekolah, alamat kop kuitansi, telepon, email, kepala sekolah, bendahara).
2. [x] Endpoint manajemen profil: `GET /api/settings/profile`, `PUT /api/settings/profile`.
3. [x] Endpoint ganti kata sandi: `POST /api/settings/change-password`.
4. [x] CRUD akun pengguna staf RBAC (Super Admin Only): `GET /api/settings/users`, `POST /api/settings/users`, `PUT /api/settings/users/{user}`, `DELETE /api/settings/users/{user}`.

### Frontend
1. [x] Halaman Pengaturan (`/pengaturan`):
   - Tab Profil Sekolah & Kuitansi: Form identitas instansi.
   - Tab Manajemen Pengguna (Super Admin Only): Tabel pengguna dan modal kelola role akun.
   - Tab Keamanan Akun: Form ganti kata sandi.

---

## [x] Fase 6: Uji Coba, Audit Kinerja & Rilis
Validasi acceptance criteria dan rilis aplikasi.

1. [x] **Audit Hak Akses (RBAC):** Seluruh mutasi dilindungi, Kepala Sekolah 100% read-only, Void terkunci di Super Admin.
2. [x] **Audit Integritas Data:** Format JSON `camelCase`, nominal uang `bigInteger`, penolakan mutasi duplikat/invalid.
3. [x] **Kinerja Frontend:** Next.js 16 App Router build clean (13 route teroptimasi).
4. [x] **Kinerja Backend:** 30 Unit & Feature tests lulus 100% (231 assertions).
