import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Cek koneksi ke Supabase
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          status: 'error',
          message: 'Tabel users tidak ditemukan',
          hint: 'Jalankan SQL di schema.sql di dashboard Supabase'
        }, { status: 500 })
      }
      
      return NextResponse.json({
        status: 'error',
        message: 'Database error',
        error: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Tabel users tersedia',
      count: data || 0,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...'
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Server error',
      error: error.message,
      details: error.stack
    }, { status: 500 })
  }
}
