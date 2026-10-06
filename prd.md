# Product Requirements Document (PRD)
**Project Name:** Sistem ERP Pembayaran Sekolah
**Version:** 1.1.0

## 1. Tujuan Proyek
Membangun sistem ERP internal berbasis web untuk mengelola, mencatat, dan melaporkan transaksi pembayaran siswa (SPP, Uang Gedung, dll). Sistem ini dirancang untuk mempercepat proses di Tata Usaha dan memberikan transparansi laporan keuangan secara *real-time* kepada Kepala Sekolah.

## 2. Target Pengguna & Hak Akses (RBAC)
Sistem ini menggunakan Role-Based Access Control (RBAC) dengan 3 level pengguna:
1. **Super Admin:** Memiliki akses penuh ke seluruh sistem, termasuk manajemen database, pengaturan sistem inti, dan *bypass* validasi.
2. **Admin / Tata Usaha (TU):** Operator harian. Bisa mengakses Data Master (Siswa, Kategori), memproses Transaksi (Tunai/Transfer), mencetak kuitansi, dan melihat Laporan operasional.
3. **Kepala Sekolah:** Akses *Read-Only*. Hanya dapat mengakses Dashboard dan Laporan untuk memantau arus kas dan tunggakan tanpa bisa mengubah data.

## 3. Fitur Utama & Struktur Menu

### 3.1. Dashboard
* **Ringkasan (Widget):** Total penerimaan hari ini & bulan ini (dipisah berdasarkan Tunai dan Transfer), total tunggakan siswa bulan berjalan.
* **Grafik:** Tren pembayaran 7 hari terakhir.

### 3.2. Data Master
* **Siswa:** CRUD data siswa (NIS/NISN, Nama, Kelas, Tahun Masuk, Status Aktif).
* **Kelas & Tahun Ajaran:** CRUD kelas dan periode akademik.
* **Kategori Biaya:** CRUD jenis tagihan (bulanan seperti SPP, atau insidental seperti Seragam/Buku) beserta nominal default.
* **Metode Pembayaran:** CRUD metode (Tunai, Transfer Bank A, Transfer Bank B).

### 3.3. Transaksi
* **Penerimaan Pembayaran:**
  * Alur: Cari Siswa (ketik NIS/Nama) -> Pilih Tagihan -> Pilih Metode (Tunai/Transfer).
  * **Logika Tunai:** Langsung berstatus "Lunas" (Paid) saat disimpan.
  * **Logika Transfer:** Admin TU harus menginput nomor referensi/tanggal transfer. Status "Lunas" setelah divalidasi oleh TU.
* **Riwayat Transaksi:** Tabel daftar transaksi dengan pencarian, *filter* tanggal, cetak ulang kuitansi, dan fitur *Void* (Batal) khusus Super Admin.

### 3.4. Laporan
* **Laporan Kas & Bank Harian:** Rekapitulasi uang masuk per hari (pemisahan kolom Tunai dan Transfer).
* **Laporan Tunggakan:** Daftar siswa yang belum lunas (bisa diekspor ke PDF/Excel).
* **Rekapitulasi per Kategori:** Total pendapatan berdasarkan jenis biaya (misal: Total SPP, Total Seragam).

### 3.5. Pengaturan (Settings)
* **Manajemen Pengguna:** CRUD akun staf dan penugasan *role*.
* **Profil Sekolah:** Nama Sekolah, Logo, Alamat, dan Teks Header/Footer untuk kuitansi.

## 4. Kriteria Kesuksesan (Acceptance Criteria)
* Antarmuka (UI) harus responsif, bersih, dan konsisten menggunakan pustaka TasteSkill.
* Transaksi pembayaran tidak memakan waktu lebih dari 1 menit per siswa.
* Data Laporan Kas tidak boleh berbeda dengan total uang fisik & mutasi bank.