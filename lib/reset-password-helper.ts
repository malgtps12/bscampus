/**
 * Helper functions untuk generate dan verifikasi kode reset
 */

import crypto from 'crypto'
import bcrypt from 'bcryptjs'

/**
 * Generate kode reset 6 digit menggunakan crypto.randomInt (aman)
 * Selalu mengembalikan 6 digit dengan padding nol di depan
 */
export function generateResetCode(): string {
  // Generate random number 0-999999
  const code = crypto.randomInt(0, 1000000)
  // Padding dengan nol di depan supaya selalu 6 digit
  return code.toString().padStart(6, '0')
}

/**
 * Hash kode reset menggunakan bcrypt
 * Kode tidak disimpan dalam bentuk plain text untuk keamanan
 */
export async function hashResetCode(code: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(code, saltRounds)
}

/**
 * Verifikasi kode reset dengan hash yang tersimpan
 */
export async function verifyResetCode(code: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(code, hash)
}

/**
 * Validasi format kode (harus 6 digit angka)
 */
export function validateResetCodeFormat(code: string): boolean {
  return /^\d{6}$/.test(code)
}

/**
 * Validasi password baru (minimal 8 karakter)
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password minimal 8 karakter' }
  }
  return { valid: true }
}

/**
 * Validasi email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
