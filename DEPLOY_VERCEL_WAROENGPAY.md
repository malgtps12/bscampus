# Deploy ke Vercel + Konfigurasi QRIS WaroengPay

Panduan ini menyelesaikan dua hal sekaligus: aplikasi online di Vercel, dan
pembayaran QRIS berfungsi penuh (webhook diterima).

## Kenapa harus publik?

WaroengPay menolak `callback_url` ke jaringan privat:

> `"Alamat tujuan berada di jaringan privat dan tidak diizinkan."`

Artinya di `localhost` webhook `payment.paid` **tidak akan pernah sampai**.
Aplikasi tetap bisa mendeteksi pembayaran lewat polling
`GET /api/waroengpay/[id]`, tetapi produksi sebaiknya memakai webhook.

---

## Langkah 1 - Import project ke Vercel

1. Buka https://vercel.com/new
2. Import repository `malgtps12/bscampus`
3. Framework akan terdeteksi otomatis sebagai **Next.js** — biarkan default
4. Jangan klik Deploy dulu; isi environment variables di langkah 2

## Langkah 2 - Environment Variables

Di halaman import, buka **Environment Variables**. Isi semua nilai berikut
(lihat juga `.env.example`):

| Variable | Nilai |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mjpbiktoxqqircxrsfxr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key Supabase |
| `APP_NAME` | `BSCampus` |
| `NEXT_PUBLIC_APP_URL` | `https://<project>.vercel.app` |
| `ADMIN_USERNAME` | username admin |
| `ADMIN_PASSWORD` | password admin |
| `JWT_SECRET` | string acak ≥32 karakter |
| `RESEND_API_KEY` | key Resend |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` |
| `WAROENGPAY_API_KEY` | `wp_live_...` (produksi) |
| `WAROENGPAY_WEBHOOK_SECRET` | `whsec_live_...` |

> **Penting:** `NEXT_PUBLIC_APP_URL` harus URL Vercel final. Nilai ini dipakai
> sebagai `callback_url` dan `redirect_url` setiap tagihan QRIS.

Klik **Deploy** dan tunggu selesai. Catat domain yang diberikan, misal
`https://bscampus-xyz.vercel.app`.

## Langkah 3 - Perbaiki `NEXT_PUBLIC_APP_URL`

Kalau domain Vercel berbeda dari yang Anda isi di langkah 2:

1. Vercel → Project → **Settings** → **Environment Variables**
2. Ubah `NEXT_PUBLIC_APP_URL` ke domain final
3. **Deployments** → deployment terakhir → **⋯** → **Redeploy**

`NEXT_PUBLIC_*` di-*inline* saat build, jadi **wajib redeploy** setelah diubah.

## Langkah 4 - Daftarkan Webhook di WaroengPay

1. Login https://waroengpay.com/dashboard
2. **Integrasi & API** → **Webhook**
3. Isi URL webhook (pilih salah satu, keduanya aktif):
   ```
   https://<project>.vercel.app/api/waroengpay/webhook
   https://<project>.vercel.app/webhook/waroengpay
   ```
4. Masukkan password akun untuk menampilkan **webhook secret**
5. Pastikan secret itu sama dengan `WAROENGPAY_WEBHOOK_SECRET` di Vercel
6. Klik **Kirim tes** — harus menerima respons 2xx

> Port yang diizinkan WaroengPay: 80, 443, 8080, 8443. Vercel memakai 443
> sehingga aman.

## Langkah 5 - Verifikasi

1. Buka `https://<project>.vercel.app`
2. Login, pilih produk, klik **Beli Sekarang**
3. Anda diarahkan ke halaman tunggu dengan QRIS
4. Bayar (atau, dengan key sandbox, tekan tombol simulasi di halaman bayar
   WaroengPay)
5. Halaman tunggu berubah menjadi **Pembayaran Berhasil** otomatis
6. Cek Vercel → **Logs** untuk memastikan webhook masuk:
   ```
   [WaroengPay Webhook] Payment processed successfully: <id>
   ```

## Langkah 6 - Aktifkan deploy otomatis dari GitHub (opsional)

Workflow `.github/workflows/ci-cd.yml` sudah bisa men-deploy setiap push ke
`main`, tetapi butuh tiga repository secrets:

| Secret | Cara mendapatkannya |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Jalankan `vercel link` lalu lihat `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Sama, dari `.vercel/project.json` |

Set di GitHub → repo → **Settings** → **Secrets and variables** → **Actions**.

Selama ketiganya belum ada, langkah deploy dilewati dengan peringatan
(warning) dan workflow tetap **hijau** — build, lint, test, dan type check
tetap diverifikasi.

---

## Development lokal

Di `localhost`, webhook tidak bisa masuk (ditolak WaroengPay). Yang terjadi:

- Tagihan QRIS tetap dibuat normal
- Pembeli diarahkan ke halaman tunggu
- Status disinkronkan lewat polling tiap 5 detik ke
  `GET /api/waroengpay/[id]`
- Setelah lunas, transaksi jadi `paid` dan produk jadi `sold: true`

Untuk menguji webhook secara lokal, gunakan tunnel publik
(mis. `ngrok http 3000`) lalu set `NEXT_PUBLIC_APP_URL` ke URL tunnel itu.

## Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Payment gateway belum dikonfigurasi` | `WAROENGPAY_API_KEY` kosong | Isi env lalu redeploy |
| `Harga produk harus antara Rp1.000 - Rp10.000.000` | Batas nominal WaroengPay | Sesuaikan harga produk |
| Webhook `Alamat tujuan berada di jaringan privat` | `callback_url` localhost | Pakai domain publik |
| Webhook 401 `Invalid signature` | secret tidak cocok | Samakan `WAROENGPAY_WEBHOOK_SECRET` |
| Status tidak berubah setelah bayar | webhook gagal, polling belum jalan | Cek halaman tunggu / logs |
| Webhook masuk tapi transaksi tidak berubah | `payment_id` tidak cocok atau nominal beda | Cek log `Transaction not found` |
