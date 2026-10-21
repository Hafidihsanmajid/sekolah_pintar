\# Roadmap Implementasi Modul Absensi \& Kiosk



Roadmap ini memastikan AI agen (seperti Herdr/OpenCode) bekerja secara bertahap tanpa merusak arsitektur API dan modul Keuangan yang sudah berjalan stabil.



\## Fase 1: Setup Navigasi \& Konfigurasi (Sub-Menu 2)

\*Tujuan: Membangun fondasi UI navigasi dan pengaturan parameter waktu.\*

\* \[x] \*\*Frontend:\*\* Tambahkan menu "Absensi" di `Sidebar.tsx` tepat di bawah menu "Keuangan".

\* \[x] \*\*Frontend:\*\* Buat struktur 3 sub-menu: Data Siswa, Konfigurasi Absensi, Riwayat Absensi.

\* \[x] \*\*Backend:\*\* Buat file migrasi untuk tabel `attendance\_settings`.

\* \[x] \*\*Backend:\*\* Buat model, Form Request, API Resource, dan Controller untuk `AttendanceSettingController`.

\* \[x] \*\*Frontend:\*\* Bangun halaman `/absensi/konfigurasi` menggunakan TasteSkill UI untuk membaca dan menyimpan API Konfigurasi.



\## Fase 2: Integrasi Master Data Siswa (Sub-Menu 1)

\*Tujuan: Menampilkan data siswa di dalam modul absensi secara read-only.\*

\* \[x] \*\*Backend:\*\* Buat endpoint API spesifik (atau gunakan ulang endpoint siswa yang ada) yang hanya me-return data siswa aktif (mengecualikan siswa di kelas "Tagihan Alumni").

\* \[x] \*\*Frontend:\*\* Bangun halaman `/absensi/data-siswa`.

\* \[x] \*\*Frontend:\*\* Integrasikan komponen `DataTable` TasteSkill untuk menampilkan data (NIS, Nama, Kelas) tanpa tombol Edit/Hapus.



\## Fase 3: Transaksi \& Riwayat Absensi (Sub-Menu 3)

\*Tujuan: Membangun inti sistem pencatatan kehadiran.\*

\* \[x] \*\*Backend:\*\* Buat file migrasi untuk tabel `attendances` beserta \*foreign key\* `student\_id`.

\* \[x] \*\*Backend:\*\* Buat model, Form Request, API Resource, dan Controller untuk `AttendanceController`.

\* \[x] \*\*Backend:\*\* Buat fungsi \*batch insert\* di backend agar satu \*request\* bisa menyimpan absensi puluhan siswa dalam satu kelas sekaligus.

\* \[x] \*\*Frontend:\*\* Bangun halaman `/absensi/riwayat` yang berisi rekapitulasi data.

\* \[x] \*\*Frontend:\*\* Buat \*Modal\* atau halaman \*Quick Entry Form\* menggunakan TasteSkill UI untuk input absen harian per kelas.



\## Fase 4: Pengujian \& RBAC

\*Tujuan: Memastikan modul aman dan mematuhi aturan akses sistem.\*

\* \[x] \*\*Backend:\*\* Uji coba integrasi \*foreign key\* `student\_id`, pastikan tidak bisa menghapus siswa yang sudah memiliki riwayat absen (`onDelete('restrict')`).

\* \[x] \*\*Frontend:\*\* Sinkronisasi menu Absensi dengan sistem \*Role-Based Access Control\* (hanya tampil untuk role `super\_admin`, `admin\_tu`, atau role kustom absensi).



\## Fase 5: Mode Kiosk Mandiri (Self-Service)

\*Tujuan: Membangun antarmuka layar penuh untuk siswa agar bisa absen mandiri.\*

\* \[x] \*\*Backend:\*\* Buat endpoint khusus `POST /api/v1/attendances/kiosk` yang memproses payload `nis` dan mengeksekusi logika kehadiran otomatis.

\* \[x] \*\*Frontend:\*\* Buat Route Group baru di Next.js: `app/(kiosk)/layar-absen` dengan layout polos tanpa \*sidebar\* ERP.

\* \[x] \*\*Frontend:\*\* Buat komponen \*Virtual Numpad\* dan jam digital menggunakan utilitas UI TasteSkill.

\* \[x] \*\*Frontend:\*\* Integrasikan API Kiosk ke UI. Buat logika \*auto-reset\* form dalam waktu 3 detik setelah absen sukses (ditandai dengan warna Emerald) atau gagal (ditandai dengan warna merah).



\## Fase 6: Autentikasi Perangkat \& Pengaturan OS

\*Tujuan: Mengamankan API Kiosk dan mengatur PC Windows ruang kelas.\*

\* \[ ] \*\*Backend:\*\* Konfigurasi autentikasi \*Personal Access Token\* (Sanctum) untuk Kiosk dengan membuat \*role\* `device\_kiosk`.

\* \[ ] \*\*Deployment:\*\* Buat \*shortcut\* Google Chrome/Microsoft Edge dengan argumen `--kiosk` di PC Windows.

\* \[ ] \*\*Deployment:\*\* Pindahkan \*shortcut\* tersebut ke folder \*Startup\* Windows agar otomatis berjalan saat mesin dinyalakan.

