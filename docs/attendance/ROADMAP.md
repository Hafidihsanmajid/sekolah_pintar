# Roadmap Implementasi Modul Absensi

Roadmap ini memastikan AI agen (seperti Herdr/OpenCode) bekerja secara bertahap tanpa merusak arsitektur API dan modul Keuangan yang sudah berjalan stabil.

## Fase 1: Setup Navigasi & Konfigurasi (Sub-Menu 2)
*Tujuan: Membangun fondasi UI navigasi dan pengaturan parameter waktu.*

- [x] **Frontend:** Tambahkan menu "Absensi" di `Sidebar.tsx` tepat di bawah menu "Keuangan".
- [x] **Frontend:** Buat struktur 3 sub-menu: Data Siswa, Konfigurasi Absensi, Riwayat Absensi.
- [x] **Backend:** Buat file migrasi untuk tabel `attendance_settings`.
- [x] **Backend:** Buat model, Form Request, API Resource, dan Controller untuk `AttendanceSettingController`.
- [x] **Frontend:** Bangun halaman `/absensi/konfigurasi` menggunakan TasteSkill UI untuk membaca dan menyimpan API Konfigurasi.

## Fase 2: Integrasi Master Data Siswa (Sub-Menu 1)
*Tujuan: Menampilkan data siswa di dalam modul absensi secara read-only.*

- [x] **Backend:** Buat endpoint API spesifik (atau gunakan ulang endpoint siswa yang ada) yang hanya me-return data siswa aktif (mengecualikan siswa di kelas "Tagihan Alumni").
- [x] **Frontend:** Bangun halaman `/absensi/data-siswa`.
- [x] **Frontend:** Integrasikan komponen `DataTable` TasteSkill untuk menampilkan data (NIS, Nama, Kelas) tanpa tombol Edit/Hapus.

## Fase 3: Transaksi & Riwayat Absensi (Sub-Menu 3)
*Tujuan: Membangun inti sistem pencatatan kehadiran.*

- [x] **Backend:** Buat file migrasi untuk tabel `attendances` beserta *foreign key* `student_id`.
- [x] **Backend:** Buat model, Form Request, API Resource, dan Controller untuk `AttendanceController`.
- [x] **Backend:** Buat fungsi *batch insert* di backend agar satu *request* bisa menyimpan absensi puluhan siswa dalam satu kelas sekaligus.
- [x] **Frontend:** Bangun halaman `/absensi/riwayat` yang berisi rekapitulasi data.
- [x] **Frontend:** Buat *Modal* atau halaman *Quick Entry Form* menggunakan TasteSkill UI untuk input absen harian per kelas.

## Fase 4: Pengujian & RBAC
*Tujuan: Memastikan modul aman dan mematuhi aturan akses sistem.*

- [x] **Backend:** Uji coba integrasi *foreign key* `student_id`, pastikan tidak bisa menghapus siswa yang sudah memiliki riwayat absen (`onDelete('restrict')`).
- [x] **Frontend:** Sinkronisasi menu Absensi dengan sistem *Role-Based Access Control* (hanya tampil untuk role `super_admin`, `admin_tu`, atau role kustom absensi).