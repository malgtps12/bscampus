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
| `POST /api/auth/forgot-password` | `auth.resetPasswordForEmail` dengan `redirectTo /auth/callback?next=/auth/update-password`. |
| `GET /auth/callback` | Tukar `code` menjadi session cookie. |
| `POST /api/auth/reset-password` | `auth.updateUser({ password })` untuk session recovery. |
| `GET /api/auth/me` | Baca session Auth lalu petakan ke `public.users`. |
| `POST /api/auth/logout` | `auth.signOut()` + bersihkan cookie lama. |
| `POST /api/uploads/product-images` | Baru. Hanya user login; path `products/<public.users.id>/...`. |

Halaman baru: `/auth/update-password`. Halaman `/forgot-password` kini
satu langkah (kirim tautan, bukan kode 6 digit).

## Langkah deploy

1. Backup database.
2. Jalankan migrasi lama jika belum: `lib/schema.sql`, `migrations/001..005`.
3. Jalankan `migrations/006_supabase_auth.sql`.
4. Di Supabase Dashboard → Authentication → Providers, aktifkan **Email**.
5. Di Authentication → URL Configuration, tambahkan redirect URL:
   ```
   https://<domain-anda>/auth/callback
   ```
6. Isi env berikut di Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`
   - `WAROENGPAY_API_KEY`, `WAROENGPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
7. Deploy, lalu uji registrasi user baru dan login.
8. Uji login salah satu user lama dengan password lamanya.

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

Kolom lama `password_hash`, `password_reset_codes`, dan service reset lama
dibiarkan untuk audit/rollback, tetapi tidak lagi dipakai alur Auth baru.

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
