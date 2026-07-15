# LinkHub V1.0 - Modern Bio Link & Affiliate Manager

LinkHub adalah website bio-link modern berbasis cloud yang memudahkan Anda/Admin mengelola berbagai tautan promosi (affiliate, media sosial, portfolio, marketplace) melalui Dashboard pengelolaan yang dinamis, aman, dan responsif.

---

## 🚀 Fitur Utama
1. **Dasbor Manajemen Link:**
   - CRUD Link lengkap (Tambah, Edit, Hapus).
   - Pengaturan urutan link via button (Up/Down) otomatis.
   - Status Aktif/Nonaktif interaktif (Toggle Switch).
   - Pengelompokan Kategori (Social Media, Affiliate, Marketplace, Portfolio, Contact) & Badge premium (*NEW*, *HOT*, *PROMO*, *BEST*).
2. **Mesin Pencari Lanjutan (Search Flow):**
   - Validasi pencarian minimal 2 karakter.
   - Debounce 500ms & fitur pembatalan request lama (*AbortController*).
   - Pencarian PostgreSQL berbasis indeks (`ILIKE` pada `title` & `description`).
   - Caching memori aman selama 30 detik.
   - Skeleton Loading & interaksi Empty State yang detail.
3. **Halaman Publik Premium:**
   - Desain ultra-premium berbasis *Glassmorphism* dengan latar belakang mesh mengambang yang interaktif.
   - Banner Carousel dinamis dengan navigasi geser otomatis.
   - Pelacakan Klik (*Click Statistics*) otomatis.
4. **Keamanan Tinggi:**
   - Otentikasi aman melalui Supabase Auth.
   - Penggunaan variabel lingkungan terpisah untuk Server & Client.

---

## 🛠️ Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (dengan efek Glassmorphism)
- **UI Components:** Shadcn/ui
- **Database & Auth:** Supabase PostgreSQL & Supabase Auth
- **Animation:** Framer Motion
- **Form Validation:** React Hook Form & Zod

---

## 📂 Struktur Folder
```text
linkhub/
├── public/                 # File aset statis publik
├── src/
│   ├── app/                # Next.js App Router (Admin Pages, Login, Public View)
│   ├── components/         # Komponen UI Reusable (Admin & Common components)
│   ├── lib/                # Konfigurasi Supabase Client & utilitas autentikasi
│   ├── middleware.ts       # Proteksi akses admin & session guard
│   └── globals.css         # CSS Global & Desain Token
├── schema.sql              # Struktur tabel, trigger, dan indeks database
├── .env.example            # Template Environment Variables
├── package.json            # Daftar dependencies proyek
└── tsconfig.json           # Konfigurasi TypeScript compiler
```

---

## ⚙️ Persiapan & Instalasi Lokal

### 1. Kloning Proyek & Pasang Dependensi
```bash
npm install
```

### 2. Konfigurasi Database Supabase
Buka **Supabase SQL Editor**, salin dan jalankan seluruh isi file `schema.sql` untuk:
- Membuat tabel `links`, `profiles`, dan `banners`.
- Memasang fungsi trigger otomatis untuk update timestamp `updated_at`.
- Membuat indeks pencarian pada kolom `title`, `description`, `order_no`, dan `user_id` untuk mengoptimalkan performa.

### 3. Konfigurasi Environment Variables
Salin berkas `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lalu lengkapi isinya menggunakan kredensial proyek Supabase Anda:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` *(hanya digunakan di sisi server)*

### 4. Jalankan Development Server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) untuk mengakses LinkHub Anda secara lokal.

---

## 🌐 Panduan Deployment (Vercel)

### 1. Hubungkan ke GitHub
- Buat repository baru di GitHub.
- Lakukan push kode lokal ke branch `main`:
  ```bash
  git init
  git add .
  git commit -m "feat: inisialisasi linkhub v1.0"
  git remote add origin https://github.com/username/repository.git
  git branch -M main
  git push -u origin main
  ```

### 2. Deploy di Vercel
- Masuk ke dashboard **Vercel** lalu klik **Add New Project**.
- Impor repository GitHub LinkHub Anda.
- Pada bagian **Environment Variables**, tambahkan tiga variabel berikut:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Klik **Deploy**. CI/CD Vercel akan otomatis melakukan proses build & publikasi.

---

## 📋 Deployment Checklist

- [x] Next.js berjalan lancar tanpa error kompilasi (`npm run build` sukses).
- [x] TypeScript & ESLint terverifikasi bersih.
- [x] Environment Variables dikonfigurasi dengan aman.
- [x] `.env.local` terdaftar di `.gitignore` (tidak terunggah ke GitHub).
- [x] Indeks optimasi database telah terpasang di Supabase PostgreSQL.
- [x] RLS (Row Level Security) aktif untuk memproteksi query antar-user.
