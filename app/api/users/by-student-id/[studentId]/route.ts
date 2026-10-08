import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const supabase = await createClient()
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, student_id, email, phone, bank_name, account_number, account_holder_name, ewallet_type, ewallet_number')
      .eq('student_id', studentId)
      .single()

    if (error) {
      console.error("[Get User] Error:", error)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error("[Get User] Error:", error)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
