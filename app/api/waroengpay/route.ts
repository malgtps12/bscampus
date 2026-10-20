import { NextRequest, NextResponse } from "next/server"
import { verifyJWT, verifyAdminJWT } from "@/lib/auth-utils"
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
    // Wajib login - identitas buyer diambil dari token, bukan dari body
    const token = request.cookies.get("user_token")?.value
    const decoded = token ? verifyJWT(token) : null

    if (!decoded || decoded.role !== 'user') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId } = body

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      )
    }

    // Harga & data penjual diambil dari database - bukan dari body request,
    // supaya pembeli tidak bisa memanipulasi nominal pembayaran.
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, title, price, sold, seller_name, seller_student_id")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      )
    }

    if (product.sold) {
      return NextResponse.json(
        { error: "Produk sudah terjual" },
        { status: 400 }
      )
    }

    if (product.seller_student_id === decoded.username) {
      return NextResponse.json(
        { error: "Tidak bisa membeli produk sendiri" },
        { status: 400 }
      )
    }

    const amount = Number(product.price)

    if (!Number.isFinite(amount) || amount < 1000 || amount > 10000000) {
      return NextResponse.json(
        { error: "Harga produk harus antara Rp1.000 - Rp10.000.000" },
        { status: 400 }
      )
    }

    // Identitas pembeli dari token (student_id = username pada klaim JWT)
    const { data: buyer, error: buyerError } = await supabase
      .from("users")
      .select("id, name")
      .eq("student_id", decoded.username)
      .single()

    if (buyerError || !buyer) {
      return NextResponse.json(
        { error: "Akun pembeli tidak ditemukan" },
        { status: 400 }
      )
    }

    // Kolom transactions.seller_id adalah UUID - cari user penjual dari NIM
    const { data: seller, error: sellerError } = await supabase
      .from("users")
      .select("id")
      .eq("student_id", product.seller_student_id)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json(
        { error: "Akun penjual tidak ditemukan" },
        { status: 400 }
      )
    }

    const reference = generateUniqueReference(productId)
    const description = `Pembayaran ${product.title}`

    const paymentData = await createPayment(amount, reference, description)

    if (!paymentData) {
      return NextResponse.json(
        { error: "Gagal membuat tagihan pembayaran" },
        { status: 500 }
      )
    }

    // Catat transaksi dengan payment_id - webhook WaroengPay mencocokkan
    // event pembayaran lewat kolom ini (lihat /api/waroengpay/webhook).
    const { error: insertError } = await supabase.from("transactions").insert({
      product_id: product.id,
      product_title: product.title,
      seller_id: seller.id,
      seller_name: product.seller_name,
      seller_student_id: product.seller_student_id,
      buyer_id: buyer.id,
      buyer_name: buyer.name,
      price: amount,
      status: "pending",
      payment_id: paymentData.id,
    })

    if (insertError) {
      console.error("[WaroengPay] Insert transaction error:", insertError)
      return NextResponse.json(
        { error: "Gagal mencatat transaksi. Silakan coba lagi." },
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
    // Listing pembayaran merchant = data sensitif, khusus admin
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
