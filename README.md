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

3. Buka browser dan akses: `http://localhost:3000`

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
