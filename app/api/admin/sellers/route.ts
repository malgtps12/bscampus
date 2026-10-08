import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get("authorization")?.split(" ")[1]

    if (!adminToken || adminToken !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: sellers, error } = await supabase
      .from('users')
      .select('id, name, student_id, email, phone, campus, bank_name, account_number, account_holder_name, ewallet_type, ewallet_number, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("[Get Sellers] Error:", error)
      return NextResponse.json(
        { error: "Gagal mengambil data penjual" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sellers: sellers.map(seller => ({
        id: seller.id,
        name: seller.name,
        studentId: seller.student_id,
        email: seller.email,
        phone: seller.phone,
        campus: seller.campus,
        bankName: seller.bank_name,
        accountNumber: seller.account_number,
        accountHolderName: seller.account_holder_name,
        ewalletType: seller.ewallet_type,
        ewalletNumber: seller.ewallet_number,
        createdAt: seller.created_at
      }))
    })
  } catch (error) {
    console.error("[Get Sellers] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan" },
      { status: 500 }
    )
  }
}
