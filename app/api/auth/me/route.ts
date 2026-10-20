import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth-utils"
import { supabase } from "@/lib/supabase"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("user_token")?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const decoded = verifyJWT(token)

    if (!decoded) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Pilih semua kolom lalu petakan dengan fallback null - jangan mendaftarkan
    // kolom opsional secara eksplisit. Jika kolom opsional (rekening bank/dompet
    // digital) belum ada di database, query ikut gagal dan user yang sudah login
    // justru dianggap 401 (dulu menyebabkan loop login -> halaman -> login).
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', decoded.username)
      .single()

    if (error || !user) {
      console.error('[Auth Me] User query error:', error?.message)
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        studentId: user.student_id,
        email: user.email,
        phone: user.phone,
        campus: user.campus,
        bankName: user.bank_name ?? null,
        accountNumber: user.account_number ?? null,
        accountHolderName: user.account_holder_name ?? null,
        ewalletType: user.ewallet_type ?? null,
        ewalletNumber: user.ewallet_number ?? null,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error("[Auth Me] Error:", error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
