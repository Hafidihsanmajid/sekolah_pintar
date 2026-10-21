# System Architecture & Tech Stack

## 1. Tech Stack Utama
* **Frontend Framework:** Next.js (App Router, TypeScript)
* **Styling & UI Library:** Tailwind CSS + **TasteSkill UI & CLI** ([https://www.tasteskill.dev/](https://www.tasteskill.dev/))
* **Backend / API:** Laravel 12 (RESTful API-only)
* **Database:** PostgreSQL 15+ (Driver `pdo_pgsql`)
* **Autentikasi:** Laravel Sanctum (Token-based API Authentication)
* **Format Data:** JSON standar dengan konvensi `camelCase`

---

## 2. Arsitektur Sistem (Decoupled API-Driven)
Sistem memisahkan backend dan frontend secara menyeluruh:

### 2.1. Backend (Laravel 12 API)
* Berperan murni sebagai penyedia RESTful API (Headless).
* Menangani validasi request melalui Form Request classes, transaksi database, RBAC middleware, dan logika bisnis keuangan.
* Seluruh output model diserialisasikan melalui Eloquent API Resource dengan struktur seragam (`success`, `message`, `data`, `errors`) dan field berformat `camelCase`.
* **Database PostgreSQL:**
  - Skema data relasional dengan foreign key constraint ketat (`onDelete('restrict')` untuk data transaksi).
  - Kolom finansial/mata uang disimpan menggunakan `bigInteger` (satuan Rupiah penuh) untuk menjamin akurasi desimal nol.
  - Indeks relasional pada kolom pencarian intensif (`nis`, `transaction_code`, `status`, `created_at`).
  - Prosedur migrasi absolut: dilarang memodifikasi file migrasi lama yang telah berjalan; wajib migrasi baru bertahap.

### 2.2. Frontend (Next.js App Router)
* Mengonsumsi REST API dari Laravel secara asinkron via Axios / Fetch API client terpusat.
* Mengadopsi React Server Components (RSC) untuk fetching data performan dan Client Components terbatas untuk interaktivitas kasir & form.
* State management terisolasi per fitur untuk menjaga kecepatan proses pembayaran siswa (< 1 menit per transaksi).

### 2.3. Pustaka & Standar Desain TasteSkill (https://www.tasteskill.dev/)
* Pemanfaatan CLI Tasteskill (`npx skills ...`) untuk mengambil dan mereferensikan standar desain anti-slop.
* Komponen interaktif (seperti *Modal*, *DataTable*, *Dropdown*, *Quick Entry Form*, *Sidebar*, *Receipt View*) wajib mengikuti panduan visual TasteSkill:
  - Tipografi: `Geist` / `Outfit` untuk teks antarmuka dan `Geist Mono` untuk seluruh representasi angka, nominal uang, serta timestamp.
  - Palet warna: Canvas White (`#F9FAFB`), Zinc-950 teks, Whisper Border semi-transparan, aksen finansial Emerald (`#10B981`).
  - Larangan CSS kustom: 100% Tailwind utility classes.

---

## 3. Struktur Repositori & Direktori
Proyek diorganisir dalam arsitektur multi-direktori bersih:

```text
/
├── backend/                   # Proyek Laravel 12 (API-only)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/   # REST Controllers ramping
│   │   │   ├── Requests/      # Validasi Form Request ketat
│   │   │   └── Resources/     # Serialisasi API camelCase
│   │   ├── Models/            # Eloquent Models PostgreSQL
│   │   └── Services/          # Business logic & rekonsiliasi
│   ├── config/                # Konfigurasi database & sanctum
│   ├── database/
│   │   ├── migrations/        # Migrasi PostgreSQL berurutan (immutable)
│   │   └── seeders/           # Seeder role, user admin, & data awal
│   └── routes/
│       └── api.php            # Endpoint API v1
│
├── frontend/                  # Proyek Next.js App Router
│   ├── app/                   # App Router (layout, routes, pages)
│   ├── components/
│   │   ├── ui/                # Base primitives bersumber dari TasteSkill
│   │   └── features/          # Komponen domain (kasir, laporan, master)
│   ├── lib/                   # API client (Axios instance), auth token helper
│   ├── types/                 # TypeScript interfaces (camelCase payload)
│   └── styles/
│       └── globals.css        # Tailwind entrypoint (tanpa custom CSS)
│
├── .agents/skills/            # Pustaka TasteSkill CLI yang telah terinstal
├── PRD.md                     # Kebutuhan produk & acceptance criteria
├── ARCHITECTURE.md            # Arsitektur sistem & tech stack (file ini)
├── ROADMAP.md                 # Fase implementasi bertahap
├── RULES.md                   # Standar koding ketat & konvensi tim
└── README.md                  # Panduan operasional teknis & setup lokal
```

---

## 4. Perkembangan & State Sistem Terkini

### 4.1. Ekosistem Role & RBAC (Role-Based Access Control)
Sistem telah memperluas cakupan peran pengguna:
* **Peran Inti:**
  1. `super_admin`: Kendali modul menyeluruh, manajemen user/role, pembatalan (*void*) transaksi kasir.
  2. `admin_tu`: Operasional master data, transaksi kasir pembayaran siswa, pencetakan kuitansi.
  3. `kepala_sekolah`: Pemantauan analitik (*read-only*) pada dashboard dan laporan keuangan.
  4. `keuangan`: Pengelolaan kas masuk, pengeluaran kas operasional, dan visibilitas laporan keuangan harian/tunggakan.
* **Manajemen Hak Akses Dinamis (`/hak-akses`):**
  - Super Admin dapat membuat role kustom, mengatur matriks perizinan menu per role, dan menetapkan batasan modul.
  - Perizinan menu disinkronkan ke state antarmuka (`Sidebar.tsx`) berbasis storage event (`role-permissions-updated`, `roles-updated`).

### 4.2. Manajemen Siklus Hidup Siswa (Student Lifecycle)
* **Kelulusan Siswa & Kelas Khusus `Tagihan Alumni`:**
  - Siswa yang dinyatakan lulus dipindahkan ke sub menu Data Alumni (`/master/alumni`).
  - Tagihan yang belum lunas tidak dihapus: sistem mengalihkan relasi kelas siswa ke kelas khusus `Tagihan Alumni` (migration `create_tagihan_alumni_classroom`).
  - Kasir pembayaran menyediakan filter kelas `Tagihan Alumni (Khusus Alumni)` agar sisa piutang siswa lulus tetap dapat dicari dan dilunasi.
* **Fitur Kenaikan Kelas Bertahap:**
  - Tombol **Naik Kelas** disediakan di sub menu Data Siswa (`/master/siswa`) untuk siswa tingkat 10 dan 11.
  - Siswa kelas 12 (tingkat akhir) hanya menampilkan tombol **Lulus**.
  - Validasi ketat melarang lompat tingkat (kenaikan wajib tepat satu tingkat, misal 10 ke 11, 11 ke 12).
  - Seluruh riwayat tagihan siswa tetap utuh dan terhubung secara otomatis mengikuti kelas tujuan baru.

### 4.3. Modul Manajemen Keuangan Sekolah Non-Kasir (`/keuangan`)
* **Input Uang Masuk (`/keuangan/input-uang-masuk`):**
  - Pencatatan penerimaan dana eksternal non-iuran siswa (BOS, hibah, donasi, sponsorship, CSR).
  - Penomoran invoice otomatis berformat `IN/YYYYMMDD/XXXX`.
* **Pengeluaran Kas Operasional (`/keuangan/input-uang-keluar` & `/keuangan/uang-keluar`):**
  - Pencatatan dan monitoring beban biaya operasional, ATK, pemeliharaan sarana, honorarium, konsumsi rapat.
  - Penomoran invoice otomatis berformat `OUT/YYYYMMDD/XXXX`.
* **Konsolidasi Laporan Keuangan Terpadu (`/laporan`):**
  - Menggabungkan mutasi kasir pembayaran tagihan siswa dengan kas masuk non-kasir secara real-time.
  - Analisis arus kas harian, laporan tunggakan siswa, dan rekonsiliasi saluran pembayaran tunai/bank.

### 4.4. Tata Kelola Dokumentasi Multi-Domain (`docs/`)
Dokumentasi proyek diorganisasi ke dalam subfolder berbasis modul:
* `docs/architecture.md`: Dokumen arsitektur teknis dan status implementasi sistem global.
* `docs/payments/`: Dokumentasi khusus modul pembayaran SPP & tagihan siswa (`prd.md`, `roadmap.md`).
* `docs/attendance/`: Ruang lingkup untuk rencana modul presensi/kehadiran siswa.
* `RULES.md`: Panduan standar koding dan integritas data baku proyek.

### 4.5. Modul Presensi / Absensi Siswa (`/absensi`)
* **Tiga Sub-Menu Presensi:**
  - **Data Siswa (`/absensi/data-siswa`):** Halaman read-only menampilkan daftar siswa aktif per rombel tanpa tombol edit/hapus/lulus. Siswa di kelas khusus `Tagihan Alumni` dieksklusikan secara otomatis.
  - **Konfigurasi Absensi (`/absensi/konfigurasi`):** Pengaturan jam masuk, jam pulang, dan toleransi keterlambatan dalam menit (tabel `attendance_settings`). Perubahan berlaku ke perhitungan presensi berikutnya tanpa mengubah log lampau.
  - **Riwayat Absensi (`/absensi/riwayat`):** Dua mode operasional:
    1. *Log & Rekapitulasi:* Metrik kartu ringkasan (Total, Hadir, Terlambat, Sakit, Izin, Alpa) dan DataTable riwayat dengan filter tanggal, kelas, dan status.
    2. *Input Presensi Cepat Massal:* Pilih tanggal dan rombel, muat siswa aktif otomatis, kontrol radio pill per status (hadir/terlambat/sakit/izin/alpa), tombol set semua hadir, dan batch insert/upsert via `POST /api/v1/attendances/batch`.
* **Integritas Relasi Database & RBAC:**
  - Foreign key `student_id` pada tabel `attendances` menggunakan `onDelete('restrict')` sehingga siswa dengan riwayat presensi tidak dapat dihapus sembarangan.
  - Akses modul presensi diatur via permission key `absensi` (role `super_admin`, `admin_tu`, atau role kustom dengan izin absensi). Mutasi konfigurasi dan input batch diproteksi middleware `role:super_admin|admin_tu`.
