# BSCampus - Email Configuration Guide

## Email Services Setup

BSCampus mendukung 2 email service providers: **Resend** dan **SendGrid**.

---

## Option 1: Resend (Recommended)

### Keuntungan Resend:
- Setup mudah dan cepat
- Free tier: 100 emails/hari, 3,000 emails/bulan
- API sederhana
- Domain verification opsional untuk development

### Setup Resend:

1. **Daftar akun di Resend**
   - Kunjungi: https://resend.com/signup
   - Daftar dengan email atau GitHub

2. **Dapatkan API Key**
   - Login ke dashboard: https://resend.com/api-keys
   - Klik "Create API Key"
   - Berikan nama (contoh: "BSCampus Production")
   - Copy API key yang dihasilkan

3. **Konfigurasi di `.env.local`**
   ```env
   EMAIL_SERVICE=resend
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```
   
   **Note:** Untuk testing gunakan `onboarding@resend.dev`. Untuk production, verify domain Anda.

4. **Verify Domain (Production)**
   - Dashboard → Domains → Add Domain
   - Masukkan domain Anda (contoh: `bscampus.com`)
   - Tambahkan DNS records yang diberikan
   - Setelah verified, ubah `RESEND_FROM_EMAIL=no-reply@bscampus.com`

---

## Option 2: SendGrid

### Keuntungan SendGrid:
- Free tier: 100 emails/hari selamanya
- Reliability tinggi
- Advanced features (analytics, templates)

### Setup SendGrid:

1. **Daftar akun di SendGrid**
   - Kunjungi: https://signup.sendgrid.com/
   - Lengkapi data registrasi
   - Verify email Anda

2. **Dapatkan API Key**
   - Login ke dashboard: https://app.sendgrid.com/
   - Settings → API Keys
   - Klik "Create API Key"
   - Pilih "Restricted Access" → centang "Mail Send" → Full Access
   - Copy API key (hanya muncul sekali!)

3. **Verify Sender Identity**
   - Settings → Sender Authentication
   - Pilih "Single Sender Verification"
   - Masukkan email dan detail
   - Cek email dan klik link verifikasi

4. **Konfigurasi di `.env.local`**
   ```env
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=your-verified-email@gmail.com
   ```

5. **Domain Authentication (Production)**
   - Settings → Sender Authentication → Domain Authentication
   - Ikuti wizard untuk verify domain
   - Tambahkan CNAME records ke DNS
   - Setelah verified, gunakan `no-reply@yourdomain.com`

---

## Testing

### Development Mode (Tanpa Email Service)
Jika tidak ada API key di `.env.local`, email akan di-log ke console:

```bash
npm run dev
```

Test forgot password → cek console untuk kode 4 digit.

### Testing dengan Email Service

1. Install dependencies:
   ```bash
   npm install
   ```

2. Jalankan aplikasi:
   ```bash
   npm run dev
   ```

3. Test forgot password:
   - Buka: http://localhost:3000/forgot-password
   - Masukkan email terdaftar
   - Cek inbox untuk kode verifikasi

---

## Environment Variables Reference

```env
# Choose email service: "resend" or "sendgrid"
EMAIL_SERVICE=resend

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=verified-email@example.com
```

---

## Troubleshooting

### Email tidak terkirim
1. Cek console untuk error log
2. Pastikan API key benar
3. Pastikan `EMAIL_SERVICE` sesuai dengan provider yang digunakan
4. Untuk SendGrid, pastikan sender email sudah verified

### Email masuk spam
1. Verify domain Anda
2. Setup SPF, DKIM, dan DMARC records
3. Hindari spam words di subject/content
4. Gunakan plain text + HTML template

### Rate limit exceeded
- Resend: 100 emails/hari (free tier)
- SendGrid: 100 emails/hari (free tier)
- Upgrade plan jika butuh lebih banyak

---

## Production Checklist

- [ ] Verify domain di email provider
- [ ] Setup DNS records (SPF, DKIM, DMARC)
- [ ] Ganti `from` email dengan domain sendiri
- [ ] Test email di berbagai provider (Gmail, Outlook, Yahoo)
- [ ] Monitor email delivery rate
- [ ] Setup error logging dan alerting

---

## Resources

- Resend Docs: https://resend.com/docs
- SendGrid Docs: https://docs.sendgrid.com/
- Email Template Testing: https://www.mail-tester.com/
