# WaroengPay Integration Guide

BSCampus mengintegrasikan WaroengPay sebagai payment gateway untuk QRIS dinamis.

## Setup

### 1. Daftar WaroengPay
- Kunjungi: https://waroengpay.com
- Daftar akun merchant
- Verifikasi email dan data bisnis
- Login ke dashboard

### 2. Ambil API Key dan Webhook Secret

#### API Key
1. Dashboard → Integrasi & API → Kredensial
2. Klik "Tampilkan API Key" atau buat key baru
3. Copy API key (format: `wp_live_...`)
4. Simpan di `.env.local`:
   ```env
   WAROENGPAY_API_KEY=wp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

#### Webhook Secret
1. Dashboard → Integrasi & API → Webhook
2. Masukkan password akun untuk tampilkan secret
3. Copy webhook secret (format: `whsec_live_...`)
4. Simpan di `.env.local`:
   ```env
   WAROENGPAY_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 3. Setup Webhook URL
1. Dashboard → Integrasi & API → Webhook
2. Atur URL webhook:
   ```
   https://yourdomain.com/api/waroengpay/webhook
   ```
   (Development: gunakan `ngrok` atau tunnel service lain)

3. Port yang didukung: 80, 443, 8080, 8443

### 4. Update .env.local
```env
# WaroengPay Configuration
WAROENGPAY_API_KEY=wp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WAROENGPAY_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Fitur

### Membuat Pembayaran
- Pembeli membeli produk
- Sistem membuat tagihan QRIS via WaroengPay API
- Pembeli scan QR atau klik link bayar
- Pembayaran diproses via bank/e-wallet

### Status Pembayaran
1. `pending` - Menunggu pembayaran
2. `paid` - Pembayaran sukses (webhook diterima)
3. `expired` - Tagihan kadaluarsa (15 menit + 5 menit masa tenggang)
4. `cancelled` - Pembayaran dibatalkan

### Nominal Pembayaran
- Minimum: Rp1.000
- Maksimum: Rp10.000.000
- Kode unik otomatis ditambahkan (Rp100-Rp250 default)
- Contoh: Rp50.000 → Rp50.137 (dengan kode unik Rp137)

### Webhook
Sistem secara otomatis menerima notifikasi pembayaran:
- `payment.paid` - Pembayaran berhasil
- `payment.expired` - Tagihan kadaluarsa
- `payment.cancelled` - Pembayaran dibatalkan

Setiap webhook diverifikasi dengan HMAC-SHA256.

## Testing (Mode Uji/Sandbox)

### 1. Buat Test API Key
1. Dashboard → Integrasi & API → Kredensial
2. Klik "Buat API Key Mode Uji"
3. Copy key (format: `wp_test_...`)
4. Simpan untuk testing saja

### 2. Setup Test Webhook Secret
1. Dashboard → Integrasi & API → Webhook
2. Tab "Mode Uji"
3. Copy webhook secret (format: `whsec_test_...`)

### 3. Testing di Development
```bash
# .env.local
WAROENGPAY_API_KEY=wp_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WAROENGPAY_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Simulasi Pembayaran
API WaroengPay menyediakan endpoint untuk simulasi:
```bash
POST /api/payments/:id/simulate
Authorization: Bearer wp_test_...
Content-Type: application/json

{"action":"pay"}  # Simulasi pembayaran berhasil
{"action":"expire"}  # Simulasi pembayaran kadaluarsa
```

Mode uji (`livemode: false`):
- Tidak ada uang yang masuk
- QRIS menampilkan teks `WAROENGPAY-TEST` (tidak bisa dipayar aplikasi real)
- Halaman bayar menampilkan banner "MODE UJI" dengan tombol simulasi
- Webhook dikirim dengan `livemode: false`

## API Endpoints

### Create Payment
```
POST /api/waroengpay
```

Request:
```json
{
  "amount": 50000,
  "productId": "product-uuid",
  "productName": "Laptop ASUS",
  "userId": "buyer-uuid",
  "buyerId": "buyer-uuid"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "WRG-7K2M9QX4BD1PZ",
    "reference": "INV-xxxxx",
    "pay_url": "https://waroengpay.com/pay/WRG-7K2M9QX4BD1PZ",
    "qris": "000201010212265...",
    "amount": 50137,
    "expires_at": "2026-09-24T03:15:00.000Z"
  }
}
```

### Get Payments
```
GET /api/waroengpay?status=paid&limit=50
```

### Webhook
```
POST /api/waroengpay/webhook
```

Automatically receives:
- `payment.paid`
- `payment.expired`
- `payment.cancelled`

## Troubleshooting

### Webhook tidak masuk
1. Verifikasi URL webhook di dashboard (harus HTTPS atau tunnel)
2. Pastikan port 443 terbuka
3. Cek logs server untuk error
4. Gunakan dashboard WaroengPay → Integrasi & API → Webhook → "Pengiriman terakhir" untuk lihat riwayat

### Payment tidak terdeteksi
1. Cek status payment di dashboard WaroengPay
2. Verify nominal pembayaran = nominal tagihan (termasuk kode unik)
3. Pastikan webhook secret benar di .env.local
4. Debug: cek transaction di database, payment_id harus cocok

### Test API Key Error 403
- Pastikan menggunakan `wp_test_` untuk test
- Jangan campur test dan live key
- Test key hanya bisa membaca tagihan test

## Dokumentasi Lengkap

- WaroengPay Dashboard: https://waroengpay.com/dashboard
- API Docs: https://waroengpay.com/docs.md
- Interaktif: https://waroengpay.com/dashboard#integrasi

## Support

Hubungi WaroengPay support:
- Email: support@waroengpay.com
- WhatsApp: (lihat di dashboard)
- Chat: Dashboard → Support
