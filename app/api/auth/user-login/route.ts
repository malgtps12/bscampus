import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import {
  validateInput,
  validatePasswordLength,
  checkRateLimit,
  generateJWT,
  getClientIp,
} from "@/lib/auth-utils"
import bcrypt from "bcryptjs"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Coba lagi nanti." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { studentId, password } = body

    if (!studentId || !password) {
      return NextResponse.json(
        { error: "NIM dan password harus diisi" },
        { status: 400 }
      )
    }

    if (!validateInput(studentId) || !validatePasswordLength(password)) {
      return NextResponse.json(
        { error: "Input tidak valid" },
        { status: 400 }
      )
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle()

    if (error) {
      console.error('[User Login] Query error:', error)
      return NextResponse.json(
        { error: "NIM atau password salah" },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: "NIM atau password salah" },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "NIM atau password salah" },
        { status: 401 }
      )
    }

    const token = generateJWT(user.student_id, "user")

    const response = NextResponse.json(
      { 
        success: true, 
        token,
        user: {
          id: user.id,
          name: user.name,
          studentId: user.student_id,
          email: user.email,
          phone: user.phone,
          campus: user.campus
        }
      },
      { status: 200 }
    )

    response.cookies.set({
      name: "user_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[User Login] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
