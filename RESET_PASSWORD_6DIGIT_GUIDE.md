# Fitur Reset Password 6-Digit dengan MongoDB + Nodemailer

## 📦 Package yang Harus Di-install

```bash
# MongoDB & Mongoose
npm install mongoose

# Email dengan Nodemailer
npm install nodemailer
npm install @types/nodemailer --save-dev

# Rate Limiting
npm install rate-limiter-flexible

# Sudah ada di project:
# - bcryptjs (untuk password hashing)
```

---

## 📁 Struktur File

```
bscampus/
├── models/
│   ├── User.ts                 # Model user MongoDB
│   └── ResetPassword.ts        # Model kode reset dengan TTL
├── lib/
│   ├── mongodb.ts              # Koneksi MongoDB
│   ├── reset-password-helper.ts # Helper generate & verify kode
│   └── email-service.ts        # Nodemailer service
├── services/
│   └── reset-password-service.ts # Business logic & rate limiting
├── app/
│   ├── api/auth/forgot-password/secure-route.ts  # POST kirim kode
│   ├── api/auth/reset-password/secure-route.ts   # POST reset password
│   └── auth/secure-forgot-password/page.tsx      # Frontend React
```

---

## ⚙️ Setup Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bscampus

# SMTP untuk Nodemailer (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Gmail App Password:
1. Buka https://myaccount.google.com/apppasswords
2. Generate App Password baru
3. Copy 16 karakter sebagai SMTP_PASSWORD

---

## 🚀 Endpoint 1: POST /api/auth/forgot-password

### Request (cURL):
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@student.pnl.ac.id"}'
```

### Response Success (selalu sama untuk keamanan):
```json
{
  "success": true,
  "message": "Jika email terdaftar, kode reset akan dikirim ke email Anda."
}
```

### Response Rate Limit (429):
```json
{
  "error": "Terlalu banyak permintaan. Silakan coba lagi nanti."
}
```

---

## 🔐 Endpoint 2: POST /api/auth/reset-password

### Request (cURL):
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@student.pnl.ac.id",
    "code": "123456",
    "newPassword": "passwordbaru123",
    "confirmPassword": "passwordbaru123"
  }'
```

### Response Success:
```json
{
  "success": true,
  "message": "Password berhasil direset. Silakan login dengan password baru."
}
```

### Response Error (contoh):
```json
{
  "error": "Kode tidak valid"
}
```

---

## 📋 Penjelasan Tiap Langkah

### 1. **Generate Kode (crypto.randomInt)**
- Menggunakan `crypto.randomInt(0, 1000000)` untuk keamanan cryptographic
- Padding nol: `"123"` → `"000123"` (selalu 6 digit)
- Bukan Math.random() yang predictable

### 2. **Hash Kode (bcrypt)**
- Kode asli tidak disimpan di database
- Hash dengan bcrypt salt rounds 10
- Verifikasi dengan bcrypt.compare()

### 3. **TTL Index (10 menit)**
- MongoDB otomatis hapus document setelah 600 detik
- `expires: 600` di schema + `expireAfterSeconds: 600`
- Tidak perlu cron job manual

### 4. **Batas 5x Percobaan**
- Setiap kode salah → attempts +1
- Attempts >= 5 → kode dihapus
- User harus minta kode baru

### 5. **One-time Use**
- Kode dihapus setelah password berhasil direset
- Tidak bisa reuse kode yang sama

### 6. **Replace Kode Lama**
- Request kode baru → delete kode lama untuk email tersebut
- Hanya 1 kode aktif per email (unique index)

### 7. **Rate Limiting**
- 5 requests per 15 menit per IP
- Untuk kedua endpoint (forgot & reset)
- Response 429 dengan Retry-After header

### 8. **Anti User Enumeration**
- Response forgot-password selalu sama
- Tidak bocorkan apakah email terdaftar atau tidak
- Attacker tidak bisa brute force cek email

### 9. **Validasi Input**
- Kode: regex `/^\d{6}$/` (harus 6 digit angka)
- Password: min 8 karakter
- Email: regex validasi format

### 10. **Password Hashing**
- Password baru di-hash dengan bcrypt (salt 10)
- Tidak disimpan plain text

---

## 🧪 Testing

```bash
# 1. Jalankan dev server
npm run dev

# 2. Buka halaman
http://localhost:3000/auth/secure-forgot-password

# 3. Test flow:
# - Input email → kirim kode
# - Cek email untuk kode 6 digit
# - Input kode + password baru
# - Login dengan password baru
```

---

## 🔒 Keamanan Checklist

- ✅ crypto.randomInt (bukan Math.random)
- ✅ Padding nol (selalu 6 digit)
- ✅ Bcrypt hash kode
- ✅ TTL 10 menit
- ✅ Max 5 attempts
- ✅ One-time use
- ✅ Replace old code
- ✅ Rate limiting
- ✅ Anti-enumeration response
- ✅ Validasi 6 digit + min 8 char
- ✅ Bcrypt password
