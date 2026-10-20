import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import {
  validateInput,
  validatePasswordLength,
  checkAdminRateLimit,
  generateJWT,
  getClientIp,
} from "@/lib/auth-utils"

export const runtime = 'nodejs'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) {
    // Tetap lakukan perbandingan supaya durasi tidak membocorkan panjang password
    crypto.timingSafeEqual(bufferA, bufferA)
    return false
  }
  return crypto.timingSafeEqual(bufferA, bufferB)
}

export async function POST(request: NextRequest) {
  try {
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error("[Security] ADMIN_USERNAME / ADMIN_PASSWORD belum di-set di environment")
      return NextResponse.json(
        { error: "Login admin belum dikonfigurasi di server." },
        { status: 503 }
      )
    }

    const ip = getClientIp(request)

    if (!checkAdminRateLimit(ip)) {
      console.warn(`[Security] Rate limit admin login exceeded for IP: ${ip}`)
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Coba lagi nanti." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password harus diisi" },
        { status: 400 }
      )
    }

    if (!validateInput(username) || !validatePasswordLength(password)) {
      console.warn(`[Security] Invalid input detected for IP: ${ip}`)
      return NextResponse.json(
        { error: "Input tidak valid" },
        { status: 400 }
      )
    }

    const usernameMatches = safeEqual(username.trim(), ADMIN_USERNAME)
    const passwordMatches = safeEqual(password, ADMIN_PASSWORD)

    if (!usernameMatches || !passwordMatches) {
      console.warn(`[Security] Failed admin login attempt from IP: ${ip}`)
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      )
    }

    const token = generateJWT(ADMIN_USERNAME, "admin")

    const response = NextResponse.json(
      { success: true, token },
      { status: 200 }
    )

    response.cookies.set({
      name: "admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
      path: "/",
    })

    console.info(`[Security] Successful admin login from IP: ${ip}`)
    return response
  } catch (error) {
    console.error("[Security] Login endpoint error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
