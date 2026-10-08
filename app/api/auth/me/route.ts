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
      .select('id, name, student_id, email, phone, campus, created_at')
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
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error("[Auth Me] Error:", error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
