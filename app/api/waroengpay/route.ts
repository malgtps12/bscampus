import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = 'nodejs'

const WAROENGPAY_API_KEY = process.env.WAROENGPAY_API_KEY
const WAROENGPAY_BASE_URL = "https://waroengpay.com"

function generateUniqueReference(productId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `INV-${productId.slice(0, 6)}-${timestamp}${random}`
}

async function createPayment(amount: number, reference: string, description: string) {
  try {
    const response = await fetch(`${WAROENGPAY_BASE_URL}/api/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WAROENGPAY_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': reference
      },
      body: JSON.stringify({
        amount,
        reference,
        description,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/waroengpay/webhook`,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/transactions/success`
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[WaroengPay] Create payment error:', errorData)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[WaroengPay] Create payment API error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  if (!WAROENGPAY_API_KEY) {
    return NextResponse.json(
      { error: "Payment gateway belum dikonfigurasi" },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { amount, productId, productName, userId, buyerId } = body

    if (!amount || !productId || !userId) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      )
    }

    if (amount < 1000 || amount > 10000000) {
      return NextResponse.json(
        { error: "Jumlah harus antara Rp1.000 - Rp10.000.000" },
        { status: 400 }
      )
    }

    const reference = generateUniqueReference(productId)
    const description = `Pembayaran ${productName || 'Produk'}`

    const paymentData = await createPayment(amount, reference, description)

    if (!paymentData) {
      return NextResponse.json(
        { error: "Gagal membuat tagihan pembayaran" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: paymentData.id,
        reference: paymentData.reference,
        pay_url: paymentData.pay_url,
        qris: paymentData.qris,
        amount: paymentData.amount,
        expires_at: paymentData.expires_at
      }
    })
  } catch (error) {
    console.error('[WaroengPay] Error:', error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  if (!WAROENGPAY_API_KEY) {
    return NextResponse.json(
      { error: "Payment gateway belum dikonfigurasi" },
      { status: 500 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const params = new URLSearchParams()
    if (status) params.append('status', status)
    params.append('limit', limit.toString())

    const response = await fetch(`${WAROENGPAY_BASE_URL}/api/payments?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${WAROENGPAY_API_KEY}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: errorData.error }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[WaroengPay] List payments error:', error)
    return NextResponse.json(
      { error: "Terjadi kesalahan" },
      { status: 500 }
    )
  }
}
