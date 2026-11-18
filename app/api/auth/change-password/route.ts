import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase-server";
import { validatePassword } from "@/lib/reset-password-helper";
import { getClientIp } from "@/lib/auth-utils";
import { checkChangePasswordRateLimit } from "@/services/reset-password-service";

export const runtime = "nodejs";

/**
 * Ganti password dari pengaturan akun.
 * User hanya mengirim password lama, password baru, dan konfirmasinya.
 * Password lama diverifikasi Supabase Auth, lalu password baru ditulis
 * lewat auth.updateUser({ password }).
 */
export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: "Anda belum login" }, { status: 401 });
    }

    // Gabungkan user + IP supaya rate limit tidak memblokir user lain yang
    // memakai IP bersama (kampus/Wi-Fi).
    const rateLimitCheck = await checkChangePasswordRateLimit(
      `${current.id}:${getClientIp(request)}`,
    );
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Silakan coba lagi nanti." },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitCheck.retryAfter?.toString() || "30",
          },
        },
      );
    }

    const body = await request.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 });
    }

    if (
      typeof oldPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return NextResponse.json({ error: "Format password tidak valid" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Password baru dan konfirmasi tidak cocok" },
        { status: 400 },
      );
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
    }

    const supabase = await createClient();

    // Verifikasi password lama. login dengan password yang benar juga
    // menyegarkan session, sehingga updateUser tidak meminta nonce
    // meski fitur Secure password change aktif.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: current.email,
      password: oldPassword,
    });

    if (signInError) {
      return NextResponse.json({ error: "Password lama tidak valid" }, { status: 401 });
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("[Change Password] updateUser error:", updateError.message);
      return NextResponse.json(
        { error: "Gagal menyimpan password baru. Silakan coba lagi." },
        { status: 500 },
      );
    }

    // users.password_hash hanya untuk audit/rollback. Supabase Auth tetap
    // menjadi sumber kebenaran saat login.
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error: syncError } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", current.id);

    if (syncError) {
      console.error("[Change Password] Sync password_hash error:", syncError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Password berhasil diganti",
    });
  } catch (error) {
    console.error("[Change Password] Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
