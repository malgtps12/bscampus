import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("products")
      .select("count", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({
        status: "error",
        error: error.message,
        hint: "Table 'products' mungkin belum dibuat di Supabase",
        solution: "Jalankan SQL schema di Supabase SQL Editor"
      }, { status: 500 });
    }

    return NextResponse.json({
      status: "ok",
      message: "Table products exists",
      count: data
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
