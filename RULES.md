# Aturan Standar Pengembangan (RULES.md)

Dokumen ini berisi aturan baku rekayasa perangkat lunak untuk proyek **Sistem ERP Pembayaran Sekolah**. Seluruh pengembang dan AI agent wajib mematuhi panduan ini secara ketat tanpa pengecualian.

---

## 1. Konvensi Penamaan (Naming Conventions)

### 1.1. Aturan Wajib camelCase
- **Variabel & Fungsi:** Wajib menggunakan `camelCase` di seluruh file TypeScript/JavaScript dan method/variabel PHP:
  ```typescript
  // BENAR
  const totalPaymentAmount = 150000;
  function calculateRemainingBalance() {}

  // SALAH
  const total_payment_amount = 150000;
  function Calculate_Remaining_Balance() {}
  ```
- **Payload API (JSON Request & Response):** Wajib menggunakan `camelCase` pada setiap key properti JSON:
  ```json
  // BENAR
  {
    "studentId": 12,
    "paymentMethod": "transfer",
    "transactionDate": "2026-10-06"
  }

  // SALAH
  {
    "student_id": 12,
    "payment_method": "transfer"
  }
  ```

### 1.2. Konvensi Lainnya
- **Komponen React & Interface/Type:** Wajib `PascalCase` (`PaymentModal.tsx`, `StudentTable.tsx`, `interface TransactionDetail`).
- **Nama File Route & Komponen Frontend:** Wajib `kebab-case` untuk folder dan `PascalCase` untuk komponen UI.
- **Model Laravel:** Wajib `PascalCase` tunggal (`Student`, `FeeCategory`, `Transaction`).
- **Tabel & Kolom Database PostgreSQL:** Wajib `snake_case` jamak untuk tabel (`students`, `fee_categories`) dan `snake_case` untuk kolom (`student_id`, `created_at`). Laravel API Resource bertugas mentransformasikan ke `camelCase` saat dikirim ke frontend.

---

## 2. Standar Styling: Tailwind CSS & Larangan CSS Kustom

### 2.1. Larangan Total CSS Kustom
- **DILARANG** membuat file `.css` baru selain file root utama Tailwind (`globals.css`).
- **DILARANG** menggunakan tag `<style>` atau properti inline `style={{ ... }}` pada komponen React kecuali nilai dinamik mutlak (misal koordinat grafik canvas/transform koordinat drag).
- **DILARANG** menulis blok `@apply` berlebihan di file CSS global.

### 2.2. Standar Tailwind CSS
- Gunakan utility classes bawaan Tailwind CSS secara eksplisit.
- Gabungkan class dinamis secara konsisten menggunakan fungsi utilitas `cn()` (`clsx` + `tailwind-merge`):
  ```typescript
  // lib/utils.ts
  import { clsx, type ClassValue } from 'clsx';
  import { twMerge } from 'tailwind-merge';

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```

---

## 3. Database: Kebijakan Ketat PostgreSQL & Migrasi

### 3.1. Larangan Mengubah Migrasi yang Sudah Berjalan
- **ATURAN MUTLAK:** File migrasi Laravel yang sudah pernah dieksekusi atau telah masuk ke branch utama **DILARANG DIUBAH, DIHAPUS, ATAU DI-ROLLBACK SECARA SEPIHAK**.
- Setiap perubahan skema, penambahan kolom, modifikasi tipe data, atau penghapusan indeks **WAJIB** dibuatkan file migrasi baru menggunakan:
  ```bash
  php artisan make:migration alter_[nama_tabel]_[deskripsi_perubahan]
  ```
- Perubahan migrasi lama hanya diizinkan dalam tahap inisialisasi lokal sebelum repositori dirilis ke tim atau staging, dan memerlukan persetujuan eksplisit.

### 3.2. Integritas Data & PostgreSQL Best Practices
- Setiap foreign key wajib didefinisikan eksplisit dengan constraint relasional:
  ```php
  $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
  ```
- Kolom pencarian frekuensi tinggi (NIS, nomor referensi, status, tanggal transaksi) wajib memiliki indeks:
  ```php
  $table->index(['status', 'created_at']);
  $table->index('nis');
  ```
