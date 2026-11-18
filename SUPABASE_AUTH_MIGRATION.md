# Migrasi Login ke Supabase Auth

Dokumen ini menjelaskan perubahan autentikasi user dan langkah operasionalnya.

## Prinsip utama

- `public.users.id` **tidak diubah** dan tetap primary key. Semua tabel lain
  (`products`, `transactions`, `wishlists`, `reviews`, `messages`, dll.)
  tetap merujuk ke ID ini.
- Supabase Auth hanya menambah kolom `public.users.auth_user_id` sebagai
  penghubung: `auth.users.id` → `users.auth_user_id` → `users.id`.
- Aplikasi tidak menyimpan atau memakai `SUPABASE_SERVICE_ROLE_KEY`.
  Hanya URL dan publishable key yang dipakai, baik di server maupun browser.
- Login admin tetap memakai `ADMIN_USERNAME`/`ADMIN_PASSWORD` dan cookie
  `admin_token` (JWT lama).

## Alur identitas

```
Browser (cookie session Supabase Auth)
        ↓  auth.getClaims().claims.sub
   auth.users.id
        ↓  users.auth_user_id
   public.users.id   ← dipakai seluruh aplikasi
```

`lib/dal.ts` melakukan pemetaan ini lewat `getCurrentUser()`. Semua route user
memanggil fungsi tersebut, bukan lagi `verifyJWT(cookie user_token)`.

## Perubahan endpoint

| Endpoint | Perubahan |
| --- | --- |
| `POST /api/auth/user-login` | Terima NIM, cari email, panggil `supabase.auth.signInWithPassword`. Tidak lagi membandingkan bcrypt. |
| `POST /api/auth/register` | `supabase.auth.signUp` dengan metadata `name`, `student_id`, `phone`, `campus`. Baris `users` dibuat trigger DB. |
| `POST /api/auth/forgot-password` | Buat kode 6 digit via RPC `create_password_reset_code`, kirim via Resend. Tidak memakai email Supabase Auth. |
| `POST /api/auth/reset-password` | Panggil RPC `reset_password_with_code` untuk verifikasi kode + update `auth.users` tanpa service role key. |
| `POST /api/auth/change-password` | Baru. User login mengirim password lama, password baru, konfirmasi; verifikasi via `signInWithPassword` lalu `auth.updateUser`. |
| `GET /auth/callback` | Tukar `code` menjadi session cookie (tetap dipakai verifikasi email registrasi). |
| `GET /api/auth/me` | Baca session Auth lalu petakan ke `public.users`. |
| `POST /api/auth/logout` | `auth.signOut()` + bersihkan cookie lama. |
| `POST /api/uploads/product-images` | Baru. Hanya user login; path `products/<public.users.id>/...`. |

Halaman `/forgot-password` kini dua langkah: email → kode 6 digit + password
baru + konfirmasi. Halaman `/auth/update-password` hanya me-redirect ke
`/forgot-password` untuk bookmark/link lama. Form **Ubah Password** di
`/profile` hanya meminta password lama, password baru, dan konfirmasi password
baru.

## Langkah deploy

1. Backup database.
2. Jalankan migrasi lama jika belum: `lib/schema.sql`, `migrations/001..005`.
3. Jalankan `migrations/006_supabase_auth.sql`.
4. Jalankan `migrations/007_password_reset_rpc.sql` (**wajib** sebelum deploy
   fitur lupa/ganti password). Migration ini membuat RPC reset, mengaktifkan
   RLS pada `password_reset_codes`, dan mencabut akses langsung tabel dari
   `anon`/`authenticated`.
5. Di Supabase Dashboard → Authentication → Providers, aktifkan **Email**.
6. Di Authentication → URL Configuration, tambahkan redirect URL:
   ```
   https://<domain-anda>/auth/callback
   ```
7. Isi env berikut di Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`
   - `WAROENGPAY_API_KEY`, `WAROENGPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
8. Deploy, lalu uji registrasi user baru dan login.
9. Uji login salah satu user lama dengan password lamanya.

## Catatan user lama (tanpa reset password)

Migration 006 membuat akun `auth.users` untuk setiap baris `users` yang belum
terhubung. Jika `users.password_hash` berupa bcrypt valid
(`$2a$`/`$2b$`/`$2y$`, cost 04–31), hash tersebut **disalin apa adanya** ke
`auth.users.encrypted_password`. Supabase Auth memakai bcrypt yang kompatibel,
jadi user langsung login dengan password lama — tidak perlu "Lupa password".

Hanya akun dengan hash kosong/rusak yang mendapat password acak; akun tersebut
memang perlu reset sekali. Email ditandai terverifikasi agar alur reset langsung
bekerja.

### Jika 006 sudah terlanjur dijalankan versi lama

Jalankan `migrations/006b_import_legacy_passwords.sql` **sebelum ada user yang
reset password**. Script ini hanya menyentuh akun yang belum pernah login dan
belum mengubah `updated_at`, sehingga tidak akan menimpa password baru hasil
reset.

Kolom `password_hash` tetap disinkronkan untuk audit/rollback, tetapi sumber
kebenaran login adalah `auth.users.encrypted_password`.

## Reset password realtime (kode via email)

- `POST /api/auth/forgot-password` memanggil RPC `create_password_reset_code`.
  Kode 6 digit dibuat di database dengan `gen_random_bytes`, di-hash dengan
  bcrypt (`pgcrypto`), lalu dikembalikan sekali ke aplikasi untuk dikirim via
  Resend. Kode berlaku 10 menit dan maksimal 5 kali salah.
- Tabel `password_reset_codes` sudah dienkripsi RLS dan akses langsungnya
  dicabut dari `anon`/`authenticated`. Klien hanya bisa memanggil RPC yang
  sudah dibatasi (maksimal 5 kode per email per 15 menit).
- `POST /api/auth/reset-password` memanggil RPC `reset_password_with_code`.
  RPC memverifikasi kode, memperbarui `auth.users.encrypted_password`,
  menyinkronkan `users.password_hash`, lalu menandai kode `used = TRUE`.
- Semua error kode sengaja seragam: `Kode tidak valid atau sudah kadaluarsa.
  Minta kode baru.` supaya tidak membocorkan keberadaan email.
- `RESEND_API_KEY` wajib diisi. Tanpa itu endpoint forgot-password mengembalikan
  error 500 dan kode tidak dikirim.
- Ganti password dari `/profile` memakai `POST /api/auth/change-password`:
  password lama diverifikasi `signInWithPassword`, password baru disimpan
  `auth.updateUser`, lalu `users.password_hash` disinkronkan.

## Keamanan upload

- Upload dipindah dari browser langsung ke Storage menjadi
  `POST /api/uploads/product-images`.
- Server memverifikasi session Auth dan mengambil `public.users.id` dari DAL.
- Storage policy hanya mengizinkan insert/update/delete pada
  `product-images/products/<id-pemilik>/...`.
- File dibatasi maksimal 5 file, 5 MB per file, dan ekstensi gambar umum.

## Rollback

Jika perlu kembali ke sistem lama:

1. Kembalikan kode auth/upload dari git sebelum commit migrasi ini.
2. Kolom `auth_user_id` boleh dibiarkan (nullable) atau dihapus dengan:
   ```sql
   ALTER TABLE public.users DROP COLUMN IF EXISTS auth_user_id;
   ```
3. Hapus policy storage dan trigger `on_auth_user_created` bila diperlukan.
4. Hash password lama masih tersimpan di `users.password_hash` untuk akun lama,
   tetapi akun yang sudah reset memakai password baru di Supabase Auth.
