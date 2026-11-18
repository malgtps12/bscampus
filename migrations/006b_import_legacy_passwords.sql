-- ============================================================
-- 006b_import_legacy_passwords.sql (OPSIONAL)
-- ============================================================
-- Jalankan HANYA jika 006_supabase_auth.sql sudah dijalankan dengan versi
-- lama yang memakai password acak, DAN belum ada user yang reset password.
-- Script ini menyalin hash bcrypt lama ke auth.users agar user tidak perlu
-- "Lupa password".
--
-- Aman terhadap user yang sudah mengganti password: hanya akun dengan
-- last_sign_in_at IS NULL dan updated_at = created_at yang disentuh.
-- ============================================================

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
    RAISE EXCEPTION 'Ekstensi pgcrypto tidak ditemukan';
  END IF;

  EXECUTE format($sql$
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
       AND substring(u.password_hash from 5 for 2) BETWEEN '04' AND '31'
  $sql$);
END $$;

-- Cek hasil: berapa akun yang sudah memakai hash lama.
-- SELECT count(*) AS imported
-- FROM auth.users au
-- JOIN public.users u ON u.auth_user_id = au.id
-- WHERE au.raw_user_meta_data->>'legacy_password_imported' = 'true';