- Simpan nilai moneter/uang dalam tipe data `bigInteger` (dalam satuan Rupiah penuh) atau `decimal(15, 2)` untuk menghindari precision loss floating point.

---

## 4. Standar Desain Tasteskill (https://www.tasteskill.dev/)

### 4.1. Filosofi Desain Anti-Slop
- Seluruh antarmuka mengacu pada prinsip pustaka **Tasteskill**:
  - **Font Display & Body:** Gunakan `Geist` atau `Outfit`. Dilarang memakai font generik bawaan.
  - **Font Angka/Finansial:** Wajib menggunakan font monospace (`Geist Mono` / `JetBrains Mono`) untuk seluruh nominal uang, saldo, tanggal, dan kode transaksi.
  - **Warna Aksen:** Emerald (`#10B981`) sebagai warna aksen utama status finansial/lunas, Zinc-950 (`#09090b`) untuk teks utama, dan Canvas White (`#F9FAFB`) untuk latar.
  - **Banned Visual Patterns:** Dilarang menggunakan gradien ungu AI, shadow kasar bernilai tinggi, border berwarna mencolok, atau layout "3 card generik" simetris tanpa konteks fungsional.

### 4.2. Pemanfaatan Komponen
- Setiap komponen input, modal, data table, kartu metrik, dan tombol harus bersumber atau mengadopsi standar komponen TasteSkill di folder `components/ui/`.
- Jangan membuat variasi styling komponen baru jika komponen standar TasteSkill sudah tersedia.

---

## 5. Arsitektur Kode Backend (Laravel 12 API)

1. **API-Only Responsibility:** Laravel hanya bertugas melayani endpoint RESTful JSON. Dilarang menggunakan Blade view kecuali untuk render template PDF kuitansi/laporan.
2. **Form Request Validation:** Seluruh validasi input request wajib ditulis di dalam Form Request class tersendiri (`app/Http/Requests/*`). Controller tidak boleh memuat validasi inline (`$request->validate(...)`).
3. **API Resource Serialization:** Selalu bungkus output model menggunakan `JsonResource` untuk menjaga konsistensi format JSON `camelCase` dan menyaring atribut sensitif database.
4. **Format Response Baku:**
   - Sukses:
     ```json
     {
       "success": true,
       "message": "Data transaksi berhasil disimpan",
       "data": { ... }
     }
     ```
   - Gagal:
     ```json
     {
       "success": false,
       "message": "Validasi gagal",
       "errors": { ... }
     }
     ```

---

## 6. Arsitektur Kode Frontend (Next.js App Router)

1. **Server Components by Default:** Gunakan React Server Components (RSC) untuk fetching data statis dan rendering struktur halaman.
2. **Client Components Seperlunya:** Deklarasikan `'use client'` hanya pada komponen interaktif yang membutuhkan state (`useState`), effect (`useEffect`), event listener (tombol klik, modal toggle), atau hooks browser.
3. **Strict TypeScript:** Dilarang menggunakan tipe `any`. Seluruh payload API, properti props, dan response harus didefinisikan interface/type-nya secara eksplisit di `types/`.
4. **Kecepatan Transaksi:** Form kasir pembayaran harus mendukung navigasi keyboard (Enter / Tab) agar proses pembayaran siswa selesai di bawah 1 menit sesuai PRD.

---

## 7. Aturan Khusus Siklus Siswa & Tagihan Alumni

### 7.1. Integritas Tagihan Siswa Lulus (Alumni)
- **DILARANG MENGHAPUS TAGIHAN:** Ketika siswa dinyatakan lulus, seluruh data tagihan yang belum lunas (`unpaid` / `partially_paid`) **DILARANG DIHAPUS**.
- Siswa yang lulus dialihkan kelasnya ke kelas khusus `Tagihan Alumni` (`level: 'Alumni'`), dan data siswa aktif disaring agar hanya tampil di sub menu Data Alumni.
- Pada modul kasir, kelas `Tagihan Alumni` wajib selalu dapat diakses untuk penagihan piutang tanpa terikat batasan filter tahun ajaran aktif.

