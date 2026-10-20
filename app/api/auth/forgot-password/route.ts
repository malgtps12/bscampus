/**
 * API Endpoint: /api/auth/forgot-password
 * Mengirim kode reset password 6 digit ke email
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateEmail } from '@/lib/reset-password-helper'
import {
  createResetCode,
  checkForgotPasswordRateLimit,
} from '@/services/reset-password-service'
import { sendResetCodeEmail } from '@/lib/email'
import { getClientIp } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

/** Respons identik untuk semua kondisi - mencegah email enumeration. */
function genericResponse() {
  return NextResponse.json({
    success: true,
    message: 'Jika email terdaftar, kode reset akan dikirim ke email Anda.',
  })
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIp(request)
    const rateLimitCheck = await checkForgotPasswordRateLimit(ip)

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
        { status: 429, headers: { 'Retry-After': rateLimitCheck.retryAfter?.toString() || '900' } }
      )
    }

    // Parse request body
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email harus diisi' },
        { status: 400 }
      )
    }

    // Normalisasi: trim saja - penyimpanan harus case-preserving agar cocok
    // dengan data di tabel users
    const targetEmail = email.trim()

    // Validasi format email
    if (!validateEmail(targetEmail)) {
      return genericResponse()
    }

    // Cek apakah email terdaftar (Supabase - sumber data yang sama dengan login)
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', targetEmail)
      .maybeSingle()

    if (error) {
      console.error('[Forgot Password] User lookup error:', error.message)
    }

    // Untuk keamanan, selalu return response yang sama
    // meskipun email tidak terdaftar
    if (!user) {
      return genericResponse()
    }

    // Buat kode reset baru (auto-replace kode lama)
    const result = await createResetCode(targetEmail)

    if (!result.success) {
      console.error('[Forgot Password] Failed to create reset code:', result.error)
      return NextResponse.json(
        { error: 'Gagal membuat kode reset' },
        { status: 500 }
      )
    }

    // Kirim email dengan kode
    const emailResult = await sendResetCodeEmail(targetEmail, result.code)

    if (!emailResult) {
      // Jangan pernah log kode reset - cukup catat bahwa pengiriman gagal
      console.error(`[Forgot Password] Email sending failed for: ${targetEmail}`)
    }

    return genericResponse()
  } catch (error) {
    console.error('[Forgot Password] Error:', error)
    return genericResponse()
  }
}
