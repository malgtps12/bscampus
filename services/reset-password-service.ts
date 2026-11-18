/**
 * Service untuk manajemen kode reset password dengan rate limiting.
 * Kode dibuat dan diverifikasi sepenuhnya oleh RPC di database
 * (migrations/007_password_reset_rpc.sql), sehingga tabel kode tidak
 * perlu diakses langsung oleh aplikasi.
 */

import { RateLimiterMemory } from "rate-limiter-flexible";
import { supabase } from "@/lib/supabase";

// Rate limiter aplikasi (IP). Database juga membatasi 3 kode / 15 menit / email.
const forgotPasswordLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900,
  keyPrefix: "forgot_password",
});

const resetPasswordLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900,
  keyPrefix: "reset_password",
});

const changePasswordLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900,
  keyPrefix: "change_password",
});

type ServiceResult<T> = T & { success: boolean; error?: string };

/**
 * Minta kode 6 digit baru. RPC mengembalikan kode plaintext hanya sekali;
 * aplikasi lalu mengirimnya lewat Brevo. Mengembalikan success=false bila
 * email tidak terdaftar atau rate limit database tercapai.
 */
export async function createResetCode(
  email: string,
): Promise<ServiceResult<{ code: string }>> {
  try {
    const { data, error } = await supabase.rpc("create_password_reset_code", {
      p_email: email,
    });

    if (error) {
      console.error("[Reset Service] Create code RPC error:", error.message);
      return {
        code: "",
        success: false,
        error: "Gagal membuat kode reset",
      };
    }

    if (typeof data !== "string" || !/^\d{6}$/.test(data)) {
      return {
        code: "",
        success: false,
        error: "Email tidak terdaftar atau terlalu banyak permintaan",
      };
    }

    return { code: data, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Reset Service] Error creating reset code:", message);
    return { code: "", success: false, error: message };
  }
}

async function checkRateLimit(
  limiter: RateLimiterMemory,
  key: string,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    await limiter.consume(key);
    return { allowed: true };
  } catch (rejected) {
    if (rejected instanceof Error) {
      console.error("[Rate Limit] Error:", rejected);
      return { allowed: false };
    }
    const retryAfterMs = (rejected as { msBeforeNext?: number }).msBeforeNext;
    return {
      allowed: false,
      retryAfter: Math.ceil((retryAfterMs ?? 900_000) / 1000),
    };
  }
}

/** Rate limiting check untuk endpoint forgot password. */
export function checkForgotPasswordRateLimit(ip: string) {
  return checkRateLimit(forgotPasswordLimiter, ip);
}

/** Rate limiting check untuk endpoint reset password. */
export function checkResetPasswordRateLimit(ip: string) {
  return checkRateLimit(resetPasswordLimiter, ip);
}

/** Rate limiting check untuk endpoint ganti password dari akun. */
export function checkChangePasswordRateLimit(key: string) {
  return checkRateLimit(changePasswordLimiter, key);
}
