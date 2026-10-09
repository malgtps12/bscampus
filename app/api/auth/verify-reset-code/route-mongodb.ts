import { NextRequest, NextResponse } from "next/server"
import { findUserByEmail } from "@/lib/user"
import { findResetCode } from "@/lib/password-reset"

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

    const user = await findUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        { error: "Email tidak valid" },
        { status: 404 }
      )
    }

    const resetCode = await findResetCode(user._id!.toString(), code)

    if (!resetCode) {
      return NextResponse.json(
        { error: "Kode tidak valid atau sudah digunakan" },
        { status: 400 }
      )
    }

    const now = new Date()
    if (now > resetCode.expires_at) {
      return NextResponse.json(
        { error: "Kode sudah kadaluarsa. Silakan minta kode baru." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Kode valid",
      resetCodeId: resetCode._id?.toString()
    })
  } catch (error) {
    console.error("[Verify Reset Code] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
