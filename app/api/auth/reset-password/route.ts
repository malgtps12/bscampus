import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, newPassword, confirmPassword } = body

    if (!email || !code || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Password dan konfirmasi password tidak cocok" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
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

    const passwordHash = await bcrypt.hash(newPassword, 10)

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id)

    if (updateError) {
      console.error("[Reset Password] Update password error:", updateError)
      return NextResponse.json(
        { error: "Gagal mengubah password" },
        { status: 500 }
      )
    }

    const { error: markUsedError } = await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('id', resetCode.id)

    if (markUsedError) {
      console.error("[Reset Password] Mark code used error:", markUsedError)
    }

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah. Silakan login dengan password baru."
    })
  } catch (error) {
    console.error("[Reset Password] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
