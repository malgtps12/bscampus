import { NextRequest, NextResponse } from "next/server";
import { validateEmail } from "@/lib/reset-password-helper";
import {
  createResetCode,
  checkForgotPasswordRateLimit,
  isEmailRegistered,
} from "@/services/reset-password-service";
import { sendResetCodeEmail } from "@/lib/email";
import { getClientIp } from "@/lib/auth-utils";

export const runtime = "nodejs";

/** Respons identik untuk semua kondisi - mencegah email enumeration. */
function genericResponse() {
  return NextResponse.json({
    success: true,
    message: "Jika email terdaftar, kode reset akan dikirim ke email Anda.",
  });
}

/**
 * Kirim kode 6 digit via Resend (bukan email Supabase Auth).
 * Kode dibuat dan disimpan ter-hash di password_reset_codes.
 */
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
            "Retry-After": rateLimitCheck.retryAfter?.toString() || "30",
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

    // Balas generik untuk email tidak terdaftar agar tidak membocorkan akun.
    if (!(await isEmailRegistered(targetEmail))) return genericResponse();

    // RPC memakai SECURITY DEFINER dan sudah mengecek email secara
    // case-insensitive, sehingga tidak bergantung pada RLS/GRANT tabel users.
    const result = await createResetCode(targetEmail);
    if (!result.success) {
      // Email terdaftar tapi RPC gagal -> hampir pasti batas 5 kode/30 detik.
      // Beri tahu user supaya tidak menunggu email yang tidak pernah dikirim.
      console.error("[Forgot Password] Failed to create reset code:", result.error);
      return NextResponse.json(
        {
          error: "Terlalu banyak permintaan kode reset. Coba lagi 30 detik.",
        },
        { status: 429, headers: { "Retry-After": "30" } },
      );
    }

    const sent = await sendResetCodeEmail(targetEmail, result.code);
    if (!sent) {
      // Jangan log kode reset - cukup catat bahwa pengiriman gagal.
      console.error(`[Forgot Password] Email sending failed for: ${targetEmail}`);
      return NextResponse.json(
        { error: "Gagal mengirim email. Periksa konfigurasi RESEND_API_KEY dan RESEND_FROM_EMAIL." },
        { status: 500 },
      );
    }

    return genericResponse();
  } catch (error) {
    console.error("[Forgot Password] Error:", error);
    return genericResponse();
  }
}
