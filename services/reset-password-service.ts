/**
 * Service untuk manajemen kode reset password dengan rate limiting.
 * Semua penyimpanan via Supabase (users + password_reset_codes) -
 * satu-satunya sumber data, sejalan dengan login/register.
 */

import { RateLimiterMemory } from 'rate-limiter-flexible'
import { supabase } from '@/lib/supabase'
import {
  generateResetCode,
  hashResetCode,
  verifyResetCode,
} from '@/lib/reset-password-helper'

/** Masa berlaku kode reset. */
const CODE_TTL_MINUTES = 10
/** Percobaan salah sebelum kode dibuang. */
const MAX_VERIFY_ATTEMPTS = 5

// Rate limiter untuk forgot-password endpoint (5 requests per 15 menit per IP)
const forgotPasswordLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900,
  keyPrefix: 'forgot_password',
})

// Rate limiter untuk reset-password endpoint (5 attempts per 15 menit per IP)
const resetPasswordLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900,
  keyPrefix: 'reset_password',
})

type ServiceResult<T> = T & { success: boolean; error?: string }

/**
 * Membuat kode reset baru untuk email:
 * generate kode 6 digit -> hash bcrypt -> ganti kode lama (satu kode aktif per email).
 */
export async function createResetCode(
  email: string
): Promise<ServiceResult<{ code: string }>> {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (userError) {
      console.error('[Reset Service] User lookup error:', userError.message)
      return { code: '', success: false, error: userError.message }
    }

    if (!user) {
      return { code: '', success: false, error: 'Email tidak terdaftar' }
    }

    const code = generateResetCode()
    const codeHash = await hashResetCode(code)

    // Satu kode aktif per email - buang kode lama
    const { error: deleteError } = await supabase
      .from('password_reset_codes')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[Reset Service] Delete old code error:', deleteError.message)
      return { code: '', success: false, error: deleteError.message }
    }

    const { error: insertError } = await supabase.from('password_reset_codes').insert({
      user_id: user.id,
      email,
      code_hash: codeHash,
      attempts: 0,
      expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString(),
    })

    if (insertError) {
      console.error('[Reset Service] Insert code error:', insertError.message)
      return { code: '', success: false, error: insertError.message }
    }

    return { code, success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Reset Service] Error creating reset code:', message)
    return { code: '', success: false, error: message }
  }
}

type VerifyResult = { valid: boolean; error?: string }

/**
 * Verifikasi kode reset:
 * cek eksistensi + expiry + attempt limit, lalu bcrypt.compare.
 * Percobaan salah di-increment; kode dibuang setelah MAX_VERIFY_ATTEMPTS.
 */
export async function verifyResetCodeService(
  email: string,
  code: string
): Promise<VerifyResult> {
  try {
    const { data: record, error: findError } = await supabase
      .from('password_reset_codes')
      .select('id, code_hash, attempts, expires_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (findError) {
      console.error('[Reset Service] Find code error:', findError.message)
      return { valid: false, error: 'Gagal memverifikasi kode' }
    }

    if (!record) {
      return { valid: false, error: 'Kode tidak ditemukan atau sudah kadaluarsa' }
    }

    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      await supabase.from('password_reset_codes').delete().eq('id', record.id)
      return { valid: false, error: 'Terlalu banyak percobaan gagal. Silakan minta kode baru' }
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      await supabase.from('password_reset_codes').delete().eq('id', record.id)
      return { valid: false, error: 'Kode sudah kadaluarsa. Silakan minta kode baru' }
    }

    const isValid = await verifyResetCode(code, record.code_hash)

    if (!isValid) {
      const { error: updateError } = await supabase
        .from('password_reset_codes')
        .update({ attempts: record.attempts + 1 })
        .eq('id', record.id)

      if (updateError) {
        console.error('[Reset Service] Increment attempts error:', updateError.message)
      }

      return { valid: false, error: 'Kode tidak valid' }
    }

    return { valid: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Reset Service] Error verifying code:', message)
    return { valid: false, error: message }
  }
}

/**
 * Reset password user berdasarkan kode yang sudah diverifikasi.
 * Update users.password_hash (Supabase) lalu buang kode reset.
 */
export async function resetPasswordService(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verification = await verifyResetCodeService(email, code)

    if (!verification.valid) {
      return { success: false, error: verification.error }
    }

    const bcrypt = await import('bcryptjs')

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (userError) {
      console.error('[Reset Service] User lookup error:', userError.message)
      return { success: false, error: 'Gagal memproses reset password' }
    }

    if (!user) {
      return { success: false, error: 'User tidak ditemukan' }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Reset Service] Update password error:', updateError.message)
      return { success: false, error: 'Gagal menyimpan password baru' }
    }

    // Buang kode setelah dipakai
    const { error: deleteError } = await supabase
      .from('password_reset_codes')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[Reset Service] Delete code error:', deleteError.message)
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Reset Service] Error resetting password:', message)
    return { success: false, error: message }
  }
}

/** Rate limiting check untuk forgot password endpoint */
export async function checkForgotPasswordRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    await forgotPasswordLimiter.consume(ip)
    return { allowed: true }
  } catch (rlRejected) {
    if (rlRejected instanceof Error) {
      console.error('[Rate Limit] Error:', rlRejected)
      return { allowed: false }
    }
    const retryAfterMs = (rlRejected as { msBeforeNext?: number }).msBeforeNext
    return { allowed: false, retryAfter: Math.ceil((retryAfterMs ?? 900000) / 1000) }
  }
}

/** Rate limiting check untuk reset password endpoint */
export async function checkResetPasswordRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    await resetPasswordLimiter.consume(ip)
    return { allowed: true }
  } catch (rlRejected) {
    if (rlRejected instanceof Error) {
      console.error('[Rate Limit] Error:', rlRejected)
      return { allowed: false }
    }
    const retryAfterMs = (rlRejected as { msBeforeNext?: number }).msBeforeNext
    return { allowed: false, retryAfter: Math.ceil((retryAfterMs ?? 900000) / 1000) }
  }
}
