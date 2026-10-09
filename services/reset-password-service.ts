/**
 * Service untuk manajemen kode reset password dengan rate limiting
 */

import { RateLimiterMemory } from 'rate-limiter-flexible'
import { ResetPassword } from '@/models/ResetPassword'
import { hashResetCode, verifyResetCode } from '@/lib/reset-password-helper'

// Rate limiter untuk forgot-password endpoint (5 requests per 15 menit per IP)
const forgotPasswordLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 900, // 15 menit
  keyPrefix: 'forgot_password'
})

// Rate limiter untuk reset-password endpoint (5 attempts per 15 menit per IP)
const resetPasswordLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900,
  keyPrefix: 'reset_password'
})

/**
 * Membuat kode reset baru untuk email
 * - Generate kode 6 digit acak
 * - Hash kode dengan bcrypt
 * - Delete kode lama jika ada
 * - Simpan kode baru ke database
 */
export async function createResetCode(email: string): Promise<{ code: string; success: boolean; error?: string }> {
  try {
    // Generate kode 6 digit acak
    const { generateResetCode, hashResetCode } = await import('@/lib/reset-password-helper')
    const code = generateResetCode()
    
    // Hash kode sebelum disimpan
    const codeHash = await hashResetCode(code)
    
    // Delete kode lama untuk email ini (satu kode aktif per email)
    await ResetPassword.deleteOne({ email })
    
    // Simpan kode baru
    await ResetPassword.create({
      email,
      codeHash,
      attempts: 0
    })
    
    return { code, success: true }
  } catch (error: any) {
    console.error('[Reset Service] Error creating reset code:', error)
    return { code: '', success: false, error: error.message }
  }
}

/**
 * Verifikasi kode reset
 * - Cek apakah ada kode untuk email
 * - Verifikasi kode dengan bcrypt.compare
 * - Increment attempt counter jika salah
 * - Delete kode jika attempt > 5
 */
export async function verifyResetCodeService(
  email: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Cari kode untuk email
    const resetRecord = await ResetPassword.findOne({ email })
    
    if (!resetRecord) {
      return { valid: false, error: 'Kode tidak ditemukan atau sudah kadaluarsa' }
    }
    
    // Cek apakah attempt sudah melebihi batas
    if (resetRecord.attempts >= 5) {
      await ResetPassword.deleteOne({ email })
      return { valid: false, error: 'Terlalu banyak percobaan gagal. Silakan minta kode baru' }
    }
    
    // Verifikasi kode dengan bcrypt
    const isValid = await verifyResetCode(code, resetRecord.codeHash)
    
    if (!isValid) {
      // Increment attempt counter
      await ResetPassword.updateOne(
        { email },
        { $inc: { attempts: 1 } }
      )
      
      return { valid: false, error: 'Kode tidak valid' }
    }
    
    return { valid: true }
  } catch (error: any) {
    console.error('[Reset Service] Error verifying code:', error)
    return { valid: false, error: error.message }
  }
}

/**
 * Reset password dengan kode yang sudah diverifikasi
 * - Cari user by email
 * - Hash password baru
 * - Update password user
 * - Delete kode reset
 */
export async function resetPasswordService(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verifikasi kode terlebih dahulu
    const verification = await verifyResetCodeService(email, code)
    
    if (!verification.valid) {
      return { success: false, error: verification.error }
    }
    
    // Import bcrypt untuk hash password baru
    const bcrypt = await import('bcryptjs')
    
    // Cari user
    const { User } = await import('@/models/User')
    const user = await User.findOne({ email })
    
    if (!user) {
      return { success: false, error: 'User tidak ditemukan' }
    }
    
    // Hash password baru
    const passwordHash = await bcrypt.hash(newPassword, 10)
    
    // Update password user
    user.passwordHash = passwordHash
    user.updatedAt = new Date()
    await user.save()
    
    // Delete kode reset setelah digunakan
    await ResetPassword.deleteOne({ email })
    
    return { success: true }
  } catch (error: any) {
    console.error('[Reset Service] Error resetting password:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Rate limiting check untuk forgot password endpoint
 */
export async function checkForgotPasswordRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const res = await forgotPasswordLimiter.consume(ip)
    return { allowed: true }
  } catch (rlRejected: any) {
    if (rlRejected instanceof Error) {
      console.error('[Rate Limit] Error:', rlRejected)
      return { allowed: false }
    } else {
      return { allowed: false, retryAfter: Math.ceil(rlRejected.msBeforeNext / 1000) }
    }
  }
}

/**
 * Rate limiting check untuk reset password endpoint
 */
export async function checkResetPasswordRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const res = await resetPasswordLimiter.consume(ip)
    return { allowed: true }
  } catch (rlRejected: any) {
    if (rlRejected instanceof Error) {
      console.error('[Rate Limit] Error:', rlRejected)
      return { allowed: false }
    } else {
      return { allowed: false, retryAfter: Math.ceil(rlRejected.msBeforeNext / 1000) }
    }
  }
}
