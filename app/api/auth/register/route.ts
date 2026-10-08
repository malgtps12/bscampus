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

    if (!validateInput(name) || !validateInput(studentId) || !validateInput(email)) {
      return NextResponse.json(
        { error: "Input tidak valid" },
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

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`student_id.eq.${studentId},email.eq.${email}`)
      .single()

    if (existingUser) {
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
        { error: "Gagal mendaftar. Silakan coba lagi." },
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
