-- Migrasi 005: Aktifkan Supabase Realtime untuk chat
--
-- Tanpa tabel di publication `supabase_realtime`, subscription
-- postgres_changes di browser tidak menerima event apa pun. Aplikasi tetap
-- punya polling fallback, tetapi realtime baru aktif setelah migrasi ini
-- dijalankan di SQL Editor Supabase.
--
-- Migrasi ini IDEMPOTEN - aman dijalankan berulang kali.

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'create publication supabase_realtime';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    execute 'alter publication supabase_realtime add table public.conversations';
  end if;
end $$;
