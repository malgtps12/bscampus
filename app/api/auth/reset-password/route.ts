import { NextRequest, NextResponse } from "next/server"
import { findUserByEmail } from "@/lib/user"
import { findResetCode, markResetCodeUsed } from "@/lib/password-reset"
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

    const passwordHash = await bcrypt.hash(newPassword, 10)

    const { updateUserPassword } = await import("@/lib/user")
    const updated = await updateUserPassword(user._id!.toString(), passwordHash)

    if (!updated) {
      return NextResponse.json(
        { error: "Gagal mengubah password" },
        { status: 500 }
      )
    }

    await markResetCodeUsed(resetCode._id!)

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
