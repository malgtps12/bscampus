import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { verifyJWT } from "@/lib/auth-utils";

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[DEBUG] Error fetching products:", error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[DEBUG] Error in GET /api/products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("user_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu untuk menjual produk" },
        { status: 401 }
      )
    }

    const decoded = verifyJWT(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Token tidak valid. Silakan login kembali" },
        { status: 401 }
      )
    }

    const body = await request.json();
    
    console.log("[DEBUG] Received payload:", JSON.stringify(body, null, 2));

    if (!body.title || !body.price || !body.seller_name) {
      return NextResponse.json(
        { error: "Data tidak lengkap: title, price, dan seller_name wajib diisi", body },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    console.log("[DEBUG] Supabase client created");

    const productData = {
      title: body.title,
      description: body.description || "",
      price: parseInt(body.price),
      category: body.category || "lainnya",
      condition: body.condition || "bekas",
      seller_name: body.seller_name,
      seller_student_id: body.seller_student_id,
      seller_contact: body.seller_contact,
      images: body.images || [],
    };

    console.log("[DEBUG] Inserting to Supabase:", JSON.stringify(productData, null, 2));

    const { data, error } = await supabase
      .from("products")
      .insert([productData])
      .select();

    if (error) {
      console.error("[DEBUG] Supabase error:", error);
      return NextResponse.json(
        { 
          error: "Database error", 
          details: error.message,
          hint: "Pastikan table 'products' sudah dibuat di Supabase"
        },
        { status: 500 }
      );
    }

    console.log("[DEBUG] Product created successfully:", JSON.stringify(data, null, 2));
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("[DEBUG] Error creating product:", error);
    
    return NextResponse.json(
      { 
        error: "Server error", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
