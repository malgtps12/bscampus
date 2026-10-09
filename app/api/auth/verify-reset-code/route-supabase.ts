import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email dan kode harus diisi" },
        { status: 400 }
      )
    }

    if (code.length !== 4 || !/^\d{4}$/.test(code)) {
      return NextResponse.json(
        { error: "Kode harus 4 digit angka" },
        { status: 400 }
      )
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Email tidak valid" },
        { status: 404 }
      )
    }

    const { data: resetCode, error: codeError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('reset_code', code)
      .eq('used', false)
      .single()

    if (codeError || !resetCode) {
      return NextResponse.json(
        { error: "Kode tidak valid atau sudah digunakan" },
        { status: 400 }
      )
    }

    const expiresAt = new Date(resetCode.expires_at)
    const now = new Date()

    if (now > expiresAt) {
      return NextResponse.json(
        { error: "Kode sudah kadaluarsa. Silakan minta kode baru." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Kode valid",
      resetCodeId: resetCode.id
    })
  } catch (error) {
    console.error("[Verify Reset Code] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
