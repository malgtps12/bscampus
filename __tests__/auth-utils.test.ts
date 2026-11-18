import {
  validateInput,
  checkRateLimit,
  recordFailedLogin,
  clearLoginFailures,
  checkRegisterRateLimit,
} from '@/lib/auth-utils'

describe('Auth Utils', () => {
  describe('validateInput', () => {
    it('should reject empty input', () => {
      expect(validateInput('')).toBe(false)
    })

    it('should reject input longer than 100 characters', () => {
      const longInput = 'a'.repeat(101)
      expect(validateInput(longInput)).toBe(false)
    })

    it('should reject SQL injection patterns', () => {
      expect(validateInput("'; DROP TABLE users--")).toBe(false)
      expect(validateInput('UNION SELECT * FROM users')).toBe(false)
      expect(validateInput('1/**/OR/**/1=1')).toBe(false)
    })

    it('should accept valid input', () => {
      expect(validateInput('valid_input')).toBe(true)
      expect(validateInput('user@example.com')).toBe(true)
    })
  })

  describe('checkRateLimit', () => {
    it('should allow first attempt and not consume on status checks', () => {
      const ip = '192.168.1.1'
      clearLoginFailures(ip)
      expect(checkRateLimit(ip)).toBe(true)
      expect(checkRateLimit(ip)).toBe(true)
    })

    it('should block after 5 failed logins', () => {
      const ip = '192.168.1.2'
      clearLoginFailures(ip)
      for (let i = 0; i < 4; i++) {
        recordFailedLogin(ip)
        expect(checkRateLimit(ip)).toBe(true)
      }
      recordFailedLogin(ip)
      expect(checkRateLimit(ip)).toBe(false)
    })

    it('should unlock 30 seconds after the first failed login', () => {
      const ip = '192.168.1.5'
      jest.useFakeTimers()
      try {
        clearLoginFailures(ip)
        for (let i = 0; i < 5; i++) {
          recordFailedLogin(ip)
        }
        expect(checkRateLimit(ip)).toBe(false)

        jest.advanceTimersByTime(30_000)
        expect(checkRateLimit(ip)).toBe(true)
      } finally {
        jest.useRealTimers()
      }
    })

    it('should clear failures after a successful login', () => {
      const ip = '192.168.1.6'
      clearLoginFailures(ip)
      for (let i = 0; i < 5; i++) {
        recordFailedLogin(ip)
      }
      expect(checkRateLimit(ip)).toBe(false)

      clearLoginFailures(ip)
      expect(checkRateLimit(ip)).toBe(true)
    })
  })

  describe('checkRegisterRateLimit', () => {
    it('should allow first registration attempt', () => {
      const ip = '192.168.1.3'
      expect(checkRegisterRateLimit(ip)).toBe(true)
    })

    it('should allow multiple attempts within limit', () => {
      const ip = '192.168.1.4'
      for (let i = 0; i < 10; i++) {
        expect(checkRegisterRateLimit(ip)).toBe(true)
      }
      expect(checkRegisterRateLimit(ip)).toBe(false)
    })
  })
})
