import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./supabase-env";

/**
 * Supabase client untuk Server Component, Route Handler, dan proxy.
 * Client ini meneruskan cookie session sehingga RLS dan getClaims()
 * melihat user yang sedang login.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createSupabaseServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Dipanggil dari Server Component: refresh session dilakukan proxy.
        }
      },
    },
  });
}

/** Alias yang lebih deskriptif untuk pemanggil lama. */
export const createServerClient = createClient;
