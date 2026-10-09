/**
 * API Endpoint: /api/auth/reset-password
 * Reset password dengan kode verifikasi 6 digit
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateResetCodeFormat, validatePassword } from '@/lib/reset-password-helper'
import { resetPasswordService } from '@/services/reset-password-service'
import { checkResetPasswordRateLimit } from '@/services/reset-password-service'
import { validateEmail } from '@/lib/reset-password-helper'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitCheck = await checkResetPasswordRateLimit(ip)
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
        { status: 429, headers: { 'Retry-After': rateLimitCheck.retryAfter?.toString() || '900' } }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { email, code, newPassword, confirmPassword } = body
    
    // Validasi input required
    if (!email || !code || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      )
    }
    
    // Validasi email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }
    
    // Validasi kode 6 digit
    if (!validateResetCodeFormat(code)) {
      return NextResponse.json(
        { error: 'Kode harus 6 digit angka' },
        { status: 400 }
      )
    }
    
    // Validasi password minimal 8 karakter
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }
    
    // Validasi password dan konfirmasi password sama
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Password dan konfirmasi password tidak cocok' },
        { status: 400 }
      )
    }
    
    // Reset password service
    const result = await resetPasswordService(
      email.toLowerCase(),
      code,
      newPassword
    )
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Gagal reset password' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset. Silakan login dengan password baru.'
    })
    
  } catch (error: any) {
    console.error('[Reset Password] Error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
