import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth-utils"
import { supabase } from "@/lib/supabase"

export const runtime = 'nodejs'

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("user_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyJWT(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      phone, 
      bankName, 
      accountNumber, 
      accountHolderName,
      ewalletType,
      ewalletNumber
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (bankName !== undefined) updateData.bank_name = bankName
    if (accountNumber !== undefined) updateData.account_number = accountNumber
    if (accountHolderName !== undefined) updateData.account_holder_name = accountHolderName
    if (ewalletType !== undefined) updateData.ewallet_type = ewalletType
    if (ewalletNumber !== undefined) updateData.ewallet_number = ewalletNumber

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('student_id', decoded.username)
      .select('id, name, student_id, email, phone, campus, bank_name, account_number, account_holder_name, ewallet_type, ewallet_number')
      .single()

    if (error) {
      console.error("[Update Profile] Error:", error)
      return NextResponse.json(
        { error: "Gagal mengupdate profil" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        name: data.name,
        studentId: data.student_id,
        email: data.email,
        phone: data.phone,
        campus: data.campus,
        bankName: data.bank_name,
        accountNumber: data.account_number,
        accountHolderName: data.account_holder_name,
        ewalletType: data.ewallet_type,
        ewalletNumber: data.ewallet_number
      }
    })
  } catch (error) {
    console.error("[Update Profile] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan" },
      { status: 500 }
    )
  }
}
