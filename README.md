# BSCampus

Marketplace Politeknik Negeri Lhokseumawe untuk jual beli produk mahasiswa.

## Fitur Utama

- 🛍️ Browse dan cari produk dari mahasiswa
- 📱 Responsive design untuk mobile dan desktop
- 🎨 Dark mode support
- 📝 Form posting produk yang mudah digunakan
- 🔍 Filter berdasarkan kategori
- 💬 Informasi kontak penjual langsung
- 🚀 Ready untuk deploy di Vercel

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **Deployment**: Vercel (optimized)

## Cara Menjalankan

1. Install dependencies:
```bash
npm install
```

2. Jalankan development server:
```bash
npm run dev
```

3. Salin `.env.example` ke `.env.local` dan isi nilainya.
4. Buka browser dan akses: `http://localhost:3000`

## Autentikasi & Database

Login user memakai **Supabase Auth**. NIM tetap dipakai di form login, lalu
server mencari email terkait dan memanggil `signInWithPassword`.

Sebelum first run:

1. Jalankan `lib/schema.sql`, `migrations/001..005`, lalu `migrations/006_supabase_auth.sql`
   di Supabase SQL Editor.
2. Aktifkan Email provider di Supabase Authentication.
3. Daftarkan redirect URL: `${NEXT_PUBLIC_APP_URL}/auth/callback`.
4. Password lama tetap dipakai bila hash bcrypt-nya valid; hanya akun dengan
   hash rusak/null yang perlu **Lupa password**.

Detail lengkap ada di [`SUPABASE_AUTH_MIGRATION.md`](./SUPABASE_AUTH_MIGRATION.md).

> Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY` di kode atau env aplikasi.
> Aplikasi hanya memakai `NEXT_PUBLIC_SUPABASE_URL` dan
> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Deploy ke Vercel

1. Push repository ke GitHub
2. Import project di [Vercel](https://vercel.com/new)
3. Deploy otomatis akan berjalan

Atau gunakan Vercel CLI:
```bash
npm install -g vercel
vercel
```

## Struktur Folder

```
bscampus/
├── app/
│   ├── api/products/       # API routes
│   ├── products/           # Halaman produk
│   ├── sell/               # Halaman posting produk
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/             # React components
├── lib/                    # Utilities & types
└── public/                 # Static assets
```

## Kategori Produk

- Elektronik
- Buku & Alat Tulis
- Furniture
- Fashion
- Olahraga
- Lainnya

## Lisensi

© 2026 BSCampus - Marketplace Politeknik Negeri Lhokseumawe
