import { NextRequest, NextResponse } from "next/server"
import { handleWaroengPayWebhook } from "@/lib/waroengpay-webhook"

export const runtime = "nodejs"

/**
 * Endpoint webhook WaroengPay (QRIS) - path kanonik.
 * Daftarkan URL ini di dashboard WaroengPay:
 *   https://<domain>/api/waroengpay/webhook
 *
 * Logika lengkap ada di `lib/waroengpay-webhook.ts` dan dipakai bersama
 * dengan alias `/webhook/waroengpay`.
 */
export async function POST(request: NextRequest) {
  return handleWaroengPayWebhook(request)
}

/** Health check sederhana untuk memastikan endpoint aktif setelah deploy. */
export async function GET() {
  return NextResponse.json({
    endpoint: "waroengpay-webhook",
    method: "POST",
    status: "ready",
  })
}
