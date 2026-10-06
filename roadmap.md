# Roadmap Pengembangan: Sistem ERP Pembayaran Sekolah

Dokumen roadmap implementasi bertahap sistem ERP sekolah berbasis Laravel 12 API, Next.js (App Router), PostgreSQL, dan TasteSkill Design System.

---

## Ringkasan Proyek
- **Backend:** Laravel 12 (REST API, Token Auth, PostgreSQL)
- **Frontend:** Next.js App Router + Tailwind CSS + TasteSkill UI tokens
- **Aktor:** Super Admin, Admin TU, Kepala Sekolah (Read-Only)
- **Target Kinerja:** Transaksi per siswa < 1 menit, rekonsiliasi kas 100% akurat

---

## Fase 0: Setup Repositori & Fondasi Desain
Inisialisasi workspace monorepo/multi-folder dan standardisasi UI TasteSkill.

### Backend (Laravel 12)
1. Setup proyek Laravel 12 API-only di `/backend`.
2. Konfigurasi koneksi PostgreSQL dan migration dasar.
3. Setup autentikasi API token (Laravel Sanctum).
4. Standardisasi format JSON response dan global error handling.

### Frontend (Next.js)
1. Setup proyek Next.js (App Router) TypeScript di `/frontend`.
2. Integrasi Tailwind CSS dengan token TasteSkill:
   - Font: `Geist` / `Outfit` (Display & Body), `Geist Mono` (Finansial / Angka).
   - Warna: Canvas White (`#F9FAFB`), Zinc-950, Whisper Border, Accent Emerald (`#10B981`) untuk status lunas / finansial.
   - Bebas slop: Tanpa gradien ungu neon, tanpa shadow berat.
3. Buat base component TasteSkill di `frontend/components/ui/`:
   - `Sidebar` & `TopNav` (asymmetric, tactile active state).
   - `DataTable` (server-side pagination, search input cepat, sorting).
   - `Modal` & `SlideOver` dialog.
   - `InputField`, `SelectField`, `Badge` status (Lunas / Pending / Void).
   - `StatCard` (widget KPI).
4. Setup API client (Axios / Fetch wrapper) dengan token interceptor.

---

## Fase 1: Autentikasi & Role-Based Access Control (RBAC)
Membangun fondasi izin 3 role sesuai PRD.

### Backend
1. Skema database: tabel `users`, `roles`, `permissions` (atau integrasi `spatie/laravel-permission`).
2. Seeder role awal: `super_admin`, `admin_tu`, `kepala_sekolah`.
3. Middleware proteksi route:
   - `role:super_admin`
   - `role:admin_tu`
   - `role:kepala_sekolah` (Read-only guard)
4. Endpoint: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

### Frontend
1. Halaman Login minimalis TasteSkill dengan validasi form instan.
2. Session provider & route guards (middleware Next.js).
3. Dynamic layout dashboard berdasarkan role aktif.

---

## Fase 2: Manajemen Data Master
CRUD lengkap entitas inti sekolah sebelum transaksi aktif.

### Backend
1. Migrasi & Model:
   - `academic_years` (Tahun Ajaran, status aktif).
   - `classrooms` (Tingkat & Nama Kelas).
   - `students` (NIS, NISN, Nama, ID Kelas, Tahun Masuk, Status Aktif).
   - `fee_categories` (Nama Tagihan, Jenis: Bulanan/Insidental, Nominal Default).
   - `payment_methods` (Tunai, Transfer Bank + Info Rekening).
2. Form Request validation & REST Controller untuk tiap entitas.
3. Import data massal Siswa via file Excel/CSV.

### Frontend
1. Modul CRUD Siswa:
   - Tabel siswa TasteSkill dengan search live (NIS/Nama) dan filter kelas.
   - Form modal create/edit siswa + validasi client-side.
2. Modul CRUD Kelas & Tahun Ajaran.
3. Modul Kategori Biaya & Metode Pembayaran.

---

## Fase 3: Modul Transaksi & Cetak Kuitansi
Core feature penerimaan pembayaran cepat (< 1 menit).

