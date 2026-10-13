import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { validateInput, checkRegisterRateLimit } from "@/lib/auth-utils"
import bcrypt from "bcryptjs"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    
    if (!checkRegisterRateLimit(ip)) {
      console.warn(`[Security] Register rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { error: "Terlalu banyak percobaan registrasi. Coba lagi dalam 1 jam." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, studentId, email, phone, campus, password } = body

    if (!name || !studentId || !email || !phone || !campus || !password) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      )
    }

    if (!validateInput(name) || !validateInput(studentId)) {
      return NextResponse.json(
        { error: "Nama atau NIM mengandung karakter tidak valid" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      )
    }

    // Cek NIM sudah ada atau tidak
    const { data: existingByStudentId, error: studentIdError } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', studentId)
      .limit(1)

    if (studentIdError) {
      console.error("[Register] Check NIM error:", studentIdError)
      if (studentIdError.code === '42P01') {
        return NextResponse.json(
          { error: "Tabel users belum dibuat. Jalankan SQL schema terlebih dahulu." },
          { status: 500 }
        )
      }
    }

    if (existingByStudentId && existingByStudentId.length > 0) {
      return NextResponse.json(
        { error: "NIM sudah terdaftar" },
        { status: 400 }
      )
    }

    // Cek email sudah ada atau tidak
    const { data: existingByEmail, error: emailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (emailError) {
      console.error("[Register] Check email error:", emailError)
    }

    if (existingByEmail && existingByEmail.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        name,
        student_id: studentId,
        email,
        phone,
        campus,
        password_hash: passwordHash
      })

    if (insertError) {
      console.error("[Register] Insert error:", insertError)
      return NextResponse.json(
        { error: `Gagal mendaftar: ${insertError.message || 'Silakan coba lagi.'}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Registrasi berhasil. Silakan login." },
      { status: 201 }
    )
  } catch (error) {
    console.error("[Register] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
