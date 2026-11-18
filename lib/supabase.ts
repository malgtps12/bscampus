import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./supabase-env";

const { url, key } = getSupabaseEnv();

/**
 * Client anon untuk query public (tanpa session user).
 * Untuk data/operasi yang bergantung pada sesi, gunakan createClient()
 * dari lib/supabase-server.ts agar cookie diteruskan dan RLS aktif.
 */
export const supabase = createClient(url, key);
