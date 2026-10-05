import { NextRequest, NextResponse } from "next/server"
import {
  validateInput,
  checkRateLimit,
  generateJWT,
} from "@/lib/auth-utils"

export const runtime = 'nodejs'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "MXLERA"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "2026583020043"

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    
    if (!checkRateLimit(ip)) {
      console.warn(`[Security] Rate limit exceeded for IP: ${ip}`)
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

    if (!validateInput(username) || !validateInput(password)) {
      console.warn(`[Security] Invalid input detected for IP: ${ip}`)
      return NextResponse.json(
        { error: "Input tidak valid" },
        { status: 400 }
      )
    }

    if (username.trim() !== ADMIN_USERNAME) {
      console.warn(`[Security] Failed login attempt - invalid username from IP: ${ip}`)
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      )
    }

    if (password !== ADMIN_PASSWORD) {
      console.warn(`[Security] Failed login attempt - invalid password from IP: ${ip}`)
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      )
    }

    const token = generateJWT(username)

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
