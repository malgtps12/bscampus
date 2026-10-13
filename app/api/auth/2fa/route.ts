import { NextRequest, NextResponse } from "next/server"
import speakeasy from "speakeasy"
import QRCode from "qrcode"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    
    const secret = speakeasy.generateSecret({
      name: "BSCampus Admin",
      length: 20,
    })

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "", {
      width: 300,
    })

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: "Scan QR code dengan aplikasi authenticator Anda",
    }, { status: 200 })
  } catch (error) {
    console.error("[2FA Setup] Error:", error)
    return NextResponse.json(
      { error: "Gagal membuat 2FA secret" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, token } = body

    if (!secret || !token) {
      return NextResponse.json(
        { error: "Secret dan token diperlukan" },
        { status: 400 }
      )
    }

    const isValid = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2,
    })

    if (isValid) {
      return NextResponse.json({
        valid: true,
        message: "2FA berhasil diverifikasi",
      }, { status: 200 })
    } else {
      return NextResponse.json({
        valid: false,
        error: "Kode 2FA tidak valid",
      }, { status: 401 })
    }
  } catch (error) {
    console.error("[2FA Verify] Error:", error)
    return NextResponse.json(
      { error: "Gagal memverifikasi 2FA" },
      { status: 500 }
    )
  }
}
