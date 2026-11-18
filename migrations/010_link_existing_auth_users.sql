-- ============================================================
-- 010_link_existing_auth_users.sql
-- ============================================================
-- Perbaikan untuk public.users yang auth_user_id-nya masih NULL.
-- Aman dijalankan berulang.
--
--   1. Hubungkan ke auth.users yang emailnya sudah ada.
--   2. Pastikan identity provider email ada.
--   3. Buat auth.users untuk akun yang benar-benar belum ada.
--   4. Konfirmasi email akun lama agar tidak diblokir GoTrue.
--   5. Impor hash bcrypt lama hanya untuk akun yang belum pernah login
--      atau mengganti password.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Hubungkan akun yang auth.users-nya sudah ada
-- ------------------------------------------------------------
UPDATE public.users u
   SET auth_user_id = au.id
  FROM auth.users au
 WHERE u.auth_user_id IS NULL
   AND lower(u.email) = lower(au.email);

-- ------------------------------------------------------------
-- 2.identity email untuk akun yang sudah terhubung
-- ------------------------------------------------------------
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
-- 3. Buat auth.users untuk akun yang masih belum terhubung
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

-- Identity untuk akun yang baru dibuat pada langkah 3.
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
-- 4. Konfirmasi email akun lama agar bisa langsung login
-- ------------------------------------------------------------
UPDATE auth.users au
   SET email_confirmed_at = COALESCE(au.email_confirmed_at, now())
  FROM public.users u
 WHERE u.auth_user_id = au.id;

-- ------------------------------------------------------------
-- 5. Impor password lama hanya untuk akun yang belum dipakai
-- ------------------------------------------------------------
UPDATE auth.users au
   SET encrypted_password = u.password_hash,
       raw_user_meta_data = COALESCE(au.raw_user_meta_data, '{}'::jsonb)
         || jsonb_build_object('legacy_password_imported', true),
       updated_at = now()
  FROM public.users u
 WHERE u.auth_user_id = au.id
   AND au.last_sign_in_at IS NULL
   AND au.updated_at = au.created_at
   AND COALESCE(au.raw_user_meta_data->>'legacy_password_imported', '') <> 'true'
   AND u.password_hash ~ '^[$]2[aby][$][0-9]{2}[$][./A-Za-z0-9]{53}$'
   AND substring(u.password_hash from 5 for 2) BETWEEN '04' AND '31';
