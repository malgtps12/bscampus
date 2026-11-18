import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase-env";

const DEV_JWT_SECRET = "bscampus-dev-only-secret-do-not-use-in-production";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length > 0) return new TextEncoder().encode(secret);
  return new TextEncoder().encode(DEV_JWT_SECRET);
}

async function isAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

type RefreshedCookie = { name: string; value: string; options?: CookieOptions };

/**
 * Menyegarkan session Supabase Auth (getClaims memverifikasi JWT dan refresh
 * bila perlu) untuk semua halaman/API, dan tetap memproteksi /admin/* dengan
 * cookie admin_token lama.
 */
export default async function proxy(request: NextRequest) {
  const { url, key } = getSupabaseEnv();
  const refreshed: RefreshedCookie[] = [];
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        refreshed.push(...cookiesToSet);
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // Kirim cookie terbaru ke handler berikutnya.
        response = NextResponse.next({ request });
      },
    },
  });

  // Jangan percaya claims dari cookie tanpa verifikasi; getClaims() melakukan
  // verifikasi tanda tangan dan melakukan refresh jika token hampir kedaluwarsa.
  await supabase.auth.getClaims();

  const applyCookies = (target: NextResponse) => {
    refreshed.forEach(({ name, value, options }) => target.cookies.set(name, value, options));
    return target;
  };

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const valid = await isAdminToken(request.cookies.get("admin_token")?.value);
    if (!valid) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin";
      redirectUrl.search = "";
      return applyCookies(NextResponse.redirect(redirectUrl));
    }
  }

  return applyCookies(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
