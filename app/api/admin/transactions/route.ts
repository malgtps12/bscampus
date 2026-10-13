import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyJWT } from "@/lib/auth-utils"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]
    const cookieToken = request.cookies.get("admin_token")?.value

    const adminToken = token || cookieToken

    if (!adminToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      )
    }

    const decoded = verifyJWT(adminToken)
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or expired token" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query = supabase
      .from('transactions')
      .select(`
        id,
        product_id,
        product_title,
        seller_id,
        seller_name,
        seller_student_id,
        buyer_id,
        buyer_name,
        price,
        status,
        payment_method,
        paid_at,
        transferred_at,
        notes,
        created_at,
        users:seller_id (
          id,
          name,
          email,
          phone,
          student_id,
          bank_name,
          account_number,
          account_holder_name,
          ewallet_type,
          ewallet_number
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error("[Get Transactions] Error:", error)
      return NextResponse.json(
        { error: "Gagal mengambil data transaksi" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: transactions
    })
  } catch (error) {
    console.error("[Get Transactions] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]
    const cookieToken = request.cookies.get("admin_token")?.value

    const adminToken = token || cookieToken

    if (!adminToken) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      )
    }

    const decoded = verifyJWT(adminToken)
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or expired token" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { transactionId, status, notes } = body

    if (!transactionId || !status) {
      return NextResponse.json(
        { error: "Transaction ID dan status harus diisi" },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    if (notes) updateData.notes = notes
    if (status === 'transferred') {
      updateData.transferred_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .select()
      .single()

    if (error) {
      console.error("[Update Transaction] Error:", error)
      return NextResponse.json(
        { error: "Gagal mengupdate transaksi" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error("[Update Transaction] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan" },
      { status: 500 }
    )
  }
}
