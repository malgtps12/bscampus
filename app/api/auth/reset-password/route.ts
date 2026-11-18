import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { validatePassword } from "@/lib/reset-password-helper";
import { getClientIp } from "@/lib/auth-utils";
import { checkResetPasswordRateLimit } from "@/services/reset-password-service";

export const runtime = "nodejs";

/**
 * Pasca klik tautan reset dari email, browser sudah punya session recovery
 * (ditukar di /auth/callback). Endpoint ini mengganti password via Auth API.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitCheck = await checkResetPasswordRateLimit(ip);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Silakan coba lagi nanti." },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitCheck.retryAfter?.toString() || "900",
          },
        },
      );
    }

    const body = await request.json();
    const { newPassword, confirmPassword } = body;

    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Password dan konfirmasi password tidak cocok" },
        { status: 400 },
      );
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru." },
        { status: 401 },
      );
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error("[Reset Password] updateUser error:", error.message);
      return NextResponse.json(
        { error: "Gagal mengganti password. Silakan minta tautan reset baru." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password berhasil diganti. Silakan login dengan password baru.",
    });
  } catch (error) {
    console.error("[Reset Password] Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
