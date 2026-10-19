# Product Requirements Document (PRD) - Modul Absensi

## 1. Pendahuluan
Modul Absensi dibangun sebagai sistem pencatatan kehadiran siswa harian. Sesuai dengan arsitektur sistem (API-Driven Laravel 12 & Next.js), modul ini akan memanfaatkan *master data* siswa yang sudah ada tanpa melakukan duplikasi entitas. 

Pada antarmuka pengguna (UI/Sidebar), **Modul Absensi akan ditempatkan persis di bawah Modul Keuangan**, dan memiliki 3 (tiga) sub-menu utama.

## 2. Struktur Navigasi & UI (TasteSkill UI)

Modul Absensi akan memuat struktur sidebar berikut:
*   **Keuangan** (Modul existing)
*   **Absensi** (Modul Baru)
    *   **1. Data Siswa:** Halaman *read-only* yang menampilkan daftar siswa aktif. Data ditarik dari *master data* siswa (`/master/siswa`). Bertujuan agar admin/guru dapat melihat status siswa sebelum melakukan proses absensi.
    *   **2. Konfigurasi Absensi:** Halaman pengaturan parameter waktu kehadiran.
    *   **3. Riwayat Absensi:** Halaman operasional untuk menginput absensi harian massal per kelas dan melihat rekap/log kehadiran.

## 3. Spesifikasi Fungsional (Sub-Menu)

### 3.1 Sub-Menu 1: Data Siswa
*   **Fungsi:** Menampilkan *DataTable* (komponen TasteSkill) berisi data siswa aktif berdasarkan kelas.
*   **Aturan Bisnis:** 
    *   Hanya menampilkan data (Read-Only). Operasi CRUD tetap dilakukan di modul Master Data.
    *   Wajib mengecualikan siswa yang berada di kelas `Tagihan Alumni (Khusus Alumni)` sesuai aturan siklus siswa di `ARCHITECTURE.md`.

### 3.2 Sub-Menu 2: Konfigurasi Absensi
*   **Fungsi:** Form pengaturan parameter absensi sekolah (Single Row Configuration).
*   **Parameter yang disimpan:**
    *   `Jam Masuk` (contoh: 07:00)
    *   `Jam Pulang` (contoh: 15:00)
    *   `Batas Keterlambatan` (contoh: 15 menit)
*   **Aturan Bisnis:** Perubahan pada konfigurasi ini akan langsung mempengaruhi perhitungan status absensi pada hari berikutnya, namun tidak mengubah log riwayat yang sudah lampau.

### 3.3 Sub-Menu 3: Riwayat Absensi
*   **Fungsi:** Mencatat absensi harian dan melihat rekapitulasi data.
*   **Fitur Input:**
    *   Terdapat tombol "Input Absensi Hari Ini".
    *   Pengguna memilih Kelas, kemudian sistem menampilkan daftar siswa di kelas tersebut.
    *   Tersedia opsi *Quick Entry Form* (status default: `Hadir`), pengguna hanya perlu mengubah status siswa menjadi `Sakit`, `Izin`, `Alpa`, atau `Terlambat`.
*   **Aturan Bisnis Keterlambatan:** Jika guru menginput absen setelah batas toleransi (Jam Masuk + Batas Keterlambatan), sistem atau API otomatis memberikan peringatan atau default status menjadi `Terlambat`.

## 4. Spesifikasi Teknis & Database

Sistem mematuhi aturan ketat dari `RULES.md`, termasuk penggunaan `camelCase` di frontend/API dan `snake_case` di PostgreSQL.

### 4.1 Tabel Database (PostgreSQL)

**A. `attendance_settings`**
| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | `bigserial` | PK |
| `entry_time` | `time` | Jam masuk wajib |
| `exit_time` | `time` | Jam pulang wajib |
| `late_tolerance` | `integer` | Batas keterlambatan (menit) |
| `created_at` / `updated_at` | `timestamp` | Standar Laravel |

**B. `attendances`**
| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | `bigserial` | PK |
| `student_id` | `bigint` | FK ke tabel `students` (`onDelete('restrict')`) |
| `date` | `date` | Tanggal pencatatan |
| `status` | `varchar` | `hadir`, `sakit`, `izin`, `alpa`, `terlambat` |
| `notes` | `text` | Opsional |
| `created_at` / `updated_at` | `timestamp` | Standar Laravel |

### 4.2 Endpoint API (Laravel 12 - camelCase JSON)
*   `GET /api/v1/attendance-settings` (Ambil konfigurasi)
*   `PUT /api/v1/attendance-settings` (Update konfigurasi)
*   `GET /api/v1/attendances/students` (Ambil data siswa filter per kelas untuk sub-menu 1)
*   `GET /api/v1/attendances` (Ambil log/riwayat absensi)
*   `POST /api/v1/attendances/batch` (Simpan absensi satu kelas sekaligus)