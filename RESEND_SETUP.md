# Setup Resend untuk BSCampus

BSCampus menggunakan **Resend** sebagai email service provider untuk mengirim email transaksional.

## Kenapa Resend?

- **Developer-friendly** - API simple dan modern
- **Reliable** - Deliverability rate tinggi
- **Vercel-optimized** - Deploy seamless di Vercel
- **Free tier** - 100 emails/day gratis untuk testing
- **No SMTP hassle** - Tidak perlu konfigurasi SMTP rumit

## Setup Steps

### 1. Buat Akun Resend

1. Buka https://resend.com
2. Sign up dengan GitHub atau email
3. Verifikasi akun Anda

### 2. Dapatkan API Key

1. Login ke Resend dashboard
2. Buka **API Keys** di sidebar
3. Click **Create API Key**
4. Beri nama: `BSCampus Production` atau `BSCampus Development`
5. Copy API key yang dihasilkan

### 3. Verifikasi Domain (Production)

**Untuk testing/development**: Skip langkah ini, pakai default sender.

**Untuk production**:
1. Buka **Domains** di Resend dashboard
2. Click **Add Domain**
3. Masukkan domain Anda (misal: `bscampus.com`)
4. Tambahkan DNS records yang diberikan ke DNS provider Anda:
   - SPF record
   - DKIM record
   - DMARC record (optional)
5. Tunggu verifikasi (biasanya 15 menit - 24 jam)

### 4. Konfigurasi Environment Variables

Tambahkan ke `.env.local`:

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Development**: Gunakan `onboarding@resend.dev` sebagai `RESEND_FROM_EMAIL`

**Production**: Gunakan domain yang sudah diverifikasi

### 5. Deploy ke Vercel

1. Buka Vercel dashboard
2. Pilih project BSCampus
3. Go to **Settings** → **Environment Variables**
4. Tambahkan:
   - `RESEND_API_KEY` = (paste API key)
   - `RESEND_FROM_EMAIL` = `noreply@yourdomain.com`
5. Redeploy aplikasi

## Testing

### Test di Development

```bash
# Jalankan dev server
npm run dev

# Test forgot password endpoint
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Cek console log untuk melihat reset code (development mode).

### Test di Production

1. Buka `/forgot-password` di browser
2. Masukkan email yang terdaftar
3. Cek inbox email untuk reset code
4. Jika tidak menerima email:
   - Cek spam folder
   - Cek Resend dashboard → Logs untuk melihat status email
   - Verifikasi API key dan domain

## Email Templates

BSCampus mengirim 1 jenis email:

### 1. Reset Password Email
- **Template**: `lib/email.ts` → `sendResetCodeEmail()`
- **Trigger**: User request forgot password
- **Contains**: 6-digit reset code (10 menit validity)

## Troubleshooting

### Email tidak terkirim

1. **Cek API Key**:
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Cek Resend Logs**:
   - Login ke Resend dashboard
   - Buka **Logs**
   - Lihat failed emails dan error message

3. **Domain belum verified**:
   - Pastikan DNS records sudah ditambahkan
   - Tunggu propagasi DNS (sampai 24 jam)

4. **Rate limit exceeded**:
   - Free tier: 100 emails/day
   - Upgrade plan jika perlu lebih

### Email masuk spam

1. Verifikasi domain dengan SPF/DKIM
2. Tambahkan DMARC policy
3. Warm up domain (kirim email secara bertahap)
4. Avoid spam trigger words di subject/body

## Rate Limits

| Plan | Daily Limit | Monthly Limit |
|------|------------|---------------|
| Free | 100 | 3,000 |
| Pro | 50,000 | 100,000 |
| Scale | Custom | Custom |

## Support

- **Resend Docs**: https://resend.com/docs
- **Resend Discord**: https://resend.com/discord
- **Email Support**: support@resend.com

## Migration Notes

Project ini sebelumnya support multiple email providers (SendGrid, Nodemailer). 

Sudah disederhanakan ke **Resend only** untuk:
- Simplicity
- Better Vercel integration
- Lower maintenance
- Cost-effective

Old files removed:
- `lib/email-service.ts` (Nodemailer)
- `lib/email-sendgrid.ts` (SendGrid)
- `lib/email-resend.ts` (merged ke `lib/email.ts`)
