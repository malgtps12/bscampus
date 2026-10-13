import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { checkApiRateLimit } from "@/lib/auth-utils"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    
    if (!checkApiRateLimit(ip, 50)) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("product_id")

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID diperlukan" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        users:user_id (
          name,
          student_id
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("[Reviews GET] Error:", error)
      return NextResponse.json(
        { error: "Gagal mengambil review" },
        { status: 500 }
      )
    }

    const reviews = data.map((review: any) => ({
      id: review.id,
      product_id: review.product_id,
      user_id: review.user_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
      reviewer_name: review.users?.name || "Pembeli Anonim",
    }))

    return NextResponse.json(reviews, { status: 200 })
  } catch (error) {
    console.error("[Reviews GET] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    
    if (!checkApiRateLimit(ip, 20)) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { product_id, user_id, rating, comment } = body

    if (!product_id || !user_id || !rating) {
      return NextResponse.json(
        { error: "Product ID, User ID, dan rating diperlukan" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating harus antara 1-5" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        product_id,
        user_id,
        rating,
        comment: comment || "",
      })
      .select()

    if (error) {
      console.error("[Reviews POST] Error:", error)
      return NextResponse.json(
        { error: "Gagal membuat review" },
        { status: 500 }
      )
    }

    await supabase.rpc('update_product_rating', {
      p_product_id: product_id
    })

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error("[Reviews POST] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
