import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  validateEmail,
  validateResetCodeFormat,
  validatePassword,
} from "@/lib/reset-password-helper";
import { getClientIp } from "@/lib/auth-utils";
import { checkResetPasswordRateLimit } from "@/services/reset-password-service";

export const runtime = "nodejs";

/**
 * Reset password dengan kode 6 digit dari email (Brevo).
 * Tidak memerlukan session Supabase Auth, jadi tetap bekerja saat user
 * belum bisa login.
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
    const { email, code, newPassword, confirmPassword } = body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 });
    }

    if (typeof email !== "string" || !validateEmail(email.trim())) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }

    if (typeof code !== "string" || !validateResetCodeFormat(code)) {
      return NextResponse.json({ error: "Kode harus 6 digit angka" }, { status: 400 });
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

    // Fungsi DB memverifikasi kode (hash bcrypt), expiry, dan attempt limit,
    // lalu mengganti password di auth.users + users.
    const { data, error } = await supabase.rpc("reset_password_with_code", {
      p_email: email.trim(),
      p_code: code,
      p_new_password: newPassword,
    });

    if (error) {
      console.error("[Reset Password] RPC error:", error.message);
      return NextResponse.json(
        { error: "Gagal mereset password. Silakan minta kode baru." },
        { status: 500 },
      );
    }

    const result = data as { ok?: boolean; error?: string } | null;
    if (!result?.ok) {
      return NextResponse.json(
        { error: result?.error || "Kode tidak valid atau sudah kadaluarsa" },
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
