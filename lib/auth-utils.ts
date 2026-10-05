const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "MXLERA"
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || ""
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const RATE_LIMIT_WINDOW = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

const loginAttempts = new Map<string, { count: number; resetTime: number }>()

export function generateJWT(username: string): string {
  const payload = {
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  }
  
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

export function verifyJWT(token: string): { username: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    const now = Math.floor(Date.now() / 1000)
    
    if (payload.exp < now) {
      return null
    }
    
    return { username: payload.username }
  } catch (error) {
    return null
  }
}

export function validateInput(input: string): boolean {
  if (!input || typeof input !== 'string') return false
  if (input.length > 100) return false
  
  const sqlInjectionPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
    /(-{2}|\/\*|\*\/|;|\|{2}|&&)/,
    /('|")(.*)(--|-#|\/\*|\*\/|xp_|sp_)/i,
  ]
  
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(input)) return false
  }
  
  return true
}

export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempt = loginAttempts.get(ip)
  
  if (!attempt) {
    loginAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (now > attempt.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (attempt.count >= MAX_ATTEMPTS) {
    return false
  }
  
  attempt.count++
  return true
}

export function sanitizeUsername(username: string): string {
  return username.trim().replace(/[^a-zA-Z0-9_-]/g, '')
}
