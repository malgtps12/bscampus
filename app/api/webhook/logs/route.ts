import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')

    let query = supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Webhook Logs] Error:', error)
      return NextResponse.json(
        { error: 'Gagal mengambil webhook logs' },
        { status: 500 }
      )
    }

    const webhooks = (data || []).map((log: any) => ({
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
