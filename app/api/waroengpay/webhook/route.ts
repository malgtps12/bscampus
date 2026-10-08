import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import crypto from "crypto"

export const runtime = 'nodejs'

const WEBHOOK_SECRET = process.env.WAROENGPAY_WEBHOOK_SECRET

function verifySignature(timestamp: string, body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false
  
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex')
  
  return signature.length === expectedSignature.length && 
         crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const timestamp = request.headers.get('x-waroengpay-timestamp') || ''
    const signature = request.headers.get('x-signature') || ''

    const currentTime = Math.floor(Date.now() / 1000)
    const requestTime = parseInt(timestamp)
    const timeDiff = Math.abs(currentTime - requestTime)

    if (timeDiff > 300) {
      console.error('[WaroengPay Webhook] Timestamp too old or future')
      return NextResponse.json({ error: 'Invalid timestamp' }, { status: 401 })
    }

    if (!verifySignature(timestamp, body, signature)) {
      console.error('[WaroengPay Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)

    if (event.livemode === false) {
      console.log('[WaroengPay Webhook] Test mode event - ignoring')
      return NextResponse.json({ received: true }, { status: 200 })
    }

    console.log('[WaroengPay Webhook] Event received:', event.event, event.data.id)

    if (event.event === 'payment.paid') {
      const paymentData = event.data

      const { data: transaction, error: findError } = await supabase
        .from('transactions')
        .select('*')
        .eq('payment_id', paymentData.id)
        .single()

      if (findError && findError.code !== 'PGRST116') {
        console.error('[WaroengPay Webhook] Find transaction error:', findError)
        return NextResponse.json({ received: true }, { status: 200 })
      }

      if (!transaction) {
        console.warn('[WaroengPay Webhook] Transaction not found for payment:', paymentData.id)
        return NextResponse.json({ received: true }, { status: 200 })
      }

      if (paymentData.base_amount !== transaction.price) {
        console.error('[WaroengPay Webhook] Amount mismatch:', {
          expected: transaction.price,
          received: paymentData.base_amount
        })
        return NextResponse.json({ received: true }, { status: 200 })
      }

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'paid',
          paid_at: paymentData.paid_at,
          payment_method: paymentData.payment?.issuer || 'QRIS',
          notes: `Dibayar via ${paymentData.payment?.issuer || 'QRIS'} - ${paymentData.payment?.payer || ''}`
        })
        .eq('id', transaction.id)

      if (updateError) {
        console.error('[WaroengPay Webhook] Update transaction error:', updateError)
        return NextResponse.json({ received: true }, { status: 200 })
      }

      const { error: productError } = await supabase
        .from('products')
        .update({ sold: true })
        .eq('id', transaction.product_id)

      if (productError) {
        console.error('[WaroengPay Webhook] Update product error:', productError)
      }

      console.log('[WaroengPay Webhook] Payment processed successfully:', transaction.id)
    }

    if (event.event === 'payment.expired') {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'expired' })
        .eq('payment_id', event.data.id)

      if (updateError) {
        console.error('[WaroengPay Webhook] Update expired error:', updateError)
      }
    }

    if (event.event === 'payment.cancelled') {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'cancelled' })
        .eq('payment_id', event.data.id)

      if (updateError) {
        console.error('[WaroengPay Webhook] Update cancelled error:', updateError)
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[WaroengPay Webhook] Error:', error)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
