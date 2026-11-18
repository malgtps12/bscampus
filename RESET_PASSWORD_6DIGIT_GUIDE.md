# Reset Password 6 Digit (Supabase RPC + Brevo)

Alur lupa password tidak bergantung pada email Supabase Auth. Aplikasi
membuat kode 6 digit lewat RPC, mengirimnya dengan Brevo, lalu memverifikasi
kode di database. Tidak ada `SUPABASE_SERVICE_ROLE_KEY` yang dipakai.

## Migration yang wajib dijalankan

1. `migrations/001_add_password_reset.sql` — tabel `password_reset_codes`.
2. `migrations/007_password_reset_rpc.sql` — RPC buat/verifikasi kode, RLS,
   pencabutan akses langsung ke tabel, dan penghapusan unique index email.

Jalankan keduanya di Supabase SQL Editor sebelum deploy.

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
BREVO_API_KEY=xkeysib-xxxxxxxx
BREVO_FROM_EMAIL=BSCampus <no-reply@domain-anda.com>
```

`BREVO_API_KEY` wajib. Tanpa itu, `POST /api/auth/forgot-password` mengembalikan
error 500 dan kode tidak dikirim.

## Alur UI

`/forgot-password` dua langkah:

1. Input email → `POST /api/auth/forgot-password`.
2. Input kode 6 digit + password baru + konfirmasi →
   `POST /api/auth/reset-password`. Tersedia tombol **Kirim ulang kode**.

## Endpoint

### `POST /api/auth/forgot-password`

Request:

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@student.pnl.ac.id"}'
```

Respons selalu generik untuk email terdaftar maupun tidak:

```json
{
  "success": true,
  "message": "Jika email terdaftar, kode reset akan dikirim ke email Anda."
}
```

Rate limit aplikasi: 5 request / 15 menit / IP (429 + `Retry-After`).
Database juga membatasi 5 kode / 15 menit / email.

### `POST /api/auth/reset-password`

Request:

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

Respons sukses:

```json
{
  "success": true,
  "message": "Password berhasil diganti. Silakan login dengan password baru."
}
```

Error kode sengaja seragam:

```json
{ "error": "Kode tidak valid atau sudah kadaluarsa. Minta kode baru." }
```

## Detail keamanan

- `create_password_reset_code(p_email)` membuat kode dengan
  `gen_random_bytes(4)` (bukan `random()`), lalu menyimpan
  `crypt(kode, gen_salt('bf', 10))`. Kode plaintext hanya dikembalikan sekali
  ke aplikasi untuk dikirim via email.
- `reset_password_with_code(email, kode, password)` memverifikasi kode dengan
  `crypt()`, memeriksa `expires_at` (10 menit) dan `attempts` (maksimal 5),
  lalu menulis `auth.users.encrypted_password` dan `users.password_hash`.
- Kode ditandai `used = TRUE` setelah sukses, sehingga tidak bisa dipakai ulang.
- Kode yang lebih lama otomatis kalah karena query mengambil baris terbaru.
- Tabel `password_reset_codes` memiliki RLS dan tidak punya policy; akses
  langsung dari klien dicabut. Semua operasi lewat fungsi `SECURITY DEFINER`.
- Password dibatasi 8–72 karakter agar hash bcrypt di Auth dan di `users`
  identik.
- Response forgot-password tidak membocorkan apakah email terdaftar.

## Ganti password dari akun

`POST /api/auth/change-password` menerima hanya:

```json
{
  "oldPassword": "passwordlama",
  "newPassword": "passwordbaru",
  "confirmPassword": "passwordbaru"
}
```

Endpoint ini hanya untuk user yang sudah login. Password lama diverifikasi
dengan `signInWithPassword`, lalu password baru disimpan dengan
`auth.updateUser({ password })` dan `users.password_hash` ikut disinkronkan.

## Testing manual

1. `npm run dev`.
2. Buka `http://localhost:3000/forgot-password`.
3. Masukkan email terdaftar, cek inbox Brevo untuk kode 6 digit.
4. Masukkan kode + password baru + konfirmasi, lalu login dengan password baru.
5. Login, buka `/profile`, coba Ubah Password dengan password lama/baru/konfirmasi.
