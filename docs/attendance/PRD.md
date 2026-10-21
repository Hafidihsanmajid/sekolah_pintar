\# Product Requirements Document (PRD) - Modul Absensi \& Kiosk Mandiri



\## 1. Pendahuluan

Modul Absensi dibangun sebagai sistem pencatatan kehadiran siswa harian. Sesuai dengan arsitektur sistem (API-Driven Laravel 12 \& Next.js), modul ini akan memanfaatkan \*master data\* siswa yang sudah ada tanpa melakukan duplikasi entitas.



Modul ini memiliki dua mode antarmuka:

1\. \*\*Mode Dashboard ERP:\*\* Ditempatkan di dalam sistem utama untuk admin/guru mengelola konfigurasi dan melihat riwayat.

2\. \*\*Mode Kiosk Mandiri:\*\* Halaman \*fullscreen\* terpisah bagi siswa untuk melakukan absensi sendiri menggunakan NIS.



\## 2. Struktur Navigasi \& UI (TasteSkill UI)



\### 2.1 Mode Dashboard ERP (Grup Route Utama)

\*   \*\*Keuangan\*\* (Modul existing)

\*   \*\*Absensi\*\* (Modul Baru)

&#x20;   \*   \*\*1. Data Siswa:\*\* Halaman \*read-only\* yang menampilkan daftar siswa aktif. Data ditarik dari \*master data\* siswa (`/master/siswa`).

&#x20;   \*   \*\*2. Konfigurasi Absensi:\*\* Halaman pengaturan parameter waktu kehadiran.

&#x20;   \*   \*\*3. Riwayat Absensi:\*\* Halaman operasional untuk menginput absensi harian massal per kelas dan melihat rekap/log kehadiran.



\### 2.2 Mode Kiosk Mandiri (Grup Route `(kiosk)`)

\*   \*\*Route:\*\* `/layar-absen`

\*   \*\*Fungsi:\*\* Halaman khusus \*self-service\* (mandiri) untuk diakses siswa melalui PC/perangkat di depan kelas.

\*   \*\*UI/UX:\*\* Tampilan layar penuh (\*fullscreen\*) tanpa \*sidebar\* maupun \*navbar\* ERP. Halaman berisi jam digital \*real-time\*, form input NIS, dan \*\*Virtual Numpad\*\* berukuran besar yang dirancang untuk layar sentuh menggunakan utilitas komponen TasteSkill.

\*   \*\*Feedback:\*\* Sistem memberikan indikasi visual instan (hijau/Emerald untuk sukses, merah untuk gagal) dan otomatis membersihkan (\*reset\*) form dalam 3 detik setelah absen berhasil agar siap digunakan siswa berikutnya.



\## 3. Spesifikasi Fungsional (Sub-Menu Dashboard)



\### 3.1 Sub-Menu 1: Data Siswa

\*   \*\*Fungsi:\*\* Menampilkan \*DataTable\* (komponen TasteSkill) berisi data siswa aktif berdasarkan kelas.

\*   \*\*Aturan Bisnis:\*\* Hanya menampilkan data (Read-Only). Wajib mengecualikan siswa yang berada di kelas `Tagihan Alumni (Khusus Alumni)`.



\### 3.2 Sub-Menu 2: Konfigurasi Absensi

\*   \*\*Fungsi:\*\* Form pengaturan parameter absensi sekolah (Single Row Configuration).

\*   \*\*Parameter yang disimpan:\*\* `Jam Masuk` (07:00), `Jam Pulang` (15:00), `Batas Keterlambatan` (15 menit).



\### 3.3 Sub-Menu 3: Riwayat Absensi

\*   \*\*Fungsi:\*\* Mencatat absensi harian dan melihat rekapitulasi data.

\*   \*\*Fitur Input:\*\* Tersedia opsi \*Quick Entry Form\* (status default: `Hadir`) untuk mengubah status siswa menjadi `Sakit`, `Izin`, `Alpa`, atau `Terlambat`.



\## 4. Spesifikasi Teknis \& Database



Sistem mematuhi aturan ketat dari `RULES.md`, termasuk penggunaan `camelCase` di frontend/API dan `snake\_case` di PostgreSQL.



\### 4.1 Tabel Database (PostgreSQL)



\*\*A. `attendance\_settings`\*\*

| Kolom | Tipe | Keterangan |

| :--- | :--- | :--- |

| `id` | `bigserial` | PK |

| `entry\_time` | `time` | Jam masuk wajib |

| `exit\_time` | `time` | Jam pulang wajib |

| `late\_tolerance` | `integer` | Batas keterlambatan (menit) |

| `created\_at` / `updated\_at` | `timestamp` | Standar Laravel |



\*\*B. `attendances`\*\*

| Kolom | Tipe | Keterangan |

| :--- | :--- | :--- |

| `id` | `bigserial` | PK |

| `student\_id` | `bigint` | FK ke tabel `students` (`onDelete('restrict')`) |

| `date` | `date` | Tanggal pencatatan |

| `status` | `varchar` | `hadir`, `sakit`, `izin`, `alpa`, `terlambat` |

| `notes` | `text` | Opsional |

| `created\_at` / `updated\_at` | `timestamp` | Standar Laravel |



\### 4.2 Endpoint API (Laravel 12 - camelCase JSON)

\*   `GET /api/v1/attendance-settings` (Ambil konfigurasi)

\*   `PUT /api/v1/attendance-settings` (Update konfigurasi)

\*   `GET /api/v1/attendances/students` (Ambil data siswa filter per kelas untuk sub-menu 1)

\*   `GET /api/v1/attendances` (Ambil log/riwayat absensi)

\*   `POST /api/v1/attendances/batch` (Simpan absensi satu kelas sekaligus)

\*   \*\*`POST /api/v1/attendances/kiosk` (BARU):\*\* Endpoint khusus untuk Kiosk. Menerima request `{"nis": "12345"}`, mencari NIS di \*database\*, mencocokkan waktu saat ini dengan tabel `attendance\_settings`, lalu membuat \*record\* kehadiran secara otomatis (termasuk penentuan status "Terlambat").



\### 4.3 Autentikasi Perangkat Kiosk

Sistem tidak mengharuskan siswa untuk melakukan \*login\*. PC/Perangkat Kiosk diotorisasi menggunakan \*Personal Access Token\* statis (Sanctum) yang diikat pada peran khusus (misalnya `role: device\_kiosk`). Token ini ditanam di dalam \*Environment Variables\* aplikasi Next.js khusus untuk rute Kiosk.

