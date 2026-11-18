import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { checkApiRateLimit, getClientIp } from "@/lib/auth-utils"
import { getCurrentUser } from "@/lib/dal"

export const runtime = 'nodejs'

async function getCurrentUserId(): Promise<string | null> {
  const currentUser = await getCurrentUser()
  return currentUser?.id ?? null
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    if (!checkApiRateLimit(ip, 50)) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 }
      )
    }

    // user_id diambil dari sesi Auth - user hanya bisa melihat wishlist miliknya
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        products (
          id,
          title,
          price,
          images,
          condition,
          sold
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("[Wishlist GET] Error:", error.message)
      return NextResponse.json(
        { error: "Gagal mengambil wishlist" },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[Wishlist GET] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    if (!checkApiRateLimit(ip, 30)) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 }
      )
    }

    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { product_id } = body

    if (!product_id) {
      return NextResponse.json(
        { error: "Product ID diperlukan" },
        { status: 400 }
      )
    }

    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', product_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "Produk sudah ada di wishlist" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: userId,
        product_id,
      })
      .select()

    if (error) {
      console.error("[Wishlist POST] Error:", error.message)
      return NextResponse.json(
        { error: "Gagal menambahkan ke wishlist" },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error("[Wishlist POST] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    if (!checkApiRateLimit(ip, 30)) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 }
      )
    }

    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const wishlistId = searchParams.get("id")

    if (!wishlistId) {
      return NextResponse.json(
        { error: "Wishlist ID diperlukan" },
        { status: 400 }
      )
    }

    // Hapus hanya jika baris wishlist milik user tersebut (cegah IDOR)
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', wishlistId)
      .eq('user_id', userId)

    if (error) {
      console.error("[Wishlist DELETE] Error:", error.message)
      return NextResponse.json(
        { error: "Gagal menghapus dari wishlist" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[Wishlist DELETE] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
