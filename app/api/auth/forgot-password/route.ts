/**
 * API Endpoint: /api/auth/forgot-password
 * Mengirim kode reset password 6 digit ke email
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateEmail } from '@/lib/reset-password-helper'
import { createResetCode } from '@/services/reset-password-service'
import { checkForgotPasswordRateLimit } from '@/services/reset-password-service'
import { sendResetCodeEmail } from '@/lib/email-service'
import { User } from '@/models/User'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
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
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email harus diisi' },
        { status: 400 }
      )
    }
    
    // Validasi format email
    if (!validateEmail(email)) {
      // Tetap return response yang sama untuk keamanan
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, kode reset akan dikirim ke email Anda.'
      })
    }
    
    // Cek apakah email terdaftar
    const user = await User.findOne({ email })
    
    // Untuk keamanan, selalu return response yang sama
    // meskipun email tidak terdaftar
    if (!user) {
      console.log(`[Forgot Password] Email tidak terdaftar: ${email}`)
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, kode reset akan dikirim ke email Anda.'
      })
    }
    
    // Buat kode reset baru (auto-replace kode lama)
    const result = await createResetCode(email.toLowerCase())
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Gagal membuat kode reset' },
        { status: 500 }
      )
    }
    
    // Kirim email dengan kode
    const emailResult = await sendResetCodeEmail(email, result.code)
    
    if (!emailResult.success) {
      // Tetap return success response untuk keamanan
      console.error('[Forgot Password] Email sending failed:', emailResult.error)
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, kode reset akan dikirim ke email Anda.'
      })
    }
    
    // Log untuk development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Development] Reset code for ${email}: ${result.code}`)
    }
    
    // Response standar untuk semua kasus (keamanan)
    return NextResponse.json({
      success: true,
      message: 'Jika email terdaftar, kode reset akan dikirim ke email Anda.'
    })
    
  } catch (error: any) {
    console.error('[Forgot Password] Error:', error)
    return NextResponse.json({
      success: true,
      message: 'Jika email terdaftar, kode reset akan dikirim ke email Anda.'
    })
  }
}
