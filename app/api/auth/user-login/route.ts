import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  validateInput,
  validatePasswordLength,
  checkRateLimit,
  getClientIp,
} from "@/lib/auth-utils";

export const runtime = "nodejs";

/**
 * Login tetap menerima NIM di UI, tetapi autentikasi done oleh Supabase Auth.
 * NIM dipakai hanya untuk mencari email; password tidak pernah diverifikasi
 * dengan bcrypt di aplikasi.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Coba lagi nanti." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { studentId, password } = body;

    if (!studentId || !password) {
      return NextResponse.json(
        { error: "NIM dan password harus diisi" },
        { status: 400 },
      );
    }

    if (!validateInput(studentId) || !validatePasswordLength(password)) {
      return NextResponse.json({ error: "Input tidak valid" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, student_id, email, phone, campus, auth_user_id")
      .eq("student_id", studentId)
      .maybeSingle();

    if (profileError) {
      console.error("[User Login] Query error:", profileError.message);
      return NextResponse.json(
        { error: "NIM atau password salah" },
        { status: 401 },
      );
    }

    // Respons yang sama untuk user tidak ditemukan dan akun belum terhubung,
    // kecuali untuk akun lama yang memang harus reset password.
    if (!profile?.email) {
      return NextResponse.json(
        { error: "NIM atau password salah" },
        { status: 401 },
      );
    }

    if (!profile.auth_user_id) {
      return NextResponse.json(
        {
          error:
            "Akun belum terhubung ke Supabase Auth. Silakan hubungi administrator.",
        },
        { status: 403 },
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (error || !data.user) {
      const message = error?.message || "";
      if (/email not confirmed/i.test(message)) {
        return NextResponse.json(
          { error: "Email belum diverifikasi. Silakan cek email Anda." },
          { status: 403 },
        );
      }

      return NextResponse.json(
        { error: "NIM atau password salah" },
        { status: 401 },
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: profile.id,
          name: profile.name,
          studentId: profile.student_id,
          email: profile.email,
          phone: profile.phone,
          campus: profile.campus,
        },
      },
      { status: 200 },
    );

    // Bersihkan cookie JWT user lama bila masih tertinggal di browser.
    response.cookies.set({
      name: "user_token",
      value: "",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("[User Login] Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
