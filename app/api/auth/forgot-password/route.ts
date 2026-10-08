import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { sendEmail } from "@/lib/email"
import { generateResetCodeEmailTemplate } from "@/lib/email-templates"

export const runtime = 'nodejs'

function generateResetCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email harus diisi" },
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

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Email tidak terdaftar" },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabase
      .from('password_reset_codes')
      .delete()
      .eq('user_id', user.id)
      .eq('used', false)

    if (deleteError) {
      console.error("[Forgot Password] Delete old codes error:", deleteError)
    }

    const resetCode = generateResetCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    const { error: insertError } = await supabase
      .from('password_reset_codes')
      .insert({
        user_id: user.id,
        reset_code: resetCode,
        expires_at: expiresAt.toISOString()
      })

    if (insertError) {
      console.error("[Forgot Password] Insert code error:", insertError)
      return NextResponse.json(
        { error: "Gagal membuat kode reset" },
        { status: 500 }
      )
    }

    const { text, html } = generateResetCodeEmailTemplate(user.name, resetCode)

    const emailSent = await sendEmail({
      to: user.email,
      subject: 'Kode Reset Password BSCampus',
      text,
      html
    })

    if (!emailSent) {
      console.warn('[Forgot Password] Email sending failed, but code was created')
    }

    return NextResponse.json({
      success: true,
      message: "Kode reset password telah dikirim ke email Anda",
      email: user.email
    })
  } catch (error) {
    console.error("[Forgot Password] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
