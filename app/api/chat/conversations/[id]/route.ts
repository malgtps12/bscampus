import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { verifyJWT } from "@/lib/auth-utils"

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get("user_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const decoded = verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const supabase = await createClient()
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, name, student_id)
      `)
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error("[Get Messages] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(messages)
  } catch (error) {
    console.error("[Get Messages] Error:", error)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get("user_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const decoded = verifyJWT(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data: sender } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', decoded.username)
      .single()

    if (!sender) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: sender.id,
        content: content.trim()
      })
      .select(`
        *,
        sender:sender_id(id, name, student_id)
      `)
      .single()

    if (error) {
      console.error("[Send Message] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("[Send Message] Error:", error)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