### 7.2. Aturan Kenaikan Kelas (Class Promotion)
- **Larangan Lompat Tingkat:** Siswa hanya diperbolehkan naik tepat 1 tingkat di atas tingkat kelas saat ini (misal: tingkat 10 hanya boleh ke tingkat 11; tingkat 11 hanya boleh ke tingkat 12). Kenaikan melompat (misal: tingkat 10 langsung ke tingkat 12) wajib diblokir pada tingkat antarmuka dan validasi.
- **Siswa Tingkat Akhir:** Siswa tingkat 12/XII dilarang memiliki tombol naik kelas; siswa tingkat 12 hanya memiliki opsi fitur kelulusan (**Lulus**).
- Seluruh tagihan aktif siswa wajib tetap melekat pada profil siswa bersangkutan saat berpindah ke kelas baru.

---

## 8. Aturan Modul Keuangan & Arus Kas Non-Kasir

### 8.1. Konvensi Penomoran Invoice Kas
- **Uang Masuk Non-Kasir (Penerimaan BOS/Hibah):** Wajib menggunakan prefix dan format penanggalan:
  `IN/YYYYMMDD/XXXX` (Contoh: `IN/20261019/0001`).
- **Uang Keluar / Beban Operasional:** Wajib menggunakan prefix dan format penanggalan:
  `OUT/YYYYMMDD/XXXX` (Contoh: `OUT/20261019/0001`).
- **Transaksi Kasir Pembayaran Siswa:** Tetap menggunakan format standar:
  `INV/YYYYMMDD/XXXX`.

### 8.2. Rekonsiliasi & Pelaporan Terpadu
- Laporan arus kas wajib memisahkan penerimaan kasir siswa dengan penerimaan kas non-kasir, namun tetap menyediakan ringkasan grand total yang konsisten.
- Metode/saluran pembayaran wajib dibedakan antara kas fisik (tunai kasir TU) dan rekening transfer bank agar rekonsiliasi mutasi akurat.

---

## 9. Aturan Perluasan Role-Based Access Control (RBAC)

1. **Role Baru:** Setiap penambahan role baru (misal: `keuangan`) wajib didaftarkan pada:
   - Seeder backend (`RoleAndUserSeeder.php`).
   - Route middleware grup `api.php`.
   - Kamus role frontend (`lib/role-permissions.ts`).
   - Interface TypeScript (`types/api.ts`).
2. **Sinkronisasi Navigasi:** Pengubahan hak akses role dinamis di antarmuka harus memicu event `role-permissions-updated` dan `roles-updated` agar navigasi sidebar langsung terbarui tanpa perlu refresh manual.

---

## 10. Aturan Modul Presensi Siswa (Absensi)

### 10.1. Integritas Data & Proteksi Hapus Siswa
- **Larangan Hapus Siswa Berpresensi:** Tabel `attendances` menggunakan relasi foreign key `student_id` dengan opsi `onDelete('restrict')`. Endpoint penghapusan siswa (`DELETE /api/students/{id}`) wajib memvalidasi ketiadaan riwayat presensi siswa terlebih dahulu dan me-return status `422 Unprocessable Entity` jika riwayat presensi ada.
- **Pengecualian Kelas Tagihan Alumni:** Seluruh query data siswa untuk absensi wajib mengecualikan kelas `Tagihan Alumni` (`LOWER(name) != 'tagihan alumni'`).
- **Upsert Presensi Harian:** Pencatatan presensi massal (`POST /api/v1/attendances/batch`) wajib bersifat idempotens/upsert berdasarkan pasangan `[student_id, date]`. Jika entri sudah ada pada tanggal bersangkutan, sistem memperbarui status dan catatan siswa tanpa membuat duplikat baris.

### 10.2. Hak Akses Modul Presensi (RBAC)
- **Akses Tampil Menu:** Hanya role yang memiliki izin `absensi` (`super_admin`, `admin_tu`, atau role kustom dengan hak akses absensi) yang menampilkan menu Presensi di antarmuka sidebar.
- **Mutasi Parameter & Presensi Massal:** Operasi perubahan konfigurasi waktu (`PUT /attendance-settings`) dan input absensi massal (`POST /attendances/batch`) diproteksi ketat dengan middleware `role:super_admin|admin_tu`. Role pimpinan (seperti `kepala_sekolah`) hanya memiliki hak pantau/baca (read-only) pada log rekapitulasi presensi.
