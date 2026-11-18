/** URL publik aplikasi, dipakai untuk redirect Supabase Auth. */
export function getAppUrl(requestOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured && configured.length > 0) {
    return configured.replace(/\/+$/, "");
  }

  if (requestOrigin && requestOrigin.length > 0) {
    return requestOrigin.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL wajib dikonfigurasi di production");
  }

  return "http://localhost:3000";
}
