import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAppUrl } from "@/lib/app-url";
import { validateEmail } from "@/lib/reset-password-helper";
import { checkForgotPasswordRateLimit } from "@/services/reset-password-service";
import { getClientIp } from "@/lib/auth-utils";

export const runtime = "nodejs";

/** Respons identik untuk semua kondisi - mencegah email enumeration. */
function genericResponse() {
  return NextResponse.json({
    success: true,
    message:
      "Jika email terdaftar, tautan reset password telah dikirim. Silakan cek inbox Anda.",
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitCheck = await checkForgotPasswordRateLimit(ip);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitCheck.retryAfter?.toString() || "900",
          },
        },
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email harus diisi" }, { status: 400 });
    }

    const targetEmail = email.trim();
    if (!validateEmail(targetEmail)) return genericResponse();

    const supabase = await createClient();
    const appUrl = getAppUrl(request.nextUrl.origin);

    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`,
    });

    if (error) {
      // Jangan membocorkan apakah email terdaftar atau tidak.
      console.error("[Forgot Password] resetPasswordForEmail error:", error.message);
    }

    return genericResponse();
  } catch (error) {
    console.error("[Forgot Password] Error:", error);
    return genericResponse();
  }
}
