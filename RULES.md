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
