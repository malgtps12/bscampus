-- ============================================================
-- 010_link_existing_auth_users.sql
-- ============================================================
-- Perbaikan akun lama agar bisa login lewat Supabase Auth.
-- Aman dijalankan berulang (idempoten).
-- ============================================================

-- Matikan trigger pendantaftaran selama migrasi supaya INSERT ke auth.users
-- tidak membuat baris public.users duplikat (bentrok phone/email).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ------------------------------------------------------------
-- 1. Hubungkan akun yang auth.users-nya sudah ada (berdasar email)
-- ------------------------------------------------------------
UPDATE public.users u
   SET auth_user_id = au.id
  FROM auth.users au
 WHERE u.auth_user_id IS NULL
   AND lower(u.email) = lower(au.email);

-- ------------------------------------------------------------
-- 2. Buat auth.users untuk akun yang belum terhubung
-- ------------------------------------------------------------
WITH inserted AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change_token_current,
    email_change,
    email_change_sent_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    is_anonymous,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  SELECT
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    u.email,
    u.password_hash,
    now(),
    '', NULL, '', NULL, '', '', '', NULL,
    '', NULL, '', '', NULL, '', NULL,
    false,
    false,
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object(
      'name', u.name,
      'student_id', u.student_id,
      'phone', NULLIF(u.phone, ''),
      'campus', u.campus,
      'email', u.email,
      'email_verified', true,
      'phone_verified', false
    ),
    now(),
    now()
  FROM public.users u
  WHERE u.auth_user_id IS NULL
    AND u.email IS NOT NULL
    AND u.password_hash ~ '^[$]2[aby][$][0-9]{2}[$][./A-Za-z0-9]{53}$'
    AND NOT EXISTS (
      SELECT 1 FROM auth.users au WHERE lower(au.email) = lower(u.email)
    )
  RETURNING id, email
)
UPDATE public.users u
   SET auth_user_id = i.id
  FROM inserted i
 WHERE lower(u.email) = lower(i.email)
   AND u.auth_user_id IS NULL;

-- ------------------------------------------------------------
-- 3. Rapikan auth.users yang sudah terhubung (tanpa DELETE)
-- ------------------------------------------------------------
UPDATE auth.users au
   SET encrypted_password = u.password_hash,
       email_confirmed_at = COALESCE(au.email_confirmed_at, now()),
       confirmation_token = '',
       confirmation_sent_at = NULL,
       recovery_token = '',
       recovery_sent_at = NULL,
       email_change_token_new = '',
       email_change_token_current = '',
       email_change = '',
       email_change_sent_at = NULL,
       reauthentication_token = '',
       reauthentication_sent_at = NULL,
       raw_app_meta_data = jsonb_build_object(
         'provider', 'email', 'providers', ARRAY['email']
       ),
       raw_user_meta_data = COALESCE(au.raw_user_meta_data, '{}'::jsonb)
         || jsonb_build_object(
           'name', u.name,
           'student_id', u.student_id,
           'phone', NULLIF(u.phone, ''),
           'campus', u.campus,
           'email', u.email,
           'email_verified', true,
           'phone_verified', false,
           'sub', au.id::text
         ),
       updated_at = now()
  FROM public.users u
 WHERE u.auth_user_id = au.id
   AND au.last_sign_in_at IS NULL
   AND u.password_hash ~ '^[$]2[aby][$][0-9]{2}[$][./A-Za-z0-9]{53}$';

-- ------------------------------------------------------------
-- 4. Identity email: provider_id = email (bukan id user)
-- ------------------------------------------------------------
DELETE FROM auth.identities i
 USING public.users u
 WHERE i.user_id = u.auth_user_id
   AND i.provider = 'email';

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
  u.auth_user_id,
  lower(u.email),
  'email',
  jsonb_build_object(
    'sub', u.auth_user_id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  NULL,
  now(),
  now()
FROM public.users u
WHERE u.auth_user_id IS NOT NULL
  AND u.email IS NOT NULL;

-- ------------------------------------------------------------
-- 5. Bersihkan akun uji yang dibuat saat diagnosa (jika ada)
-- ------------------------------------------------------------
DELETE FROM auth.users WHERE lower(email) = lower('__baru_unik_99881__@x.com');

-- ------------------------------------------------------------
-- 6. Helper auth.uid() -> public.users.id untuk storage policy
-- ------------------------------------------------------------
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
-- 7. Trigger pendaftaran baru via auth.signUp()
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

  IF v_student_id IS NULL OR btrim(v_student_id) = '' THEN
    RETURN NEW;
  END IF;

  UPDATE public.users
     SET auth_user_id = NEW.id
   WHERE lower(email) = lower(NEW.email)
     AND auth_user_id IS NULL;

  IF FOUND THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (
    auth_user_id, name, student_id, email, phone, campus, password_hash
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), 'Mahasiswa'),
    v_student_id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'phone', ''),
      '-' || NEW.id::text
    ),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'campus', ''), 'PNL'),
    ''
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ------------------------------------------------------------
-- 8. Storage product-images
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
