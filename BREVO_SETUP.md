# Setup Brevo untuk BSCampus

BSCampus memakai **Brevo** sebagai pengirim email transaksional, khususnya
kode reset password 6 digit. Pengiriman memakai REST API Brevo langsung dari
server (`lib/email.ts`), tanpa SDK tambahan dan tanpa service role Supabase.

## 1. Buat akun & API key

1. Buka https://app.brevo.com dan daftar/login.
2. Buka **Settings → API Keys** (atau https://app.brevo.com/settings/keys/api).
3. Buat API key baru dengan nama misalnya `BSCampus`.
4. Salin key tersebut. Key ini **rahasia**: jangan pernah commit ke git atau
   taruh di kode frontend.

## 2. Verifikasi pengirim

Email reset harus dikirim dari alamat yang terverifikasi:

1. Buka **Senders & Domains → Domains** di dashboard Brevo.
2. Tambahkan domain yang dipakai, lalu ikuti instruksi DNS (SPF/DKIM).
3. Tunggu status terverifikasi.
4. Alternatif development: gunakan alamat sender default yang sudah
   diverifikasi Brevo, lalu ganti ke domain sendiri saat produksi.

> `BREVO_FROM_EMAIL` bisa ditulis `BSCampus <no-reply@domain-anda.com>`
> atau hanya `no-reply@domain-anda.com`.

## 3. Environment variables

Tambahkan ke `.env.local`:

```env
BREVO_API_KEY=xkeysib-xxxxxxxx
BREVO_FROM_EMAIL=BSCampus <no-reply@domain-anda.com>
```

Di Vercel: **Project Settings → Environment Variables**, isi dua nama yang
sama untuk Production/Preview/Development, lalu redeploy.

## 4. Testing

```bash
npm run dev
```

1. Buka `http://localhost:3000/forgot-password`.
2. Masukkan email user yang terdaftar di `public.users`.
3. Cek inbox (atau **Brevo Dashboard → Email Activity / Logs**).
4. Masukkan kode 6 digit + password baru + konfirmasi di halaman tersebut.

Endpoint yang dipakai:

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@student.pnl.ac.id"}'
```

Responsnya sengaja generik:

```json
{
  "success": true,
  "message": "Jika email terdaftar, kode reset akan dikirim ke email Anda."
}
```

## 5. Troubleshooting

| Masalah | Penyebab umum | Solusi |
|---|---|---|
| Response 500 `BREVO_API_KEY belum dikonfigurasi` | Env belum diisi | Isi `BREVO_API_KEY`, restart dev server / redeploy |
| Email tidak masuk | Sender belum terverifikasi | Verifikasi domain/sender di Brevo |
| Status 401 dari Brevo | API key salah atau sudah di-rotate | Buat API key baru, update env |
| Status 400 `not_enough_credits` | Kuota habis | Top up atau tunggu reset kuota bulanan |
| Email masuk spam | Domain belum SPF/DKIM | Lengkapi DNS record lalu warm up domain |

Jangan pernah menaruh API key di chat, screenshot publik, atau file yang
ter-commit. Jika key pernah terbuka, **rotate/cabut key lama** di dashboard
Brevo dan ganti dengan yang baru.

## Referensi

- Brevo API: https://developers.brevo.com/reference/sendtransacemail
- Brevo dashboard: https://app.brevo.com
