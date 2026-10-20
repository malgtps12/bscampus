import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { verifyJWT } from "@/lib/auth-utils"

export const runtime = 'nodejs'

/**
 * Lookup penjual by NIM - hanya untuk user login.
 * Hanya mengembalikan data publik minimal (id, nama, NIM).
 * Data PII (email, telepon, rekening, e-wallet) TIDAK pernah dikembalikan.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const token = request.cookies.get("user_token")?.value
    const decoded = token ? verifyJWT(token) : null

    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { studentId } = await params
    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, student_id')
      .eq('student_id', studentId)
      .single()

    if (error) {
      console.error("[Get User] Error:", error.message)
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
