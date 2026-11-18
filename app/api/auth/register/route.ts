import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAppUrl } from "@/lib/app-url";
import { validateInput, checkRegisterRateLimit, getClientIp } from "@/lib/auth-utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    if (!checkRegisterRateLimit(ip)) {
      console.warn(`[Security] Register rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "Terlalu banyak percobaan registrasi. Coba lagi dalam 1 jam." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { name, studentId, email, phone, campus, password } = body;

    if (!name || !studentId || !email || !phone || !campus || !password) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 });
    }

    if (!validateInput(name) || !validateInput(studentId)) {
      return NextResponse.json(
        { error: "Nama atau NIM mengandung karakter tidak valid" },
        { status: 400 },
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }

    const supabase = await createClient();

    // Cek duplikat lebih awal supaya pesannya ramah. Trigger DB tetap menjadi
    // penjaga terakhir untuk NIM/email yang sama.
    const { data: existingByStudentId, error: studentIdError } = await supabase
      .from("users")
      .select("id")
      .eq("student_id", studentId)
      .limit(1);

    if (studentIdError) {
      console.error("[Register] Check NIM error:", studentIdError.message);
      if (studentIdError.code === "42P01") {
        return NextResponse.json(
          { error: "Tabel users belum dibuat. Jalankan SQL schema terlebih dahulu." },
          { status: 500 },
        );
      }
    }

    if (existingByStudentId && existingByStudentId.length > 0) {
      return NextResponse.json({ error: "NIM sudah terdaftar" }, { status: 400 });
    }

    const { data: existingByEmail, error: emailError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (emailError) {
      console.error("[Register] Check email error:", emailError.message);
    }

    if (existingByEmail && existingByEmail.length > 0) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const appUrl = getAppUrl(request.nextUrl.origin);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, student_id: studentId, phone, campus },
        emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent("/login?registered=true")}`,
      },
    });

    if (error) {
      console.error("[Register] signUp error:", error.message);
      if (/already registered|user already exists/i.test(error.message)) {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
      }
      return NextResponse.json(
        { error: "Gagal mendaftar. Silakan coba lagi." },
        { status: 500 },
      );
    }

    // Session null berarti Supabase masih menunggu verifikasi email.
    if (!data.session) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Registrasi berhasil. Silakan verifikasi email terlebih dahulu sebelum login.",
          requiresVerification: true,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registrasi berhasil. Selamat datang di BSCampus.",
        requiresVerification: false,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Register] Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
