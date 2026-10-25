import crypto from "crypto"

/**
 * Utilitas verifikasi webhook WaroengPay (QRIS) - murni kriptografi,
 * tanpa dependensi Next.js, supaya mudah diuji unit.
 *
 * Skema signature (https://waroengpay.com/docs.md):
 *   X-Signature = hex HMAC-SHA256(secret, "<X-WaroengPay-Timestamp>.<raw body>")
 */

/** Toleransi umur request webhook (detik) untuk mencegah replay. */
export const TIMESTAMP_TOLERANCE_SECONDS = 300

/**
 * Verifikasi `X-Signature`. Secret dibaca saat pemanggilan (bukan saat modul
 * dimuat) agar tidak "membeku" bila env di-set setelah import.
 */
export function verifyWaroengPaySignature(
  timestamp: string,
  body: string,
  signature: string,
  secret: string | undefined = process.env.WAROENGPAY_WEBHOOK_SECRET
): boolean {
  if (!secret || !signature) return false

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex")

  return (
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  )
}

/**
 * Cek header timestamp ada dan masih dalam jendela toleransi.
 * `Number.isFinite` menangkap header hilang (NaN) yang sebelumnya lolos.
 */
export function isWaroengPayTimestampFresh(
  timestamp: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): boolean {
  const requestTime = Number.parseInt(timestamp, 10)
  return (
    Number.isFinite(requestTime) &&
    Math.abs(nowSeconds - requestTime) <= TIMESTAMP_TOLERANCE_SECONDS
  )
}
