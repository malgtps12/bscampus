import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminJWT } from "@/lib/auth-utils"

export const runtime = 'nodejs'

type WebhookLogRow = {
  id: string
  event: string
  payment_id: string
  status: string
  amount: number
  reference: string | null
  created_at: string
  verified: boolean
  livemode: boolean
  raw_data: unknown
}

/**
 * Monitoring log webhook pembayaran - khusus admin
 * (berisi payload pembayaran mentah/privat).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const bearerToken = authHeader?.split(" ")[1]
    const cookieToken = request.cookies.get("admin_token")?.value

    if (!verifyAdminJWT(bearerToken || cookieToken)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10)
    const status = searchParams.get('status')

    let query = supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number.isFinite(limit) ? limit : 50)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Webhook Logs] Error:', error.message)
      return NextResponse.json(
        { error: 'Gagal mengambil webhook logs' },
        { status: 500 }
      )
    }

    const webhooks = ((data ?? []) as WebhookLogRow[]).map((log) => ({
      id: log.id,
      event: log.event,
      payment_id: log.payment_id,
      status: log.status,
      amount: log.amount,
      reference: log.reference,
      received_at: log.created_at,
      verified: log.verified,
      livemode: log.livemode,
      raw_data: log.raw_data
    }))

    return NextResponse.json({
      success: true,
      webhooks,
      total: webhooks.length
    })
  } catch (error) {
    console.error('[Webhook Logs] Error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
