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

    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', decoded.username)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Pastikan caller adalah peserta percakapan (buyer atau seller)
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id')
      .eq('id', id)
      .single()

    if (
      !conversation ||
      (conversation.buyer_id !== currentUser.id && conversation.seller_id !== currentUser.id)
    ) {
      return NextResponse.json(
        { error: "Forbidden - Anda bukan peserta percakapan ini" },
        { status: 403 }
      )
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, name, student_id)
      `)
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error("[Get Messages] Error:", error.message)
      return NextResponse.json({ error: "Gagal mengambil pesan" }, { status: 500 })
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

    // Pastikan caller adalah peserta percakapan (buyer atau seller)
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id')
      .eq('id', id)
      .single()

    if (
      !conversation ||
      (conversation.buyer_id !== sender.id && conversation.seller_id !== sender.id)
    ) {
      return NextResponse.json(
        { error: "Forbidden - Anda bukan peserta percakapan ini" },
        { status: 403 }
      )
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
      console.error("[Send Message] Error:", error.message)
      return NextResponse.json({ error: "Gagal mengirim pesan" }, { status: 500 })
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
