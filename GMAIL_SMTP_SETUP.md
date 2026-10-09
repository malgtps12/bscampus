# Setup Gmail SMTP untuk Reset Password BSCampus

## 📧 Cara Generate Gmail App Password

### Step 1: Aktifkan 2-Factor Authentication (2FA)

1. Buka https://myaccount.google.com/security
2. Scroll ke **"2-Step Verification"**
3. Klik **"Get started"** dan ikuti setup
4. Verifikasi dengan nomor HP Anda

**Penting:** App Password hanya bisa dibuat jika 2FA sudah aktif!

---

### Step 2: Generate App Password

1. Buka https://myaccount.google.com/apppasswords
2. Login dengan Gmail Anda
3. Di dropdown **"Select app"**, pilih **"Mail"**
4. Di dropdown **"Select device"**, pilih **"Other (Custom name)"**
5. Ketik nama: `BSCampus Reset Password`
6. Klik **"Generate"**
7. Copy **16 karakter** password yang muncul (contoh: `abcd efgh ijkl mnop`)

**Simpan baik-baik! Password ini hanya muncul sekali.**

---

### Step 3: Update .env.local

Ganti di file `.env.local`:

```env
# SMTP Configuration (untuk reset password email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-actual-email@gmail.com         # ← Ganti dengan Gmail Anda
SMTP_PASSWORD=abcdefghijklmnop                # ← Ganti dengan 16 karakter (tanpa spasi)
APP_NAME=BSCampus
```

**Contoh:**
```env
SMTP_USER=jamaluddin@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
```

---

### Step 4: Test Email

```bash
npm run dev
```

Buka: `http://localhost:3000/forgot-password`
- Input email user
- Cek inbox Gmail untuk kode 6 digit

---

## 🔧 Troubleshooting

### Error: "Invalid login"
- Pastikan 2FA sudah aktif
- Pastikan App Password 16 karakter (tanpa spasi)
- Jangan pakai password Gmail biasa

### Error: "Connection timeout"
- Cek firewall/antivirus
- Pastikan port 587 tidak diblok

### Email masuk Spam
- Normal untuk email pertama
- Cek folder Spam/Junk

---

## 🔐 Keamanan

- ✅ Jangan commit .env.local ke Git (sudah di .gitignore)
- ✅ Gunakan App Password, bukan password Gmail asli
- ✅ Revoke App Password jika tidak dipakai lagi

---

## 📝 Alternative: Gunakan Email Lain

Jika tidak ingin pakai Gmail, bisa pakai SMTP provider lain:

### Mailtrap (Development Only)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
```

### SendGrid SMTP
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

---

## ✅ Setelah Setup

1. Update `.env.local` dengan credentials Gmail
2. Restart dev server: `npm run dev`
3. Test di `/forgot-password`
4. Kode 6 digit akan terkirim ke email!
