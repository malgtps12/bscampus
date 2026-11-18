import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./supabase-env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

/**
 * Client Supabase untuk Client Component.
 * Hanya memakai env NEXT_PUBLIC_*, yaitu URL dan publishable key yang aman
 * dikirim ke browser. Jangan pernah menaruh service_role/secret key di sini.
 */
export function createClient() {
  if (!browserClient) {
    const { url, key } = getSupabaseEnv();
    browserClient = createBrowserClient(url, key);
  }

  return browserClient;
}
