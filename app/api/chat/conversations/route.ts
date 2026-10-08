import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { verifyJWT } from "@/lib/auth-utils"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
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
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', decoded.username)
      .single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        buyer:buyer_id(id, name, student_id),
        seller:seller_id(id, name, student_id),
        product:product_id(id, title, images)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error("[Get Conversations] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("[Get Conversations] Error:", error)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { productId, sellerId } = body

    if (!productId || !sellerId) {
      return NextResponse.json(
        { error: "Missing productId or sellerId" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data: buyer } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', decoded.username)
      .single()

    if (!buyer) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (buyer.id === sellerId) {
      return NextResponse.json(
        { error: "Cannot chat dengan diri sendiri" },
        { status: 400 }
      )
    }

    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('product_id', productId)
      .eq('buyer_id', buyer.id)
      .eq('seller_id', sellerId)
      .single()

    if (existingConversation) {
      return NextResponse.json(existingConversation)
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        product_id: productId,
        buyer_id: buyer.id,
        seller_id: sellerId
      })
      .select()
      .single()

    if (error) {
      console.error("[Create Conversation] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error("[Create Conversation] Error:", error)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
