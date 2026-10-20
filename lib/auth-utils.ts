import jwt from 'jsonwebtoken'
import type { NextRequest } from 'next/server'

export type TokenRole = 'admin' | 'user'

export interface AuthPayload {
  username: string
  role: TokenRole
}

const JWT_EXPIRES_IN = '24h'
const DEV_JWT_SECRET = 'bscampus-dev-only-secret-do-not-use-in-production'

const RATE_LIMIT_WINDOW = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
const REGISTER_RATE_LIMIT_WINDOW = 60 * 60 * 1000
const MAX_REGISTER_ATTEMPTS = 10

type AttemptRecord = { count: number; resetTime: number }

// Bucket terpisah supaya kegagalan login admin tidak mengunci login siswa (dan sebaliknya)
const loginAttempts = new Map<string, AttemptRecord>()
const adminLoginAttempts = new Map<string, AttemptRecord>()
const registerAttempts = new Map<string, AttemptRecord>()
const apiCallAttempts = new Map<string, AttemptRecord>()

/**
 * Ambil secret JWT. Wajib ada di production - jika tidak, operasi token gagal
 * (fail closed) alih-alih memakai secret lemah yang bisa dipalsukan.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (secret && secret.length > 0) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET belum dikonfigurasi')
  }
  return DEV_JWT_SECRET
}

/** Buat token JWT bertanda tangan (HMAC-SHA256) dengan klaim role. */
export function generateJWT(username: string, role: TokenRole = 'user'): string {
  return jwt.sign({ username, role }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN })
}

/** Verifikasi tanda tangan + expired. Token lama yang tidak ditandatangani otomatis ditolak. */
export function verifyJWT(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    if (typeof decoded === 'string') return null

    const payload = decoded as jwt.JwtPayload
    const username = payload.username
    const role = payload.role

    if (typeof username !== 'string' || username.length === 0) return null
    if (role !== 'admin' && role !== 'user') return null

    return { username, role }
  } catch {
    return null
  }
}

/** Verifikasi token yang WAJIB ber-role admin. Dipakai semua endpoint /api/admin/*. */
export function verifyAdminJWT(token: string | undefined | null): AuthPayload | null {
  if (!token) return null
  const payload = verifyJWT(token)
  if (!payload || payload.role !== 'admin') return null
  return payload
}

/**
 * IP client yang bisa dipercaya: ambil hop terakhir dari x-forwarded-for
 * (header pertama bisa dipalsukan client, hop terakhir ditambah proxy tepercaya).
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const hops = forwarded.split(',').map((hop) => hop.trim()).filter(Boolean)
    if (hops.length > 0) return hops[hops.length - 1]
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

/** Validasi input untuk identifier (NIM, nama) - bukan untuk password. */
export function validateInput(input: string): boolean {
  if (!input || typeof input !== 'string') return false
  if (input.length > 100) return false

  const sqlInjectionPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
    /(\/\*|\*\/|;|\|{2})/,
    /('|")(.*)(--|xp_|sp_)/i,
  ]

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(input)) return false
  }

  return true
}

/**
 * Validasi panjang password saja (semua query sudah parameterized,
 * filter kata SQL di password hanya menyulitkan user).
 */
export function validatePasswordLength(input: unknown): input is string {
  return typeof input === 'string' && input.length > 0 && input.length <= 100
}

/** Buang record yang sudah kedaluwarsa supaya Map tidak tumbuh tanpa batas. */
function pruneExpired(map: Map<string, AttemptRecord>, now: number): void {
  if (map.size === 0) return
  for (const [key, record] of map) {
    if (now > record.resetTime) map.delete(key)
  }
}

function consumeAttempt(
  map: Map<string, AttemptRecord>,
  key: string,
  windowMs: number,
  maxAttempts: number
): boolean {
  const now = Date.now()
  pruneExpired(map, now)

  const attempt = map.get(key)

  if (!attempt || now > attempt.resetTime) {
    map.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (attempt.count >= maxAttempts) {
    return false
  }

  attempt.count++
  return true
}

export function checkRateLimit(ip: string): boolean {
  return consumeAttempt(loginAttempts, ip, RATE_LIMIT_WINDOW, MAX_ATTEMPTS)
}

export function checkAdminRateLimit(ip: string): boolean {
  return consumeAttempt(adminLoginAttempts, ip, RATE_LIMIT_WINDOW, MAX_ATTEMPTS)
}

export function checkRegisterRateLimit(ip: string): boolean {
  return consumeAttempt(registerAttempts, ip, REGISTER_RATE_LIMIT_WINDOW, MAX_REGISTER_ATTEMPTS)
}

export function checkApiRateLimit(ip: string, limit: number = 100): boolean {
  return consumeAttempt(apiCallAttempts, ip, 60 * 1000, limit)
}

export function sanitizeUsername(username: string): string {
  return username.trim().replace(/[^a-zA-Z0-9_-]/g, '')
}

export function resetRateLimit(ip: string) {
  loginAttempts.delete(ip)
  adminLoginAttempts.delete(ip)
  registerAttempts.delete(ip)
  apiCallAttempts.delete(ip)
}
