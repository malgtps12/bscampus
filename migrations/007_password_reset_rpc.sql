-- ============================================================
-- 007_password_reset_rpc.sql
-- Reset password realtime memakai kode 6 digit yang dikirim aplikasi (Resend).
-- ============================================================
-- Aplikasi hanya memakai publishable key, jadi semua operasi sensitif
-- dibungkus fungsi SECURITY DEFINER. Tabel password_reset_codes tidak
-- boleh dibaca/ditulis langsung oleh role anon/authenticated.
--
-- Jalankan migration 001_add_password_reset.sql lebih dulu.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 001 membuat unique index pada email. Kita perlu menyimpan riwayat singkat
-- untuk rate limit per email, jadi index diubah jadi non-unik. Baris terbaru
-- yang dipakai reset (ORDER BY created_at DESC, id DESC).
DROP INDEX IF EXISTS public.idx_password_reset_codes_email;
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email
  ON public.password_reset_codes (email);

-- Tidak ada policy = tidak ada akses langsung dari klien. RPC di bawah
-- berjalan sebagai owner (postgres) sehingga tetap bisa mengakses tabel.
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.password_reset_codes FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------
-- Buat kode. Kode dibuat di database memakai gen_random_bytes,
-- di-hash dengan pgcrypto/bcrypt, lalu dikembalikan ke aplikasi
-- untuk dikirim via Resend. Tidak ada hash yang dikirim ke klien.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_password_reset_code(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email TEXT := lower(trim(p_email));
  v_user_id UUID;
  v_recent INTEGER;
  v_code TEXT;
  v_code_hash TEXT;
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_user_id FROM public.users WHERE lower(email) = v_email;
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Maksimal 5 kode per email dalam 15 menit, sama dengan rate limiter
  -- aplikasi per IP. Termasuk panggilan langsung ke RPC.

  SELECT count(*) INTO v_recent
  FROM public.password_reset_codes
  WHERE lower(email) = v_email
    AND created_at > now() - interval '15 minutes';

  IF v_recent >= 5 THEN
    RETURN NULL;
  END IF;

  -- Bersihkan baris sangat lama supaya tabel tidak tumbuh terus.
  DELETE FROM public.password_reset_codes
  WHERE created_at < now() - interval '1 day';

  v_code := lpad(
    (
      (('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 1000000
    )::text,
    6,
    '0'
  );
  v_code_hash := crypt(v_code, gen_salt('bf', 10));

  INSERT INTO public.password_reset_codes
    (user_id, email, code_hash, attempts, expires_at, used)
  VALUES
    (v_user_id, v_email, v_code_hash, 0, now() + interval '10 minutes', FALSE);

  RETURN v_code;
END;
$$;

-- ------------------------------------------------------------
-- Verifikasi kode + ganti password.
-- Pesan error sengaja seragam supaya tidak membocorkan apakah email
-- terdaftar atau kode yang dimasukkan salah.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_password_with_code(
  p_email TEXT,
  p_code TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email TEXT := lower(trim(p_email));
  v_record public.password_reset_codes%ROWTYPE;
  v_user_id UUID;
  v_auth_user_id UUID;
  v_new_hash TEXT;
  v_error TEXT := 'Kode tidak valid atau sudah kadaluarsa. Minta kode baru.';
BEGIN
  IF v_email IS NULL OR v_email = '' OR p_code IS NULL OR p_new_password IS NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'Semua field harus diisi');
  END IF;

  IF length(p_new_password) < 8 THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'Password minimal 8 karakter');
  END IF;

  -- bcrypt hanya memakai 72 byte pertama; tolak password lebih panjang supaya
  -- hash di Auth dan di users.password_hash tidak berbeda.
  IF length(p_new_password) > 72 THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'Password maksimal 72 karakter');
  END IF;

  IF p_code !~ '^[0-9]{6}$' THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', v_error);
  END IF;

  SELECT *
    INTO v_record
  FROM public.password_reset_codes
  WHERE lower(email) = v_email
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF NOT FOUND OR v_record.used OR v_record.attempts >= 5
     OR v_record.expires_at < now() THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', v_error);
  END IF;

  -- pgcrypto bisa memverifikasi hash bcrypt dengan crypt(kode, hash_lama).
  IF crypt(p_code, v_record.code_hash) <> v_record.code_hash THEN
    UPDATE public.password_reset_codes
       SET attempts = attempts + 1
     WHERE id = v_record.id;
    RETURN jsonb_build_object('ok', FALSE, 'error', v_error);
  END IF;

  SELECT id, auth_user_id
    INTO v_user_id, v_auth_user_id
  FROM public.users
  WHERE lower(email) = v_email;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', v_error);
  END IF;

  v_new_hash := crypt(p_new_password, gen_salt('bf', 10));

  -- Sumber kebenaran password adalah Supabase Auth.
  IF v_auth_user_id IS NOT NULL THEN
    UPDATE auth.users
       SET encrypted_password = v_new_hash,
           updated_at = now()
     WHERE id = v_auth_user_id;
  END IF;

  -- Ikut disinkronkan untuk rollback/audit.
  UPDATE public.users
     SET password_hash = v_new_hash
   WHERE id = v_user_id;

  -- Kode sekali pakai. Baris lama sengaja disimpan sebentar untuk rate limit.
  UPDATE public.password_reset_codes
     SET used = TRUE
   WHERE id = v_record.id;

  RETURN jsonb_build_object('ok', TRUE, 'message', 'Password berhasil diganti');
END;
$$;

REVOKE ALL ON FUNCTION public.create_password_reset_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_password_reset_code(TEXT) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.reset_password_with_code(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_password_with_code(TEXT, TEXT, TEXT) TO anon, authenticated;
