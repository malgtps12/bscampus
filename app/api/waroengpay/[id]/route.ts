import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth-utils"
import { supabase } from "@/lib/supabase"

export const runtime = 'nodejs'

const WAROENGPAY_API_KEY = process.env.WAROENGPAY_API_KEY
const WAROENGPAY_BASE_URL = "https://waroengpay.com"

/**
 * Cek status tagihan WaroengPay milik user yang login.
 *
 * Pembeli bisa polling endpoint ini (mis. tiap 5 detik) untuk tahu
 * kapan pembayarannya lunas tanpa bergantung pada webhook.
 * Idempotency tetap dijaga: hanya transaksi milik caller yang bisa
 * dibaca, dan sinkronisasi status dilakukan server-side.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!WAROENGPAY_API_KEY) {
    return NextResponse.json(
      { error: "Payment gateway belum dikonfigurasi" },
      { status: 500 }
    )
  }

  try {
    const { id } = await params
    const token = request.cookies.get("user_token")?.value
    const decoded = token ? verifyJWT(token) : null

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Cari transaksi milik caller dengan payment_id ini
    const { data: buyer } = await supabase
      .from("users")
      .select("id")
      .eq("student_id", decoded.username)
      .single()

    if (!buyer) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    const { data: transaction } = await supabase
      .from("transactions")
      .select("id, status, payment_id, price, product_id")
      .eq("payment_id", id)
      .eq("buyer_id", buyer.id)
      .maybeSingle()

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      )
    }

    // Jika sudah final di DB, tidak perlu cek ke WaroengPay
    if (transaction.status === "paid" || transaction.status === "expired" || transaction.status === "cancelled") {
      return NextResponse.json({ status: transaction.status, source: "database" })
    }

    // Ambil status terbaru dari WaroengPay
    const response = await fetch(`${WAROENGPAY_BASE_URL}/api/payments/${id}`, {
      headers: { Authorization: `Bearer ${WAROENGPAY_API_KEY}` },
    })

    if (!response.ok) {
      // Bisa jadi tagihan test dibaca dengan key live atau sebaliknya
      const errorData = await response.json().catch(() => ({ error: "unknown" }))
      console.error("[WaroengPay Status] API error:", errorData)
      return NextResponse.json(
        { status: transaction.status, source: "database", warning: "Tidak dapat menghubungi WaroengPay" },
        { status: 200 }
      )
    }

    const payment = await response.json()

    // Sinkronkan status final ke database (webhook mungkin belum sampai,
    // mis. saat development lokal tanpa URL publik)
    if (payment.status === "paid") {
      const amountOk = payment.base_amount === transaction.price
      if (amountOk) {
        await supabase
          .from("transactions")
          .update({
            status: "paid",
            paid_at: payment.paid_at,
            payment_method: payment.payment?.issuer || "QRIS",
          })
          .eq("id", transaction.id)

        await supabase
          .from("products")
          .update({ sold: true })
          .eq("id", transaction.product_id)
      }
      return NextResponse.json({ status: amountOk ? "paid" : "pending", source: "polling" })
    }

    if (payment.status === "expired" || payment.status === "cancelled") {
      await supabase
        .from("transactions")
        .update({ status: payment.status })
        .eq("id", transaction.id)
      return NextResponse.json({ status: payment.status, source: "polling" })
    }

    return NextResponse.json({ status: payment.status, source: "polling" })
  } catch (error) {
    console.error("[WaroengPay Status] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan" },
      { status: 500 }
    )
  }
}
