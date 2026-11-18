-- ============================================================
-- 006_supabase_auth.sql
-- Migrasi login ke Supabase Auth TANPA mengganti public.users.id.
-- ============================================================
-- Strategi:
--   1. Tambah public.users.auth_user_id sebagai penghubung ke auth.users.
--      public.users.id tetap PRIMARY KEY dan dipakai semua tabel relasi.
--   2. Buat akun auth.users untuk user lama. Hash bcrypt lama DISALIN bila
--      formatnya valid ($2a$/$2b$, cost 04-31), sehingga password lama tetap
--      bisa dipakai. Hash yang tidak valid mendapat password acak dan user
--      tersebut tetap bisa memperbaikinya lewat "Lupa password".
--   3. Trigger auth.users membuat baris public.users untuk pendaftaran baru.
--   4. RLS users + storage policy membatasi tulis_data/profile & upload foto.
-- Jalankan SQL ini sebagai owner/postgres di Supabase SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Kolom penghubung
-- ------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Dibiarkan untuk rollback/audit, tapi tidak dipakai oleh alur Auth baru.
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

-- ------------------------------------------------------------
-- 2. Backfill akun Auth lama
-- ------------------------------------------------------------
DO $$
DECLARE
  pgcrypto_schema TEXT;
BEGIN
  SELECT n.nspname
    INTO pgcrypto_schema
  FROM pg_extension e
  JOIN pg_namespace n ON n.oid = e.extnamespace
  WHERE e.extname = 'pgcrypto';

  IF pgcrypto_schema IS NULL THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
    EXCEPTION WHEN insufficient_privilege THEN
      CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
    END;

    SELECT n.nspname
      INTO pgcrypto_schema
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pgcrypto';
  END IF;

  IF pgcrypto_schema IS NULL THEN
    RAISE EXCEPTION 'Ekstensi pgcrypto tidak tersedia; tidak bisa membuat hash password';
  END IF;

  EXECUTE format($sql$
    WITH inserted AS (
      INSERT INTO auth.users (
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        raw_app_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change_token_current,
        email_change,
        email_change_sent_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        reauthentication_token,
        reauthentication_sent_at
      )
      SELECT
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        u.email,
        CASE
          WHEN u.password_hash ~ '^[$]2[aby][$][0-9]{2}[$][./A-Za-z0-9]{53}$'
           AND substring(u.password_hash from 5 for 2) BETWEEN '04' AND '31'
            THEN u.password_hash
          ELSE %I.crypt(gen_random_uuid()::text, %I.gen_salt('bf', 12))
        END,
        now(),
        jsonb_build_object(
          'name', u.name,
          'student_id', u.student_id,
          'phone', u.phone,
          'campus', u.campus,
          'legacy_password_imported',
          u.password_hash ~ '^[$]2[aby][$][0-9]{2}[$][./A-Za-z0-9]{53}$'
          AND substring(u.password_hash from 5 for 2) BETWEEN '04' AND '31'
        ),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        now(),
        now(),
        '', NULL, '', NULL, '', '', '', NULL, '', '', NULL, '', NULL
      FROM public.users u
      WHERE u.auth_user_id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM auth.users au WHERE lower(au.email) = lower(u.email)
        )
      RETURNING id, email
    )
    UPDATE public.users u
       SET auth_user_id = i.id
      FROM inserted i
     WHERE lower(u.email) = lower(i.email)
       AND u.auth_user_id IS NULL
  $sql$, pgcrypto_schema, pgcrypto_schema);
END $$;

-- Identitas email dibutuhkan GoTrue supaya signInWithPassword bisa membaca
-- user. Sekali lagi: hanya untuk akun yang sudah terhubung ke public.users.
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  au.id,
  au.id::text,
  'email',
  jsonb_build_object(
    'sub', au.id::text,
    'email', au.email,
    'email_verified', true,
    'phone_verified', false
  ),
  au.last_sign_in_at,
  au.created_at,
  au.updated_at
FROM auth.users au
JOIN public.users u ON u.auth_user_id = au.id
WHERE au.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM auth.identities i
    WHERE i.user_id = au.id AND i.provider = 'email'
  );

-- ------------------------------------------------------------
-- 3. Trigger untuk pendaftaran baru via auth.signUp()
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_student_id TEXT;
BEGIN
  v_student_id := NEW.raw_user_meta_data->>'student_id';

  -- Akun tanpa metadata student_id (mis. provider OAuth lain) tidak dibuatkan
  -- baris users; filter ini juga melindungi backfill di atas dari duplikat.
  IF v_student_id IS NULL OR btrim(v_student_id) = '' THEN
    RETURN NEW;
  END IF;

  -- Jika email sudah ada (kasus backfill), cukup hubungkan auth_user_id-nya.
  UPDATE public.users
     SET auth_user_id = NEW.id
   WHERE lower(email) = lower(NEW.email)
     AND auth_user_id IS NULL;

  IF FOUND THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (
    auth_user_id,
    name,
    student_id,
    email,
    phone,
    campus,
    password_hash
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), 'Mahasiswa'),
    v_student_id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), '-'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'campus', ''), 'PNL'),
    ''
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ------------------------------------------------------------
-- 4. RLS users
-- ------------------------------------------------------------
-- SELECT sengaja dibuka karena endpoint publik (profil penjual, chat, dll.)
-- sudah menampilkan data ini. Penulisan dibatasi hanya untuk baris sendiri.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_all" ON public.users;
CREATE POLICY "users_select_all"
  ON public.users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "users_delete_own" ON public.users;
CREATE POLICY "users_delete_own"
  ON public.users FOR DELETE
  USING (auth_user_id = auth.uid());

-- Helper dipakai storage policy: auth.uid() -> public.users.id.
-- SECURITY DEFINER agar tetap bisa membaca users walaupun RLS berubah.
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;

-- ------------------------------------------------------------
-- 5. Storage product-images
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_insert_own_folder" ON storage.objects;
CREATE POLICY "product_images_insert_own_folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'products'
    AND (storage.foldername(name))[2] = public.current_app_user_id()::text
  );

DROP POLICY IF EXISTS "product_images_update_own_folder" ON storage.objects;
CREATE POLICY "product_images_update_own_folder"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[2] = public.current_app_user_id()::text
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[2] = public.current_app_user_id()::text
  );

DROP POLICY IF EXISTS "product_images_delete_own_folder" ON storage.objects;
CREATE POLICY "product_images_delete_own_folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[2] = public.current_app_user_id()::text
  );

-- ============================================================
-- SETELAH MIGRASI:
--   * User lama langsung login dengan password lama bila hash bcrypt valid;
--     hanya yang hash-nya rusak/null yang perlu /forgot-password.
--   * Daftarkan redirect URL: ${NEXT_PUBLIC_APP_URL}/auth/callback
--     di Supabase Dashboard -> Authentication -> URL Configuration.
--   * Aktifkan Email provider dan konfigurasi SMTP/email template.
-- ============================================================
