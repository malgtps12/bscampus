# Setup WaroengPay Sandbox Testing

## 📋 Langkah-langkah Setup Sandbox

### 1. Login ke WaroengPay Dashboard
- Buka: https://waroengpay.com/dashboard
- Login dengan akun Anda

### 2. Generate Test API Key
1. Menu: **Integrasi & API** → **Kredensial**
2. Lihat section **"Mode Uji (Sandbox)"**
3. Klik **"Buat API Key Mode Uji"** atau copy test key yang sudah ada
4. Format: `wp_test_xxxxxxxxxxxxxxxxxxxxx`
5. **Copy dan simpan**

### 3. Generate Test Webhook Secret
1. Menu: **Integrasi & API** → **Webhook**
2. Tab: **"Mode Uji"**
3. Copy **Webhook Secret** (format: `whsec_test_xxxxxxxxxxxxx`)
4. **Copy dan simpan**

### 4. Update .env.local dengan Test Credentials
```env
# WaroengPay TEST MODE (Sandbox)
WAROENGPAY_API_KEY=wp_test_xxxxxxxxxxxxxxxxxxxxx
WAROENGPAY_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:8080
```

### 5. Restart Dev Server
```bash
npm run dev -- -p 8080
```

---

## ✅ Keuntungan Mode Test/Sandbox

- ✅ Tidak ada uang yang masuk
- ✅ QRIS menampilkan teks **"WAROENGPAY-TEST"** (tidak bisa dipayar aplikasi real)
- ✅ Halaman bayar menampilkan banner **"MODE UJI"** dengan tombol simulasi
- ✅ Webhook dikirim dengan `livemode: false`
- ✅ Unlimited transactions untuk testing

---

## 🧪 Testing Pembayaran di Sandbox

### Method 1: Simulasi via Dashboard WaroengPay

1. Buka payment di dashboard WaroengPay
2. Klik tombol **"Simulasi"**
3. Pilih **"Bayar"** untuk simulasi pembayaran sukses
4. Atau **"Kadaluarsa"** untuk simulasi timeout

### Method 2: Simulasi via API

```bash
# Simulasi pembayaran berhasil
curl -X POST https://waroengpay.com/api/payments/WRG-XXXXX/simulate \
  -H "Authorization: Bearer wp_test_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"action":"pay"}'

# Simulasi pembayaran kadaluarsa
curl -X POST https://waroengpay.com/api/payments/WRG-XXXXX/simulate \
  -H "Authorization: Bearer wp_test_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"action":"expire"}'
```

---

## 🔄 Perbedaan Live vs Test Mode

| Fitur | Live (wp_live_) | Test (wp_test_) |
|-------|-----------------|-----------------|
| Uang masuk | ✅ Real money | ❌ No money |
| QRIS | Real QRIS code | TEST (tidak dipayar) |
| Dashboard | Production data | Sandbox data |
| Webhook | Real transactions | Test transactions |
| Umur payment | 15 menit + 5 menit buffer | 15 menit + 5 menit buffer |

---

## 🚀 Testing Scenario di Sandbox

### Scenario 1: Pembayaran Sukses
1. Create payment via API
2. Simulate `pay` action
3. Webhook diterima: `payment.paid`
4. Status transaction berubah ke `paid`

### Scenario 2: Pembayaran Kadaluarsa
1. Create payment via API
2. Simulate `expire` action (atau tunggu 15+ menit)
3. Webhook diterima: `payment.expired`
4. Status transaction berubah ke `expired`

### Scenario 3: Multiple Payments
1. Create 10+ payments
2. Simulasi berbagai status
3. Test webhook retry mechanism
4. Verifikasi database transactions

---

## 📝 Contoh Test Credentials

Jika Anda belum punya test API key, hubungi WaroengPay support untuk mendapatkan credentials.

Atau gunakan **public sandbox credentials** (jika tersedia):
```env
WAROENGPAY_API_KEY=wp_test_public_sandbox_key
WAROENGPAY_WEBHOOK_SECRET=whsec_test_public_sandbox_secret
```

---

Setelah dapat test credentials, beritahu saya dan saya akan test checkout di sandbox! 🎉
