-- ============================================================
-- 008_restore_users_select_policy.sql
-- Memulihkan akses baca public.users untuk klien publishable key.
-- ============================================================
-- Endpoint profil penjual, chat, dan cek duplikat registrasi membaca tabel
-- users langsung. Jika policy/GRANT ini hilang, klien melihat tabel seolah
-- kosong walaupun barisnya ada di database.
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.users TO anon, authenticated;

DROP POLICY IF EXISTS "users_select_all" ON public.users;
CREATE POLICY "users_select_all"
  ON public.users FOR SELECT
  USING (true);
