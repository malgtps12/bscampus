/**
 * Hanya URL dan publishable key yang boleh dipakai aplikasi.
 * Service role/secret key tidak boleh masuk ke kode maupun env aplikasi.
 */
export function getSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY wajib dikonfigurasi",
    )
  }

  return { url, key }
}
