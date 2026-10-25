import { NextRequest, NextResponse } from "next/server"
import { handleWaroengPayWebhook } from "@/lib/waroengpay-webhook"

export const runtime = "nodejs"

/**
 * Alias singkat untuk menerima webhook WaroengPay (QRIS).
 *   https://<domain>/webhook/waroengpay
 *
 * Memakai handler yang sama persis dengan `/api/waroengpay/webhook`
 * (lihat `lib/waroengpay-webhook.ts`), jadi signature, timestamp,
 * idempotency, dan pencocokan nominal tetap konsisten.
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
