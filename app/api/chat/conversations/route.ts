import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/dal"

export const runtime = 'nodejs'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        buyer:buyer_id(id, name, student_id),
        seller:seller_id(id, name, student_id)
      `)
      .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error("[Get Conversations] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // conversations.product_id tidak punya foreign key ke products, sehingga
    // embed `product:product_id(...)` ditolak PostgREST (PGRST200) dan seluruh
    // endpoint gagal -> daftar chat selalu kosong. Ambil produk terpisah lalu
    // gabungkan di sini.
    const rows = conversations ?? []
    const productIds = [...new Set(rows.map((c) => c.product_id).filter(Boolean))]
    let productsById = new Map<string, { id: string; title: string; images: string[] }>()

    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title, images')
        .in('id', productIds)

      if (productsError) {
        console.error("[Get Conversations] Product lookup error:", productsError.message)
      } else {
        productsById = new Map((products ?? []).map((p) => [p.id, p]))
      }
    }

    const result = rows.map((conversation) => ({
      ...conversation,
      product: productsById.get(conversation.product_id) ?? null,
    }))

    return NextResponse.json(result)
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
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    if (currentUser.id === sellerId) {
      return NextResponse.json(
        { error: "Cannot chat dengan diri sendiri" },
        { status: 400 }
      )
    }

    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('product_id', productId)
      .eq('buyer_id', currentUser.id)
      .eq('seller_id', sellerId)
      .single()

    if (existingConversation) {
      return NextResponse.json(existingConversation)
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        product_id: productId,
        buyer_id: currentUser.id,
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
