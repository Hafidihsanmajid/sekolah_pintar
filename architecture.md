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