### Backend
1. Migrasi & Model:
   - `bills` (Tagihan siswa per periode/insidental).
   - `transactions` (Kode Transaksi unik, Siswa ID, User TU ID, Metode ID, Total, Status: Paid/Pending/Void).
   - `transaction_items` (Relasi detail item tagihan yang dibayar).
2. Logika Pembayaran:
   - **Tunai:** Auto-set status `Paid` saat simpan transaksi.
   - **Transfer:** Simpan nomor referensi + tanggal transfer; verifikasi approval TU sebelum status `Paid`.
3. Fitur Void:
   - Endpoint `POST /api/transactions/{id}/void` khusus role `super_admin`.
   - Logging audit trail untuk setiap transaksi dibatalkan.
4. Endpoint payload kuitansi cetak: `GET /api/transactions/{id}/receipt`.

### Frontend
1. Layar Kasir / Input Pembayaran Cepat:
   - Single-screen layout optimized for speed: Cari Siswa -> Tampil checklist tagihan -> Pilih metode pembayaran.
   - Shortcut keyboard untuk navigasi dan submit cepat.
2. Riwayat Transaksi:
   - Filter rentang tanggal, filter metode (Tunai/Transfer), filter status.
   - Tombol "Void" hanya muncul untuk Super Admin.
3. Modul Cetak Kuitansi:
   - Clean printable view (Thermal 80mm & Invoice A5 standard) memuat profil sekolah, nomor kuitansi, rincian biaya, cap lunas.

---

## Fase 4: Laporan Keuangan & Dashboard
Visibilitas keuangan real-time untuk Tata Usaha dan Kepala Sekolah.

### Backend
1. Query agregasi & reporting:
   - Laporan Kas Harian: Split kolom Tunai vs Transfer.
   - Laporan Tunggakan: Daftar siswa belum bayar per periode.
   - Rekapitulasi per Kategori: Total pendapatan per pos biaya.
   - Dashboard Stats: Omzet hari ini, bulan ini, tunggakan bulan berjalan, tren 7 hari.
2. Export engine:
   - Export Laporan Tunggakan & Kas ke PDF & Excel.

### Frontend
1. Dashboard Utama:
   - Widget KPI TasteSkill: Card metrik dengan angka Geist Mono tebal.
   - Grafik tren pembayaran 7 hari terakhir (ChartJS / Recharts minimalis).
   - Akses read-only tanpa tombol aksi untuk Kepala Sekolah.
2. Halaman Laporan:
   - Rekapitulasi Kas & Bank Harian dengan tabel split kolom.
   - Tabel Tunggakan dengan tombol ekspor satu klik (PDF / XLSX).
   - Filter dinamis berdasarkan tanggal, kelas, dan kategori tagihan.

---

## Fase 5: Pengaturan Sistem & Profil Sekolah
Konfigurasi operasional dan branding institusi.

### Backend
1. Migrasi & Model: `school_profiles` (Nama, Logo, Alamat, Header/Footer kuitansi).
2. User management API (CRUD akun staf TU dan penugasan role).
3. File upload handler untuk logo sekolah.

### Frontend
1. Modul Manajemen Pengguna (Super Admin only).
2. Modul Profil Sekolah:
   - Form data sekolah + upload preview logo.
   - Customizer teks header dan footer kuitansi dengan live preview.

---

## Fase 6: Uji Coba, Audit Kinerja & Rilis
Validasi acceptance criteria sebelum operasional penuh.

1. **Uji Kecepatan Transaksi:** Uji alur pembayaran di bawah 60 detik per siswa.
2. **Audit Rekonsiliasi:** Validasi kalkulasi laporan kas vs mutasi fisik & transfer bank.
3. **Uji Hak Akses (RBAC):** Pastikan role Kepala Sekolah 100% read-only dan fungsi Void terkunci di Super Admin.
4. **Deploy & Production Readiness:**
   - Database indexing PostgreSQL pada `student_id`, `created_at`, `status`.
   - Build optimization Next.js & konfigurasi server API Laravel 12.
