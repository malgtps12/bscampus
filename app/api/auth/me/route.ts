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

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, student_id, email, phone, campus, bank_name, account_number, account_holder_name, ewallet_type, ewallet_number, created_at')
      .eq('student_id', decoded.username)
      .single()

    if (error || !user) {
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
        bankName: user.bank_name,
        accountNumber: user.account_number,
        accountHolderName: user.account_holder_name,
        ewalletType: user.ewallet_type,
        ewalletNumber: user.ewallet_number,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error("[Auth Me] Error:", error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
