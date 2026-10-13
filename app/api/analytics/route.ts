import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: totalReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })

    const { data: ratingData } = await supabase
      .from('reviews')
      .select('rating')

    const avgRating = ratingData && ratingData.length > 0
      ? ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length
      : 0

    const { data: categoryData } = await supabase
      .from('products')
      .select('category')

    const productsByCategory = categoryData?.reduce((acc: any, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1
      return acc
    }, {})

    const categoryArray = Object.entries(productsByCategory || {}).map(([category, count]) => ({
      category,
      count
    }))

    const { data: sellerData } = await supabase
      .from('products')
      .select('seller_student_id, seller_name')

    const sellerCount = sellerData?.reduce((acc: any, p) => {
      acc[p.seller_student_id] = {
        seller_id: p.seller_student_id,
        seller_name: p.seller_name,
        count: (acc[p.seller_student_id]?.count || 0) + 1
      }
      return acc
    }, {})

    const topSellers = Object.values(sellerCount || {})
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5)
      .map((s: any) => ({
        seller_id: s.seller_id,
        seller_name: s.seller_name,
        product_count: s.count
      }))

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentProducts } = await supabase
      .from('products')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const activityByDate = recentProducts?.reduce((acc: any, p) => {
      const date = new Date(p.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    const recentActivity = Object.entries(activityByDate || {})
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const analytics = {
      total_products: totalProducts || 0,
      total_users: totalUsers || 0,
      total_reviews: totalReviews || 0,
      total_transactions: 0,
      avg_rating: Math.round(avgRating * 10) / 10,
      products_by_category: categoryArray,
      top_sellers: topSellers,
      recent_activity: recentActivity
    }

    return NextResponse.json(analytics, { status: 200 })
  } catch (error) {
    console.error("[Analytics GET] Error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
