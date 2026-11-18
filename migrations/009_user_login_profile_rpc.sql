-- ============================================================
-- 009_user_login_profile_rpc.sql
-- Login NIM tidak boleh bergantung pada akses SELECT langsung ke
-- public.users. Jika policy/GRANT SELECT hilang, publishable key melihat
-- tabel seolah kosong dan login mengira NIM tidak terdaftar.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_login_profile(p_student_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_profile JSONB;
BEGIN
  IF p_student_id IS NULL OR btrim(p_student_id) = '' THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', u.id,
    'name', u.name,
    'student_id', u.student_id,
    'email', u.email,
    'phone', u.phone,
    'campus', u.campus,
    'auth_user_id', u.auth_user_id
  )
  INTO v_profile
  FROM public.users u
  WHERE u.student_id = p_student_id
  LIMIT 1;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_login_profile(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_login_profile(TEXT) TO anon, authenticated;
