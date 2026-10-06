# Panduan Operasional Teknis: Sistem ERP Pembayaran Sekolah

Panduan teknis instalasi, konfigurasi environment, migrasi PostgreSQL, eksekusi server lokal, dan alur kerja TasteSkill CLI untuk proyek Sistem ERP Pembayaran Sekolah.

---

## 1. Prasyarat Sistem (Prerequisites)
Pastikan dependensi sistem berikut sudah terpasang di komputer lokal:
- **PHP:** Versi 8.2 atau lebih baru (dengan ekstensi `pdo_pgsql`, `mbstring`, `openssl`, `bcmath`).
- **Composer:** Versi 2.x.
- **Node.js:** Versi 20.x LTS atau lebih baru.
- **NPM:** Versi 10.x+.
- **PostgreSQL:** Versi 15 atau lebih baru.
- **TasteSkill CLI / Agent Skills:** Sudah terinstal via npx (`https://www.tasteskill.dev/`).

---

## 2. Konfigurasi Environment Variables (`.env`)

### 2.1. Backend (`backend/.env`)
Salin file `backend/.env.example` ke `backend/.env` dan pastikan konfigurasi PostgreSQL terisi lengkap:

```env
APP_NAME="SekolahPintar ERP"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_TIMEZONE=Asia/Jakarta
APP_URL=http://localhost:8000

FRONTEND_URL=http://localhost:3000

LOG_CHANNEL=stack
LOG_LEVEL=debug

# Konfigurasi Database PostgreSQL
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sekolah_pintar_db
DB_USERNAME=postgres
DB_PASSWORD=secret
DB_SCHEMA=public

# Session, Cache, Queue via PostgreSQL
SESSION_DRIVER=database
SESSION_LIFETIME=120
QUEUE_CONNECTION=database
CACHE_STORE=database

# CORS Allowed Origins
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

### 2.2. Frontend (`frontend/.env.local`)
Buat file `frontend/.env.local` untuk menghubungkan Next.js ke backend Laravel:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME="Sistem ERP Pembayaran Sekolah"
NEXT_PUBLIC_DEFAULT_CURRENCY="IDR"
```

---

## 3. Instalasi Dependensi

Jalankan perintah berikut di terminal:

### Backend (Laravel 12)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

### Frontend (Next.js)
```bash
cd frontend
npm install
```

---

## 4. Eksekusi Database PostgreSQL

### 4.1. Buat Database PostgreSQL
Pastikan database sudah dibuat di PostgreSQL (via psql atau pgAdmin):
```sql
CREATE DATABASE sekolah_pintar_db;
```

### 4.2. Jalankan Migrasi & Seeder
Di direktori `backend/`:
```bash
# Menjalankan seluruh migrasi skema tabel
php artisan migrate

# Menjalankan migrasi beserta seeder akun default (Super Admin, TU, Kepala Sekolah)
php artisan migrate --seed
```

> **PERINGATAN PENTING (RULES.md):**
> File migrasi yang sudah dieksekusi **DILARANG** diubah atau dihapus manual. Setiap penambahan atau perubahan kolom wajib dibuat melalui file migrasi baru:
> ```bash
> php artisan make:migration alter_users_table_add_phone_number
> ```

---

## 5. Menjalankan Server Lokal (Local Development)

Buka dua jendela terminal terpisah:

### Terminal 1: Backend API (Laravel 12)
```bash
cd backend
php artisan serve --port=8000
```
API berjalan di: `http://localhost:8000/api`

### Terminal 2: Frontend App (Next.js)
```bash
cd frontend
npm run dev
```
Aplikasi web berjalan di: `http://localhost:3000`

---

## 6. Alur Kerja & Perintah CLI TasteSkill (https://www.tasteskill.dev/)

Proyek ini memanfaatkan pustaka standar desain anti-slop **TasteSkill** untuk menjamin antarmuka cepat, minimalis, dan konsisten.

### 6.1. Perintah Instalasi & Update Skill
Untuk memperbarui atau menambahkan modul desain TasteSkill ke proyek:
```bash
# Menambahkan pustaka skill taste ke workspace lokal
npx skills add Leonxlnx/taste-skill
```

### 6.2. Memeriksa Skill Terpasang
Daftar skill yang aktif di workspace tersimpan di folder `.agents/skills/`:
- `design-taste-frontend`: Standar desain anti-slop, kalibrasi kontras, dan layout bento.
- `stitch-design-taste`: Token desain semantik (Geist Mono, Whisper Border, Emerald Accent).
- `minimalist-ui`: Panduan antarmuka data-dense tanpa shadow kasar.

### 6.3. Pedoman Pemakaian Komponen TasteSkill di Frontend
1. **Pustaka Primitif:** Ambil komponen dasar dari `frontend/components/ui/` yang sudah mengadopsi standar TasteSkill.
2. **Format Angka & Moneter:** Wajib bungkus teks nominal dengan class font monospace (`font-mono` / Geist Mono):
   ```tsx
   <span className="font-mono font-medium text-emerald-600">
     Rp {amount.toLocaleString('id-ID')}
   </span>
   ```
3. **Pemberian Status Transaksi:** Gunakan badge standar TasteSkill:
   - `Paid` / Lunas: `bg-emerald-50 text-emerald-700 border-emerald-200`
   - `Pending` / Transfer Menunggu: `bg-amber-50 text-amber-700 border-amber-200`
   - `Void` / Batal: `bg-rose-50 text-rose-700 border-rose-200`

---

## 7. Rujukan Dokumen Terkait
- **PRD.md:** Spesifikasi kebutuhan produk, peran RBAC, dan alur pembayaran.
- **ARCHITECTURE.md:** Arsitektur decoupled, skema PostgreSQL, dan struktur direktori.
- **ROADMAP.md:** Tahapan implementasi dari Fase 0 hingga Fase 6.
- **RULES.md:** Aturan koding baku (camelCase, larangan custom CSS, integritas migrasi).
