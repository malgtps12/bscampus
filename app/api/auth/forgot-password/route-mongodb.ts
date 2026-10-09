import { NextRequest, NextResponse } from "next/server"
import { findUserByEmail } from "@/lib/user"
import { deleteOldResetCodes, createResetCode } from "@/lib/password-reset"
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

    const user = await findUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        { error: "Email tidak terdaftar" },
        { status: 404 }
      )
    }

    await deleteOldResetCodes(user._id!.toString())

    const resetCode = generateResetCode()
    const created = await createResetCode(user._id!.toString(), resetCode)

    if (!created) {
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
      email: user.email,
      ...(process.env.NODE_ENV === 'development' ? { resetCode } : {})
    })
  } catch (error) {
    console.error("[Forgot Password] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
