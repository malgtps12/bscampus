import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { validateInput } from "@/lib/auth-utils"
import bcrypt from "bcryptjs"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
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

    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`student_id.eq.${studentId},email.eq.${email}`)

    if (checkError) {
      console.error("[Register] Check error:", checkError)
      if (checkError.code === '42P01') {
        return NextResponse.json(
          { error: "Tabel users belum dibuat. Jalankan SQL schema terlebih dahulu." },
          { status: 500 }
        )
      }
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "NIM atau email sudah terdaftar" },
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
