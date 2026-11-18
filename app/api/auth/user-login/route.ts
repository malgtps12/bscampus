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
    const normalizedStudentId = studentId.trim();

    type LoginProfile = {
      id: string;
      name: string;
      student_id: string;
      email: string;
      phone: string;
      campus: string;
      auth_user_id: string | null;
    };

    let profile: LoginProfile | null = null;

    // RPC SECURITY DEFINER dipakai supaya login tetap bekerja walaupun
    // publishable key tidak punya akses SELECT langsung ke public.users.
    const { data: profileData, error: profileError } = await supabase.rpc(
      "get_user_login_profile",
      { p_student_id: normalizedStudentId },
    );

    if (profileError) {
      // Fallback untuk deployment yang belum menjalankan migration 009.
      console.warn(
        "[User Login] RPC tidak tersedia, pakai query langsung:",
        profileError.message,
      );
      const { data: directProfile, error: directError } = await supabase
        .from("users")
        .select("id, name, student_id, email, phone, campus, auth_user_id")
        .eq("student_id", normalizedStudentId)
        .maybeSingle();

      if (directError) {
        console.error("[User Login] Query error:", directError.message);
        return NextResponse.json(
          { error: "NIM atau password salah" },
          { status: 401 },
        );
      }

      profile = (directProfile as LoginProfile | null) ?? null;
    } else {
      profile =
        profileData && typeof profileData === "object" && !Array.isArray(profileData)
          ? (profileData as LoginProfile)
          : null;
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
